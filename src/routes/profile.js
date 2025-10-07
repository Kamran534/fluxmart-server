import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import User from '../models/User.js';
import { getS3Client, getObjectStream } from '../helper/s3/index.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Single module housing both GET (proxy) and POST (upload) endpoints
export const profileRouter = express.Router();

// Shared auth helpers
const authenticate = (req, res, next) => {
  try {
    const raw = (req.headers['authorization'] || req.headers['x-access-token'] || '').toString();
    const match = raw.match(/^Bearer\s+(.*)$/i);
    const token = match ? match[1] : raw;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, tokenVersion: payload.tv };
    next();
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const ensureOwnKey = (key, userId) => {
  const parts = (key || '').split('/');
  return parts[0] === 'users' && parts[1] === userId;
};

const isAllowedImage = (mime) => /^(image\/(jpeg|jpg|png|webp|gif))$/i.test(mime);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/image?key=users/... (Swagger-friendly)
profileRouter.get('/image', authenticate, async (req, res) => {
  const key = (req.query.key || '').toString();
  if (!key) return res.status(400).json({ success: false, message: 'Missing key' });
  if (!ensureOwnKey(key, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied' });
  return streamImage(key, res);
});

// GET /api/image/{key}
profileRouter.get('/image/:key', authenticate, async (req, res) => {
  const key = req.params.key;
  if (!ensureOwnKey(key, req.user.id)) return res.status(403).json({ success: false, message: 'Access denied' });
  return streamImage(key, res);
});

const streamImage = async (key, res) => {
  try {
    if (!key || !key.startsWith('users/')) {
      return res.status(400).json({ success: false, message: 'Invalid image key format' });
    }
    const s3Response = await getObjectStream({ key });
    if (!s3Response?.Body) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    const contentType = s3Response.ContentType || 'application/octet-stream';
    const contentLength = s3Response.ContentLength;
    const lastModified = s3Response.LastModified;
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'private, max-age=300', 'ETag': s3Response.ETag });
    if (contentLength) res.set('Content-Length', String(contentLength));
    if (lastModified) res.set('Last-Modified', lastModified.toUTCString());
    const stream = s3Response.Body;
    stream.pipe(res);
    stream.on('error', () => { if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming image' }); });
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Error retrieving image' });
  }
};

/**
 * @swagger
 * /api/profile-image:
 *   post:
 *     summary: Upload and set the authenticated user's profile image
 *     description: Accepts a multipart/form-data upload, stores the image in a private S3 bucket, and saves the S3 key on the user's profile.
 *     tags: [Profile Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpeg, png, webp, gif)
 *           encoding:
 *             file:
 *               contentType: [image/jpeg, image/png, image/webp, image/gif]
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 key:
 *                   type: string
 *                   example: users/123/profile/1700000000-ab12cd34.jpg
 *       400:
 *         description: Bad request (no file or unsupported type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
profileRouter.post('/profile-image', authenticate, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!isAllowedImage(file.mimetype)) return res.status(400).json({ success: false, message: 'Unsupported image type' });
    const bucket = process.env.S3_BUCKET;
    if (!bucket) return res.status(500).json({ success: false, message: 'S3 bucket not configured' });
    const extension = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg';
    const key = `users/${req.user.id}/profile/${Date.now()}-${randomBytes(4).toString('hex')}.${safeExt}`;
    const client = getS3Client();
    const put = new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype });
    await client.send(put);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.profileImageUrl = key;
    await user.save();
    return res.json({ success: true, key });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

export default profileRouter;



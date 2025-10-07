import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client = null;

export const getS3Client = () => {
  if (s3Client) return s3Client;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const endpoint = process.env.S3_ENDPOINT || undefined; // allow custom endpoints (e.g., MinIO)
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  return s3Client;
};

export const createPresignedUploadUrl = async ({
  bucket = process.env.S3_BUCKET,
  key,
  contentType,
  expiresInSec = Number(process.env.S3_UPLOAD_URL_TTL_SEC || 300),
}) => {
  if (!bucket) throw new Error('S3 bucket not configured');
  if (!key) throw new Error('S3 object key is required');
  const client = getS3Client();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSec });
  return { url, fields: null, key };
};

export const createPresignedGetUrl = async ({
  bucket = process.env.S3_BUCKET,
  key,
  expiresInSec = Number(process.env.S3_GET_URL_TTL_SEC || 300),
}) => {
  if (!bucket) throw new Error('S3 bucket not configured');
  if (!key) throw new Error('S3 object key is required');
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSec });
};

export const deleteObject = async ({ bucket = process.env.S3_BUCKET, key }) => {
  if (!bucket) throw new Error('S3 bucket not configured');
  if (!key) return;
  const client = getS3Client();
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await client.send(command);
};

export const getObjectStream = async ({ bucket = process.env.S3_BUCKET, key }) => {
  if (!bucket) throw new Error('S3 bucket not configured');
  if (!key) throw new Error('S3 object key is required');
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  return response;
};

export default { getS3Client, createPresignedUploadUrl, createPresignedGetUrl, deleteObject, getObjectStream };

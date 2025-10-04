import express from 'express';
import emailService from '../helper/mail/emailService.js';

const router = express.Router();

/**
 * @swagger
 * /test-email:
 *   post:
 *     tags: [Email]
 *     summary: Send test email
 *     description: Send various types of emails (OTP, welcome, password reset) for testing purposes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, name, type]
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: "Recipient email address"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: "Recipient name"
 *               type:
 *                 type: string
 *                 enum: [otp, welcome, reset]
 *                 example: "welcome"
 *                 description: "Type of email to send"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - missing required fields or invalid email type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - JWT token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - email service failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/test-email', async (req, res) => {
  try {
    const { type, to, name } = req.body;
    
    if (!to || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required"
      });
    }
    
    let result;
    switch (type) {
      case 'otp':
        result = await emailService.sendOTPEmail({
          to,
          name,
          otp: Math.floor(100000 + Math.random() * 900000).toString()
        });
        break;
      case 'welcome':
        result = await emailService.sendWelcomeEmail({ to, name });
        break;
      case 'reset':
        result = await emailService.sendPasswordResetEmail({
          to,
          name,
          resetLink: `https://fluxmart.com/reset-password?token=${Math.random().toString(36).substring(7)}`
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid email type. Use: otp, welcome, or reset"
        });
    }
    
    res.status(200).json({
      success: true,
      message: `${type} email sent successfully`,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message
    });
  }
});

export default router;

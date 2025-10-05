import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const rejectUnauthorizedEnv = process.env.SMTP_REJECT_UNAUTHORIZED;
  const rejectUnauthorized = typeof rejectUnauthorizedEnv === 'string'
    ? rejectUnauthorizedEnv === 'true'
    : (process.env.NODE_ENV === 'production');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // your email
      pass: process.env.SMTP_PASS, // your email password or app password
    },
    tls: {
      rejectUnauthorized: rejectUnauthorized
    }
  });
};

// Verify connection configuration
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log(' SMTP Server is ready to take our messages '.bgGreen.black.bold);
    return true;
  } catch (error) {
    console.log(' SMTP Server connection failed: '.bgRed.white.bold, error.message);
    return false;
  }
};

// Email configuration
export const emailConfig = {
  from: process.env.FROM_EMAIL || process.env.SMTP_USER,
  replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
  companyName: process.env.COMPANY_NAME || 'FluxMart',
  companyWebsite: process.env.COMPANY_WEBSITE || 'https://fluxmart.com',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
};

export { createTransporter, verifyConnection };

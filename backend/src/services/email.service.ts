import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Creates a Nodemailer transporter using environment configuration.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends an email using the configured transporter.
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'PMS App <noreply@pmsapp.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${options.to}: ${error.message}`);
    throw new Error('Email could not be sent. Please try again later.');
  }
};

/**
 * HTML template for email verification.
 */
export const emailVerificationTemplate = (name: string, verificationUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification - PMS</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #1976d2; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .body { padding: 40px 30px; }
    .body p { color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #1976d2; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>📋 Project Management System</h1></div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome to PMS! Please verify your email address to complete your registration.</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="btn">Verify Email Address</a>
      </p>
      <p>This link expires in <strong>24 hours</strong>.</p>
      <p>If you did not create an account, please ignore this email.</p>
    </div>
    <div class="footer"><p>© ${new Date().getFullYear()} Project Management System. All rights reserved.</p></div>
  </div>
</body>
</html>
`;

/**
 * HTML template for password reset.
 */
export const passwordResetTemplate = (name: string, resetUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset - PMS</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #d32f2f; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .body { padding: 40px 30px; }
    .body p { color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #d32f2f; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; color: #856404; margin: 15px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🔐 Password Reset Request</h1></div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </p>
      <div class="warning">⚠️ This link expires in <strong>10 minutes</strong>.</div>
      <p>If you did not request a password reset, your account may be compromised. Please contact support immediately.</p>
    </div>
    <div class="footer"><p>© ${new Date().getFullYear()} Project Management System. All rights reserved.</p></div>
  </div>
</body>
</html>
`;

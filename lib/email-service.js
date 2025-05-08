import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter
let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production transporter (e.g., SendGrid, Mailgun, etc.)
  transporter = nodemailer.createTransport({
    service: 'SendGrid', // Or your preferred email service
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development transporter (using ethereal.email for testing)
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || 'your-ethereal-username',
      pass: process.env.DEV_EMAIL_PASS || 'your-ethereal-password'
    }
  });
}

// Generate a random token
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Trading Platform" <${process.env.EMAIL_FROM || 'no-reply@tradingplatform.com'}>`,
    to: user.email,
    subject: 'Please verify your email address',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2196F3;">Trading Platform</h1>
        </div>
        <div style="background-color: #f5f7fa; padding: 20px; border-radius: 8px;">
          <h2>Verify Your Email Address</h2>
          <p>Hi ${user.name},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2196F3;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2025 Trading Platform</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // For development/testing - log the test URL for viewing the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Trading Platform" <${process.env.EMAIL_FROM || 'no-reply@tradingplatform.com'}>`,
    to: user.email,
    subject: 'Reset your password',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2196F3;">Trading Platform</h1>
        </div>
        <div style="background-color: #f5f7fa; padding: 20px; border-radius: 8px;">
          <h2>Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2025 Trading Platform</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // For development/testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  generateToken
};
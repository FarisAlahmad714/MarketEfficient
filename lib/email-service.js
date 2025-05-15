// lib/email-service.js
import crypto from 'crypto';
import axios from 'axios';

// Constants
const API_URL = 'https://connect.mailerlite.com/api';
const API_KEY = process.env.MAILERLITE_API_KEY;

// Helper to set request headers with authorization
const getHeaders = () => {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Generate a random token
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send an email using MailerLite API
async function sendEmail(to, subject, htmlContent, textContent) {
  if (!API_KEY) {
    console.error('MailerLite API key is missing. Cannot send email.');
    return false;
  }

  // MailerLite transactional email payload format
  const emailData = {
    to: [{ email: to }],
    subject: subject,
    html: htmlContent,
    plain: textContent || htmlContent.replace(/<[^>]*>/g, ''),
    // The from field will use your default sender settings from MailerLite dashboard
  };

  try {
    // Use the correct endpoint for transactional emails
    const response = await axios.post(`${API_URL}/campaigns/transactional`, emailData, {
      headers: getHeaders()
    });

    console.log('Email sent successfully via MailerLite API');
    return true;
  } catch (error) {
    console.error('Error sending email via MailerLite API:', 
      error.response?.data || error.message);
    
    // Fall back to development mailer if in dev mode
    if (process.env.NODE_ENV !== 'production' && process.env.USE_TEST_EMAIL === 'true') {
      console.log('Attempting to use dev email service...');
      return await sendDevEmail(to, subject, htmlContent, textContent);
    }
    
    return false;
  }
}

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const htmlContent = `
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
  `;
  
  const textContent = `
    Hi ${user.name},
    
    Thanks for signing up! Please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    Trading Platform
  `;
  
  return await sendEmail(user.email, 'Please verify your email address', htmlContent, textContent);
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const htmlContent = `
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
  `;
  
  const textContent = `
    Hi ${user.name},
    
    We received a request to reset your password. Please visit the link below to create a new password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    Trading Platform
  `;
  
  return await sendEmail(user.email, 'Reset your password', htmlContent, textContent);
};

// For development: fallback to ethereal mail for testing if needed
async function sendDevEmail(to, subject, htmlContent, textContent) {
  try {
    const nodemailer = require('nodemailer');
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    const info = await transporter.sendMail({
      from: `"Trading Platform" <${testAccount.user}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent
    });
    
    console.log('Test email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  generateToken
};
// lib/email-service.js
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate a random token
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send an email using Mailjet API
async function sendEmail(to, subject, htmlContent, textContent) {
  // For development: use Ethereal if configured
  if (process.env.NODE_ENV !== 'production' && process.env.USE_TEST_EMAIL === 'true') {
    console.log('Using Ethereal for development email...');
    return await sendDevEmail(to, subject, htmlContent, textContent);
  }

  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      throw new Error('Mailjet credentials not configured');
    }

    // Import Mailjet
    const Mailjet = require('node-mailjet');
    
    // Connect to Mailjet API
    const mailjet = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );
    
    const fromName = process.env.EMAIL_SENDER_NAME || 'ChartSense';
    const fromEmail = process.env.EMAIL_SENDER_EMAIL;

    if (!fromEmail) {
      throw new Error('Sender email not configured (EMAIL_SENDER_EMAIL)');
    }
    
    // Prepare text part if not provided
    const plainText = textContent || htmlContent.replace(/<[^>]*>/g, '');
    
    // Send email using Mailjet API
    const result = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName
          },
          To: [
            {
              Email: to
            }
          ],
          Subject: subject,
          HTMLPart: htmlContent,
          TextPart: plainText
        }
      ]
    });
    
    console.log('Email sent successfully via Mailjet API:', result.body.Messages[0].Status);
    return true;
  } catch (error) {
    console.error('Error sending email via Mailjet API:', error.message);
    console.error('Error details:', error.statusCode ? `Status code: ${error.statusCode}` : 'No status code');
    
    if (error.response && error.response.body) {
      console.error('Error response:', JSON.stringify(error.response.body, null, 2));
    }
    
    // Fall back to Ethereal in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Falling back to Ethereal in development...');
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
        <h1 style="color: #2196F3;">ChartSense</h1>
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
        <p>© 2025 ChartSense</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Hi ${user.name},
    
    Thanks for signing up! Please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    ChartSense
  `;
  
  return await sendEmail(user.email, 'Please verify your email address', htmlContent, textContent);
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2196F3;">ChartSense</h1>
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
        <p>© 2025 ChartSense</p>
      </div>
    </div>
  `;
  
  const textContent = `
    Hi ${user.name},
    
    We received a request to reset your password. Please visit the link below to create a new password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    ChartSense
  `;
  
  return await sendEmail(user.email, 'Reset your password', htmlContent, textContent);
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2196F3;">Welcome to ChartSense!</h1>
      </div>
      <div style="background-color: #f5f7fa; padding: 20px; border-radius: 8px;">
        <p>Hi ${user.name},</p>
        <p>We're thrilled to have you join our trading platform. Here's how to get started:</p>
        <ul>
          <li>Explore our dashboard to track your performance</li>
          <li>Take your first bias test to assess your trading skills</li>
          <li>Check out our educational resources to improve your trading knowledge</li>
        </ul>
        <p>Remember to verify your email if you haven't already.</p>
        <p>Happy trading!</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2025 ChartSense</p>
      </div>
    </div>
  `;

  const textContent = `
    Hi ${user.name},

    Welcome to ChartSense! We're thrilled to have you join our trading platform.

    Here's how to get started:
    - Explore our dashboard to track your performance
    - Take your first bias test to assess your trading skills
    - Check out our educational resources to improve your trading knowledge

    Remember to verify your email if you haven't already.

    Happy trading!

    ChartSense
  `;

  return await sendEmail(user.email, 'Welcome to ChartSense!', htmlContent, textContent);
};

// Send metrics email (weekly or monthly)
export const sendMetricsEmail = async (user, metrics, period) => {
  const periodText = period === 'weekly' ? 'This Week' : 'This Month';
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2196F3;">Your ${periodText} Trading Metrics</h1>
      </div>
      <div style="background-color: #f5f7fa; padding: 20px; border-radius: 8px;">
        <p>Hi ${user.name},</p>
        <p>Here's a summary of your trading performance for ${periodText.toLowerCase()}:</p>
        <ul>
          <li>Tests Taken: ${metrics.testsTaken}</li>
          <li>Average Score: ${metrics.averageScore.toFixed(2)}%</li>
          <li>Improvement: ${metrics.improvement > 0 ? '+' : ''}${metrics.improvement.toFixed(2)}% from last ${period}</li>
        </ul>
        <p>Keep up the good work! Consistent practice leads to better trading decisions.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2025 ChartSense</p>
      </div>
    </div>
  `;

  const textContent = `
    Hi ${user.name},

    Here's a summary of your trading performance for ${periodText.toLowerCase()}:

    - Tests Taken: ${metrics.testsTaken}
    - Average Score: ${metrics.averageScore.toFixed(2)}%
    - Improvement: ${metrics.improvement > 0 ? '+' : ''}${metrics.improvement.toFixed(2)}% from last ${period}

    Keep up the good work! Consistent practice leads to better trading decisions.

    ChartSense
  `;

  return await sendEmail(user.email, `Your ${periodText} Trading Metrics`, htmlContent, textContent);
};

// Send inactive user reminder email
export const sendInactiveUserReminder = async (user) => {
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2196F3;">We Miss You on ChartSense!</h1>
      </div>
      <div style="background-color: #f5f7fa; padding: 20px; border-radius: 8px;">
        <p>Hi ${user.name},</p>
        <p>It's been a while since you've practiced your trading skills. Why not come back and take a test to keep improving?</p>
        <p>Remember, the more you practice, the better you'll get at identifying market biases.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/bias-test" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Take a Test Now
          </a>
        </div>
        <p>We're here to help you become a better trader. See you soon!</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2025 ChartSense</p>
      </div>
    </div>
  `;

  const textContent = `
    Hi ${user.name},

    It's been a while since you've practiced your trading skills on ChartSense. Why not come back and take a test to keep improving?

    Remember, the more you practice, the better you'll get at identifying market biases.

    Click here to take a test now: ${process.env.NEXT_PUBLIC_APP_URL}/bias-test

    We're here to help you become a better trader. See you soon!

    ChartSense
  `;

  return await sendEmail(user.email, 'We Miss You on ChartSense!', htmlContent, textContent);
};

// For development: Ethereal email service
async function sendDevEmail(to, subject, htmlContent, textContent) {
  try {
    let auth = {
      user: process.env.DEV_EMAIL_USER,
      pass: process.env.DEV_EMAIL_PASS,
    };
    
    if (!auth.user || !auth.pass) {
      const testAccount = await nodemailer.createTestAccount();
      auth.user = testAccount.user;
      auth.pass = testAccount.pass;
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth,
    });
    
    const info = await transporter.sendMail({
      from: `"ChartSense" <${auth.user}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
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
  sendWelcomeEmail,
  sendMetricsEmail,
  sendInactiveUserReminder,
  generateToken,
};
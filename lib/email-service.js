// lib/email-service.js
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import logger from './logger'; // Adjust path to your logger utility

// Generate a random token
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Simple rate limiting - in production you'd want Redis or a more sophisticated solution
const emailRateLimit = new Map();
const RATE_LIMIT = 100; // emails per hour per recipient
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  
  if (!emailRateLimit.has(key)) {
    emailRateLimit.set(key, { count: 1, window: now });
    return true;
  }
  
  const limit = emailRateLimit.get(key);
  
  // Reset if window expired
  if (now - limit.window > RATE_WINDOW) {
    emailRateLimit.set(key, { count: 1, window: now });
    return true;
  }
  
  // Check if under limit
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  // Increment count
  limit.count++;
  return true;
}

// Send an email using Mailjet API
async function sendEmail(to, subject, htmlContent, textContent) {
  // Check rate limit
  if (!checkRateLimit(to)) {
    throw new Error(`Rate limit exceeded for ${to}. Maximum ${RATE_LIMIT} emails per hour.`);
  }
  
  // For development: use Ethereal if configured
  if (process.env.NODE_ENV !== 'production' && process.env.USE_TEST_EMAIL === 'true') {
    logger.log('Using Ethereal for development email...');
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
    
    logger.log('Email sent successfully via Mailjet API:', result.body.Messages[0].Status);
    return true;
  } catch (error) {
    
    if (error.response && error.response.body) {
    }
    
    // Fall back to Ethereal in development
    if (process.env.NODE_ENV !== 'production') {
      logger.log('Falling back to Ethereal in development...');
      return await sendDevEmail(to, subject, htmlContent, textContent);
    }
    return false;
  }
}

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #2196F3; margin: 0; font-size: 28px; font-weight: bold;">📧 ChartSense</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Welcome to the future of trading!</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <!-- Success Icon -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; background-color: #4CAF50; border-radius: 50%; color: white; font-size: 40px; line-height: 80px;">✓</div>
        </div>
        
        <h2 style="color: #333; text-align: center; margin-bottom: 20px; font-size: 24px;">Verify Your Email Address</h2>
        
        <p style="color: #333; font-size: 18px; line-height: 1.6; margin-bottom: 10px;">Hi ${user.name},</p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          🎉 <strong>Congratulations!</strong> You've successfully created your ChartSense account. To start using all our powerful trading tools and features, please verify your email address by clicking the button below:
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3); transition: transform 0.2s ease;">
            🚀 Verify My Email Address
          </a>
        </div>
        
        <!-- Alternative Link -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; text-align: center;">
            <strong>Button not working?</strong> Copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #2196F3; font-size: 14px; text-align: center; margin: 0; padding: 10px; background-color: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            ${verificationUrl}
          </p>
        </div>
        
        <!-- What's Next Section -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 30px 0;">
          <h3 style="color: #1976D2; margin: 0 0 15px 0; font-size: 18px;">🎯 What's Next?</h3>
          <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Click the verification button above</li>
            <li>Complete your profile setup</li>
            <li>Take your first bias test to assess your trading skills</li>
            <li>Explore our educational resources and trading tools</li>
          </ul>
        </div>
        
        <!-- Important Notes -->
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 30px 0;">
          <h4 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important:</h4>
          <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
            <li>This verification link will expire in <strong>24 hours</strong></li>
            <li>If you didn't create this account, please ignore this email</li>
            <li>For security, don't share this email with anyone</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: center;">
          Welcome to ChartSense! We're excited to help you become a better trader. 📈
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
        <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
        <p style="margin: 0;">This email was sent to ${user.email}</p>
      </div>
    </div>
  `;
  
  const textContent = `
    🎉 Welcome to ChartSense!
    
    Hi ${user.name},
    
    Congratulations! You've successfully created your ChartSense account.
    
    To start using all our powerful trading tools and features, please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    What's Next?
    • Click the verification link above
    • Complete your profile setup  
    • Take your first bias test to assess your trading skills
    • Explore our educational resources and trading tools
    
    Important:
    • This verification link will expire in 24 hours
    • If you didn't create this account, please ignore this email
    • For security, don't share this email with anyone
    
    Welcome to ChartSense! We're excited to help you become a better trader.
    
    ChartSense Team
    © 2025 ChartSense - Advanced Trading Analytics
  `;
  
  return await sendEmail(user.email, '🚀 Verify Your ChartSense Account - Welcome!', htmlContent, textContent);
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
    
    logger.log('Test email sent: %s', info.messageId);
    logger.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    return false;
  }
}

// Send badge received email
export const sendBadgeReceivedEmail = async (user, badge) => {
  const rarityColors = {
    common: '#4CAF50',
    rare: '#FF9800', 
    legendary: '#FFD700',
    goal: '#2196F3'
  };

  const rarityEmojis = {
    common: '🏅',
    rare: '🏆', 
    legendary: '💎',
    goal: '🎯'
  };

  const badgeColor = rarityColors[badge.rarity] || '#2196F3';
  const rarityEmoji = rarityEmojis[badge.rarity] || '🏅';

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #2196F3; margin: 0; font-size: 28px; font-weight: bold;">🎉 ChartSense</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Achievement Unlocked!</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <!-- Badge Display -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 120px; height: 120px; background: linear-gradient(135deg, ${badgeColor} 0%, ${badgeColor}dd 100%); border-radius: 50%; color: white; font-size: 60px; line-height: 120px; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
            ${badge.icon}
          </div>
          <div style="background-color: ${badgeColor}; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">
            ${rarityEmoji} ${badge.rarity}
          </div>
        </div>
        
        <h2 style="color: #333; text-align: center; margin-bottom: 10px; font-size: 28px; font-weight: bold;">${badge.title}</h2>
        <p style="color: #666; text-align: center; font-size: 18px; margin-bottom: 30px;">${badge.description}</p>
        
        <p style="color: #333; font-size: 18px; line-height: 1.6; margin-bottom: 10px;">Hi ${user.name},</p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          🎊 <strong>Congratulations!</strong> You've just earned the <strong>"${badge.title}"</strong> achievement! This ${badge.rarity} badge recognizes your dedication and skill in improving your trading abilities.
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
            🏆 View My Profile
          </a>
        </div>
        
        <!-- Achievement Progress -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 30px 0;">
          <h3 style="color: #1976D2; margin: 0 0 15px 0; font-size: 18px;">🎯 Keep Going!</h3>
          <p style="color: #666; margin: 0; line-height: 1.6;">
            You're making great progress! Keep taking tests and improving your trading skills to unlock more achievements. Every test brings you closer to mastering market analysis.
          </p>
        </div>
        
        <!-- Share Section -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📱 Share Your Achievement</h4>
          <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
            Show off your new badge to friends and colleagues!
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}?share=${badge.id}" style="color: #2196F3; text-decoration: none; font-weight: bold;">
            Share on Social Media →
          </a>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: center;">
          Keep up the excellent work! Your trading skills are clearly improving. 📈
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
        <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
        <p style="margin: 0;">This email was sent to ${user.email}</p>
      </div>
    </div>
  `;
  
  const textContent = `
    🎉 Achievement Unlocked!
    
    Hi ${user.name},
    
    Congratulations! You've just earned the "${badge.title}" achievement!
    
    Badge Details:
    • Title: ${badge.title}
    • Description: ${badge.description}
    • Rarity: ${badge.rarity.toUpperCase()}
    
    This ${badge.rarity} badge recognizes your dedication and skill in improving your trading abilities.
    
    View your profile and all achievements: ${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}
    
    Keep Going!
    You're making great progress! Keep taking tests and improving your trading skills to unlock more achievements. Every test brings you closer to mastering market analysis.
    
    Share Your Achievement:
    Show off your new badge to friends and colleagues at: ${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}?share=${badge.id}
    
    Keep up the excellent work! Your trading skills are clearly improving.
    
    ChartSense Team
    © 2025 ChartSense - Advanced Trading Analytics
  `;
  
  const subject = `🏆 Achievement Unlocked: ${badge.title} | ChartSense`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

// Send sandbox deposit notification
export const sendSandboxDepositNotification = async (user, depositData) => {
  const { amount, newBalance, quarter, year } = depositData;
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💰 Quarterly Deposit Received!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your ChartSense sandbox has been topped up</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="color: #333; font-size: 18px; margin: 0 0 25px 0; line-height: 1.6;">
          Hi <strong>${user.name || user.username}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Great news! Your quarterly deposit for Q${quarter} ${year} has been processed and added to your sandbox trading account.
        </p>
        
        <!-- Deposit Details -->
        <div style="background: linear-gradient(135deg, #a8e6cf 0%, #dcedc8 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 20px;">💎 Deposit Details</h3>
          <div style="background: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
              <strong>Amount:</strong> <span style="color: #2e7d32; font-size: 20px; font-weight: bold;">+${amount.toLocaleString()} SENSES</span>
            </p>
            <p style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
              <strong>New Balance:</strong> <span style="color: #1976d2; font-size: 18px; font-weight: bold;">${newBalance.toLocaleString()} SENSES</span>
            </p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              Quarter ${quarter}, ${year} • ChartSense Quarterly Deposit
            </p>
          </div>
        </div>
        
        <!-- Trading Reminder -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2196F3;">
          <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📈 Ready to Trade?</h4>
          <p style="color: #666; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
            Your sandbox is now loaded with fresh capital! Use this opportunity to:
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.5; margin: 0; padding-left: 20px;">
            <li>Practice new trading strategies risk-free</li>
            <li>Test your market analysis skills</li>
            <li>Build your trading confidence</li>
            <li>Learn from both wins and losses</li>
          </ul>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/sandbox" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            Start Trading Now →
          </a>
        </div>
        
        <!-- Next Deposit Info -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <h4 style="color: #1976d2; margin: 0 0 15px 0; font-size: 16px;">⏰ Next Deposit</h4>
          <p style="color: #1565c0; margin: 0; font-size: 14px;">
            Your next quarterly deposit will be automatically processed on the first day of Q${quarter === 4 ? 1 : quarter + 1} ${quarter === 4 ? year + 1 : year}.
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: center;">
          Happy trading! Remember, the best traders learn from every trade. 🚀
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
        <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
        <p style="margin: 0;">This email was sent to ${user.email}</p>
      </div>
    </div>
  `;
  
  const textContent = `
    💰 Quarterly Deposit Received!
    
    Hi ${user.name || user.username},
    
    Great news! Your quarterly deposit for Q${quarter} ${year} has been processed and added to your sandbox trading account.
    
    Deposit Details:
    • Amount: +${amount.toLocaleString()} SENSES
    • New Balance: ${newBalance.toLocaleString()} SENSES
    • Period: Quarter ${quarter}, ${year}
    • Type: ChartSense Quarterly Deposit
    
    Ready to Trade?
    Your sandbox is now loaded with fresh capital! Use this opportunity to:
    - Practice new trading strategies risk-free
    - Test your market analysis skills
    - Build your trading confidence
    - Learn from both wins and losses
    
    Start trading now: ${process.env.NEXT_PUBLIC_APP_URL}/sandbox
    
    Next Deposit:
    Your next quarterly deposit will be automatically processed on the first day of Q${quarter === 4 ? 1 : quarter + 1} ${quarter === 4 ? year + 1 : year}.
    
    Happy trading! Remember, the best traders learn from every trade.
    
    ChartSense Team
    © 2025 ChartSense - Advanced Trading Analytics
  `;
  
  const subject = `💰 Q${quarter} ${year} Deposit: ${amount.toLocaleString()} SENSES Added | ChartSense`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

// Send trading event email (SL/TP/Liquidation)
export const sendTradingEventEmail = async (user, tradeData, eventType) => {
  const { symbol, side, entryPrice, exitPrice, pnl, pnlPercentage, leverage } = tradeData;
  
  const eventDetails = {
    stop_loss: {
      emoji: '🛑',
      title: 'Stop Loss Triggered',
      color: '#F44336',
      description: 'Your position hit the stop loss level'
    },
    take_profit: {
      emoji: '🎯',
      title: 'Take Profit Reached!',
      color: '#4CAF50',
      description: 'Your position successfully hit the take profit target'
    },
    liquidation: {
      emoji: '⚠️',
      title: 'Position Liquidated',
      color: '#FF5722',
      description: 'Your leveraged position was liquidated due to insufficient margin'
    }
  };
  
  const event = eventDetails[eventType] || eventDetails.stop_loss;
  const pnlColor = pnl >= 0 ? '#4CAF50' : '#F44336';
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #2196F3; margin: 0; font-size: 28px; font-weight: bold;">📊 ChartSense</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Trading Alert</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <!-- Event Icon -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; background-color: ${event.color}; border-radius: 50%; color: white; font-size: 40px; line-height: 80px;">
            ${event.emoji}
          </div>
        </div>
        
        <h2 style="color: ${event.color}; text-align: center; margin-bottom: 10px; font-size: 24px; font-weight: bold;">
          ${event.title} - ${symbol}
        </h2>
        <p style="color: #666; text-align: center; font-size: 16px; margin-bottom: 30px;">${event.description}</p>
        
        <p style="color: #333; font-size: 18px; line-height: 1.6; margin-bottom: 10px;">Hi ${user.name},</p>
        
        <!-- Trade Details -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📈 Position Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px 0; color: #666;">Symbol:</td>
              <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right;">${symbol}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px 0; color: #666;">Side:</td>
              <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right;">${side.toUpperCase()}${leverage > 1 ? ` (${leverage}x)` : ''}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px 0; color: #666;">Entry Price:</td>
              <td style="padding: 10px 0; color: #333; text-align: right;">${entryPrice.toFixed(2)} SENSES</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px 0; color: #666;">Exit Price:</td>
              <td style="padding: 10px 0; color: #333; text-align: right;">${exitPrice.toFixed(2)} SENSES</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: bold;">P&L:</td>
              <td style="padding: 10px 0; color: ${pnlColor}; font-weight: bold; font-size: 18px; text-align: right;">
                ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SENSES (${pnl >= 0 ? '+' : ''}${pnlPercentage}%)
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=history" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
            📊 View Trading History
          </a>
        </div>
        
        ${eventType === 'liquidation' ? `
        <!-- Liquidation Warning -->
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 30px 0;">
          <h4 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px;">⚠️ Risk Management Reminder</h4>
          <p style="color: #666; margin: 0; line-height: 1.6; font-size: 14px;">
            Liquidations occur when losses exceed your margin. Consider using lower leverage and always set stop losses to protect your capital.
          </p>
        </div>
        ` : ''}
        
        <!-- Trading Tips -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 30px 0;">
          <h4 style="color: #1976D2; margin: 0 0 15px 0; font-size: 16px;">💡 Trading Tips</h4>
          <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
            ${eventType === 'stop_loss' ? `
              <li>Stop losses help limit downside risk and protect capital</li>
              <li>Consider your risk-reward ratio when setting stop losses</li>
              <li>Review your trade to understand what went wrong</li>
            ` : eventType === 'take_profit' ? `
              <li>Great job setting and achieving your profit target!</li>
              <li>Consistent profit-taking is key to long-term success</li>
              <li>Consider trailing stop losses for trending markets</li>
            ` : `
              <li>Always use appropriate position sizing for your account</li>
              <li>Lower leverage reduces liquidation risk</li>
              <li>Set stop losses to exit before liquidation levels</li>
            `}
          </ul>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: center;">
          Keep learning and improving your trading strategy! 📈
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
        <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
        <p style="margin: 0;">This email was sent to ${user.email}</p>
      </div>
    </div>
  `;
  
  const textContent = `
    ${event.emoji} ${event.title} - ${symbol}
    
    Hi ${user.name},
    
    ${event.description}
    
    Position Details:
    • Symbol: ${symbol}
    • Side: ${side.toUpperCase()}${leverage > 1 ? ` (${leverage}x)` : ''}
    • Entry Price: ${entryPrice.toFixed(2)} SENSES
    • Exit Price: ${exitPrice.toFixed(2)} SENSES
    • P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SENSES (${pnl >= 0 ? '+' : ''}${pnlPercentage}%)
    
    View your trading history: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=history
    
    ${eventType === 'liquidation' ? `
    Risk Management Reminder:
    Liquidations occur when losses exceed your margin. Consider using lower leverage and always set stop losses to protect your capital.
    ` : ''}
    
    Trading Tips:
    ${eventType === 'stop_loss' ? `
    • Stop losses help limit downside risk and protect capital
    • Consider your risk-reward ratio when setting stop losses
    • Review your trade to understand what went wrong
    ` : eventType === 'take_profit' ? `
    • Great job setting and achieving your profit target!
    • Consistent profit-taking is key to long-term success
    • Consider trailing stop losses for trending markets
    ` : `
    • Always use appropriate position sizing for your account
    • Lower leverage reduces liquidation risk
    • Set stop losses to exit before liquidation levels
    `}
    
    Keep learning and improving your trading strategy!
    
    ChartSense Team
    © 2025 ChartSense - Advanced Trading Analytics
  `;
  
  const subject = `${event.emoji} ${event.title} - ${symbol} | ChartSense`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

// Send new follower email
export const sendNewFollowerEmail = async (user, follower) => {
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #2196F3; margin: 0; font-size: 28px; font-weight: bold;">👥 ChartSense</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">New Follower Alert!</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <!-- Follower Icon -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); border-radius: 50%; color: white; font-size: 40px; line-height: 80px;">
            ➕
          </div>
        </div>
        
        <h2 style="color: #333; text-align: center; margin-bottom: 20px; font-size: 24px;">You Have a New Follower!</h2>
        
        <p style="color: #333; font-size: 18px; line-height: 1.6; margin-bottom: 10px;">Hi ${user.name},</p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Great news! <strong>${follower.name}</strong> (@${follower.username}) just started following you on ChartSense.
        </p>
        
        <!-- Follower Info -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">${follower.name}</h3>
          <p style="color: #2196F3; margin: 0 0 10px 0; font-size: 16px;">@${follower.username}</p>
          ${follower.bio ? `<p style="color: #666; margin: 0 0 20px 0; font-size: 14px; font-style: italic;">"${follower.bio}"</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/u/${follower.username}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Profile
          </a>
        </div>
        
        <!-- Engagement Tips -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 30px 0;">
          <h4 style="color: #1976D2; margin: 0 0 15px 0; font-size: 16px;">💡 Growing Your Community</h4>
          <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
            <li>Share your trading insights and strategies</li>
            <li>Engage with your followers' content</li>
            <li>Post regular updates about your trading journey</li>
            <li>Help others learn from your experiences</li>
          </ul>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}" style="display: inline-block; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
            👤 View Your Profile
          </a>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 30px; text-align: center;">
          Keep building your trading community! 🚀
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; padding: 20px;">
        <p style="margin: 0 0 10px 0;">© 2025 ChartSense - Advanced Trading Analytics</p>
        <p style="margin: 0;">This email was sent to ${user.email}</p>
      </div>
    </div>
  `;
  
  const textContent = `
    👥 You Have a New Follower!
    
    Hi ${user.name},
    
    Great news! ${follower.name} (@${follower.username}) just started following you on ChartSense.
    
    View their profile: ${process.env.NEXT_PUBLIC_APP_URL}/u/${follower.username}
    
    Growing Your Community:
    • Share your trading insights and strategies
    • Engage with your followers' content
    • Post regular updates about your trading journey
    • Help others learn from your experiences
    
    View your profile: ${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}
    
    Keep building your trading community!
    
    ChartSense Team
    © 2025 ChartSense - Advanced Trading Analytics
  `;
  
  const subject = `👥 ${follower.name} started following you | ChartSense`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

// Send bulk email (used by admin panel)
export const sendBulkEmail = async (emailData) => {
  return await sendEmail(emailData.to, emailData.subject, emailData.html, emailData.text);
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendMetricsEmail,
  sendInactiveUserReminder,
  sendBadgeReceivedEmail,
  sendSandboxDepositNotification,
  sendTradingEventEmail,
  sendNewFollowerEmail,
  sendBulkEmail,
  generateToken,
};
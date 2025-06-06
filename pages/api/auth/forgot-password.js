import { createApiHandler } from '../../../lib/api-handler';
import { composeMiddleware } from '../../../lib/api-handler';
import { authRateLimit } from '../../../middleware/rateLimit';
import { sanitizeInput, sanitizeEmail } from '../../../middleware/sanitization';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import crypto from 'crypto';
import emailService from '../../../lib/email-service';
import logger from '../../../lib/logger';

async function forgotPasswordHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();

    const { email } = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email (case-insensitive search)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') }
    });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      // Log the attempt but still return success
      logger.log(`Password reset attempted for non-existent email: ${sanitizedEmail}`);
      return res.status(200).json({
        message: 'If an account with this email exists, you will receive password reset instructions.'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        error: 'Please verify your email address before requesting a password reset.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user,
        resetToken
      );

      logger.log(`Password reset email sent to: ${sanitizedEmail}`);

      return res.status(200).json({
        message: 'Password reset instructions have been sent to your email.'
      });

    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      
      // Clear the reset token since we couldn't send the email
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        error: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    logger.error('Forgot password error:', error);
    return res.status(500).json({
      error: 'An error occurred while processing your request.'
    });
  }
}

// TEMP: Remove middleware until rate limiting is fixed
export default forgotPasswordHandler;

// TODO: Restore middleware after fixing rate limiting
/*
export default createApiHandler(
  composeMiddleware(
    authRateLimit,
    sanitizeInput,
    forgotPasswordHandler
  ),
  { methods: ['POST'] }
);
*/
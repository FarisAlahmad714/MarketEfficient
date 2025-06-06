import { createApiHandler } from '../../../lib/api-handler';
import { composeMiddleware } from '../../../lib/api-handler';
import { authRateLimit } from '../../../middleware/rateLimit';
import { sanitizeInput } from '../../../middleware/sanitization';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import logger from '../../../lib/logger';

async function resetPasswordHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();

    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (typeof token !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    logger.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    return res.status(500).json({
      error: 'An error occurred while resetting your password.'
    });
  }
}

// TEMP: Remove middleware until rate limiting is fixed  
export default resetPasswordHandler;

// TODO: Restore middleware after fixing rate limiting
/*
export default createApiHandler(
  composeMiddleware(
    authRateLimit,
    sanitizeInput,
    resetPasswordHandler
  ),
  { methods: ['POST'] }
);
*/
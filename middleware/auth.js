// middleware/auth.js
import jwt from 'jsonwebtoken';
import connectDB from '../lib/database';
import User from '../models/User';

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether authentication is required
 * @param {boolean} options.adminOnly - Whether admin access is required
 */
export const authenticate = (options = {}) => {
  return async (req, res, next) => {
    const { required = true, adminOnly = false } = options;
    
    try {
      // Get Authorization header
      const authHeader = req.headers.authorization;
      
      // If no token and auth is not required, continue
      if (!authHeader && !required) {
        req.user = null;
        return next();
      }
      
      // If no token and auth is required, return error
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authorization token required',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      
      // Extract token
      const token = authHeader.split(' ')[1];
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token expired',
            code: 'AUTH_TOKEN_EXPIRED'
          });
        }
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: 'Invalid token',
            code: 'AUTH_TOKEN_INVALID'
          });
        }
        throw error;
      }
      
      // Connect to database if not connected
      await connectDB();
      
      // Find user
      const user = await User.findById(decoded.userId)
        .select('-password -verificationToken -resetPasswordToken');
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Check if user is verified (optional based on your requirements)
      if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        return res.status(403).json({ 
          error: 'Email not verified',
          code: 'EMAIL_NOT_VERIFIED',
          needsVerification: true
        });
      }
      
      // Check admin access if required
      if (adminOnly && !user.isAdmin) {
        return res.status(403).json({ 
          error: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }
      
      // Attach user to request
      req.user = {
        id: user._id.toString(),
        userId: user._id.toString(), // For backwards compatibility
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false,
        isVerified: user.isVerified || false
      };
      
      // Continue to next middleware
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Shorthand middleware for routes that require authentication
 */
export const requireAuth = authenticate({ required: true });

/**
 * Shorthand middleware for routes that require admin access
 */
export const requireAdmin = authenticate({ required: true, adminOnly: true });

/**
 * Shorthand middleware for routes where auth is optional
 */
export const optionalAuth = authenticate({ required: false });

/**
 * Helper function to extract user from request (for backwards compatibility)
 */
export const getUserFromRequest = (req) => {
  return req.user || null;
};
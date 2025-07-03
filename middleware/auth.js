// middleware/auth.js
import jwt from 'jsonwebtoken';
import connectDB from '../lib/database';
import User from '../models/User';

/**
 * Parse cookies from request
 */
function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  
  return cookies;
}

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
      // Try to get token from cookie first, then Authorization header
      const cookies = parseCookies(req);
      const cookieToken = cookies.auth_token;
      const authHeader = req.headers.authorization;
      
      let token = null;
      
      // Prefer cookie token for better security
      if (cookieToken) {
        token = cookieToken;
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
      
      // If no token and auth is not required, continue
      if (!token && !required) {
        req.user = null;
        return next();
      }
      
      // If no token and auth is required, return error
      if (!token) {
        return res.status(401).json({ 
          error: 'Authorization token required',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // Clear cookie if it exists
          if (cookieToken) {
            res.setHeader('Set-Cookie', 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
          }
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
        .select('-password -verificationToken -resetPasswordToken -newEmailVerificationToken');
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Auto-generate username for existing users who don't have one
      if (!user.username) {
        console.log(`[AUTH MIDDLEWARE] Generating username for user ${user._id}`);
        try {
          let baseUsername = '';
          if (user.name) {
            // Use name, remove spaces and special characters, make lowercase
            baseUsername = user.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 15);
          } else {
            // Use email prefix if no name
            baseUsername = user.email
              .split('@')[0]
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 15);
          }

          // Ensure it starts with a letter
          if (!/^[a-z]/.test(baseUsername)) {
            baseUsername = 'user' + baseUsername;
          }

          // Find an available username
          let username = baseUsername;
          let counter = 1;
          
          while (true) {
            const existingUser = await User.findOne({ username });
            if (!existingUser) {
              break;
            }
            username = `${baseUsername}${counter}`;
            counter++;
            
            // Prevent infinite loop
            if (counter > 9999) {
              username = `user${Date.now().toString().slice(-6)}`;
              break;
            }
          }

          // Update user with new username
          user.username = username;
          await user.save();
          
          console.log(`[AUTH MIDDLEWARE] Auto-generated username for user ${user._id}`);
        } catch (error) {
          console.error('[AUTH MIDDLEWARE] Error auto-generating username:', error);
          // Continue without username - don't break auth flow
        }
      }

      // Update timezone and location data for existing users
      if (!user.timezone || user.timezone === 'UTC' || !user.country) {
        try {
          const timezone = req.headers['x-timezone'];
          let needsUpdate = false;
          
          // Update timezone if header present and different
          if (timezone && timezone !== 'UTC' && (!user.timezone || user.timezone === 'UTC')) {
            user.timezone = timezone;
            needsUpdate = true;
          }
          
          // Detect location if not set
          if (!user.country || !user.countryCode) {
            const { getLocationFromIP, getClientIP } = require('../lib/geolocation');
            const clientIP = getClientIP(req);
            const locationData = await getLocationFromIP(clientIP);
            
            if (locationData.success) {
              user.country = locationData.country || user.country;
              user.countryCode = locationData.countryCode || user.countryCode;
              user.region = locationData.region || user.region;
              user.city = locationData.city || user.city;
              user.continent = locationData.continent || user.continent;
              user.timezone = locationData.timezone || user.timezone;
              needsUpdate = true;
            }
          }
          
          if (needsUpdate) {
            await user.save();
            console.log(`[AUTH MIDDLEWARE] Updated location data for user ${user._id}`);
          }
        } catch (error) {
          console.error('[AUTH MIDDLEWARE] Error updating location data:', error);
        }
      }

      // Debug logging removed for security
      
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
        _id: user._id,
        id: user._id.toString(),
        userId: user._id.toString(), // For backwards compatibility
        email: user.email,
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        profileImageGcsPath: user.profileImageGcsPath,
        socialLinks: user.socialLinks,
        profileVisibility: user.profileVisibility,
        shareResults: user.shareResults,
        isAdmin: user.isAdmin || false,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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

/**
 * Verify JWT token and return user data (for backwards compatibility)
 * @param {string} token - JWT token string
 * @returns {Object|null} User data or null if invalid
 */
export const verifyToken = async (token) => {
  try {
    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findById(decoded.userId)
      .select('-password -verificationToken -resetPasswordToken -newEmailVerificationToken');
    
    if (!user) {
      return null;
    }
    
    // Return user data with subscription info
    return {
      _id: user._id,
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      isAdmin: user.isAdmin || false,
      isVerified: user.isVerified || false,
      subscriptionStatus: user.subscriptionStatus,
      isPremium: user.isPremium || false,
      promoCode: user.promoCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};
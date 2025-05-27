import jwt from 'jsonwebtoken';
import connectDB from '../lib/database';
import User from '../models/User';
import Subscription from '../models/Subscription';

/**
 * Middleware to check if user has an active subscription
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowAdmin - Whether to allow admin users regardless of subscription
 * @param {boolean} options.allowVerified - Whether to allow verified users without subscription (for limited access)
 */
export const requireSubscription = (options = {}) => {
  return async (req, res, next) => {
    const { allowAdmin = true, allowVerified = false } = options;
    
    try {
      // First check if user is authenticated
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authorization token required',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'AUTH_TOKEN_INVALID'
        });
      }
      
      // Connect to database
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
      
      // Check if admin (and admin access is allowed)
      if (allowAdmin && user.isAdmin) {
        req.user = {
          id: user._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          isAdmin: true,
          hasActiveSubscription: true,
          subscriptionStatus: 'admin'
        };
        return next();
      }
      
      // Check if user has active subscription
      const subscription = await Subscription.findOne({ 
        userId: user._id,
        status: { $in: ['active', 'trialing', 'admin_access'] }
      });
      
      if (!subscription || subscription.isExpired()) {
        // If allowVerified is true and user is verified, allow limited access
        if (allowVerified && user.isVerified) {
          req.user = {
            id: user._id.toString(),
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            isAdmin: false,
            hasActiveSubscription: false,
            subscriptionStatus: 'none',
            limitedAccess: true
          };
          return next();
        }
        
        return res.status(403).json({ 
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
          subscriptionStatus: user.subscriptionStatus || 'none',
          message: 'Please subscribe to access this feature'
        });
      }
      
      // Attach user and subscription info to request
      req.user = {
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false,
        hasActiveSubscription: true,
        subscriptionStatus: subscription.status,
        subscriptionPlan: subscription.plan,
        subscriptionEnd: subscription.currentPeriodEnd
      };
      
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({ 
        error: 'Subscription verification failed',
        code: 'SUBSCRIPTION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has premium features access
 * This is a lighter check that just verifies premium access without full subscription details
 */
export const requirePremiumAccess = requireSubscription({ allowAdmin: true, allowVerified: false });

/**
 * Middleware for routes that should be accessible to verified users with limited functionality
 */
export const requireVerifiedUser = requireSubscription({ allowAdmin: true, allowVerified: true }); 
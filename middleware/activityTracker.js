// middleware/activityTracker.js - Track user activity for online status
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const trackUserActivity = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.userId) {
          // Update lastActiveAt without waiting for completion
          User.findByIdAndUpdate(
            decoded.userId,
            { lastActiveAt: new Date() },
            { new: true }
          ).catch(err => {
            console.error('Error updating user activity:', err);
          });
        }
      } catch (error) {
        // Token verification failed, but don't block the request
      }
    }
  } catch (error) {
    // Don't block requests due to activity tracking errors
  }
  
  next();
};
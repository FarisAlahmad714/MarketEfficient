// pages/api/debug/admin-status.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import User from '../../../models/User';

async function adminStatusHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    
    if (req.method === 'GET') {
      // Get current admin status
      return res.status(200).json({
        userId: userId,
        email: user?.email,
        isAdmin: user?.isAdmin || false,
        userFound: !!user
      });
    }
    
    if (req.method === 'POST') {
      // Set admin status (for debugging only)
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      user.isAdmin = true;
      await user.save();
      
      return res.status(200).json({
        message: 'Admin status granted',
        userId: userId,
        email: user.email,
        isAdmin: user.isAdmin
      });
    }

  } catch (error) {
    console.error('Error in admin status check:', error);
    res.status(500).json({ 
      error: 'Failed to check admin status',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, adminStatusHandler),
  { methods: ['GET', 'POST'] }
);
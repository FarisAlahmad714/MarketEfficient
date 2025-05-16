// pages/api/admin/users.js
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

// Middleware to check if user is admin
async function isAdmin(req) {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    return user && user.isAdmin;
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  // Connect to database
  await connectDB();
  
  // Check if user is admin
  const adminCheck = await isAdmin(req);
  if (!adminCheck) {
    return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
  
  // GET method - fetch users with pagination
  if (req.method === 'GET') {
    try {
      // Get pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Get search parameter
      const search = req.query.search || '';
      const searchRegex = new RegExp(search, 'i');
      
      // Build query
      const query = search 
        ? { $or: [
            { name: searchRegex },
            { email: searchRegex }
          ]}
        : {};
      
      // Get users with pagination
      const users = await User.find(query)
        .select('-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Get total users count for pagination
      const total = await User.countDocuments(query);
      
      return res.status(200).json({
        users,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  } 
  // DELETE method - delete a user
  else if (req.method === 'DELETE') {
    try {
      const { userId } = req.query;
      
      // Validate userId is provided
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Find the user to check if they are an admin
      const userToDelete = await User.findById(userId);
      
      // Safety check: Don't allow deleting admin users
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (userToDelete.isAdmin) {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }
      
      // Delete the user
      await User.findByIdAndDelete(userId);
      
      // Also delete related data if needed (TestResults, etc.)
      // This would be the place to handle cascading deletion
      // Example: await TestResults.deleteMany({ userId });
      
      return res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  } 
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
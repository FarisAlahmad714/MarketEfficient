// pages/api/notifications/unread-count.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get user from token
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies.auth_token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const unreadCount = await Notification.getUnreadCount(user._id);

    res.status(200).json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
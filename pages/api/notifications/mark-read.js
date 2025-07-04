// pages/api/notifications/mark-read.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { notificationId, markAll = false } = req.body;

    if (markAll) {
      // Mark all notifications as read
      const result = await Notification.markAllAsRead(user._id);
      
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await Notification.markAsRead(notificationId, user._id);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        notification
      });
    } else {
      return res.status(400).json({ error: 'Either notificationId or markAll must be provided' });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
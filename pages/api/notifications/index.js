// pages/api/notifications/index.js
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

    // Parse query parameters
    const { 
      type, 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      markAsRead = false 
    } = req.query;

    // Build query
    const query = {
      recipient: user._id,
      isVisible: true
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch notifications
    const notifications = await Notification.find(query)
      .populate('actor', 'username name profileImageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(user._id);

    // Mark notifications as read if requested
    if (markAsRead === 'true' && notifications.length > 0) {
      const notificationIds = notifications.map(n => n._id);
      await Notification.updateMany(
        { _id: { $in: notificationIds }, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );
      
      // Update the notifications in response
      notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date();
        }
      });
    }

    // Format notifications with time ago
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      timeAgo: getTimeAgo(notification.createdAt)
    }));

    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNextPage: skip + parseInt(limit) < totalCount,
        hasPrevPage: parseInt(page) > 1
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Notification from '../../models/Notification';
import dbConnect from '../../lib/database';

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

    // Create a test notification
    const testNotification = new Notification({
      recipient: user._id,
      actor: user._id,
      type: 'comment',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system works',
      metadata: {
        test: true
      }
    });

    await testNotification.save();

    res.status(200).json({
      success: true,
      message: 'Test notification created',
      notification: testNotification
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
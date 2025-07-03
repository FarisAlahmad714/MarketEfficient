// pages/api/share/create.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import dbConnect from '../../../lib/database';
import SharedContent from '../../../models/SharedContent';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get user from token (check both authorization header and cookies)
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
    
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    // Validate type
    const validTypes = ['achievement', 'badge', 'test_result', 'trading_highlight', 'profile'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid share type' });
    }

    // Generate unique share ID
    const shareId = uuidv4().replace(/-/g, '').substring(0, 12);

    // Create shared content
    const sharedContent = new SharedContent({
      shareId,
      type,
      username: user.username,
      name: user.name,
      data
    });

    await sharedContent.save();

    // Return the share ID and URL
    const domain = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000';
    const shareUrl = `${domain}/share/${shareId}`;

    res.status(201).json({
      shareId,
      shareUrl,
      type,
      createdAt: sharedContent.createdAt
    });

  } catch (error) {
    console.error('Error creating shared content:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: user ? { id: user._id, username: user.username } : 'No user'
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
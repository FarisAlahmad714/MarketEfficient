// pages/api/share/check-status.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import SharedContent from '../../../models/SharedContent';
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

    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    // Check if already shared based on type-specific data matching
    let existingShare = null;
    
    if (type === 'trading_highlight') {
      existingShare = await SharedContent.findOne({
        userId: user._id,
        type: type,
        'data.symbol': data.symbol,
        'data.side': data.side,
        'data.return': data.return,
        'data.entryPrice': data.entryPrice
      });
    } else if (type === 'test_result') {
      existingShare = await SharedContent.findOne({
        userId: user._id,
        type: type,
        'data.asset': data.asset,
        'data.score': data.score,
        'data.testType': data.testType
      });
    } else if (type === 'achievement' || type === 'badge') {
      existingShare = await SharedContent.findOne({
        userId: user._id,
        type: type,
        'data.id': data.id
      });
    } else {
      existingShare = await SharedContent.findOne({
        userId: user._id,
        type: type,
        data: data
      });
    }

    res.status(200).json({
      success: true,
      isShared: !!existingShare,
      shareId: existingShare?.shareId || null,
      sharedAt: existingShare?.createdAt || null
    });

  } catch (error) {
    console.error('Error checking share status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
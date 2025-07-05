import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Like from '../../../models/Like';
import Comment from '../../../models/Comment';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Get user from token (optional for this endpoint)
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies.auth_token;
    }

    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (error) {
        // Token invalid, continue without user
      }
    }

    const { shareId, targetIds, targetType } = req.query;

    if (!shareId || !targetIds || !targetType) {
      return res.status(400).json({ error: 'shareId, targetIds, and targetType are required' });
    }

    if (!['shared_content', 'comment'].includes(targetType)) {
      return res.status(400).json({ error: 'targetType must be "shared_content" or "comment"' });
    }

    const targetIdsArray = Array.isArray(targetIds) ? targetIds : [targetIds];

    // Get likes count for each target
    const likesData = {};
    
    for (const targetId of targetIdsArray) {
      const likesCount = await Like.countDocuments({ targetType, targetId });
      
      let isLiked = false;
      if (currentUserId) {
        const userLike = await Like.findOne({
          userId: currentUserId,
          targetType,
          targetId
        });
        isLiked = !!userLike;
      }

      likesData[targetId] = {
        likesCount,
        isLiked
      };
    }

    res.status(200).json({
      success: true,
      likesData
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
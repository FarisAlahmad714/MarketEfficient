// pages/api/follow/status.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUserId } = req.query;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  try {
    await dbConnect();

    // Get counts for the target user
    const followerCount = await Follow.countDocuments({ following: targetUserId });
    const followingCount = await Follow.countDocuments({ follower: targetUserId });

    let isFollowing = false;
    let currentUserId = null;

    // Check if current user is authenticated and following the target user
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies.auth_token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user) {
          currentUserId = user._id.toString();
          
          // Check if current user is following target user
          const followRelation = await Follow.findOne({
            follower: user._id,
            following: targetUserId
          });
          
          isFollowing = !!followRelation;
        }
      } catch (error) {
        // Token invalid, but still return public data
      }
    }

    res.status(200).json({
      followerCount,
      followingCount,
      isFollowing,
      isOwnProfile: currentUserId === targetUserId
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
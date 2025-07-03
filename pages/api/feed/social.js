// pages/api/feed/social.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import SharedContent from '../../../models/SharedContent';
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

    // Get list of users the current user follows
    const followRelations = await Follow.find({ follower: user._id })
      .populate('following', 'username name')
      .lean();

    const followedUserIds = followRelations.map(rel => rel.following._id);
    const followedUsers = followRelations.map(rel => rel.following);

    // If not following anyone, return empty feed
    if (followedUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        feedContent: [],
        followedUsers: [],
        message: 'Start following users to see their content in your feed'
      });
    }

    // Get shared content from followed users
    const feedContent = await SharedContent.find({
      username: { $in: followedUsers.map(u => u.username) }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      feedContent,
      followedUsers,
      totalItems: feedContent.length
    });

  } catch (error) {
    console.error('Error fetching social feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
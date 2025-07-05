// pages/api/follow/list.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUserId, type } = req.query;

  if (!targetUserId || !['followers', 'following'].includes(type)) {
    return res.status(400).json({ error: 'Target user ID and valid type (followers/following) are required' });
  }

  try {
    await dbConnect();

    let users = [];

    if (type === 'followers') {
      // Get users who follow the target user
      const followers = await Follow.find({ following: targetUserId })
        .populate('follower', 'username name profileImageUrl')
        .lean();
      
      users = followers.map(follow => follow.follower);
    } else if (type === 'following') {
      // Get users that the target user follows
      const following = await Follow.find({ follower: targetUserId })
        .populate('following', 'username name profileImageUrl')
        .lean();
      
      users = following.map(follow => follow.following);
    }

    res.status(200).json({
      success: true,
      users,
      count: users.length,
      type
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
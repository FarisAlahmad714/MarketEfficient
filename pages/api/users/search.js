// pages/api/users/search.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get user from token (optional - can search without being logged in)
    let currentUser = null;
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
        currentUser = await User.findById(decoded.userId);
      } catch (error) {
        // Token invalid but continue without user context
      }
    }

    const { q, limit = 20, page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search for users by username or name
    const searchRegex = new RegExp(searchQuery, 'i');
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { name: searchRegex }
      ],
      isPrivate: { $ne: true } // Only show public profiles
    })
.select('_id username name profileImageUrl createdAt')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 })
    .lean();

    // Get follow relationships if user is logged in
    let followInfo = {};
    if (currentUser) {
      const followRelations = await Follow.find({
        $or: [
          { follower: currentUser._id, following: { $in: users.map(u => u._id) } },
          { follower: { $in: users.map(u => u._id) }, following: currentUser._id }
        ]
      }).lean();

      followRelations.forEach(rel => {
        const userId = rel.following.toString();
        if (rel.follower.toString() === currentUser._id.toString()) {
          followInfo[userId] = { ...followInfo[userId], isFollowing: true };
        }
        if (rel.following.toString() === currentUser._id.toString()) {
          followInfo[userId] = { ...followInfo[userId], isFollower: true };
        }
      });
    }

    // Add follow information to users
    const usersWithFollowInfo = users.map(user => ({
      ...user,
      isFollowing: followInfo[user._id.toString()]?.isFollowing || false,
      isFollower: followInfo[user._id.toString()]?.isFollower || false,
      isCurrentUser: currentUser ? user._id.toString() === currentUser._id.toString() : false
    }));

    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { name: searchRegex }
      ],
      isPrivate: { $ne: true }
    });

    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.status(200).json({
      success: true,
      users: usersWithFollowInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      query: searchQuery
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
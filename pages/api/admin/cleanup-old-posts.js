// pages/api/admin/cleanup-old-posts.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import SharedContent from '../../../models/SharedContent';
import Comment from '../../../models/Comment';
import Like from '../../../models/Like';
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
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action, cutoffDate } = req.body;

    // Default cutoff date: July 3, 2025, 08:06 AM
    const defaultCutoffDate = new Date('2025-07-03T08:06:00.000Z');
    const actualCutoffDate = cutoffDate ? new Date(cutoffDate) : defaultCutoffDate;

    console.log(`Admin cleanup requested by ${user.email}`);
    console.log(`Action: ${action}, Cutoff: ${actualCutoffDate.toISOString()}`);

    let results = {};

    if (action === 'delete_old' || action === 'both') {
      // Delete old posts
      const oldPosts = await SharedContent.find({
        createdAt: { $lt: actualCutoffDate }
      });
      
      const shareIds = oldPosts.map(post => post.shareId);
      
      // Delete related data
      const deletedComments = await Comment.deleteMany({
        shareId: { $in: shareIds }
      });
      
      const deletedLikes = await Like.deleteMany({
        targetId: { $in: shareIds },
        targetType: 'shared_content'
      });
      
      const deletedNotifications = await Notification.deleteMany({
        'metadata.shareId': { $in: shareIds }
      });
      
      const deletedPosts = await SharedContent.deleteMany({
        createdAt: { $lt: actualCutoffDate }
      });

      results.deleted = {
        posts: deletedPosts.deletedCount,
        comments: deletedComments.deletedCount,
        likes: deletedLikes.deletedCount,
        notifications: deletedNotifications.deletedCount
      };
    }

    if (action === 'fix_userids' || action === 'both') {
      // Fix missing userId fields
      const postsWithoutUserId = await SharedContent.find({
        userId: { $exists: false },
        username: { $exists: true, $ne: null }
      });

      let fixed = 0;
      let notFound = 0;

      for (const post of postsWithoutUserId) {
        try {
          const userRecord = await User.findOne({ username: post.username }).select('_id');
          
          if (userRecord) {
            await SharedContent.updateOne(
              { _id: post._id },
              { $set: { userId: userRecord._id } }
            );
            fixed++;
          } else {
            notFound++;
          }
        } catch (error) {
          console.error(`Error fixing post ${post._id}:`, error);
        }
      }

      results.fixed = {
        postsFixed: fixed,
        usersNotFound: notFound
      };
    }

    // Get remaining stats
    const remainingPosts = await SharedContent.countDocuments();
    const postsWithoutUserId = await SharedContent.countDocuments({
      userId: { $exists: false }
    });

    results.summary = {
      remainingPosts,
      postsWithoutUserId,
      cutoffDate: actualCutoffDate.toISOString()
    };

    res.status(200).json({
      success: true,
      action,
      results,
      message: 'Cleanup completed successfully'
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// pages/api/follow/[action].js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;
  const { targetUserId } = req.body;

  if (!['follow', 'unfollow'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
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

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Prevent self-following
    if (user._id.equals(targetUserId)) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    if (action === 'follow') {
      // Check if already following
      const existingFollow = await Follow.findOne({
        follower: user._id,
        following: targetUserId
      });

      if (existingFollow) {
        return res.status(400).json({ error: 'Already following this user' });
      }

      // Create follow relationship
      const follow = new Follow({
        follower: user._id,
        following: targetUserId
      });

      await follow.save();

      // Create notification for the user being followed
      try {
        await Notification.createNotification({
          recipient: targetUserId,
          actor: user._id,
          type: 'follow',
          title: 'New Follower',
          message: `${user.name} started following you`,
          actionUrl: `/u/${user.username}`,
          metadata: {
            followerUsername: user.username,
            followerName: user.name
          }
        });
        
        // Send email notification if the target user has email notifications enabled
        if (targetUser.notifications?.email !== false && targetUser.isVerified) {
          const { sendNewFollowerEmail } = require('../../../lib/email-service');
          
          // Prepare follower data for email
          const followerData = {
            name: user.name,
            username: user.username,
            bio: user.bio || null
          };
          
          await sendNewFollowerEmail(targetUser, followerData);
          console.log(`[Follow API] Email sent to ${targetUser.email} for new follower ${user.username}`);
        }
      } catch (notificationError) {
        console.error('[Follow API] Failed to create notification or send email:', notificationError);
        // Don't fail the follow action if notification fails
      }

      res.status(201).json({ 
        success: true, 
        message: `Now following ${targetUser.name}`,
        isFollowing: true
      });

    } else if (action === 'unfollow') {
      // Remove follow relationship
      const result = await Follow.deleteOne({
        follower: user._id,
        following: targetUserId
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({ error: 'Not following this user' });
      }

      res.status(200).json({ 
        success: true, 
        message: `Unfollowed ${targetUser.name}`,
        isFollowing: false
      });
    }

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Like from '../../../models/Like';
import Comment from '../../../models/Comment';
import SharedContent from '../../../models/SharedContent';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
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

    const { shareId, targetType, targetId } = req.body;

    if (!shareId || !targetType || !targetId) {
      return res.status(400).json({ error: 'shareId, targetType, and targetId are required' });
    }

    if (!['shared_content', 'comment'].includes(targetType)) {
      return res.status(400).json({ error: 'targetType must be "shared_content" or "comment"' });
    }

    // Check if user already liked this
    const existingLike = await Like.findOne({
      userId: user._id,
      targetType,
      targetId
    });

    let isLiked = false;
    let likesCount = 0;

    if (existingLike) {
      // Unlike - remove the like
      await Like.deleteOne({ _id: existingLike._id });
      isLiked = false;
      
      // Update the count on the target
      if (targetType === 'comment') {
        await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
        const comment = await Comment.findById(targetId);
        likesCount = comment ? comment.likesCount : 0;
      }
    } else {
      // Like - create new like
      const like = new Like({
        shareId,
        userId: user._id,
        username: user.username,
        name: user.name,
        targetType,
        targetId
      });

      await like.save();
      isLiked = true;

      // Update the count on the target
      if (targetType === 'comment') {
        await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
        const comment = await Comment.findById(targetId);
        likesCount = comment ? comment.likesCount : 0;
      }

      // Create notification for the like
      await createLikeNotification(like, user);
    }

    // Get total likes count for the target
    if (targetType === 'shared_content') {
      likesCount = await Like.countDocuments({ targetType, targetId });
    }

    res.status(200).json({
      success: true,
      isLiked,
      likesCount
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createLikeNotification(like, liker) {
  try {
    let targetOwner = null;
    let notificationMessage = '';
    let notificationTitle = '';

    if (like.targetType === 'shared_content') {
      // Find the owner of the shared content
      const sharedContent = await SharedContent.findOne({ shareId: like.shareId });
      if (sharedContent) {
        // If userId is missing, find it by username
        if (!sharedContent.userId && sharedContent.username) {
          console.log('Like: SharedContent missing userId, looking up by username:', sharedContent.username);
          const contentOwner = await User.findOne({ username: sharedContent.username }).select('_id');
          if (contentOwner) {
            sharedContent.userId = contentOwner._id;
            console.log('Like: Found userId for username:', contentOwner._id);
          }
        }
        
        if (sharedContent.userId) {
          targetOwner = sharedContent.userId;
          notificationTitle = 'Content Liked';
          notificationMessage = `${liker.name} liked your ${sharedContent.type.replace('_', ' ')}`;
        }
      }
    } else if (like.targetType === 'comment') {
      // Find the owner of the comment
      const comment = await Comment.findById(like.targetId);
      if (comment && comment.userId) {
        targetOwner = comment.userId;
        notificationTitle = 'Comment Liked';
        notificationMessage = `${liker.name} liked your comment`;
      }
    }

    // Don't notify if the liker is the owner
    if (targetOwner && targetOwner.toString() !== liker._id.toString()) {
      const notification = new Notification({
        recipient: targetOwner,
        actor: liker._id,
        type: 'content_like',
        title: notificationTitle,
        message: notificationMessage,
        metadata: {
          shareId: like.shareId,
          targetType: like.targetType,
          targetId: like.targetId,
          likerName: liker.name,
          likerUsername: liker.username
        },
        actionUrl: `/post/${like.shareId}`
      });

      console.log('Creating like notification:', notification);
      await notification.save();
      console.log('Like notification created successfully');
    }

  } catch (error) {
    console.error('Error creating like notification:', error);
  }
}
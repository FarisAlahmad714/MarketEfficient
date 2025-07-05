import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Comment from '../../../models/Comment';
import SharedContent from '../../../models/SharedContent';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    return getComments(req, res);
  } else if (req.method === 'POST') {
    return createComment(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getComments(req, res) {
  try {
    const { shareId, limit = 20, offset = 0 } = req.query;

    if (!shareId) {
      return res.status(400).json({ error: 'shareId is required' });
    }

    const comments = await Comment.find({ 
      shareId, 
      parentCommentId: null // Only get top-level comments
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ 
          parentCommentId: comment._id 
        })
          .sort({ createdAt: 1 })
          .limit(5) // Limit replies shown initially
          .lean();

        return {
          ...comment,
          replies,
          hasMoreReplies: replies.length === 5
        };
      })
    );

    const totalCount = await Comment.countDocuments({ 
      shareId, 
      parentCommentId: null 
    });

    res.status(200).json({
      success: true,
      comments: commentsWithReplies,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createComment(req, res) {
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

    const { shareId, content, parentCommentId, mentions } = req.body;

    if (!shareId || !content) {
      return res.status(400).json({ error: 'shareId and content are required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 characters)' });
    }

    // Verify the shared content exists
    const sharedContent = await SharedContent.findOne({ shareId });
    if (!sharedContent) {
      return res.status(404).json({ error: 'Shared content not found' });
    }
    
      shareId: sharedContent.shareId,
      type: sharedContent.type,
      userId: sharedContent.userId,
      username: sharedContent.username
    });

    // If userId is missing, find it by username
    if (!sharedContent.userId && sharedContent.username) {
      const contentOwner = await User.findOne({ username: sharedContent.username }).select('_id');
      if (contentOwner) {
        sharedContent.userId = contentOwner._id;
      } else {
      }
    }

    // Create the comment
    const comment = new Comment({
      shareId,
      userId: user._id,
      username: user.username,
      name: user.name,
      content,
      parentCommentId: parentCommentId || null,
      isReply: !!parentCommentId,
      mentions: mentions || []
    });

    await comment.save();

    // Update parent comment reply count if this is a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $inc: { repliesCount: 1 } }
      );
    }

    // Create notifications
    await createCommentNotifications(comment, sharedContent, user);

    res.status(201).json({
      success: true,
      comment: {
        ...comment.toObject(),
        replies: [],
        hasMoreReplies: false
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createCommentNotifications(comment, sharedContent, commenter) {
  try {
    const notifications = [];

    // 1. Notify the original content creator (if not the commenter)
    if (sharedContent.userId && sharedContent.userId.toString() !== commenter._id.toString()) {
      notifications.push({
        recipient: sharedContent.userId,
        actor: commenter._id,
        type: 'content_comment',
        title: 'New Comment',
        message: `${commenter.name} commented on your ${sharedContent.type.replace('_', ' ')}`,
        metadata: {
          shareId: sharedContent.shareId,
          commentId: comment._id,
          commenterName: commenter.name,
          commenterUsername: commenter.username,
          content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
        },
        actionUrl: `/post/${sharedContent.shareId}`
      });
    }

    // 2. Notify mentioned users
    if (comment.mentions && comment.mentions.length > 0) {
      for (const mention of comment.mentions) {
        if (mention.userId.toString() !== commenter._id.toString()) {
          notifications.push({
            recipient: mention.userId,
            actor: commenter._id,
            type: 'profile_mention',
            title: 'You were mentioned',
            message: `${commenter.name} mentioned you in a comment`,
            metadata: {
              shareId: sharedContent.shareId,
              commentId: comment._id,
              commenterName: commenter.name,
              commenterUsername: commenter.username,
              content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
            },
            actionUrl: `/post/${sharedContent.shareId}`
          });
        }
      }
    }

    // 3. If this is a reply, notify the parent comment author
    if (comment.parentCommentId) {
      const parentComment = await Comment.findById(comment.parentCommentId);
      if (parentComment && parentComment.userId.toString() !== commenter._id.toString()) {
        notifications.push({
          recipient: parentComment.userId,
          actor: commenter._id,
          type: 'content_comment',
          title: 'New Reply',
          message: `${commenter.name} replied to your comment`,
          metadata: {
            shareId: sharedContent.shareId,
            commentId: comment._id,
            parentCommentId: comment.parentCommentId,
            commenterName: commenter.name,
            commenterUsername: commenter.username,
            content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
          },
          actionUrl: `/post/${sharedContent.shareId}`
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

  } catch (error) {
  }
}
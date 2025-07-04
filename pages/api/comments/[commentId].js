import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Comment from '../../../models/Comment';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  await dbConnect();

  const { commentId } = req.query;

  if (req.method === 'DELETE') {
    return deleteComment(req, res, commentId);
  } else if (req.method === 'GET') {
    return getCommentReplies(req, res, commentId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function deleteComment(req, res, commentId) {
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

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({
      $or: [
        { _id: commentId },
        { parentCommentId: commentId }
      ]
    });

    // Update parent comment reply count if this was a reply
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(
        comment.parentCommentId,
        { $inc: { repliesCount: -1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCommentReplies(req, res, commentId) {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const replies = await Comment.find({ 
      parentCommentId: commentId 
    })
      .sort({ createdAt: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    const totalCount = await Comment.countDocuments({ 
      parentCommentId: commentId 
    });

    res.status(200).json({
      success: true,
      replies,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    console.error('Error fetching comment replies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
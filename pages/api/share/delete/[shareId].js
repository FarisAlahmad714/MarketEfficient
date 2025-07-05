// pages/api/share/delete/[shareId].js
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import SharedContent from '../../../../models/SharedContent';
import Comment from '../../../../models/Comment';
import Like from '../../../../models/Like';
import Notification from '../../../../models/Notification';
import dbConnect from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    const { shareId } = req.query;

    if (!shareId) {
      return res.status(400).json({ error: 'shareId is required' });
    }

    // Find the shared content
    const sharedContent = await SharedContent.findOne({ shareId });
    
    if (!sharedContent) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns this content
    if (sharedContent.userId && sharedContent.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // If no userId, check by username (for legacy posts)
    if (!sharedContent.userId && sharedContent.username !== user.username) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete related data
    await Promise.all([
      // Delete comments on this post
      Comment.deleteMany({ shareId }),
      // Delete likes on this post
      Like.deleteMany({ targetId: shareId, targetType: 'shared_content' }),
      // Delete notifications related to this post
      Notification.deleteMany({ 'metadata.shareId': shareId }),
      // Delete the shared content itself
      SharedContent.deleteOne({ shareId })
    ]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
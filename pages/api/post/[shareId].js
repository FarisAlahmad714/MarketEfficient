// pages/api/post/[shareId].js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import SharedContent from '../../../models/SharedContent';
import dbConnect from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { shareId } = req.query;

    if (!shareId) {
      return res.status(400).json({ error: 'shareId is required' });
    }

    // Find the shared content
    const sharedContent = await SharedContent.findOne({ shareId }).lean();
    
    if (!sharedContent) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get user details for the post author
    let postWithUserDetails = { ...sharedContent };
    
    if (sharedContent.userId) {
      // If userId exists, get user details
      const user = await User.findById(sharedContent.userId)
        .select('name username profileImageGcsPath')
        .lean();
      
      if (user) {
        postWithUserDetails.name = user.name;
        postWithUserDetails.username = user.username;
        postWithUserDetails.profileImageGcsPath = user.profileImageGcsPath;
      }
    } else if (sharedContent.username) {
      // If only username exists, look up user details
      const user = await User.findOne({ username: sharedContent.username })
        .select('_id name username profileImageGcsPath')
        .lean();
      
      if (user) {
        postWithUserDetails.userId = user._id;
        postWithUserDetails.name = user.name;
        postWithUserDetails.profileImageGcsPath = user.profileImageGcsPath;
      }
    }

    res.status(200).json({
      success: true,
      post: postWithUserDetails
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
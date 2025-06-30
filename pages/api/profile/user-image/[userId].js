import dbConnect from '../../../../lib/database';
import User from '../../../../models/User';
import { getSignedUrlForImage } from '../../../../lib/gcs-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find user by ID - this is for public profile images
    const user = await User.findById(userId).select('profileImageGcsPath');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate signed URL for profile image if it exists
    let profileImageUrl = null;
    if (user.profileImageGcsPath) {
      try {
        profileImageUrl = await getSignedUrlForImage(user.profileImageGcsPath);
      } catch (error) {
        console.error('Error generating signed URL for user profile image:', error);
        return res.status(500).json({ 
          error: 'Failed to generate profile image URL',
          details: error.message
        });
      }
    }

    return res.status(200).json({
      profileImageUrl,
      hasProfileImage: !!profileImageUrl
    });

  } catch (error) {
    console.error('Error fetching user profile image:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import User from '../../../models/User';
import { getSignedUrlForImage } from '../../../lib/gcs-service';

async function getProfileImageHandler(req, res) {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('profileImageGcsPath').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.profileImageGcsPath) {
      return res.status(200).json({ profileImageUrl: null, hasProfileImage: false });
    }

    const profileImageUrl = await getSignedUrlForImage(user.profileImageGcsPath);
    return res.status(200).json({ profileImageUrl, hasProfileImage: true });

  } catch (error) {
    console.error('Error getting profile image:', error);
    console.error('User ID:', userId);
    console.error('GCS Path:', user?.profileImageGcsPath);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to get profile image';
    let statusCode = 500;
    
    if (error.message.includes('File not found')) {
      errorMessage = 'Profile image file not found in storage';
      statusCode = 404;
    } else if (error.message.includes('Permission denied') || error.code === 403) {
      errorMessage = 'Storage access permission denied';
      statusCode = 403;
    } else if (error.message.includes('not initialized')) {
      errorMessage = 'Storage service not properly configured';
      statusCode = 500;
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      userId: userId,
      gcsPath: user?.profileImageGcsPath
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, getProfileImageHandler),
  { methods: ['GET'] }
); 
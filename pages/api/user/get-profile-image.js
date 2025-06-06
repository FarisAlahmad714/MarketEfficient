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
    return res.status(500).json({ 
      error: 'Failed to get profile image.',
      details: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, getProfileImageHandler),
  { methods: ['GET'] }
); 
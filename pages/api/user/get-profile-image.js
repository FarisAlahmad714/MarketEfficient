import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import User from '../../../models/User';
import { getSignedUrlForImage } from '../../../lib/gcs-service';

async function getProfileImageHandler(req, res) {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('profileImageGcsPath').lean();

    if (!user) {
      // This case should ideally not be hit if requireAuth works correctly
      // and user is authenticated, but as a safeguard.
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.profileImageGcsPath) {
      return res.status(404).json({ error: 'Profile image not set for this user.', hasProfileImage: false });
    }

    try {
      const signedUrl = await getSignedUrlForImage(user.profileImageGcsPath);
      return res.status(200).json({ signedUrl, hasProfileImage: true });
    } catch (signedUrlError) {
      console.error('Error generating signed URL in API:', signedUrlError);
      // It's possible the gcsPath is invalid or the object doesn't exist anymore
      // or there was an issue with the GCS service itself.
      return res.status(500).json({ error: 'Could not retrieve profile image URL.', details: signedUrlError.message, hasProfileImage: true }); // hasProfileImage is true because a path exists
    }

  } catch (dbError) {
    console.error('Database error fetching user GCS path:', dbError);
    // This will be caught by createApiHandler's general error handling if re-thrown
    // For clarity, sending a specific response if not re-throwing.
    return res.status(500).json({ error: 'Server error retrieving image information.' });
  }
}

export default createApiHandler(
  requireAuth(getProfileImageHandler),
  { methods: ['GET'] }
); 
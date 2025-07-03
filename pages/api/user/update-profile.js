import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authenticate } from '../../../middleware/auth'; // IMPORT THE REAL MIDDLEWARE
import { uploadImageToGCS, deleteImageFromGCS } from '../../../lib/gcs-service'; // IMPORT GCS service
import crypto from 'crypto'; // For generating token
import emailService from '../../../lib/email-service'; // Import the default export
import logger from '../../../lib/logger';
import { withCsrfProtect } from '../../../middleware/csrf';
// import { sendChangeEmailVerificationEmail } from '../../../lib/email-service'; // TODO: Implement and uncomment

const EMAIL_VERIFICATION_EXPIRE_HOURS = 24;

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  const userId = req.user.id || req.user._id;
  const { 
    name, 
    bio, 
    username,
    socialLinks,
    profileVisibility,
    shareResults,
    profileImage: newProfileImageBase64, 
    email: newEmailRequest 
  } = req.body; // profileImage is base64 string

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let emailChangePending = false;
    let newEmailAddressForResponse = null;

    // Handle Email Change Request
    if (newEmailRequest && typeof newEmailRequest === 'string' && newEmailRequest.trim().toLowerCase() !== userToUpdate.email) {
      const newEmail = newEmailRequest.trim().toLowerCase();
      
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ error: 'Invalid new email format.' });
      }

      // Check if new email is already in use by another verified user or pending for another user
      const existingUserWithNewEmail = await User.findOne({
        $or: [
          { email: newEmail, isVerified: true }, 
          { newEmail: newEmail }
        ],
        _id: { $ne: userToUpdate._id } // Exclude current user
      });

      if (existingUserWithNewEmail) {
        return res.status(400).json({ error: 'This email address is already in use or pending verification by another account.' });
      }

      // Generate a new verification token
      const token = crypto.randomBytes(32).toString('hex');
      userToUpdate.newEmail = newEmail;
      userToUpdate.newEmailVerificationToken = token;
      userToUpdate.newEmailVerificationTokenExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRE_HOURS * 60 * 60 * 1000);
      
      emailChangePending = true;
      newEmailAddressForResponse = newEmail;

      // Send verification email to `newEmail`
      try {
        // Use the imported emailService object
        await emailService.sendChangeEmailVerificationEmail(newEmail, userToUpdate.name, token);
        logger.log(`Verification email initiated for user ${userToUpdate._id}`);
      } catch (emailError) {
        logger.error("Failed to send new email verification email:", emailError);
        // Non-fatal error for now: Log and proceed. The user will see the pending message.
        // For production, consider if this should be a fatal error for the request.
      }
    }

    // Validate and update fields
    if (name && typeof name === 'string') {
      userToUpdate.name = name.trim();
    } else {
      // Retain existing name if not provided or invalid, or handle as error
      // For now, we allow partial updates, so if name is missing, it's not updated.
    }

    if (bio && typeof bio === 'string') {
        // maxlength is handled by schema, but good to be aware
        userToUpdate.bio = bio.substring(0, 500); 
    } else if (bio === '') { // Allow clearing bio
        userToUpdate.bio = '';
    }

    // Handle username update
    if (username && typeof username === 'string') {
      const trimmedUsername = username.trim().toLowerCase();
      
      // Check if username is different from current
      if (trimmedUsername !== userToUpdate.username) {
        // Check if username is already taken
        const existingUser = await User.findOne({ 
          username: trimmedUsername,
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          return res.status(400).json({ error: 'Username is already taken.' });
        }
        
        userToUpdate.username = trimmedUsername;
      }
    } else if (username === '') { // Allow clearing username
      userToUpdate.username = undefined;
    }

    // Handle social links
    if (socialLinks && typeof socialLinks === 'object') {
      if (!userToUpdate.socialLinks) {
        userToUpdate.socialLinks = {};
      }
      
      // Update each social link if provided
      if (socialLinks.hasOwnProperty('twitter')) {
        userToUpdate.socialLinks.twitter = socialLinks.twitter || '';
      }
      if (socialLinks.hasOwnProperty('linkedin')) {
        userToUpdate.socialLinks.linkedin = socialLinks.linkedin || '';
      }
      if (socialLinks.hasOwnProperty('instagram')) {
        userToUpdate.socialLinks.instagram = socialLinks.instagram || '';
      }
    }

    // Handle profile visibility
    if (profileVisibility && ['public', 'private'].includes(profileVisibility)) {
      userToUpdate.profileVisibility = profileVisibility;
    }

    // Handle share results setting
    if (typeof shareResults === 'boolean') {
      userToUpdate.shareResults = shareResults;
    }

    // Handle GCS Image Upload
    if (newProfileImageBase64 && typeof newProfileImageBase64 === 'string' && newProfileImageBase64.startsWith('data:image')) {
      // 1. Delete old image from GCS if it exists
      if (userToUpdate.profileImageGcsPath) {
        try {
          await deleteImageFromGCS(userToUpdate.profileImageGcsPath);
        } catch (gcsDeleteError) {
          logger.warn(`Failed to delete old GCS image:`, gcsDeleteError.message);
          // Non-fatal, proceed with uploading new image
        }
      }

      // 2. Upload new image to GCS
      try {
        // uploadImageToGCS now returns { gcsPath }
        const { gcsPath } = await uploadImageToGCS(newProfileImageBase64);
        userToUpdate.profileImageGcsPath = gcsPath; // Save the GCS path
        userToUpdate.profileImageUrl = ''; // Clear any old direct URL; signed URL will be fetched on demand
      } catch (gcsUploadError) {
        logger.error('Failed to upload new profile image to GCS:', gcsUploadError);
        return res.status(500).json({ error: 'Failed to upload profile image.', details: gcsUploadError.message });
      }
    }
    
    // The 'notifications' field is not handled here as it was removed from the client-side form.
    // If old user objects in DB have it, it will remain unless explicitly cleared.

    await userToUpdate.save();

    // Return relevant updated user info
    const updatedUserInfo = {
        _id: userToUpdate._id,
        id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        newEmail: userToUpdate.newEmail,
        username: userToUpdate.username,
        bio: userToUpdate.bio,
        socialLinks: userToUpdate.socialLinks,
        profileVisibility: userToUpdate.profileVisibility,
        shareResults: userToUpdate.shareResults,
        // profileImageUrl is no longer a direct public URL.
        // The client will need to fetch a signed URL using the gcsPath.
        // We can choose to send back the gcsPath if useful, or have client re-fetch profile.
        // For now, let's not send profileImageUrl directly as it might be misleading.
        // profileImageUrl: userToUpdate.profileImageUrl, 
        profileImageGcsPath: userToUpdate.profileImageGcsPath, // Optionally send back the GCS path
        isAdmin: userToUpdate.isAdmin,
        isVerified: userToUpdate.isVerified
    };

    let message = 'Profile updated successfully.';
    if (emailChangePending) {
        message = `Profile details saved. A verification email has been sent to ${newEmailAddressForResponse}. Please verify to update your email address.`
    }

    return res.status(200).json({ 
        message: message, 
        user: updatedUserInfo,
        emailChangePending: emailChangePending,
        pendingEmail: newEmailAddressForResponse 
    });

  } catch (error) {
    logger.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update profile.', details: error.message });
  }
}

export default async function (req, res) {
  const authMiddleware = authenticate({ required: true });
  
  return new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => {
      if (err) return reject(err);
      // Apply CSRF protection after authentication
      withCsrfProtect(handler)(req, res).then(resolve).catch(reject);
    });
  });
}; 
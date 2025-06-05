import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authenticate } from '../../../middleware/auth'; // IMPORT THE REAL MIDDLEWARE

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  const userId = req.user.id || req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password
    const isMatch = await userToUpdate.comparePassword(currentPassword);
    if (!isMatch) {
      // It's good practice to log failed password attempts if not already handled by comparePassword
      // userToUpdate.loginAttempts +=1; // (if you want to track this specifically for password change attempts too)
      // await userToUpdate.save();
      return res.status(401).json({ error: 'Incorrect current password.' });
    }
    
    // Validate new password (minlength is handled by schema, add complexity if needed)
    if (newPassword.length < 8) { // Redundant if schema has it, but good explicit check
        return res.status(400).json({ error: 'New password must be at least 8 characters long.'});
    }

    // Set new password (pre-save hook in User model will hash it)
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    // Optionally: Invalidate other sessions, send notification, etc.

    return res.status(200).json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Error changing password:', error);
    if (error.name === 'ValidationError') {
        // Mongoose validation errors (e.g., if password doesn't meet schema criteria after trying to set)
        return res.status(400).json({ error: 'Password validation failed', details: error.errors });
    }
    // Handle account lock error from comparePassword
    if (error.message && error.message.includes('Account is temporarily locked')) {
        return res.status(423).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to change password.', details: error.message });
  }
}

export default authenticate(handler); 
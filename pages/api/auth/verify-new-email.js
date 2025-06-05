import connectDB from '../../../lib/database';
import User from '../../../models/User';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectDB();

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Verification token is missing or invalid.' });
  }

  try {
    const user = await User.findOne({
      newEmailVerificationToken: token,
      newEmailVerificationTokenExpires: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link. Please try changing your email again.' });
    }

    user.email = user.newEmail; 
    user.isVerified = true; 
    
    user.newEmail = null;
    user.newEmailVerificationToken = null;
    user.newEmailVerificationTokenExpires = null;

    await user.save();

    logger.log(`User ${user._id} successfully verified new email address`);
    
    res.redirect('/profile?newEmailVerified=true');

  } catch (error) {
    logger.error('Error verifying new email:', error);
    return res.status(500).json({ error: 'An error occurred while verifying your new email address.' });
  }
} 
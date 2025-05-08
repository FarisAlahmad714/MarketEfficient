import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { generateToken, sendVerificationEmail } from '../../../lib/email-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ 
        message: 'If your email exists in our system, a verification link has been sent.' 
      });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'This email is already verified. You can log in.'
      });
    }
    
    // Generate new verification token
    const verificationToken = generateToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user, verificationToken);
    
    return res.status(200).json({ 
      message: 'Verification email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Failed to resend verification email' });
  }
}
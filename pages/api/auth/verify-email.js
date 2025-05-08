import connectDB from '../../../lib/database';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    
    const { token } = req.method === 'GET' ? req.query : req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token',
        message: 'The verification link is invalid or has expired. Please request a new verification email.'
      });
    }
    
    // Mark user as verified and remove verification token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    
    if (req.method === 'GET') {
      // Redirect to success page for GET requests
      res.redirect(302, '/auth/verification-success');
    } else {
      // Return success message for POST requests
      return res.status(200).json({ 
        success: true,
        message: 'Email verified successfully. You can now log in.'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
}
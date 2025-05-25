import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authRateLimit } from '../../../middleware/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting for authentication
  return new Promise((resolve) => {
    authRateLimit(req, res, async () => {
      try {
        // Connect to database
        await connectDB();
        
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Additional input validation
        if (typeof email !== 'string' || typeof password !== 'string') {
          return res.status(400).json({ error: 'Invalid input format' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Optional: Check if email is verified
        if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
          return res.status(403).json({ 
            error: 'Email not verified',
            message: 'Please verify your email before logging in.',
            needsVerification: true
          });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        // Return user info (without password) and token
        return res.status(200).json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin
          },
          token
        });
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
      } finally {
        resolve();
      }
    });
  });
}
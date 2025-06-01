// pages/api/auth/login.js
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authRateLimit } from '../../../middleware/rateLimit';
import { sanitizeInput, sanitizeEmail } from '../../../middleware/sanitization';

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
        
        // Apply sanitization to inputs
        sanitizeInput()(req, res, async () => {
          const { email, password } = req.body;
          
          // Validate input
          if (!email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
          }

          // Additional input validation
          if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid input format' });
          }

          // Validate and sanitize email
          const sanitizedEmail = sanitizeEmail(email);
          if (!sanitizedEmail) {
            return res.status(400).json({ error: 'Invalid email format' });
          }

          // Validate password length
          if (password.length < 6 || password.length > 128) {
            return res.status(400).json({ error: 'Invalid credentials' });
          }
          
          // Find user with sanitized email
          const user = await User.findOne({ email: sanitizedEmail });
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
          
          // Generate JWT token with shorter expiry
          const token = jwt.sign(
            { 
              userId: user._id,
              email: user.email,
              isAdmin: user.isAdmin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Reduced from 7d
          );
          
          // Set secure httpOnly cookie
          const isProduction = process.env.NODE_ENV === 'production';
          const cookieOptions = [
            `auth_token=${token}`,
            'HttpOnly',
            isProduction ? 'Secure' : '',
            'SameSite=Strict',
            'Path=/',
            `Max-Age=${24 * 60 * 60}` // 24 hours
          ].filter(Boolean).join('; ');
          
          res.setHeader('Set-Cookie', cookieOptions);
          
          // Return user info (without password) and token
          // Keep returning token for now for backward compatibility
          // But encourage using the cookie instead
          return res.status(200).json({
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              isVerified: user.isVerified,
              isAdmin: user.isAdmin
            },
            token, // For backward compatibility - remove this after updating frontend
            message: 'Login successful. Token is now also set as secure cookie.'
          });
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
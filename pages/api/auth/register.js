import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { generateToken, sendVerificationEmail, sendWelcomeEmail } from '../../../lib/email-service';
import { authRateLimit } from '../../../middleware/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting for registration
  return new Promise((resolve) => {
    authRateLimit(req, res, async () => {
      try {
        // Connect to database
        await connectDB();
        
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Enhanced input validation
        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
          return res.status(400).json({ error: 'Invalid input format' });
        }

        // Validate name length and content
        if (name.trim().length < 2 || name.trim().length > 50) {
          return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Enhanced password validation
        if (password.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check password strength
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        let strengthScore = 0;
        if (hasUpperCase) strengthScore++;
        if (hasLowerCase) strengthScore++;
        if (hasNumbers) strengthScore++;
        if (hasSpecialChar) strengthScore++;

        if (strengthScore < 2) {
          return res.status(400).json({ 
            error: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and special characters.' 
          });
        }
        
        // Check if user already exists (case-insensitive)
        const existingUser = await User.findOne({ 
          email: email.toLowerCase().trim() 
        });
        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }
        
        // Generate verification token
        const verificationToken = generateToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Create new user
        const user = await User.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          verificationToken,
          verificationTokenExpires,
          createdAt: new Date()
        });
        
        // Send verification email
        await sendVerificationEmail(user, verificationToken);
        
        // Send welcome email
        await sendWelcomeEmail(user);
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        // Return user info (without password) and token
        return res.status(201).json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin
          },
          token,
          message: 'Registration successful. Please check your email to verify your account.'
        });
      } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Registration failed' });
      } finally {
        resolve();
      }
    });
  });
}
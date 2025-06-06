// pages/api/auth/login.js
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { authRateLimit } from '../../../middleware/rateLimit';
import { sanitizeInput, sanitizeEmail } from '../../../middleware/sanitization';
import SecurityLogger from '../../../lib/security-logger';
import crypto from 'crypto';
import { withCsrfProtect } from '../../../middleware/csrf';

async function loginApiRouteHandler(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (req.method === 'GET') {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const csrfCookieOptions = [
      `csrf_token=${csrfToken}`,
      isProduction ? 'Secure' : '',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${24 * 60 * 60}` // 24 hours
    ].filter(Boolean).join('; ');
    res.setHeader('Set-Cookie', csrfCookieOptions);
    return res.status(200).json({ csrfToken });
  }

  if (req.method === 'POST') {
    // GET IP ADDRESS INSIDE THE HANDLER
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    // Apply rate limiting for authentication
    return new Promise((resolve, reject) => {
      authRateLimit(req, res, () => {
        sanitizeInput()(req, res, async () => {
          try {
            // Connect to database
            await connectDB();
            
            const { email, password } = req.body;
            
            // Validate input
            if (!email || !password) {
              res.status(400).json({ error: 'Missing required fields' });
              return resolve();
            }

            // Additional input validation
            if (typeof email !== 'string' || typeof password !== 'string') {
              res.status(400).json({ error: 'Invalid input format' });
              return resolve();
            }

            // Validate and sanitize email
            const sanitizedEmail = sanitizeEmail(email);
            if (!sanitizedEmail) {
              res.status(400).json({ error: 'Invalid email format' });
              return resolve();
            }

            // Validate password length
            if (password.length < 6 || password.length > 128) {
              res.status(400).json({ error: 'Invalid credentials' });
              return resolve();
            }
            
            // Find user with sanitized email (case-insensitive search)
            const user = await User.findOne({ 
              email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') }
            });
            if (!user) {
              // Log failed attempt even if user doesn't exist
              SecurityLogger.logEvent('failed_login', {
                email: sanitizedEmail,
                ip,
                reason: 'user_not_found'
              });
              res.status(401).json({ error: 'Invalid credentials' });
              return resolve();
            }
            
            // Compare password
            try {
              const isPasswordValid = await user.comparePassword(password);
              
              if (!isPasswordValid) {
                // Log security event
                SecurityLogger.logEvent('failed_login', {
                  email: sanitizedEmail,
                  ip,
                  attempts: user.loginAttempts,
                  userId: user._id.toString()
                });
                
                // Check if account is now locked
                if (user.isLocked) {
                  SecurityLogger.logEvent('failed_login_lockout', {
                    email: sanitizedEmail,
                    ip,
                    userId: user._id.toString()
                  });
                }
                
                res.status(401).json({ error: 'Invalid credentials' });
                return resolve();
              }
              
              // Update last login on success
              user.lastLogin = new Date();
              await user.save();
              
              // Log successful login
              SecurityLogger.logEvent('successful_login', {
                userId: user._id.toString(),
                email: user.email,
                ip
              });
              
            } catch (error) {
              // Handle account lock error from comparePassword
              if (error.message.includes('locked')) {
                res.status(423).json({ 
                  error: 'Account is temporarily locked due to too many failed login attempts' 
                });
                return resolve();
              }
              throw error;
            }
            
            // Optional: Check if email is verified
            if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
              res.status(403).json({ 
                error: 'Email not verified',
                message: 'Please verify your email before logging in.',
                needsVerification: true
              });
              return resolve();
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
            
            // Set secure httpOnly cookie for auth_token
            const authTokenCookieOptions = [
              `auth_token=${token}`,
              'HttpOnly',
              isProduction ? 'Secure' : '',
              'SameSite=Strict',
              'Path=/',
              `Max-Age=${24 * 60 * 60}` // 24 hours
            ].filter(Boolean).join('; ');
            
            // Generate new CSRF token for the authenticated session
            const newCsrfToken = crypto.randomBytes(32).toString('hex');
            const csrfTokenCookieOptions = [
              `csrf_token=${newCsrfToken}`,
              isProduction ? 'Secure' : '',
              'SameSite=Strict',
              'Path=/',
              `Max-Age=${24 * 60 * 60}` // 24 hours
            ].filter(Boolean).join('; ');

            res.setHeader('Set-Cookie', [authTokenCookieOptions, csrfTokenCookieOptions]);
            
            res.status(200).json({
              user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                isAdmin: user.isAdmin
              },
              token, // For backward compatibility
              message: 'Login successful. Token is now also set as secure cookie.'
            });
            resolve();
          } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
            resolve();
          }
        });
      });
    });
  }

  // If method is not GET or POST
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Apply rate limiting before CSRF protection
const rateLimitedHandler = (req, res) => {
  return new Promise((resolve) => {
    authRateLimit(req, res, () => {
      withCsrfProtect(loginApiRouteHandler)(req, res);
      resolve();
    });
  });
};

export default rateLimitedHandler;
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
              // Log failed attempt even if user doesn't exist
              SecurityLogger.logEvent('failed_login', {
                email: sanitizedEmail,
                ip,
                reason: 'user_not_found'
              });
              return res.status(401).json({ error: 'Invalid credentials' });
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
                
                return res.status(401).json({ error: 'Invalid credentials' });
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
                return res.status(423).json({ 
                  error: 'Account is temporarily locked due to too many failed login attempts' 
                });
              }
              throw error;
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
            
            return res.status(200).json({
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
          });
        } catch (error) {
          console.error('Login error:', error);
          // Ensure error response is resolved within the promise if it's a direct throw from try block
          res.status(500).json({ error: 'Login failed' });
          resolve(); // Ensure promise resolves in case of outer catch
        } finally {
          // Resolve should be called if not already handled by returning a response
          // However, most paths return res.status().json(), which ends the response.
          // If a path doesn't explicitly end the response, resolve() is important.
          // Given the structure, this resolve() might be okay, but typically res.end() or similar confirms.
          if (!res.headersSent) {
             resolve();
          }
        }
      });
    });
  }

  // If method is not GET or POST
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withCsrfProtect(loginApiRouteHandler);
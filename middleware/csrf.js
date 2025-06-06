// middleware/csrf.js
import crypto from 'crypto';

/**
 * Generates a random CSRF token using crypto.
 * @returns {string} A 64-character hexadecimal token.
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to protect Next.js API routes from CSRF attacks.
 * Verifies the CSRF token from the request header against the cookie for state-changing methods.
 * @param {Function} handler - The Next.js API route handler to wrap.
 * @returns {Function} - The wrapped handler with CSRF protection.
 */
export function withCsrfProtect(handler) {
  return async (req, res) => {
    // Only apply CSRF protection to state-changing HTTP methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const tokenFromHeader = req.headers['x-csrf-token'];

      // Manually parse cookies since Next.js API routes don’t provide req.cookies by default
      const cookieHeader = req.headers.cookie || '';
      const cookies = {};
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value); // Decode to handle encoded values
        }
      });

      const tokenFromCookie = cookies.csrf_token;

      // Validate CSRF token presence and match
      if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
        return res.status(403).json({
          error: 'Invalid CSRF token',
          code: 'CSRF_VALIDATION_FAILED'
        });
      }
    }

    // CSRF check passed or not applicable (e.g., GET request), proceed to the handler
    return handler(req, res);
  };
}
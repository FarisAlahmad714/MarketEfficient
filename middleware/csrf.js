// middleware/csrf.js
import crypto from 'crypto';

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

<<<<<<< HEAD
// Fixed CSRF middleware that actually works
export function withCsrfProtect(handler) {
  return async (req, res) => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const tokenFromHeader = req.headers['x-csrf-token'];
      
      // Parse cookies manually since Next.js doesn't provide req.cookies in API routes
      const cookieHeader = req.headers.cookie || '';
      const cookies = {};
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
      
      const tokenFromCookie = cookies.csrf_token;

      if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
        return res.status(403).json({ 
          error: 'Invalid CSRF token',
          code: 'CSRF_VALIDATION_FAILED'
        });
      }
    }
    
    // CSRF check passed, continue to handler
=======
// Updated to read from cookies and to be used in a HOF
function _validateCSRFTokenLogic(req, res) {
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies?.csrf_token;

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return false;
  }
  return true;
}

export function withCsrfProtect(handler) {
  return async (req, res) => {
    // Only apply CSRF protection for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      if (!_validateCSRFTokenLogic(req, res)) {
        // Response is already sent by _validateCSRFTokenLogic
        return;
      }
    }
    // Proceed to the handler if CSRF check is not applicable or passed
>>>>>>> e21852f15954d1a29d6fab2cd61c4964bb1bbb59
    return handler(req, res);
  };
}
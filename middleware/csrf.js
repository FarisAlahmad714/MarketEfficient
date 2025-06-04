// middleware/csrf.js
import crypto from 'crypto';

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

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
    return handler(req, res);
  };
}
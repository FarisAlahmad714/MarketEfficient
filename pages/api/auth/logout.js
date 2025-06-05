import { blacklistToken } from '../../../middleware/tokenSecurity';
import { withCsrfProtect } from '../../../middleware/csrf';
import { logger } from '../../../lib/logger';

async function logoutHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookie or authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    
    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, try to parse from cookies
    if (!token) {
      const cookieHeader = req.headers.cookie || '';
      const cookies = {};
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
      token = cookies.auth_token;
    }

    // Blacklist the token if found
    if (token) {
      blacklistToken(token);
      logger.info('User token blacklisted during logout', { 
        tokenPrefix: token.substring(0, 8) + '...' 
      });
    }

    // Clear authentication and CSRF cookies
    const clearCookies = [
      'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict; Secure=' + (process.env.NODE_ENV === 'production'),
      'csrf_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure=' + (process.env.NODE_ENV === 'production'),
      'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict; Secure=' + (process.env.NODE_ENV === 'production')
    ];

    res.setHeader('Set-Cookie', clearCookies);

    return res.status(200).json({ 
      message: 'Logged out successfully',
      success: true 
    });

  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
}

export default withCsrfProtect(logoutHandler);
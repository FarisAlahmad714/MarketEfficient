// pages/api/auth/csrf-token.js
import { generateCSRFToken } from '../../../middleware/csrf';
import { setSecureCookie } from '../../../lib/cookieConfig';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    
    // Set CSRF token as cookie
    setSecureCookie(res, 'csrf_token', csrfToken, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.status(200).json({ 
      csrfToken
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
}
// lib/cookieConfig.js

export const secureCookieOptions = (isProduction = process.env.NODE_ENV === 'production') => {
    return {
      httpOnly: true,              // Prevents JavaScript access
      secure: isProduction,        // HTTPS only in production
      sameSite: 'strict',         // CSRF protection
      path: '/',                  // Cookie available site-wide
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
    };
  };
  
  // Helper to set secure cookie in API routes
  export const setSecureCookie = (res, name, value, options = {}) => {
    const cookieOptions = {
      ...secureCookieOptions(),
      ...options
    };
    
    const cookieString = `${name}=${value}; ${Object.entries(cookieOptions)
      .filter(([_, v]) => v !== undefined && v !== false)
      .map(([k, v]) => {
        if (k === 'maxAge') return `Max-Age=${Math.floor(v / 1000)}`;
        if (k === 'httpOnly' && v) return 'HttpOnly';
        if (k === 'secure' && v) return 'Secure';
        if (typeof v === 'boolean') return v ? k : '';
        return `${k.charAt(0).toUpperCase() + k.slice(1)}=${v}`;
      })
      .filter(Boolean)
      .join('; ')}`;
    
    res.setHeader('Set-Cookie', cookieString);
  };
  
  // Updated login.js implementation
  export const updateLoginEndpoint = `
  // In pages/api/auth/login.js
  import { setSecureCookie } from '../../../lib/cookieConfig';
  
  // After successful authentication:
  setSecureCookie(res, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Also set a CSRF token
  const csrfToken = crypto.randomBytes(32).toString('hex');
  setSecureCookie(res, 'csrf_token', csrfToken, {
    httpOnly: false, // Needs to be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  `;
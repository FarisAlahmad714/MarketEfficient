import jwt from 'jsonwebtoken';

// In-memory blacklist for revoked tokens (in production, use Redis)
const tokenBlacklist = new Set();

// Clean up expired blacklisted tokens every hour
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const token of tokenBlacklist) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp && decoded.exp < now) {
        tokenBlacklist.delete(token);
      }
    } catch (error) {
      // Remove invalid tokens
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000); // 1 hour

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 */
export function blacklistToken(token) {
  if (token) {
    tokenBlacklist.add(token);
  }
}

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if blacklisted
 */
export function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

/**
 * Generate secure JWT token with additional claims
 * @param {Object} payload - Token payload
 * @param {Object} options - Token options
 * @returns {string} - JWT token
 */
export function generateSecureToken(payload, options = {}) {
  const {
    expiresIn = '7d',
    issuer = 'ChartSense',
    audience = 'ChartSense-Users'
  } = options;

  // Add security claims
  const securePayload = {
    ...payload,
    iss: issuer,
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    jti: generateTokenId() // Unique token ID for tracking
  };

  return jwt.sign(securePayload, process.env.JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256'
  });
}

/**
 * Verify and validate JWT token with security checks
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token or throws error
 */
export function verifySecureToken(token) {
  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    const error = new Error('Token has been revoked');
    error.name = 'TokenRevokedError';
    throw error;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'ChartSense',
      audience: 'ChartSense-Users'
    });

    // Additional security checks
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is not expired (redundant but good practice)
    if (decoded.exp && decoded.exp < now) {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    }

    // Check if token is not issued in the future
    if (decoded.iat && decoded.iat > now + 60) { // Allow 60 seconds clock skew
      const error = new Error('Token issued in the future');
      error.name = 'JsonWebTokenError';
      throw error;
    }

    return decoded;
  } catch (error) {
    // Re-throw JWT errors
    throw error;
  }
}

/**
 * Generate unique token ID
 * @returns {string} - Unique token ID
 */
function generateTokenId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Logout middleware to blacklist token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function logout(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    blacklistToken(token);
  }
  
  next();
}

/**
 * Token refresh security checks
 * @param {string} oldToken - Current token to refresh
 * @param {Object} user - User object
 * @returns {string} - New token
 */
export function refreshSecureToken(oldToken, user) {
  try {
    // Verify old token first
    const decoded = verifySecureToken(oldToken);
    
    // Check if the user ID matches
    if (decoded.userId !== user._id.toString()) {
      throw new Error('Token user mismatch');
    }
    
    // Blacklist old token
    blacklistToken(oldToken);
    
    // Generate new token
    return generateSecureToken({
      userId: user._id,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    throw new Error('Token refresh failed: ' + error.message);
  }
}

/**
 * Enhanced authentication middleware with security features
 * @param {Object} options - Authentication options
 */
export function enhancedAuth(options = {}) {
  const { required = true, adminOnly = false } = options;
  
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader && !required) {
        req.user = null;
        return next();
      }
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Use secure token verification
      const decoded = verifySecureToken(token);
      
      // Attach token info for monitoring
      req.tokenInfo = {
        jti: decoded.jti,
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      // Continue with user lookup...
      req.decodedToken = decoded;
      next();
      
    } catch (error) {
      let errorResponse = {
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      };
      
      if (error.name === 'TokenExpiredError') {
        errorResponse = {
          error: 'Token expired',
          code: 'AUTH_TOKEN_EXPIRED'
        };
      } else if (error.name === 'TokenRevokedError') {
        errorResponse = {
          error: 'Token has been revoked',
          code: 'AUTH_TOKEN_REVOKED'
        };
      } else if (error.name === 'JsonWebTokenError') {
        errorResponse = {
          error: 'Invalid token',
          code: 'AUTH_TOKEN_INVALID'
        };
      }
      
      return res.status(401).json(errorResponse);
    }
  };
}

export default {
  generateSecureToken,
  verifySecureToken,
  blacklistToken,
  isTokenBlacklisted,
  logout,
  refreshSecureToken,
  enhancedAuth
}; 
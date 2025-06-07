// middleware/rateLimit.js
const rateLimitStore = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP address and user agent for key generation
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || '';
      return `${ip}_${userAgent.substring(0, 50)}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;
    
    let requestData = rateLimitStore.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: resetTime,
        firstRequest: now
      };
    }
    
    requestData.count++;
    rateLimitStore.set(key, requestData);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));
    
    if (requestData.count > maxRequests) {
      // Log the rate limit violation
      console.warn(`Rate limit exceeded for key: ${key}, requests: ${requestData.count}`);
      
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    // Attach rate limit info to request for monitoring
    req.rateLimit = {
      limit: maxRequests,
      current: requestData.count,
      remaining: maxRequests - requestData.count,
      resetTime: requestData.resetTime
    };
    
    next();
  };
}

// Hybrid authentication rate limiter - checks both email and IP limits
export const authRateLimit = (req, res, next) => {
  const email = req.body?.email;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress || 'unknown';
  
  // Email-based rate limiter (5 attempts per email per 15 minutes)
  const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per email
    message: 'Too many login attempts for this email. Please try again in 15 minutes.',
    keyGenerator: () => email && typeof email === 'string' ? `auth_email_${email.toLowerCase().trim()}` : `auth_no_email_${ip}`
  });
  
  // IP-based rate limiter (20 attempts per IP per 15 minutes)
  const ipRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 login attempts per IP (allows multiple emails)
    message: 'Too many login attempts from this location. Please try again in 15 minutes.',
    keyGenerator: () => `auth_ip_${ip}`
  });
  
  // Check email rate limit first
  emailRateLimit(req, res, (emailError) => {
    if (emailError || res.headersSent) {
      return; // Email rate limit exceeded, response already sent
    }
    
    // If email limit passes, check IP rate limit
    ipRateLimit(req, res, (ipError) => {
      if (ipError || res.headersSent) {
        return; // IP rate limit exceeded, response already sent
      }
      
      // Both limits passed, continue
      next();
    });
  });
};

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 API calls per 15 minutes
  message: 'API rate limit exceeded. Please try again later.'
});

export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Too many requests. Please slow down.'
});

export default rateLimit; 
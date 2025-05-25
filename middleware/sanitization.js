/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
    
  // Remove potentially dangerous scripts
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize object recursively
 * @param {any} obj - Object to sanitize
 * @param {Array} exemptFields - Fields to skip sanitization
 * @returns {any} - Sanitized object
 */
function sanitizeObject(obj, exemptFields = []) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, exemptFields));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (exemptFields.includes(key)) {
        sanitized[key] = value; // Skip sanitization for exempt fields
      } else {
        sanitized[key] = sanitizeObject(value, exemptFields);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) return null;
  
  // Additional security: check for potentially dangerous characters
  if (trimmed.includes('<') || trimmed.includes('>') || trimmed.includes('"')) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitize and validate ObjectId
 * @param {string} id - MongoDB ObjectId to validate
 * @returns {string|null} - Valid ObjectId or null
 */
export function sanitizeObjectId(id) {
  if (typeof id !== 'string') return null;
  
  const trimmed = id.trim();
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return objectIdRegex.test(trimmed) ? trimmed : null;
}

/**
 * Input sanitization middleware
 * @param {Object} options - Sanitization options
 * @param {Array} options.exemptFields - Fields to skip sanitization (e.g., passwords)
 * @param {Array} options.exemptPaths - API paths to skip sanitization
 */
export function sanitizeInput(options = {}) {
  const {
    exemptFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword'],
    exemptPaths = []
  } = options;
  
  return (req, res, next) => {
    // Skip sanitization for exempt paths
    if (exemptPaths.some(path => req.url.includes(path))) {
      return next();
    }
    
    try {
      // Sanitize request body
      if (req.body) {
        req.body = sanitizeObject(req.body, exemptFields);
      }
      
      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, exemptFields);
      }
      
      // Sanitize URL parameters
      if (req.params) {
        req.params = sanitizeObject(req.params, exemptFields);
      }
      
      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      return res.status(400).json({
        error: 'Invalid input data',
        code: 'SANITIZATION_ERROR'
      });
    }
  };
}

/**
 * Specific sanitization for financial data
 * @param {any} value - Value to sanitize
 * @returns {number|null} - Sanitized number or null
 */
export function sanitizeNumericValue(value) {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Sanitize trading prediction values
 * @param {string} prediction - Trading prediction
 * @returns {string|null} - Valid prediction or null
 */
export function sanitizePrediction(prediction) {
  if (typeof prediction !== 'string') return null;
  
  const cleaned = prediction.trim().toLowerCase();
  const validPredictions = ['bullish', 'bearish'];
  
  return validPredictions.includes(cleaned) ? cleaned : null;
}

/**
 * Sanitize asset symbol
 * @param {string} symbol - Asset symbol
 * @returns {string|null} - Valid symbol or null
 */
export function sanitizeAssetSymbol(symbol) {
  if (typeof symbol !== 'string') return null;
  
  const cleaned = symbol.trim().toUpperCase();
  
  // Allow only alphanumeric characters and common symbols
  const symbolRegex = /^[A-Z0-9\-_]{1,20}$/;
  
  return symbolRegex.test(cleaned) ? cleaned : null;
}

export default sanitizeInput; 
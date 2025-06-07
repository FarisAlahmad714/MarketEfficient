// lib/error-handler.js
import logger from './logger';

/**
 * Sanitizes error messages for production to prevent information leakage
 * @param {Error} error - The original error
 * @param {string} fallbackMessage - Safe fallback message
 * @returns {object} Sanitized error response
 */
export function sanitizeError(error, fallbackMessage = 'Internal server error') {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log the full error for debugging (this will go to server logs, not user)
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });

  // Known safe errors that can be shown to users
  const safeErrors = [
    'ValidationError',
    'CastError',
    'MongoServerError',
    'JsonWebTokenError',
    'TokenExpiredError'
  ];

  // Safe error messages that don't leak sensitive information
  const safeMessages = {
    'ValidationError': 'Invalid input data',
    'CastError': 'Invalid data format',
    'MongoServerError': 'Database operation failed',
    'JsonWebTokenError': 'Invalid authentication token',
    'TokenExpiredError': 'Authentication token expired',
    'ECONNREFUSED': 'Service temporarily unavailable',
    'ETIMEDOUT': 'Request timed out'
  };

  if (isProduction) {
    // In production, only show safe, generic error messages
    const errorType = error.name || 'UnknownError';
    
    if (safeErrors.includes(errorType)) {
      return {
        error: safeMessages[errorType] || fallbackMessage,
        code: errorType,
        timestamp: new Date().toISOString()
      };
    }
    
    // For unknown errors, show generic message
    return {
      error: fallbackMessage,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    };
  } else {
    // In development, show detailed error for debugging
    return {
      error: error.message || fallbackMessage,
      code: error.name || 'UnknownError',
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Express error handler middleware
 */
export function errorHandler(error, req, res, next) {
  const sanitizedError = sanitizeError(error);
  
  // Determine status code based on error type
  let statusCode = 500;
  
  if (error.name === 'ValidationError') statusCode = 400;
  if (error.name === 'CastError') statusCode = 400;
  if (error.name === 'JsonWebTokenError') statusCode = 401;
  if (error.name === 'TokenExpiredError') statusCode = 401;
  if (error.name === 'MongoServerError' && error.code === 11000) statusCode = 409; // Duplicate key
  
  return res.status(statusCode).json(sanitizedError);
}

/**
 * Async handler wrapper that catches errors and sanitizes them
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const sanitizedError = sanitizeError(error);
      
      // Determine status code
      let statusCode = 500;
      if (error.name === 'ValidationError') statusCode = 400;
      if (error.name === 'CastError') statusCode = 400;
      if (error.name === 'JsonWebTokenError') statusCode = 401;
      if (error.name === 'TokenExpiredError') statusCode = 401;
      
      return res.status(statusCode).json(sanitizedError);
    });
  };
}

export default { sanitizeError, errorHandler, asyncHandler };
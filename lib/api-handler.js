// lib/api-handler.js
import connectDB from './database';

/**
 * Wraps an API handler with common functionality
 * @param {Function} handler - The API handler function
 * @param {Object} options - Configuration options
 */
export function createApiHandler(handler, options = {}) {
  const {
    methods = ['GET', 'POST', 'PUT', 'DELETE'],
    connectDatabase = true,
  } = options;

  return async (req, res) => {
    // Check HTTP method
    if (!methods.includes(req.method)) {
      return res.status(405).json({ 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        allowedMethods: methods
      });
    }

    try {
      // Connect to database if required
      if (connectDatabase) {
        await connectDB();
      }

      // Call the actual handler
      return await handler(req, res);
    } catch (error) {
      // Log error (in production, send to monitoring service)
      console.error(`API Error [${req.method}] ${req.url}:`, error);

      // Handle known error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          error: 'Invalid ID format',
          code: 'INVALID_ID'
        });
      }

      // Default error response
      const isDev = process.env.NODE_ENV !== 'production';
      return res.status(error.statusCode || 500).json({
        error: isDev ? error.message : 'Internal server error',
        code: error.code || 'INTERNAL_ERROR'
        // REMOVED: Stack trace exposure for security
      });
    }
  };
}

/**
 * Compose multiple middlewares
 * @param {...Function} middlewares - Middleware functions
 * @returns {Function} - Composed middleware
 */
export function composeMiddleware(...middlewares) {
  return async (req, res) => {
    let index = -1;

    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return;
      }

      return new Promise((resolve, reject) => {
        middleware(req, res, (err) => {
          if (err) reject(err);
          else resolve(dispatch(i + 1));
        });
      });
    };

    try {
      await dispatch(0);
    } catch (error) {
      // Let createApiHandler handle the error
      throw error;
    }
  };
}
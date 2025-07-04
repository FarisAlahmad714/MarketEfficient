/**
 * Comprehensive error handling for trading operations
 * Integrates with existing admin panel audit logging
 */

/**
 * Trading-specific error types
 */
class TradingError extends Error {
  constructor(message, code, severity = 'medium', context = {}) {
    super(message);
    this.name = 'TradingError';
    this.code = code;
    this.severity = severity; // 'low', 'medium', 'high', 'critical'
    this.context = context;
    this.timestamp = new Date();
  }
}

class MarketDataError extends TradingError {
  constructor(message, source, context = {}) {
    super(message, 'MARKET_DATA_ERROR', 'high', { source, ...context });
    this.name = 'MarketDataError';
  }
}

class PositionError extends TradingError {
  constructor(message, tradeId, context = {}) {
    super(message, 'POSITION_ERROR', 'medium', { tradeId, ...context });
    this.name = 'PositionError';
  }
}

class LiquidationError extends TradingError {
  constructor(message, tradeId, context = {}) {
    super(message, 'LIQUIDATION_ERROR', 'critical', { tradeId, ...context });
    this.name = 'LiquidationError';
  }
}

/**
 * Log trading errors to admin panel
 */
async function logTradingError(error, userId, action, details = {}) {
  try {
    // Import AdminAction model for logging
    const AdminAction = require('../models/AdminAction');
    
    // Create detailed audit log entry
    const auditData = {
      adminUserId: null, // System-generated error - use null for system actions
      action: 'TRADING_ERROR_GENERAL', // Use generic action type
      targetType: 'trading', // Set target type
      category: 'Trading',
      severity: error.severity || 'medium',
      success: false,
      description: `Trading error in ${action}: ${error.message}`,
      details: {
        originalAction: action, // Store the specific action here
        errorType: error.name,
        errorCode: error.code,
        errorMessage: error.message,
        userId: userId,
        context: error.context || {},
        ...details
      },
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
      metadata: {
        timestamp: error.timestamp || new Date(),
        stackTrace: error.stack,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    await AdminAction.create(auditData);
    
    // Also log to console for immediate debugging
    console.error(`[TRADING ERROR] ${error.name}: ${error.message}`, {
      code: error.code,
      userId,
      action,
      context: error.context
    });

  } catch (logError) {
    // Fallback logging if audit system fails
    console.error('[CRITICAL] Failed to log trading error to admin panel:', logError);
    console.error('[ORIGINAL ERROR]', error);
  }
}

/**
 * Handle API failures with retries and fallbacks
 */
class APIFailureHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async withRetry(operation, operationName, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 1) {
          await logTradingError(
            new TradingError(
              `${operationName} succeeded on attempt ${attempt}`,
              'RETRY_SUCCESS',
              'low',
              { attempt, ...context }
            ),
            context.userId,
            'retry_success'
          );
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Log retry attempt
        await logTradingError(
          new TradingError(
            `${operationName} failed on attempt ${attempt}: ${error.message}`,
            'RETRY_ATTEMPT',
            attempt === this.maxRetries ? 'high' : 'medium',
            { attempt, maxRetries: this.maxRetries, ...context }
          ),
          context.userId,
          'retry_attempt',
          { originalError: error.message }
        );

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) break;

        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    throw new TradingError(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED',
      'critical',
      { maxRetries: this.maxRetries, lastError: lastError.message, ...context }
    );
  }
}

/**
 * Market data error handling with fallbacks
 */
async function handleMarketDataError(symbol, error, userId, fallbackPrice = null) {
  const marketError = new MarketDataError(
    `Failed to fetch market data for ${symbol}: ${error.message}`,
    'external_api',
    { symbol, fallbackPrice }
  );

  await logTradingError(marketError, userId, 'market_data_fetch');

  // Return fallback price if available
  if (fallbackPrice !== null) {
    return {
      price: fallbackPrice,
      isSimulated: true,
      warning: 'Using simulated price due to API failure'
    };
  }

  throw marketError;
}

/**
 * Position management error handling
 */
async function handlePositionError(operation, tradeId, error, userId, context = {}) {
  const positionError = new PositionError(
    `Position ${operation} failed for trade ${tradeId}: ${error.message}`,
    tradeId,
    { operation, ...context }
  );

  await logTradingError(positionError, userId, 'position_management', {
    operation,
    tradeId
  });

  throw positionError;
}

/**
 * Database transaction error handling
 */
async function handleDatabaseError(operation, error, userId, context = {}) {
  const dbError = new TradingError(
    `Database operation failed during ${operation}: ${error.message}`,
    'DATABASE_ERROR',
    'high',
    { operation, ...context }
  );

  await logTradingError(dbError, userId, 'database_operation', {
    operation,
    dbError: error.message
  });

  throw dbError;
}

/**
 * Liquidation error handling (critical)
 */
async function handleLiquidationError(tradeId, error, userId, context = {}) {
  const liquidationError = new LiquidationError(
    `Liquidation failed for trade ${tradeId}: ${error.message}`,
    tradeId,
    { ...context }
  );

  await logTradingError(liquidationError, userId, 'liquidation', {
    tradeId,
    urgent: true
  });

  // Additional alert for critical liquidation failures
  try {
    // Could integrate with email alerts or Slack notifications here
    console.error('[CRITICAL LIQUIDATION FAILURE]', {
      tradeId,
      userId,
      error: error.message,
      context
    });
  } catch (alertError) {
    console.error('Failed to send liquidation alert:', alertError);
  }

  throw liquidationError;
}

/**
 * Comprehensive error response formatter
 */
function formatErrorResponse(error, req = {}) {
  const response = {
    success: false,
    error: 'An error occurred',
    code: 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  if (error instanceof TradingError) {
    response.error = error.message;
    response.code = error.code;
    response.severity = error.severity;
  } else if (error.name === 'ValidationError') {
    response.error = error.message;
    response.code = 'VALIDATION_ERROR';
    response.field = error.field;
  } else if (error.name === 'CastError') {
    response.error = 'Invalid data format';
    response.code = 'INVALID_FORMAT';
  } else if (error.code === 11000) {
    response.error = 'Duplicate entry';
    response.code = 'DUPLICATE_ENTRY';
  } else {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      response.error = 'Internal server error';
      response.code = 'INTERNAL_ERROR';
    } else {
      response.error = error.message;
      response.code = error.code || 'UNKNOWN_ERROR';
    }
  }

  return response;
}

/**
 * Middleware for handling trading API errors
 */
function tradingErrorMiddleware(error, req, res, next) {
  // Log the error
  if (req.user?.id) {
    logTradingError(
      error instanceof TradingError ? error : new TradingError(
        error.message,
        'API_ERROR',
        'medium',
        { url: req.url, method: req.method }
      ),
      req.user.id,
      'api_request',
      {
        url: req.url,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
  }

  // Send formatted error response
  const errorResponse = formatErrorResponse(error, req);
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json(errorResponse);
}

/**
 * Circuit breaker for external API calls
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(operation, operationName, context = {}) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new TradingError(
          `Circuit breaker is OPEN for ${operationName}`,
          'CIRCUIT_BREAKER_OPEN',
          'high',
          { ...context, failureCount: this.failureCount }
        );
      }
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        
        await logTradingError(
          new TradingError(
            `Circuit breaker opened for ${operationName} after ${this.failureCount} failures`,
            'CIRCUIT_BREAKER_OPENED',
            'critical',
            { ...context, failureCount: this.failureCount }
          ),
          context.userId,
          'circuit_breaker'
        );
      }

      throw error;
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }
}

// Global circuit breakers for different services
const marketDataCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout
const databaseCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30 second timeout

// Export all functions and classes for CommonJS
module.exports = {
  TradingError,
  MarketDataError,
  PositionError,
  LiquidationError,
  logTradingError,
  APIFailureHandler,
  handleMarketDataError,
  handlePositionError,
  handleDatabaseError,
  handleLiquidationError,
  formatErrorResponse,
  tradingErrorMiddleware,
  CircuitBreaker,
  marketDataCircuitBreaker,
  databaseCircuitBreaker
};
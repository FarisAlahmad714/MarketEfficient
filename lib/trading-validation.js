/**
 * Comprehensive trading input validation
 * Integrates with existing admin panel audit logging
 */

const { SANDBOX_ASSETS } = require('./sandbox-constants-data');

// Trading validation constants
const VALIDATION_LIMITS = {
  QUANTITY: {
    MIN: 0.00001,
    MAX: 1000000
  },
  LEVERAGE: {
    MIN: 1,
    MAX: 3
  },
  PRICE: {
    MIN: 0.01,
    MAX: 10000000
  },
  STOP_LOSS: {
    MIN_DISTANCE_PERCENT: 0.1, // 0.1% minimum distance
    MAX_DISTANCE_PERCENT: 50   // 50% maximum distance
  },
  TAKE_PROFIT: {
    MIN_DISTANCE_PERCENT: 0.1,
    MAX_DISTANCE_PERCENT: 200
  },
  POSITION_SIZE: {
    MAX_PERCENT_OF_BALANCE: 50  // 50% max position size
  }
};

/**
 * Validation error class for structured error handling
 */
class ValidationError extends Error {
  constructor(message, field, code) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Validate trading symbol
 */
function validateSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Symbol is required and must be a string', 'symbol', 'INVALID_SYMBOL');
  }

  const upperSymbol = symbol.toUpperCase();
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  const isValid = allAssets.some(asset => asset.symbol === upperSymbol);

  if (!isValid) {
    throw new ValidationError(
      `Invalid symbol: ${symbol}. Supported symbols: ${allAssets.map(a => a.symbol).join(', ')}`,
      'symbol',
      'UNSUPPORTED_SYMBOL'
    );
  }

  return upperSymbol;
}

/**
 * Validate trade quantity
 */
function validateQuantity(quantity, symbol, currentPrice) {
  // Type validation
  const numQuantity = parseFloat(quantity);
  if (isNaN(numQuantity) || numQuantity <= 0) {
    throw new ValidationError(
      'Quantity must be a positive number greater than 0',
      'quantity',
      'INVALID_QUANTITY'
    );
  }

  // Range validation
  if (numQuantity < VALIDATION_LIMITS.QUANTITY.MIN) {
    throw new ValidationError(
      `Quantity too small. Minimum: ${VALIDATION_LIMITS.QUANTITY.MIN}`,
      'quantity',
      'QUANTITY_TOO_SMALL'
    );
  }

  if (numQuantity > VALIDATION_LIMITS.QUANTITY.MAX) {
    throw new ValidationError(
      `Quantity too large. Maximum: ${VALIDATION_LIMITS.QUANTITY.MAX}`,
      'quantity',
      'QUANTITY_TOO_LARGE'
    );
  }

  // Position value validation (prevent extremely large positions)
  if (currentPrice && numQuantity * currentPrice > 100000000) { // 100M SENSES max position
    throw new ValidationError(
      'Position value too large. Reduce quantity.',
      'quantity',
      'POSITION_VALUE_TOO_LARGE'
    );
  }

  return numQuantity;
}

/**
 * Validate leverage
 */
function validateLeverage(leverage) {
  const numLeverage = parseFloat(leverage);
  if (isNaN(numLeverage) || numLeverage <= 0) {
    throw new ValidationError(
      'Leverage must be a positive number',
      'leverage',
      'INVALID_LEVERAGE'
    );
  }

  if (numLeverage < VALIDATION_LIMITS.LEVERAGE.MIN || numLeverage > VALIDATION_LIMITS.LEVERAGE.MAX) {
    throw new ValidationError(
      `Leverage must be between ${VALIDATION_LIMITS.LEVERAGE.MIN}x and ${VALIDATION_LIMITS.LEVERAGE.MAX}x`,
      'leverage',
      'LEVERAGE_OUT_OF_RANGE'
    );
  }

  return numLeverage;
}

/**
 * Validate price (for limit orders)
 */
function validatePrice(price, currentPrice, side) {
  if (!price) return null; // Optional for market orders

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    throw new ValidationError(
      'Price must be a positive number',
      'price',
      'INVALID_PRICE'
    );
  }

  if (numPrice < VALIDATION_LIMITS.PRICE.MIN || numPrice > VALIDATION_LIMITS.PRICE.MAX) {
    throw new ValidationError(
      `Price must be between ${VALIDATION_LIMITS.PRICE.MIN} and ${VALIDATION_LIMITS.PRICE.MAX}`,
      'price',
      'PRICE_OUT_OF_RANGE'
    );
  }

  // Validate limit price reasonableness (within 20% of current price)
  if (currentPrice) {
    const priceDeviation = Math.abs((numPrice - currentPrice) / currentPrice) * 100;
    if (priceDeviation > 20) {
      throw new ValidationError(
        `Limit price too far from current price. Maximum deviation: 20%`,
        'price',
        'PRICE_DEVIATION_TOO_LARGE'
      );
    }
  }

  return numPrice;
}

/**
 * Validate stop loss price
 */
function validateStopLoss(stopLoss, entryPrice, side) {
  if (!stopLoss) return null; // Optional

  const numStopLoss = parseFloat(stopLoss);
  if (isNaN(numStopLoss) || numStopLoss <= 0) {
    throw new ValidationError(
      'Stop loss must be a positive number',
      'stopLoss',
      'INVALID_STOP_LOSS'
    );
  }

  // Validate stop loss direction based on position side
  if (side === 'long' && numStopLoss >= entryPrice) {
    throw new ValidationError(
      'Stop loss for long position must be below entry price',
      'stopLoss',
      'INVALID_STOP_LOSS_DIRECTION'
    );
  }

  if (side === 'short' && numStopLoss <= entryPrice) {
    throw new ValidationError(
      'Stop loss for short position must be above entry price',
      'stopLoss',
      'INVALID_STOP_LOSS_DIRECTION'
    );
  }

  // Validate distance from entry price
  const distancePercent = Math.abs((numStopLoss - entryPrice) / entryPrice) * 100;
  if (distancePercent < VALIDATION_LIMITS.STOP_LOSS.MIN_DISTANCE_PERCENT) {
    throw new ValidationError(
      `Stop loss too close to entry price. Minimum distance: ${VALIDATION_LIMITS.STOP_LOSS.MIN_DISTANCE_PERCENT}%`,
      'stopLoss',
      'STOP_LOSS_TOO_CLOSE'
    );
  }

  if (distancePercent > VALIDATION_LIMITS.STOP_LOSS.MAX_DISTANCE_PERCENT) {
    throw new ValidationError(
      `Stop loss too far from entry price. Maximum distance: ${VALIDATION_LIMITS.STOP_LOSS.MAX_DISTANCE_PERCENT}%`,
      'stopLoss',
      'STOP_LOSS_TOO_FAR'
    );
  }

  return numStopLoss;
}

/**
 * Validate take profit price
 */
function validateTakeProfit(takeProfit, entryPrice, side) {
  if (!takeProfit) return null; // Optional

  const numTakeProfit = parseFloat(takeProfit);
  if (isNaN(numTakeProfit) || numTakeProfit <= 0) {
    throw new ValidationError(
      'Take profit must be a positive number',
      'takeProfit',
      'INVALID_TAKE_PROFIT'
    );
  }

  // Validate take profit direction based on position side
  if (side === 'long' && numTakeProfit <= entryPrice) {
    throw new ValidationError(
      'Take profit for long position must be above entry price',
      'takeProfit',
      'INVALID_TAKE_PROFIT_DIRECTION'
    );
  }

  if (side === 'short' && numTakeProfit >= entryPrice) {
    throw new ValidationError(
      'Take profit for short position must be below entry price',
      'takeProfit',
      'INVALID_TAKE_PROFIT_DIRECTION'
    );
  }

  // Validate distance from entry price
  const distancePercent = Math.abs((numTakeProfit - entryPrice) / entryPrice) * 100;
  if (distancePercent < VALIDATION_LIMITS.TAKE_PROFIT.MIN_DISTANCE_PERCENT) {
    throw new ValidationError(
      `Take profit too close to entry price. Minimum distance: ${VALIDATION_LIMITS.TAKE_PROFIT.MIN_DISTANCE_PERCENT}%`,
      'takeProfit',
      'TAKE_PROFIT_TOO_CLOSE'
    );
  }

  if (distancePercent > VALIDATION_LIMITS.TAKE_PROFIT.MAX_DISTANCE_PERCENT) {
    throw new ValidationError(
      `Take profit too far from entry price. Maximum distance: ${VALIDATION_LIMITS.TAKE_PROFIT.MAX_DISTANCE_PERCENT}%`,
      'takeProfit',
      'TAKE_PROFIT_TOO_FAR'
    );
  }

  return numTakeProfit;
}

/**
 * Validate position size against portfolio balance
 */
function validatePositionSize(quantity, price, leverage, portfolioBalance) {
  const positionValue = quantity * price;
  const marginRequired = positionValue / leverage;
  
  // Check if user has sufficient balance
  if (marginRequired > portfolioBalance) {
    throw new ValidationError(
      `Insufficient balance. Required: ${marginRequired.toFixed(2)} SENSES, Available: ${portfolioBalance.toFixed(2)} SENSES`,
      'quantity',
      'INSUFFICIENT_BALANCE'
    );
  }

  // Check maximum position size (50% of balance)
  const maxPositionValue = portfolioBalance * (VALIDATION_LIMITS.POSITION_SIZE.MAX_PERCENT_OF_BALANCE / 100);
  if (marginRequired > maxPositionValue) {
    throw new ValidationError(
      `Position size too large. Maximum ${VALIDATION_LIMITS.POSITION_SIZE.MAX_PERCENT_OF_BALANCE}% of balance allowed`,
      'quantity',
      'POSITION_SIZE_TOO_LARGE'
    );
  }

  return { positionValue, marginRequired };
}

/**
 * Validate entire trade request
 */
function validateTradeRequest({
  symbol,
  side,
  type,
  quantity,
  leverage = 1,
  limitPrice,
  stopLoss,
  takeProfit,
  currentPrice,
  portfolioBalance
}) {
  const validatedData = {};

  try {
    // Validate symbol
    validatedData.symbol = validateSymbol(symbol);

    // Validate side
    if (!['long', 'short'].includes(side)) {
      throw new ValidationError(
        'Side must be either "long" or "short"',
        'side',
        'INVALID_SIDE'
      );
    }
    validatedData.side = side;

    // Validate type
    if (!['market', 'limit'].includes(type)) {
      throw new ValidationError(
        'Type must be either "market" or "limit"',
        'type',
        'INVALID_TYPE'
      );
    }
    validatedData.type = type;

    // Validate leverage
    validatedData.leverage = validateLeverage(leverage);

    // Validate quantity
    validatedData.quantity = validateQuantity(quantity, symbol, currentPrice);

    // Validate price for limit orders
    if (type === 'limit') {
      if (!limitPrice) {
        throw new ValidationError(
          'Limit price is required for limit orders',
          'limitPrice',
          'LIMIT_PRICE_REQUIRED'
        );
      }
      validatedData.limitPrice = validatePrice(limitPrice, currentPrice, side);
    }

    // Determine entry price for validation
    const entryPrice = type === 'limit' ? validatedData.limitPrice : currentPrice;

    // Validate stop loss
    if (stopLoss) {
      validatedData.stopLoss = validateStopLoss(stopLoss, entryPrice, side);
    }

    // Validate take profit
    if (takeProfit) {
      validatedData.takeProfit = validateTakeProfit(takeProfit, entryPrice, side);
    }

    // Validate position size if portfolio balance provided
    if (portfolioBalance && currentPrice) {
      const { positionValue, marginRequired } = validatePositionSize(
        validatedData.quantity,
        entryPrice,
        validatedData.leverage,
        portfolioBalance
      );
      validatedData.positionValue = positionValue;
      validatedData.marginRequired = marginRequired;
    }

    return {
      isValid: true,
      data: validatedData,
      errors: []
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        isValid: false,
        data: null,
        errors: [{
          field: error.field,
          message: error.message,
          code: error.code
        }]
      };
    }
    throw error; // Re-throw unexpected errors
  }
}

/**
 * Validate close position request
 */
function validateCloseRequest({
  tradeId,
  quantity,
  type = 'market',
  limitPrice,
  originalQuantity,
  currentPrice
}) {
  const validatedData = {};

  try {
    // Validate trade ID
    if (!tradeId || typeof tradeId !== 'string') {
      throw new ValidationError(
        'Trade ID is required',
        'tradeId',
        'INVALID_TRADE_ID'
      );
    }
    validatedData.tradeId = tradeId;

    // Validate close quantity
    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      throw new ValidationError(
        'Close quantity must be a positive number',
        'quantity',
        'INVALID_CLOSE_QUANTITY'
      );
    }

    if (numQuantity > originalQuantity) {
      throw new ValidationError(
        'Close quantity cannot exceed original position quantity',
        'quantity',
        'CLOSE_QUANTITY_TOO_LARGE'
      );
    }

    validatedData.quantity = numQuantity;

    // Validate type
    if (!['market', 'limit'].includes(type)) {
      throw new ValidationError(
        'Close type must be either "market" or "limit"',
        'type',
        'INVALID_CLOSE_TYPE'
      );
    }
    validatedData.type = type;

    // Validate limit price for limit closes
    if (type === 'limit') {
      if (!limitPrice) {
        throw new ValidationError(
          'Limit price is required for limit close orders',
          'limitPrice',
          'LIMIT_PRICE_REQUIRED'
        );
      }
      validatedData.limitPrice = validatePrice(limitPrice, currentPrice);
    }

    return {
      isValid: true,
      data: validatedData,
      errors: []
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        isValid: false,
        data: null,
        errors: [{
          field: error.field,
          message: error.message,
          code: error.code
        }]
      };
    }
    throw error;
  }
}

// Export functions for CommonJS
module.exports = {
  validateSymbol,
  validateQuantity,
  validateLeverage,
  validatePrice,
  validateStopLoss,
  validateTakeProfit,
  validatePositionSize,
  validateTradeRequest,
  validateCloseRequest,
  ValidationError
};
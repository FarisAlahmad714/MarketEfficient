/**
 * Test suite for trading validation functions
 * Ensures critical trading logic works correctly
 */

const {
  validateSymbol,
  validateQuantity,
  validateLeverage,
  validatePrice,
  validateStopLoss,
  validateTakeProfit,
  validatePositionSize,
  validateTradeRequest,
  validateCloseRequest,
  ValidationError,
  VALIDATION_LIMITS
} = require('../lib/trading-validation');

describe('Trading Validation Tests', () => {
  
  describe('validateSymbol', () => {
    test('should validate correct symbols', () => {
      expect(validateSymbol('BTC')).toBe('BTC');
      expect(validateSymbol('btc')).toBe('BTC');
      expect(validateSymbol('ETH')).toBe('ETH');
    });

    test('should reject invalid symbols', () => {
      expect(() => validateSymbol('INVALID')).toThrow(ValidationError);
      expect(() => validateSymbol('')).toThrow(ValidationError);
      expect(() => validateSymbol(null)).toThrow(ValidationError);
    });
  });

  describe('validateQuantity', () => {
    test('should validate correct quantities', () => {
      expect(validateQuantity('1.5', 'BTC', 50000)).toBe(1.5);
      expect(validateQuantity('0.001', 'BTC', 50000)).toBe(0.001);
    });

    test('should reject invalid quantities', () => {
      expect(() => validateQuantity('0', 'BTC', 50000)).toThrow(ValidationError);
      expect(() => validateQuantity('-1', 'BTC', 50000)).toThrow(ValidationError);
      expect(() => validateQuantity('abc', 'BTC', 50000)).toThrow(ValidationError);
      expect(() => validateQuantity('0.000001', 'BTC', 50000)).toThrow(ValidationError); // Too small
    });

    test('should reject extremely large positions', () => {
      expect(() => validateQuantity('10000', 'BTC', 50000)).toThrow(ValidationError);
    });
  });

  describe('validateLeverage', () => {
    test('should validate correct leverage', () => {
      expect(validateLeverage('1')).toBe(1);
      expect(validateLeverage('2')).toBe(2);
      expect(validateLeverage('3')).toBe(3);
    });

    test('should reject invalid leverage', () => {
      expect(() => validateLeverage('0')).toThrow(ValidationError);
      expect(() => validateLeverage('4')).toThrow(ValidationError);
      expect(() => validateLeverage('-1')).toThrow(ValidationError);
      expect(() => validateLeverage('abc')).toThrow(ValidationError);
    });
  });

  describe('validatePrice', () => {
    test('should validate correct prices', () => {
      expect(validatePrice('50000', 51000, 'long')).toBe(50000);
      expect(validatePrice('49000', 51000, 'short')).toBe(49000);
    });

    test('should allow null for market orders', () => {
      expect(validatePrice(null)).toBe(null);
      expect(validatePrice(undefined)).toBe(null);
    });

    test('should reject invalid prices', () => {
      expect(() => validatePrice('0', 50000, 'long')).toThrow(ValidationError);
      expect(() => validatePrice('-1000', 50000, 'long')).toThrow(ValidationError);
      expect(() => validatePrice('abc', 50000, 'long')).toThrow(ValidationError);
    });

    test('should reject prices too far from current price', () => {
      expect(() => validatePrice('100000', 50000, 'long')).toThrow(ValidationError); // >20% deviation
    });
  });

  describe('validateStopLoss', () => {
    test('should validate correct stop loss for long positions', () => {
      expect(validateStopLoss('49000', 50000, 'long')).toBe(49000);
      expect(validateStopLoss('45000', 50000, 'long')).toBe(45000);
    });

    test('should validate correct stop loss for short positions', () => {
      expect(validateStopLoss('51000', 50000, 'short')).toBe(51000);
      expect(validateStopLoss('55000', 50000, 'short')).toBe(55000);
    });

    test('should reject incorrect stop loss direction', () => {
      expect(() => validateStopLoss('51000', 50000, 'long')).toThrow(ValidationError);
      expect(() => validateStopLoss('49000', 50000, 'short')).toThrow(ValidationError);
    });

    test('should reject stop loss too close or too far', () => {
      expect(() => validateStopLoss('49990', 50000, 'long')).toThrow(ValidationError); // Too close
      expect(() => validateStopLoss('25000', 50000, 'long')).toThrow(ValidationError); // Too far
    });
  });

  describe('validateTakeProfit', () => {
    test('should validate correct take profit for long positions', () => {
      expect(validateTakeProfit('51000', 50000, 'long')).toBe(51000);
      expect(validateTakeProfit('55000', 50000, 'long')).toBe(55000);
    });

    test('should validate correct take profit for short positions', () => {
      expect(validateTakeProfit('49000', 50000, 'short')).toBe(49000);
      expect(validateTakeProfit('45000', 50000, 'short')).toBe(45000);
    });

    test('should reject incorrect take profit direction', () => {
      expect(() => validateTakeProfit('49000', 50000, 'long')).toThrow(ValidationError);
      expect(() => validateTakeProfit('51000', 50000, 'short')).toThrow(ValidationError);
    });
  });

  describe('validatePositionSize', () => {
    test('should validate position within limits', () => {
      const result = validatePositionSize(1, 50000, 2, 100000);
      expect(result.positionValue).toBe(50000);
      expect(result.marginRequired).toBe(25000);
    });

    test('should reject positions exceeding balance', () => {
      expect(() => validatePositionSize(2, 50000, 1, 50000)).toThrow(ValidationError);
    });

    test('should reject positions exceeding 50% of balance', () => {
      expect(() => validatePositionSize(1.1, 50000, 1, 100000)).toThrow(ValidationError);
    });
  });

  describe('validateTradeRequest', () => {
    const validRequest = {
      symbol: 'BTC',
      side: 'long',
      type: 'market',
      quantity: '0.1',
      leverage: '2',
      currentPrice: 50000,
      portfolioBalance: 100000
    };

    test('should validate complete valid request', () => {
      const result = validateTradeRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.data.symbol).toBe('BTC');
      expect(result.data.quantity).toBe(0.1);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate limit order request', () => {
      const limitRequest = {
        ...validRequest,
        type: 'limit',
        limitPrice: '49000'
      };
      const result = validateTradeRequest(limitRequest);
      expect(result.isValid).toBe(true);
      expect(result.data.limitPrice).toBe(49000);
    });

    test('should require limit price for limit orders', () => {
      const limitRequest = {
        ...validRequest,
        type: 'limit'
      };
      const result = validateTradeRequest(limitRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('LIMIT_PRICE_REQUIRED');
    });

    test('should reject invalid side', () => {
      const invalidRequest = {
        ...validRequest,
        side: 'invalid'
      };
      const result = validateTradeRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_SIDE');
    });

    test('should reject invalid type', () => {
      const invalidRequest = {
        ...validRequest,
        type: 'invalid'
      };
      const result = validateTradeRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });
  });

  describe('validateCloseRequest', () => {
    const validCloseRequest = {
      tradeId: '507f1f77bcf86cd799439011',
      quantity: '0.05',
      type: 'market',
      originalQuantity: 0.1,
      currentPrice: 51000
    };

    test('should validate complete valid close request', () => {
      const result = validateCloseRequest(validCloseRequest);
      expect(result.isValid).toBe(true);
      expect(result.data.quantity).toBe(0.05);
    });

    test('should reject close quantity exceeding original', () => {
      const invalidRequest = {
        ...validCloseRequest,
        quantity: '0.2'
      };
      const result = validateCloseRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('CLOSE_QUANTITY_TOO_LARGE');
    });

    test('should require limit price for limit close orders', () => {
      const limitCloseRequest = {
        ...validCloseRequest,
        type: 'limit'
      };
      const result = validateCloseRequest(limitCloseRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('LIMIT_PRICE_REQUIRED');
    });
  });

  describe('ValidationError', () => {
    test('should create proper validation error', () => {
      const error = new ValidationError('Test message', 'testField', 'TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.field).toBe('testField');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('VALIDATION_LIMITS', () => {
    test('should have proper validation limits', () => {
      expect(VALIDATION_LIMITS.QUANTITY.MIN).toBe(0.00001);
      expect(VALIDATION_LIMITS.QUANTITY.MAX).toBe(1000000);
      expect(VALIDATION_LIMITS.LEVERAGE.MIN).toBe(1);
      expect(VALIDATION_LIMITS.LEVERAGE.MAX).toBe(3);
      expect(VALIDATION_LIMITS.POSITION_SIZE.MAX_PERCENT_OF_BALANCE).toBe(50);
    });
  });
});

// Integration tests for complex scenarios
describe('Trading Validation Integration Tests', () => {
  test('should validate complete trading flow', () => {
    // Test market order
    const marketOrder = validateTradeRequest({
      symbol: 'BTC',
      side: 'long',
      type: 'market',
      quantity: '0.1',
      leverage: '2',
      stopLoss: '49000',
      takeProfit: '55000',
      currentPrice: 50000,
      portfolioBalance: 100000
    });

    expect(marketOrder.isValid).toBe(true);
    expect(marketOrder.data.stopLoss).toBe(49000);
    expect(marketOrder.data.takeProfit).toBe(55000);

    // Test limit order
    const limitOrder = validateTradeRequest({
      symbol: 'ETH',
      side: 'short',
      type: 'limit',
      quantity: '2',
      leverage: '1',
      limitPrice: '3800',
      stopLoss: '4000',
      takeProfit: '3500',
      currentPrice: 3900,
      portfolioBalance: 50000
    });

    expect(limitOrder.isValid).toBe(true);
    expect(limitOrder.data.limitPrice).toBe(3800);
  });

  test('should handle edge cases properly', () => {
    // Test minimum quantity
    const minQuantity = validateTradeRequest({
      symbol: 'BTC',
      side: 'long',
      type: 'market',
      quantity: '0.00001',
      leverage: '1',
      currentPrice: 50000,
      portfolioBalance: 100000
    });

    expect(minQuantity.isValid).toBe(true);

    // Test maximum leverage
    const maxLeverage = validateTradeRequest({
      symbol: 'BTC',
      side: 'long',
      type: 'market',
      quantity: '0.1',
      leverage: '3',
      currentPrice: 50000,
      portfolioBalance: 100000
    });

    expect(maxLeverage.isValid).toBe(true);
  });
});
/**
 * Test suite for P&L calculation functions
 * Ensures financial calculations are accurate
 */

const {
  calculateUnrealizedPnL,
  calculateRealizedPnL,
  calculatePnLPercentage,
  calculatePartialClosePnL
} = require('../lib/pnl-calculator');

describe('P&L Calculator Tests', () => {
  
  describe('calculateUnrealizedPnL', () => {
    test('should calculate long position profit correctly', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 55000,
        quantity: 0.1,
        totalFees: 50
      });
      
      // (55000 - 50000) * 0.1 - 50 = 500 - 50 = 450
      expect(result).toBe(450);
    });

    test('should calculate long position loss correctly', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 45000,
        quantity: 0.1,
        totalFees: 50
      });
      
      // (45000 - 50000) * 0.1 - 50 = -500 - 50 = -550
      expect(result).toBe(-550);
    });

    test('should calculate short position profit correctly', () => {
      const result = calculateUnrealizedPnL({
        side: 'short',
        entryPrice: 50000,
        currentPrice: 45000,
        quantity: 0.1,
        totalFees: 50
      });
      
      // (50000 - 45000) * 0.1 - 50 = 500 - 50 = 450
      expect(result).toBe(450);
    });

    test('should calculate short position loss correctly', () => {
      const result = calculateUnrealizedPnL({
        side: 'short',
        entryPrice: 50000,
        currentPrice: 55000,
        quantity: 0.1,
        totalFees: 50
      });
      
      // (50000 - 55000) * 0.1 - 50 = -500 - 50 = -550
      expect(result).toBe(-550);
    });

    test('should handle zero fees', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 55000,
        quantity: 0.1
      });
      
      expect(result).toBe(500);
    });

    test('should throw error for missing parameters', () => {
      expect(() => calculateUnrealizedPnL({})).toThrow('Missing required parameters');
      expect(() => calculateUnrealizedPnL({ side: 'long' })).toThrow('Missing required parameters');
    });

    test('should throw error for invalid parameters', () => {
      expect(() => calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 0,
        currentPrice: 50000,
        quantity: 0.1
      })).toThrow('Invalid parameter values');

      expect(() => calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: -1000,
        quantity: 0.1
      })).toThrow('Invalid parameter values');
    });

    test('should round to 2 decimal places', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 50001.111,
        quantity: 0.12345,
        totalFees: 1.111
      });
      
      // Should be rounded to 2 decimal places
      expect(result).toBe(Math.round((1.111 * 0.12345 - 1.111) * 100) / 100);
    });
  });

  describe('calculateRealizedPnL', () => {
    test('should calculate realized P&L same as unrealized', () => {
      const unrealized = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 55000,
        quantity: 0.1,
        totalFees: 100
      });

      const realized = calculateRealizedPnL({
        side: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        quantity: 0.1,
        totalFees: 100
      });

      expect(realized).toBe(unrealized);
    });
  });

  describe('calculatePnLPercentage', () => {
    test('should calculate percentage correctly', () => {
      const result = calculatePnLPercentage(500, 2500);
      expect(result).toBe(20); // 500/2500 * 100 = 20%
    });

    test('should calculate negative percentage correctly', () => {
      const result = calculatePnLPercentage(-250, 1000);
      expect(result).toBe(-25); // -250/1000 * 100 = -25%
    });

    test('should return 0 for zero or negative margin', () => {
      expect(calculatePnLPercentage(100, 0)).toBe(0);
      expect(calculatePnLPercentage(100, -100)).toBe(0);
    });

    test('should round to 2 decimal places', () => {
      const result = calculatePnLPercentage(333.33, 1000);
      expect(result).toBe(33.33);
    });
  });

  describe('calculatePartialClosePnL', () => {
    test('should calculate partial close correctly', () => {
      const result = calculatePartialClosePnL({
        side: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        totalQuantity: 0.2,
        closeQuantity: 0.1,
        totalFees: 100,
        exitFee: 25
      });

      // Close 50% of position
      // Gross P&L: (55000 - 50000) * 0.1 = 500
      // Entry fees: 100 * 0.5 = 50
      // Total fees: 50 + 25 = 75
      // Net P&L: 500 - 75 = 425
      
      expect(result.realizedPnL).toBe(425);
      expect(result.remainingQuantity).toBe(0.1);
      expect(result.feesPaid).toBe(75);
    });

    test('should calculate short partial close correctly', () => {
      const result = calculatePartialClosePnL({
        side: 'short',
        entryPrice: 50000,
        exitPrice: 45000,
        totalQuantity: 0.2,
        closeQuantity: 0.05,
        totalFees: 80,
        exitFee: 10
      });

      // Close 25% of position
      // Gross P&L: (50000 - 45000) * 0.05 = 250
      // Entry fees: 80 * 0.25 = 20
      // Total fees: 20 + 10 = 30
      // Net P&L: 250 - 30 = 220
      
      expect(result.realizedPnL).toBe(220);
      expect(result.remainingQuantity).toBe(0.15);
      expect(result.feesPaid).toBe(30);
    });

    test('should handle full close', () => {
      const result = calculatePartialClosePnL({
        side: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        totalQuantity: 0.1,
        closeQuantity: 0.1,
        totalFees: 50,
        exitFee: 25
      });

      expect(result.realizedPnL).toBe(425); // 500 - 75
      expect(result.remainingQuantity).toBe(0);
      expect(result.feesPaid).toBe(75);
    });

    test('should throw error if close quantity exceeds total', () => {
      expect(() => calculatePartialClosePnL({
        side: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        totalQuantity: 0.1,
        closeQuantity: 0.2,
        totalFees: 50,
        exitFee: 25
      })).toThrow('Close quantity cannot exceed total quantity');
    });

    test('should round results to 2 decimal places', () => {
      const result = calculatePartialClosePnL({
        side: 'long',
        entryPrice: 50000.333,
        exitPrice: 55000.666,
        totalQuantity: 0.123,
        closeQuantity: 0.037,
        totalFees: 12.345,
        exitFee: 3.789
      });

      // All results should be rounded to 2 decimal places
      expect(Number.isInteger(result.realizedPnL * 100)).toBe(true);
      expect(Number.isInteger(result.feesPaid * 100)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should maintain consistency across related calculations', () => {
      const params = {
        side: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        quantity: 0.1,
        totalFees: 100
      };

      // Unrealized and realized should be the same for same prices
      const unrealized = calculateUnrealizedPnL({
        side: params.side,
        entryPrice: params.entryPrice,
        currentPrice: params.exitPrice,
        quantity: params.quantity,
        totalFees: params.totalFees
      });

      const realized = calculateRealizedPnL(params);

      expect(unrealized).toBe(realized);
    });

    test('should handle leveraged positions correctly', () => {
      // 2x leverage: same P&L amount but on half the margin
      const leverage2x = {
        side: 'long',
        entryPrice: 50000,
        currentPrice: 55000,
        quantity: 0.2, // Double quantity for 2x leverage
        totalFees: 100
      };

      const pnl = calculateUnrealizedPnL(leverage2x);
      const marginUsed = (50000 * 0.2) / 2; // Position value / leverage
      const percentage = calculatePnLPercentage(pnl, marginUsed);

      expect(pnl).toBe(900); // (5000 * 0.2) - 100
      expect(percentage).toBe(18); // 900 / 5000 * 100
    });

    test('should handle edge case with zero price movement', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 50000,
        currentPrice: 50000,
        quantity: 0.1,
        totalFees: 50
      });

      expect(result).toBe(-50); // Only fees deducted
    });

    test('should handle very small quantities and prices', () => {
      const result = calculateUnrealizedPnL({
        side: 'long',
        entryPrice: 0.01,
        currentPrice: 0.011,
        quantity: 1000,
        totalFees: 0.5
      });

      // (0.011 - 0.01) * 1000 - 0.5 = 1 - 0.5 = 0.5
      expect(result).toBe(0.5);
    });
  });
});
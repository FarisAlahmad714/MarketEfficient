/**
 * Standardized P&L calculation utility
 * Ensures consistent calculations across all trading functions
 */

/**
 * Calculate unrealized P&L for a position
 * @param {Object} params - Position parameters
 * @param {string} params.side - 'long' or 'short'
 * @param {number} params.entryPrice - Entry price
 * @param {number} params.currentPrice - Current market price
 * @param {number} params.quantity - Position quantity (base amount)
 * @param {number} params.leverage - Leverage multiplier (optional, defaults to 1)
 * @param {number} params.totalFees - Total fees paid (optional, defaults to 0)
 * @returns {number} Unrealized P&L in SENSES
 */
function calculateUnrealizedPnL({ side, entryPrice, currentPrice, quantity, leverage = 1, totalFees = 0 }) {
  // Validate inputs
  if (!side || !entryPrice || !currentPrice || !quantity) {
    throw new Error('Missing required parameters for P&L calculation');
  }
  
  if (entryPrice <= 0 || currentPrice <= 0 || quantity <= 0) {
    throw new Error('Invalid parameter values for P&L calculation');
  }
  
  // Calculate price difference based on position side
  const priceDiff = side === 'long' 
    ? currentPrice - entryPrice  // Long: profit when price goes up
    : entryPrice - currentPrice; // Short: profit when price goes down
  
  // P&L = price difference * quantity * leverage - fees
  const grossPnL = priceDiff * quantity * leverage;
  const netPnL = grossPnL - totalFees;
  
  // Round to avoid floating point precision issues
  return Math.round(netPnL * 100) / 100;
}

/**
 * Calculate realized P&L for a closed position
 * @param {Object} params - Position parameters
 * @param {string} params.side - 'long' or 'short'
 * @param {number} params.entryPrice - Entry price
 * @param {number} params.exitPrice - Exit price
 * @param {number} params.quantity - Position quantity
 * @param {number} params.leverage - Leverage multiplier (optional, defaults to 1)
 * @param {number} params.totalFees - Total fees paid (entry + exit)
 * @returns {number} Realized P&L in SENSES
 */
function calculateRealizedPnL({ side, entryPrice, exitPrice, quantity, leverage = 1, totalFees = 0 }) {
  return calculateUnrealizedPnL({ 
    side, 
    entryPrice, 
    currentPrice: exitPrice, 
    quantity, 
    leverage,
    totalFees 
  });
}

/**
 * Calculate P&L percentage based on margin used
 * @param {number} pnl - P&L amount in SENSES
 * @param {number} marginUsed - Margin used for the position
 * @returns {number} P&L percentage
 */
function calculatePnLPercentage(pnl, marginUsed) {
  if (!marginUsed || marginUsed <= 0) {
    return 0;
  }
  
  const percentage = (pnl / marginUsed) * 100;
  return Math.round(percentage * 100) / 100;
}

/**
 * Calculate P&L for partial position close
 * @param {Object} params - Position parameters
 * @param {string} params.side - 'long' or 'short'
 * @param {number} params.entryPrice - Entry price
 * @param {number} params.exitPrice - Exit price
 * @param {number} params.totalQuantity - Total position quantity
 * @param {number} params.closeQuantity - Quantity being closed
 * @param {number} params.leverage - Leverage multiplier (optional, defaults to 1)
 * @param {number} params.totalFees - Total fees for full position
 * @param {number} params.exitFee - Exit fee for this partial close
 * @returns {Object} { realizedPnL, remainingQuantity, feesPaid }
 */
function calculatePartialClosePnL({ 
  side, 
  entryPrice, 
  exitPrice, 
  totalQuantity, 
  closeQuantity, 
  leverage = 1,
  totalFees = 0, 
  exitFee = 0 
}) {
  // Validate inputs
  if (closeQuantity > totalQuantity) {
    throw new Error('Close quantity cannot exceed total quantity');
  }
  
  // Calculate proportion being closed
  const closeProportion = closeQuantity / totalQuantity;
  
  // Calculate gross P&L for the closed portion
  const priceDiff = side === 'long' 
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  
  const grossPnL = priceDiff * closeQuantity * leverage;
  
  // Calculate fees for the closed portion
  const proportionalEntryFees = totalFees * closeProportion;
  const totalFeesForClose = proportionalEntryFees + exitFee;
  
  // Calculate realized P&L
  const realizedPnL = grossPnL - totalFeesForClose;
  
  return {
    realizedPnL: Math.round(realizedPnL * 100) / 100,
    remainingQuantity: totalQuantity - closeQuantity,
    feesPaid: Math.round(totalFeesForClose * 100) / 100
  };
}

module.exports = {
  calculateUnrealizedPnL,
  calculateRealizedPnL,
  calculatePnLPercentage,
  calculatePartialClosePnL
};
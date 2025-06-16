// lib/sandbox-utils.js
// Utility functions for sandbox feature formatting and calculations

/**
 * Format currency amount for sandbox trading
 * @param {number} amount - The amount to format
 * @param {boolean} showCurrency - Whether to show SENSES currency symbol
 * @returns {string} - Formatted currency string
 */
export const formatSandboxCurrency = (amount, showCurrency = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showCurrency ? '0.00 SENSES' : '0.00';
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return showCurrency ? `${formatted} SENSES` : formatted;
};

/**
 * Format price for display in sandbox
 * @param {number} price - The price to format
 * @param {boolean} showCurrency - Whether to show SENSES currency symbol
 * @returns {string} - Formatted price string
 */
export const formatSandboxPrice = (price, showCurrency = true) => {
  if (price === null || price === undefined || isNaN(price)) {
    return showCurrency ? '0.00 SENSES' : '0.00';
  }
  
  const formatted = price.toFixed(2);
  return showCurrency ? `${formatted} SENSES` : formatted;
};

/**
 * Format percentage for display
 * @param {number} percentage - The percentage to format
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.00%';
  }
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

/**
 * Round number to avoid floating point precision issues
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} - Rounded number
 */
export const roundToDecimals = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Calculate P&L percentage based on margin used (for leveraged positions)
 * @param {number} pnl - Profit/Loss amount
 * @param {number} marginUsed - Margin used for the position
 * @returns {number} - P&L percentage
 */
export const calculatePnLPercentage = (pnl, marginUsed) => {
  if (!marginUsed || marginUsed === 0 || isNaN(marginUsed) || isNaN(pnl)) {
    return 0;
  }
  return (pnl / marginUsed) * 100;
};

/**
 * Get performance color based on value
 * @param {number} value - The value to determine color for
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {string} - CSS color value
 */
export const getPerformanceColor = (value, darkMode = false) => {
  if (value > 0) return '#00ff88'; // Green for positive
  if (value < 0) return '#ff4757'; // Red for negative
  return darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'; // Neutral
};

/**
 * Format duration from milliseconds to human readable format
 * @param {number} startTime - Start time (Date or timestamp)
 * @param {number} endTime - End time (Date or timestamp, optional - defaults to now)
 * @returns {string} - Human readable duration
 */
export const formatDuration = (startTime, endTime = null) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = end - start;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

/**
 * Validate trade parameters
 * @param {Object} tradeParams - Trade parameters to validate
 * @returns {Array} - Array of error messages
 */
export const validateTradeParams = (tradeParams) => {
  const errors = [];
  const { quantity, leverage, stopLoss, takeProfit } = tradeParams;
  
  if (!quantity || parseFloat(quantity) <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (leverage && (leverage < 1 || leverage > 3)) {
    errors.push('Leverage must be between 1x and 3x');
  }
  
  if (stopLoss && parseFloat(stopLoss) <= 0) {
    errors.push('Stop loss must be greater than 0');
  }
  
  if (takeProfit && parseFloat(takeProfit) <= 0) {
    errors.push('Take profit must be greater than 0');
  }
  
  return errors;
};
// lib/sandbox-constants-data.js - CommonJS version for backend use
const SANDBOX_ASSETS = {
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', pair: 'BTC/SENSES', maxLeverage: 20 },
    { symbol: 'ETH', name: 'Ethereum', category: 'crypto', pair: 'ETH/SENSES', maxLeverage: 20 },
    { symbol: 'SOL', name: 'Solana', category: 'crypto', pair: 'SOL/SENSES', maxLeverage: 15 },
    { symbol: 'BNB', name: 'BNB', category: 'crypto', pair: 'BNB/SENSES', maxLeverage: 15 }
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', pair: 'AAPL/SENSES', maxLeverage: 4 },
    { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'stock', pair: 'GLD/SENSES', maxLeverage: 3 },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', pair: 'TSLA/SENSES', maxLeverage: 3 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock', pair: 'NVDA/SENSES', maxLeverage: 3 },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'stock', pair: 'SPY/SENSES', maxLeverage: 5 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'stock', pair: 'QQQ/SENSES', maxLeverage: 5 }
  ]
};

const getRandomAsset = () => {
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  return allAssets[Math.floor(Math.random() * allAssets.length)];
};

const getAllTradableAssets = () => {
  return [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
};

// SENSES acts as the base currency (like USD) for all trading pairs
const SENSES_CONFIG = {
  symbol: 'SENSES',
  name: 'SENSES',
  description: 'Base currency for all trading pairs in the sandbox',
  value: 1.00, // Always 1 SENSES = 1 SENSES (stable)
  // Additional metadata
  features: [
    'Stable base currency',
    'Used for all trading pairs',
    'No external volatility',
    'Educational trading currency'
  ]
};

// Function to convert USD prices to SENSES prices (1:1 ratio for now)
const convertUSDToSENSES = (usdPrice) => {
  return usdPrice; // 1 USD = 1 SENSES for simplicity
};

// Function to get the correct symbol for API calls (convert back to USD pairs)
const getAPISymbol = (symbol) => {
  const symbolMap = {
    'BTC': 'BTC/USD',
    'ETH': 'ETH/USD', 
    'SOL': 'SOL/USD',
    'BNB': 'BNB/USD',
    'AAPL': 'AAPL',
    'GLD': 'GLD',
    'TSLA': 'TSLA',
    'NVDA': 'NVDA',
    'SPY': 'SPY',
    'QQQ': 'QQQ'
  };
  return symbolMap[symbol] || symbol;
};

// Function to get maximum leverage for a specific asset
const getMaxLeverage = (symbol) => {
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  const asset = allAssets.find(asset => asset.symbol === symbol);
  return asset?.maxLeverage || 1; // Default to 1x if asset not found
};

// Function to get asset information
const getAssetInfo = (symbol) => {
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  return allAssets.find(asset => asset.symbol === symbol);
};

// Export for CommonJS
module.exports = {
  SANDBOX_ASSETS,
  getRandomAsset,
  getAllTradableAssets,
  SENSES_CONFIG,
  convertUSDToSENSES,
  getAPISymbol,
  getMaxLeverage,
  getAssetInfo
};
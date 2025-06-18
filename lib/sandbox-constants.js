// lib/sandbox-constants.js
export const SANDBOX_ASSETS = {
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', pair: 'BTC/SENSES' },
    { symbol: 'ETH', name: 'Ethereum', category: 'crypto', pair: 'ETH/SENSES' },
    { symbol: 'SOL', name: 'Solana', category: 'crypto', pair: 'SOL/SENSES' },
    { symbol: 'BNB', name: 'BNB', category: 'crypto', pair: 'BNB/SENSES' }
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', pair: 'AAPL/SENSES' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', pair: 'NVDA/SENSES' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', pair: 'TSLA/SENSES' },
    { symbol: 'GLD', name: 'SPDR Gold ETF', category: 'stock', pair: 'GLD/SENSES' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'stock', pair: 'SPY/SENSES' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'stock', pair: 'QQQ/SENSES' }
  ]
};

export const getRandomAsset = () => {
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  return allAssets[Math.floor(Math.random() * allAssets.length)];
};

export const getAllTradableAssets = () => {
  return [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
};

// SENSES acts as the base currency (like USD) for all trading pairs
export const SENSES_CONFIG = {
  symbol: 'SENSES',
  name: 'SENSES',
  description: 'Base currency for all trading pairs in the sandbox',
  value: 1.00, // Always 1 SENSES = 1 SENSES (stable)
  features: [
    'Stable base currency for all trades',
    'Portfolio balance shown in SENSES',
    'Trade BTC/SENSES, AAPL/SENSES, etc.',
    'No conversion fees between assets'
  ]
};

// Function to convert USD prices to SENSES prices (1:1 ratio for now)
export const convertUSDToSENSES = (usdPrice) => {
  return usdPrice; // 1 USD = 1 SENSES for simplicity
};

// Function to get the correct symbol for API calls (convert back to USD pairs)
export const getAPISymbol = (symbol) => {
  const symbolMap = {
    'BTC': 'BTC/USD',
    'ETH': 'ETH/USD', 
    'SOL': 'SOL/USD',
    'BNB': 'BNB/USD',
    'AAPL': 'AAPL',
    'NVDA': 'NVDA',
    'TSLA': 'TSLA',
    'GLD': 'GLD',
    'SPY': 'SPY',
    'QQQ': 'QQQ'
  };
  return symbolMap[symbol] || symbol;
};
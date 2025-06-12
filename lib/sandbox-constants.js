// lib/sandbox-constants.js
export const SANDBOX_ASSETS = {
  crypto: [
    { symbol: 'BTCUSD', name: 'Bitcoin', category: 'crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum', category: 'crypto' },
    { symbol: 'ADAUSD', name: 'Cardano', category: 'crypto' },
    { symbol: 'SOLUSD', name: 'Solana', category: 'crypto' },
    { symbol: 'LINKUSD', name: 'Chainlink', category: 'crypto' }
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stock' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'stock' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'stock' }
  ]
};

export const getRandomAsset = () => {
  const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
  return allAssets[Math.floor(Math.random() * allAssets.length)];
};
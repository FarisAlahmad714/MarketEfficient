// pages/api/assets.js
export default function handler(req, res) {
  const assets = [
    { id: 1, symbol: 'btc', name: 'Bitcoin', apiId: 'bitcoin', type: 'crypto', isActive: true },
    { id: 2, symbol: 'eth', name: 'Ethereum', apiId: 'ethereum', type: 'crypto', isActive: true },
    { id: 3, symbol: 'sol', name: 'Solana', apiId: 'solana', type: 'crypto', isActive: true },
    { id: 4, symbol: 'bnb', name: 'Binance Coin', apiId: 'binancecoin', type: 'crypto', isActive: true },
    { id: 5, symbol: 'nvda', name: 'Nvidia', apiId: 'NVDA', type: 'equity', isActive: true },
    { id: 6, symbol: 'aapl', name: 'Apple', apiId: 'AAPL', type: 'equity', isActive: true },
    { id: 7, symbol: 'tsla', name: 'Tesla', apiId: 'TSLA', type: 'equity', isActive: true },
    { id: 8, symbol: 'gld', name: 'Gold', apiId: 'GLD', type: 'equity', isActive: true },
    { id: 9, symbol: 'random', name: 'Random Mix', apiId: 'random', type: 'mixed', isActive: true },
  ];
  res.status(200).json(assets);
}
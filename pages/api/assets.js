// api/assets.js (or pages/api/assets.js - depending on your structure)
export default function handler(req, res) {
  const assets = [
    { id: 1, symbol: 'btc', name: 'Bitcoin', apiId: 'bitcoin', type: 'crypto', isActive: true },
    { id: 2, symbol: 'eth', name: 'Ethereum', apiId: 'ethereum', type: 'crypto', isActive: true },
    { id: 3, symbol: 'sol', name: 'Solana', apiId: 'solana', type: 'crypto', isActive: true },
    { id: 4, symbol: 'nvda', name: 'Nvidia', apiId: 'NVDA', type: 'equity', isActive: true },
    { id: 5, symbol: 'aapl', name: 'Apple', apiId: 'AAPL', type: 'equity', isActive: true }
  ];

  res.status(200).json(assets);
}
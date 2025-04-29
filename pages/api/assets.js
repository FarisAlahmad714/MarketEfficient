// pages/api/assets.js
export default function handler(req, res) {
  // Asset data with extended information for the enhanced UI
  const assets = [
    { 
      id: 1, 
      symbol: 'btc', 
      name: 'Bitcoin', 
      apiId: 'bitcoin', 
      type: 'crypto', 
      isActive: true,
      description: 'The world\'s first cryptocurrency and the largest by market capitalization.',
      marketCap: '$730B+',
      yearFounded: 2009
    },
    { 
      id: 2, 
      symbol: 'eth', 
      name: 'Ethereum', 
      apiId: 'ethereum', 
      type: 'crypto', 
      isActive: true,
      description: 'A decentralized platform for applications and smart contracts.',
      marketCap: '$240B+',
      yearFounded: 2015
    },
    { 
      id: 3, 
      symbol: 'sol', 
      name: 'Solana', 
      apiId: 'solana', 
      type: 'crypto', 
      isActive: true,
      description: 'A high-performance blockchain supporting fast, secure, scalable applications.',
      marketCap: '$48B+',
      yearFounded: 2020
    },
    { 
      id: 4, 
      symbol: 'bnb', 
      name: 'Binance Coin', 
      apiId: 'binancecoin', 
      type: 'crypto', 
      isActive: true,
      description: 'Native cryptocurrency of Binance, one of the world\'s largest crypto exchanges.',
      marketCap: '$42B+',
      yearFounded: 2017
    },
    { 
      id: 5, 
      symbol: 'nvda', 
      name: 'Nvidia', 
      apiId: 'NVDA', 
      type: 'equity', 
      isActive: true,
      description: 'Leading semiconductor company specializing in GPUs and AI technology.',
      marketCap: '$1.1T+',
      yearFounded: 1993
    },
    { 
      id: 6, 
      symbol: 'aapl', 
      name: 'Apple', 
      apiId: 'AAPL', 
      type: 'equity', 
      isActive: true,
      description: 'Technology company known for the iPhone, Mac, and services like Apple Music.',
      marketCap: '$2.9T+',
      yearFounded: 1976
    },
    { 
      id: 7, 
      symbol: 'tsla', 
      name: 'Tesla', 
      apiId: 'TSLA', 
      type: 'equity', 
      isActive: true,
      description: 'Electric vehicle and clean energy company led by Elon Musk.',
      marketCap: '$525B+',
      yearFounded: 2003
    },
    { 
      id: 8, 
      symbol: 'gld', 
      name: 'Gold', 
      apiId: 'GLD', 
      type: 'equity', 
      isActive: true,
      description: 'Precious metal used as a store of value and hedge against inflation.',
      marketCap: 'N/A',
      yearFounded: 'N/A'
    },
    { 
      id: 9, 
      symbol: 'random', 
      name: 'Random Mix', 
      apiId: 'random', 
      type: 'mixed', 
      isActive: true,
      description: 'A diverse blend of assets for testing your prediction skills across different markets.',
      marketCap: 'Various',
      yearFounded: 'N/A'
    },
  ];

  res.status(200).json(assets);
}
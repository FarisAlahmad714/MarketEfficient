// pages/api/assets.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../lib/api-handler';

async function assetsHandler(req, res) {
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
      name: 'Gold ETF (GLD)', 
      apiId: 'GLD', 
      type: 'equity', 
      isActive: true,
      description: 'SPDR Gold Shares ETF - tracks the price of gold bullion, providing exposure to gold without physical ownership.',
      marketCap: '$65B+',
      yearFounded: 2004
    },
    { 
      id: 9, 
      symbol: 'xau', 
      name: 'Gold Spot (XAU/USD)', 
      apiId: 'XAU/USD', 
      type: 'commodity', 
      isActive: true,
      description: 'Gold spot price in US Dollars - the most liquid precious metals market.',
      marketCap: '$13T+',
      yearFounded: 'Ancient'
    },
    { 
      id: 10, 
      symbol: 'crude', 
      name: 'Crude Oil (WTI)', 
      apiId: 'CL=F', 
      type: 'commodity', 
      isActive: true,
      description: 'West Texas Intermediate crude oil futures - benchmark for oil pricing.',
      marketCap: '$2T+',
      yearFounded: 1983
    },
    { 
      id: 11, 
      symbol: 'silver', 
      name: 'Silver Spot (XAG/USD)', 
      apiId: 'XAG/USD', 
      type: 'commodity', 
      isActive: true,
      description: 'Silver spot price in US Dollars - industrial and precious metal.',
      marketCap: '$1.4T+',
      yearFounded: 'Ancient'
    },
    { 
      id: 12, 
      symbol: 'gas', 
      name: 'Natural Gas', 
      apiId: 'NG=F', 
      type: 'commodity', 
      isActive: true,
      description: 'Natural gas futures - essential energy commodity for heating and power.',
      marketCap: '$200B+',
      yearFounded: 1990
    },
    { 
      id: 13, 
      symbol: 'random', 
      name: 'Random Mix', 
      apiId: 'random', 
      type: 'mixed', 
      isActive: true,
      description: 'Ultimate challenge - random assets with random timeframes for maximum difficulty.',
      marketCap: 'Various',
      yearFounded: 'N/A'
    },
  ];

  return res.status(200).json(assets);
}

// Export with standard API handler (no auth needed for static data)
export default createApiHandler(assetsHandler, { 
  methods: ['GET'],
  connectDatabase: false // No database needed for static data
});
// pages/api/sandbox/market-data.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import { SANDBOX_ASSETS } from '../../../lib/sandbox-constants';

async function marketDataHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { symbols, interval = '1min', outputsize = '100', type = 'price' } = req.query;
  
  try {
    // Check if user is admin first
    const User = require('../../../models/User');
    const user = await User.findById(userId);
    const isAdmin = user?.isAdmin || false;
    
    // Check if user has sandbox access (or is admin)
    const portfolio = await SandboxPortfolio.findOne({ userId });
    
    if (!isAdmin && (!portfolio || !portfolio.unlocked)) {
      return res.status(403).json({ 
        error: 'Sandbox not unlocked',
        message: 'Complete required tests to unlock sandbox trading' 
      });
    }
    
    if (req.method === 'GET') {
      // Get available assets or specific symbol data
      if (!symbols) {
        // Return available assets for trading
        const allAssets = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks];
        
        return res.status(200).json({
          success: true,
          assets: allAssets,
          categories: {
            crypto: SANDBOX_ASSETS.crypto,
            stocks: SANDBOX_ASSETS.stocks
          }
        });
      }
      
      // Check if this is a single symbol request for chart data
      if (symbols && !symbols.includes(',') && type === 'chart') {
        // Get historical chart data for charting - use mock data for sandbox
        const chartData = generateMockChartData(symbols.toUpperCase(), interval, parseInt(outputsize));
        
        return res.status(200).json({
          success: true,
          chartData: chartData,
          symbol: symbols.toUpperCase(),
          interval: interval,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get real-time price data for specific symbols
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      const validSymbols = symbolList.filter(symbol => 
        [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks]
          .some(asset => asset.symbol === symbol)
      );
      
      if (validSymbols.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid symbols',
          message: 'No valid symbols provided for sandbox trading' 
        });
      }
      
      // Fetch real-time data from Twelvedata with fallback to mock data
      let priceData;
      try {
        priceData = await fetchTwelvedataRealTime(validSymbols);
      } catch (error) {
        console.log('Using mock price data for sandbox:', error.message);
        priceData = generateMockPriceData(validSymbols);
      }
      
      res.status(200).json({
        success: true,
        data: priceData,
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Error fetching sandbox market data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message 
    });
  }
}

async function fetchTwelvedataRealTime(symbols) {
  const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
  
  if (!TWELVEDATA_API_KEY) {
    throw new Error('Twelvedata API key not configured');
  }
  
  const results = [];
  
  // Process symbols in batches to respect API limits
  const batchSize = 8; // Twelvedata allows up to 8 symbols per request
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const symbolString = batch.join(',');
    
    try {
      const url = `https://api.twelvedata.com/price?symbol=${symbolString}&apikey=${TWELVEDATA_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Twelvedata API error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Handle single symbol vs multiple symbols response
      if (batch.length === 1) {
        const symbol = batch[0];
        if (data.price && !isNaN(parseFloat(data.price))) {
          const assetInfo = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks]
            .find(asset => asset.symbol === symbol);
          
          results.push({
            symbol: symbol,
            name: assetInfo?.name || symbol,
            category: assetInfo?.category || 'unknown',
            price: parseFloat(data.price),
            timestamp: new Date().toISOString(),
            source: 'twelvedata'
          });
        }
      } else {
        // Multiple symbols
        Object.keys(data).forEach(symbol => {
          const symbolData = data[symbol];
          if (symbolData.price && !isNaN(parseFloat(symbolData.price))) {
            const assetInfo = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks]
              .find(asset => asset.symbol === symbol);
            
            results.push({
              symbol: symbol,
              name: assetInfo?.name || symbol,
              category: assetInfo?.category || 'unknown',
              price: parseFloat(symbolData.price),
              timestamp: new Date().toISOString(),
              source: 'twelvedata'
            });
          }
        });
      }
      
      // Rate limiting - wait between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Error fetching batch ${symbolString}:`, error);
      continue;
    }
  }
  
  return results;
}

// Get historical data for charts (separate endpoint functionality)
async function getHistoricalData(symbol, interval = '1h', outputsize = 100) {
  const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
  
  if (!TWELVEDATA_API_KEY) {
    throw new Error('Twelvedata API key not configured');
  }
  
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVEDATA_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API returned error');
    }
    
    if (!data.values || !Array.isArray(data.values)) {
      throw new Error('Invalid data format received');
    }
    
    // Transform data for lightweight charts
    const chartData = data.values.reverse().map(item => ({
      time: Math.floor(new Date(item.datetime).getTime() / 1000),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0
    }));
    
    return chartData;
    
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
}

// Generate mock chart data for sandbox trading
function generateMockChartData(symbol, interval, outputsize) {
  const data = [];
  const now = new Date();
  const intervalMinutes = getIntervalMinutes(interval);
  
  // Base price varies by symbol
  const basePrices = {
    'BTCUSD': 45000,
    'ETHUSD': 3000,
    'ADAUSD': 0.5,
    'SOLUSD': 100,
    'LINKUSD': 15,
    'AAPL': 180,
    'GOOGL': 140,
    'TSLA': 250,
    'AMZN': 150,
    'MSFT': 380,
    'SPY': 450,
    'QQQ': 350
  };
  
  let basePrice = basePrices[symbol] || 100;
  let currentPrice = basePrice;
  
  // Generate data points going backwards in time
  for (let i = outputsize - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
    
    // Generate realistic price movement
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.8); // Don't go below 80% of base
    currentPrice = Math.min(currentPrice, basePrice * 1.2); // Don't go above 120% of base
    
    // Generate OHLC data
    const variance = currentPrice * 0.01; // 1% variance for high/low
    const open = currentPrice + (Math.random() - 0.5) * variance;
    const close = currentPrice + (Math.random() - 0.5) * variance;
    const high = Math.max(open, close) + Math.random() * variance;
    const low = Math.min(open, close) - Math.random() * variance;
    
    data.push({
      time: Math.floor(timestamp.getTime() / 1000), // Unix timestamp
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000 // Random volume
    });
  }
  
  return data;
}

function getIntervalMinutes(interval) {
  const intervals = {
    '1min': 1,
    '5min': 5,
    '15min': 15,
    '1h': 60,
    '4h': 240,
    '1day': 1440
  };
  return intervals[interval] || 60;
}

// Generate mock real-time price data for sandbox
function generateMockPriceData(symbols) {
  const basePrices = {
    'BTCUSD': 45000,
    'ETHUSD': 3000,
    'ADAUSD': 0.5,
    'SOLUSD': 100,
    'LINKUSD': 15,
    'AAPL': 180,
    'GOOGL': 140,
    'TSLA': 250,
    'AMZN': 150,
    'MSFT': 380,
    'SPY': 450,
    'QQQ': 350
  };

  return symbols.map(symbol => {
    const basePrice = basePrices[symbol] || 100;
    const volatility = 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * volatility;
    const currentPrice = basePrice * (1 + change);
    const change24h = (Math.random() - 0.5) * 5; // ±5% daily change

    return {
      symbol: symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      change24h: parseFloat(change24h.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      timestamp: new Date().toISOString()
    };
  });
}

export default createApiHandler(
  composeMiddleware(requireAuth, marketDataHandler),
  { methods: ['GET'] }
);

// Export helper function for other modules
export { getHistoricalData };
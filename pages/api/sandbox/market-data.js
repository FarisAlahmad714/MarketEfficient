// pages/api/sandbox/market-data.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import { SANDBOX_ASSETS, getAPISymbol, convertUSDToSENSES } from '../../../lib/sandbox-constants';
import { getPriceSimulator } from '../../../lib/priceSimulation';

async function marketDataHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { symbols, interval = '1min', outputsize = '1000', type = 'price', extend = 'false', latestTime } = req.query;
  
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
        const requestedSymbol = symbols.toUpperCase();
        const apiSymbol = getAPISymbol(requestedSymbol);
        
        // Get real historical chart data for charting
        try {
          console.log(`Fetching chart data for ${apiSymbol}, interval: ${interval}, outputsize: ${outputsize}`);
          const chartData = await getHistoricalData(apiSymbol, interval, parseInt(outputsize));
          
          // Convert USD prices to SENSES prices (1:1 for now)
          const sensesChartData = chartData.map(candle => ({
            ...candle,
            open: convertUSDToSENSES(candle.open),
            high: convertUSDToSENSES(candle.high), 
            low: convertUSDToSENSES(candle.low),
            close: convertUSDToSENSES(candle.close)
          }));
          
          return res.status(200).json({
            success: true,
            chartData: sensesChartData,
            symbol: requestedSymbol,
            pair: `${requestedSymbol}/SENSES`,
            interval: interval,
            timestamp: new Date().toISOString(),
            dataAge: sensesChartData.length > 0 ? new Date(sensesChartData[sensesChartData.length-1].time * 1000).toISOString() : null,
            marketStatus: 'real-time' // Will be updated based on data freshness
          });
        } catch (error) {
          console.log('Falling back to simulated data for chart:', error.message);
          // Fallback to simulated data if real data fails
          const chartData = generateSimulatedChartData(
            requestedSymbol, 
            interval, 
            parseInt(outputsize),
            extend === 'true' ? parseInt(latestTime) : null
          );
          
          return res.status(200).json({
            success: true,
            chartData: chartData,
            symbol: requestedSymbol,
            pair: `${requestedSymbol}/SENSES`,
            interval: interval,
            timestamp: new Date().toISOString(),
            isSimulated: true, // Flag to indicate this is simulated data
            isExtension: extend === 'true'
          });
        }
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
      
      // Convert to API symbols for price fetching
      const apiSymbols = validSymbols.map(getAPISymbol);
      
      // Fetch real-time data from Twelvedata with fallback to mock data
      let priceData;
      try {
        priceData = await fetchTwelvedataRealTime(apiSymbols);
        
        if (priceData.length === 0) {
          throw new Error('No real price data received from Twelvedata');
        }
        
        // Convert back to SENSES pairs
        priceData = priceData.map((item, index) => ({
          ...item,
          symbol: validSymbols[index], // Use the original symbol (BTC not BTCUSD)
          pair: `${validSymbols[index]}/SENSES`,
          price: convertUSDToSENSES(item.price),
          name: [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks]
            .find(asset => asset.symbol === validSymbols[index])?.name || item.name,
          source: 'twelvedata'
        }));
        
        console.log(`Successfully fetched ${priceData.length} real prices from Twelvedata`);
      } catch (error) {
        console.error('Twelvedata API failed, using simulated prices:', error.message);
        priceData = generateSimulatedPriceData(validSymbols);
      }
      
      res.status(200).json({
        success: true,
        data: priceData,
        timestamp: new Date().toISOString(),
        dataSource: priceData[0]?.source === 'real' ? 'twelvedata' : 'mock'
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
  const TWELVEDATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '08f0aa1220414f6ba782aaae2cd515e3';
  
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
      
      // Rate limiting - wait between batches (reduced for Pro tier)
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Optimized for Pro tier API limits
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
  const TWELVEDATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '08f0aa1220414f6ba782aaae2cd515e3';
  
  if (!TWELVEDATA_API_KEY) {
    throw new Error('Twelvedata API key not configured');
  }
  
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVEDATA_API_KEY}`;
    console.log(`Twelve Data API URL: ${url}`);
    
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
    
    console.log(`Chart data received: ${chartData.length} candles, latest: ${new Date(chartData[chartData.length-1]?.time * 1000)}, oldest: ${new Date(chartData[0]?.time * 1000)}`);
    
    return chartData;
    
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
}

// Generate simulated chart data for sandbox trading  
function generateSimulatedChartData(symbol, interval, outputsize, extendFromTime = null) {
  const priceSimulator = getPriceSimulator();
  const currentPrice = priceSimulator.getPrice(symbol);
  
  // Generate historical data leading up to current price
  const data = [];
  const now = extendFromTime ? new Date(extendFromTime * 1000) : new Date();
  const intervalMinutes = getIntervalMinutes(interval);
  
  // Start from current simulated price and work backwards
  let workingPrice = currentPrice;
  
  // Generate data points going backwards in time
  for (let i = outputsize - 1; i >= 0; i--) {
    let timestamp;
    
    if (extendFromTime) {
      // For extension: generate data going backwards from the provided time
      timestamp = new Date(now.getTime() - ((outputsize - i) * intervalMinutes * 60 * 1000));
    } else {
      // Normal mode: generate data leading up to current time
      timestamp = new Date(now.getTime() - ((outputsize - 1 - i) * intervalMinutes * 60 * 1000));
    }
    
    // For extending mode, generate older historical data before the real data
    if (extendFromTime) {
      // Generate realistic price movement for historical data
      const volatility = 0.005; // Reduced volatility for smoother historical data
      const change = (Math.random() - 0.5) * volatility;
      workingPrice = workingPrice * (1 + change);
    } else {
      // For current candle (i=0), use exact current price
      if (i === 0) {
        workingPrice = currentPrice;
      } else {
        // Generate realistic price movement for historical data
        const volatility = 0.005; // Reduced volatility for smoother historical data
        const change = (Math.random() - 0.5) * volatility;
        workingPrice = workingPrice * (1 + change);
      }
    }
    
    // Generate OHLC data around working price
    const variance = workingPrice * 0.008; // Smaller variance for more realistic candles
    const open = workingPrice + (Math.random() - 0.5) * variance;
    const close = (i === 0) ? currentPrice : workingPrice + (Math.random() - 0.5) * variance;
    const high = Math.max(open, close) + Math.random() * variance * 0.5;
    const low = Math.min(open, close) - Math.random() * variance * 0.5;
    
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

// Generate simulated real-time price data for sandbox
function generateSimulatedPriceData(symbols) {
  const priceSimulator = getPriceSimulator();
  
  return symbols.map(symbol => {
    const currentPrice = priceSimulator.getPrice(symbol);
    const change24hData = priceSimulator.get24hChange(symbol);
    const assetInfo = [...SANDBOX_ASSETS.crypto, ...SANDBOX_ASSETS.stocks]
      .find(asset => asset.symbol === symbol);

    return {
      symbol: symbol,
      pair: `${symbol}/SENSES`,
      name: assetInfo?.name || symbol,
      price: currentPrice,
      change24h: change24hData.changePercent,
      volume: Math.floor(Math.random() * 10000000) + 1000000, // Simulated volume
      timestamp: new Date().toISOString(),
      source: 'simulated'
    };
  });
}

export default createApiHandler(
  composeMiddleware(requireAuth, marketDataHandler),
  { methods: ['GET'] }
);

// Export helper function for other modules
export { getHistoricalData };
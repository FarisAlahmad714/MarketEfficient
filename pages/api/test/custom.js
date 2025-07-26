// pages/api/test/custom.js
import { fetchAssetOHLCData } from '../../../lib/data-service';

// Asset mappings
const assetMappings = {
  // Crypto
  'btc': { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto' },
  'eth': { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto' },
  'sol': { symbol: 'SOL/USD', name: 'Solana', type: 'crypto' },
  'bnb': { symbol: 'BNB/USD', name: 'Binance Coin', type: 'crypto' },
  
  // Stocks
  'nvda': { symbol: 'NVDA', name: 'NVIDIA', type: 'equity' },
  'aapl': { symbol: 'AAPL', name: 'Apple', type: 'equity' },
  'tsla': { symbol: 'TSLA', name: 'Tesla', type: 'equity' },
  'gld': { symbol: 'GLD', name: 'SPDR Gold Trust', type: 'equity' },
  
  // Commodities
  'xau': { symbol: 'XAU/USD', name: 'Gold', type: 'commodity' },
  'cl': { symbol: 'CL=F', name: 'Crude Oil', type: 'commodity' },
  'xag': { symbol: 'XAG/USD', name: 'Silver', type: 'commodity' },
  'ng': { symbol: 'NG=F', name: 'Natural Gas', type: 'commodity' }
};

// Timeframe configurations
const timeframeConfigs = {
  '4h': {
    interval: '4h',
    setupCandles: 120,
    outcomeCandles: 30,
    candleHours: 4
  },
  'daily': {
    interval: '1day',
    setupCandles: 90,
    outcomeCandles: 20,
    candleHours: 24
  },
  'weekly': {
    interval: '1week',
    setupCandles: 52,
    outcomeCandles: 16,
    candleHours: 168
  },
  'monthly': {
    interval: '1month',
    setupCandles: 36,
    outcomeCandles: 12,
    candleHours: 720
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { asset, timeframe, date, session_id } = req.query;

  // Validate inputs
  if (!asset || !timeframe || !date || !session_id) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      success: false 
    });
  }

  const assetInfo = assetMappings[asset.toLowerCase()];
  const timeframeConfig = timeframeConfigs[timeframe.toLowerCase()];

  if (!assetInfo || !timeframeConfig) {
    return res.status(400).json({ 
      error: 'Invalid asset or timeframe',
      success: false 
    });
  }

  try {
    // Parse the selected date
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999); // End of day

    // Calculate setup period start date
    const setupDays = Math.ceil((timeframeConfig.setupCandles * timeframeConfig.candleHours) / 24);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - setupDays);
    startDate.setHours(0, 0, 0, 0); // Start of day

    // Calculate outcome period end date (for validation)
    const outcomeDays = Math.ceil((timeframeConfig.outcomeCandles * timeframeConfig.candleHours) / 24);
    const outcomeEndDate = new Date(endDate);
    outcomeEndDate.setDate(endDate.getDate() + outcomeDays);

    // Validate that we're not requesting future data
    const today = new Date();
    if (outcomeEndDate > today) {
      return res.status(400).json({
        error: 'Selected date is too recent. Need complete outcome data.',
        success: false
      });
    }

    // Fetch historical data for setup period
    const totalCandles = timeframeConfig.setupCandles + timeframeConfig.outcomeCandles + 5; // Extra buffer
    
    // Create complete asset object for fetchAssetOHLCData (matching the format from bias test)
    const basePriceMap = {
      'btc': 60000,
      'eth': 3000,
      'sol': 100,
      'bnb': 500,
      'nvda': 800,
      'aapl': 175,
      'tsla': 250,
      'gld': 240,
      'xau': 2000,
      'cl': 75,
      'xag': 25,
      'ng': 3
    };
    
    // Use different apiId mapping based on asset type
    let apiId;
    if (assetInfo.type === 'crypto') {
      const cryptoApiMap = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'sol': 'solana',
        'bnb': 'binancecoin'
      };
      apiId = cryptoApiMap[asset.toLowerCase()];
    } else {
      // For stocks and commodities, use the symbol directly
      apiId = assetInfo.symbol;
    }
    
    const assetObj = {
      id: 1, // Dummy ID
      symbol: asset.toLowerCase(),
      name: assetInfo.name,
      apiId: apiId,
      type: assetInfo.type,
      basePrice: basePriceMap[asset.toLowerCase()] || 100
    };
    
    // Fetch data just like the working test endpoint does
    const historicalData = await fetchAssetOHLCData(
      assetObj,
      timeframe,
      totalCandles, // Pass candles directly, not days
      startDate,
      session_id
    );

    if (!historicalData || historicalData.length === 0) {
      return res.status(500).json({
        error: 'Failed to fetch historical data',
        success: false
      });
    }
    
    // Debug logging
    console.log('API Request Details:', {
      asset: assetObj,
      timeframe,
      totalCandles,
      startDate: startDate.toISOString(),
      apiKey: process.env.TWELVE_DATA_API_KEY ? 'Present' : 'Missing'
    });
    console.log('Historical data sample:', historicalData[0]);
    console.log('Total candles received:', historicalData.length);
    console.log('Is Mock Data?:', historicalData[0]?.isMockData || false);

    // Split data into setup period only (outcome hidden for now)
    const setupData = historicalData.slice(0, timeframeConfig.setupCandles);
    
    // Transform data to match expected chart format
    const transformedSetupData = setupData.map(candle => {
      // Convert date string to timestamp
      const timestamp = new Date(candle.date).getTime() / 1000; // Convert to seconds
      
      // Ensure OHLC values are valid
      const open = parseFloat(candle.open) || 100;
      const high = parseFloat(candle.high) || open * 1.01;
      const low = parseFloat(candle.low) || open * 0.99;
      const close = parseFloat(candle.close) || open;
      
      return {
        time: timestamp,
        open: open,
        high: Math.max(open, high, close),
        low: Math.min(open, low, close),
        close: close,
        volume: parseFloat(candle.volume) || 0
      };
    }).filter(candle => 
      // Filter out any invalid data
      !isNaN(candle.time) && 
      !isNaN(candle.open) && 
      !isNaN(candle.high) && 
      !isNaN(candle.low) && 
      !isNaN(candle.close) &&
      candle.time > 0
    ).sort((a, b) => a.time - b.time); // Ensure chronological order
    
    console.log('Transformed data sample:', transformedSetupData[0]);
    console.log('Transformed data length:', transformedSetupData.length);
    
    // Extract volume data if available
    const volumeData = transformedSetupData.map(candle => ({
      time: candle.time,
      value: candle.volume || 0,
      color: candle.close >= candle.open ? '#26a69a' : '#ef5350'
    }));

    // Prepare response
    const responseData = {
      success: true,
      data: {
        assetName: assetInfo.name,
        assetSymbol: assetInfo.symbol,
        assetType: assetInfo.type,
        timeframe: timeframe,
        setupStart: startDate.toISOString(),
        setupEnd: endDate.toISOString(),
        outcomeEnd: outcomeEndDate.toISOString(),
        setupData: transformedSetupData,
        volumeData: volumeData.some(v => v.value > 0) ? volumeData : null,
        totalCandles: transformedSetupData.length,
        session_id: session_id
      }
    };

    // News fetching can be added later if needed

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error in custom test API:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
      details: error.message
    });
  }
}
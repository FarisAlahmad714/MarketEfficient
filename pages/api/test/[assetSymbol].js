// pages/api/test/[assetSymbol].js
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid

export default function handler(req, res) {
  const { assetSymbol } = req.query;
  const timeframe = req.query.timeframe || 'daily';

  if (req.method === 'GET') {
    // Mock test data
    const sessionId = uuidv4();
    const asset = getMockAsset(assetSymbol);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const questions = generateMockQuestions(asset, timeframe);

    return res.status(200).json({
      session_id: sessionId,
      asset_symbol: asset.symbol,
      asset_name: asset.name,
      selected_timeframe: timeframe,
      questions
    });
  } else if (req.method === 'POST') {
    // Handle test submission
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // In a real implementation, you would validate the answers against correct answers
    // and store the results in a database

    return res.status(200).json({
      success: true,
      score: 3, // Mock score
      total: 5, // Mock total
      answers: [] // Mock answers
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Helper functions
function getMockAsset(symbol) {
  const assets = [
    { id: 1, symbol: 'btc', name: 'Bitcoin', apiId: 'bitcoin', type: 'crypto', isActive: true },
    { id: 2, symbol: 'eth', name: 'Ethereum', apiId: 'ethereum', type: 'crypto', isActive: true },
    { id: 3, symbol: 'sol', name: 'Solana', apiId: 'solana', type: 'crypto', isActive: true },
    { id: 4, symbol: 'nvda', name: 'Nvidia', apiId: 'NVDA', type: 'equity', isActive: true },
    { id: 5, symbol: 'aapl', name: 'Apple', apiId: 'AAPL', type: 'equity', isActive: true },
    { id: 6, symbol: 'random', name: 'Random Mix', apiId: 'random', type: 'mixed', isActive: true }
  ];

  return assets.find(a => a.symbol === symbol);
}

function generateMockQuestions(asset, timeframe) {
  // Generate 5 mock questions
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i - 1); // Yesterday, day before yesterday, etc.

    const basePrice = asset.symbol === 'btc' ? 40000 : 
                     asset.symbol === 'eth' ? 2000 :
                     asset.symbol === 'sol' ? 100 :
                     asset.symbol === 'nvda' ? 500 :
                     asset.symbol === 'aapl' ? 150 : 200;

    const volatility = 0.05; // 5% volatility
    const priceVariation = basePrice * volatility;

    const open = basePrice - priceVariation / 2 + Math.random() * priceVariation;
    const close = basePrice - priceVariation / 2 + Math.random() * priceVariation;
    const high = Math.max(open, close) + Math.random() * priceVariation / 2;
    const low = Math.min(open, close) - Math.random() * priceVariation / 2;

    // Generate random timeframe if 'random' is selected
    const questionTimeframe = timeframe === 'random' ? 
      ['4h', 'daily', 'weekly', 'monthly'][Math.floor(Math.random() * 4)] : timeframe;

    return {
      id: i + 1,
      date: date.toISOString().split('T')[0],
      timeframe: questionTimeframe,
      ohlc: {
        open,
        high,
        low,
        close
      },
      ohlc_data: generateMockCandleData(date, open, high, low, close, 30) // 30 candles of historical data
    };
  });
}

function generateMockCandleData(date, lastOpen, lastHigh, lastLow, lastClose, count) {
  const candles = [];
  let currentDate = new Date(date);

  // Generate historical data working backward from the given date
  for (let i = 0; i < count; i++) {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);

    const volatility = 0.02; // 2% daily volatility
    const changePercent = (Math.random() - 0.5) * volatility * 2; // Random change between -2% and +2%

    // Generate new prices based on previous close
    const close = lastClose * (1 + changePercent);
    const open = lastClose * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
    const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);

    // Add to array (most recent first)
    candles.unshift({
      date: currentDate.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000)
    });

    // Set for next iteration
    lastClose = close;
  }

  return candles;
}
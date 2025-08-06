import { createApiHandler } from '../../../lib/api-handler';
import { fetchAssetOHLCData } from '../../../lib/data-service';
import fs from 'fs';
import path from 'path';
import logger from '../../../lib/logger'; // Adjust path to your logger utility
// MATCH BIAS TEST ASSETS - keep original format but only bias test assets
const CRYPTO_ASSETS = [
  { type: 'crypto', symbol: 'btc', apiId: 'bitcoin' },
  { type: 'crypto', symbol: 'eth', apiId: 'ethereum' },
  { type: 'crypto', symbol: 'bnb', apiId: 'binancecoin' },
  { type: 'crypto', symbol: 'sol', apiId: 'solana' }
];

const STOCK_ASSETS = [
  { type: 'equity', symbol: 'nvda', apiId: 'NVDA' },   // NVIDIA
  { type: 'equity', symbol: 'aapl', apiId: 'AAPL' },   // APPLE  
  { type: 'equity', symbol: 'gld', apiId: 'GLD' },     // GOLD ETF
  { type: 'equity', symbol: 'tsla', apiId: 'TSLA' }    // TESLA
];

const COMMODITY_ASSETS = [
  { type: 'commodity', symbol: 'xau', apiId: 'XAU/USD' },    // Gold Spot
  { type: 'commodity', symbol: 'silver', apiId: 'XAG/USD' }, // Silver Spot  
  { type: 'commodity', symbol: 'crude', apiId: 'CL=F' },     // Crude Oil WTI
  { type: 'commodity', symbol: 'gas', apiId: 'NG=F' }        // Natural Gas
];

const ASSETS = [...CRYPTO_ASSETS, ...STOCK_ASSETS, ...COMMODITY_ASSETS];

const TIMEFRAMES_ALL = ['1h', '4h', '1d', '1w'];
const TIMEFRAMES_FVG = ['1h', '4h', '1d'];

// Fallback sample data
const getSampleChartData = () => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'chart-data.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    return null;
  }
};

async function fetchChartHandler(req, res) {
  const chartCount = req.session?.chartCount || 1;
  
  // Get examType and assetType from query parameters
  const examType = req.query.examType || req.body?.examType;
  const assetType = req.query.assetType || req.body?.assetType;
  
  // Select appropriate timeframes based on exam type
  const timeframes = examType === 'fair-value-gaps' ? TIMEFRAMES_FVG : TIMEFRAMES_ALL;
  
  // Select asset pool based on user preference
  let assetPool = ASSETS;
  if (assetType === 'crypto') {
    assetPool = CRYPTO_ASSETS;
  } else if (assetType === 'stocks') {
    assetPool = STOCK_ASSETS;
  } else if (assetType === 'commodities') {
    assetPool = COMMODITY_ASSETS;
  }
  
  logger.log(`Fetching chart for exam type: ${examType}, asset type: ${assetType}, available timeframes:`, timeframes);

  // Randomly select asset and timeframe
  const asset = assetPool[Math.floor(Math.random() * assetPool.length)];
  const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];

  // Map timeframe to API parameters
  let apiTimeframe, candles;
  switch (timeframe) {
    case '1h':
      apiTimeframe = '1h';
      candles = 150; // ~6 days of 1h candles
      break;
    case '4h':
      apiTimeframe = '4h';
      candles = 120; // ~20 days of 4h candles
      break;
    case '1d':
      apiTimeframe = '1day';
      candles = 180; // ~6 months
      break;
    case '1w':
      apiTimeframe = '1week';
      candles = 260; // ~5 years of weekly candles
      break;
    default:
      apiTimeframe = '1day';
      candles = 180;
  }

  logger.log(`Fetching data for ${asset.apiId} on timeframe ${timeframe} (${apiTimeframe}, ${candles} candles)`);

  let chartData;
  try {
    const ohlcData = await fetchAssetOHLCData(asset, apiTimeframe, candles);
    chartData = {
      chart_data: ohlcData.map(candle => ({
        time: Math.floor(new Date(candle.date).getTime() / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      })),
      symbol: asset.symbol.toUpperCase(),
      timeframe: timeframe,
      chart_count: chartCount
    };
  } catch (error) {
    chartData = getSampleChartData();
  }

  // Fallback to mock data if needed
  if (!chartData || !chartData.chart_data || chartData.chart_data.length < 20) {
    const now = Math.floor(Date.now() / 1000);
    const interval = timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : timeframe === '1d' ? 86400 : 604800;
    const generatedData = [];
    let basePrice = 100;
    const volatility = 5;

    for (let i = 0; i < 100; i++) {
      const time = now - (100 - i) * interval;
      const open = basePrice;
      const change = (Math.random() - 0.5) * volatility;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;

      generatedData.push({ time, open, high, low, close });
      basePrice = close;
    }

    chartData = { chart_data: generatedData, symbol: 'MOCK', timeframe, chart_count: chartCount };
  }

  // Process and validate data
  const processedData = {
    ...chartData,
    chart_data: chartData.chart_data
      .filter(candle => candle && ['open', 'high', 'low', 'close'].every(key => typeof candle[key] === 'number' && !isNaN(candle[key])))
      .map(candle => ({
        ...candle,
        time: typeof candle.time === 'number' && !isNaN(candle.time) ? candle.time : Math.floor(Date.now() / 1000) - Math.random() * 86400 * 30
      }))
      .sort((a, b) => a.time - b.time)
  };

  return res.status(200).json({
    chart_data: processedData.chart_data,
    symbol: processedData.symbol || 'UNKNOWN',
    timeframe: processedData.timeframe || '1d',
    chart_count: chartCount
  });
}

// Export with standard API handler (no auth needed for chart data)
export default createApiHandler(fetchChartHandler, { 
  methods: ['GET'],
  connectDatabase: false // No database needed for chart data fetching
});
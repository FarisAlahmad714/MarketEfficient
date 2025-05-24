import { createApiHandler } from '../../../lib/api-handler';
import { fetchAssetOHLCData } from '../../../lib/data-service';
import fs from 'fs';
import path from 'path';

// Define assets and timeframes to match Flask app
const ASSETS = [
  { type: 'crypto', symbol: 'btc', apiId: 'bitcoin' },
  { type: 'crypto', symbol: 'eth', apiId: 'ethereum' },
  { type: 'crypto', symbol: 'bnb', apiId: 'binancecoin' },
  { type: 'crypto', symbol: 'sol', apiId: 'solana' },
  { type: 'crypto', symbol: 'cosmos', apiId: 'cosmos' },
  { type: 'crypto', symbol: 'xrp', apiId: 'ripple' },
  { type: 'crypto', symbol: 'ltc', apiId: 'litecoin' },
  { type: 'crypto', symbol: 'link', apiId: 'chainlink' }
];

const TIMEFRAMES = ['1h', '4h', '1d', '1w'];

// Fallback sample data
const getSampleChartData = () => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'chart-data.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading sample chart data:', error);
    return null;
  }
};

async function fetchChartHandler(req, res) {
  const chartCount = req.session?.chartCount || 1;

  // Randomly select asset and timeframe
  const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
  const timeframe = TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)];

  // Map timeframe to API parameters
  let apiTimeframe, days;
  switch (timeframe) {
    case '1h':
      apiTimeframe = 'hourly';
      days = 1;
      break;
    case '4h':
      apiTimeframe = 'hourly';
      days = 7;
      break;
    case '1d':
      apiTimeframe = 'daily';
      days = 30;
      break;
    case '1w':
      apiTimeframe = 'daily';
      days = 365;
      break;
    default:
      apiTimeframe = 'daily';
      days = 30;
  }

  console.log(`Fetching data for ${asset.apiId} on timeframe ${timeframe} (${apiTimeframe}, ${days} days)`);

  let chartData;
  try {
    const ohlcData = await fetchAssetOHLCData(asset, apiTimeframe, days);
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
    console.warn('Data fetch failed, using sample data:', error.message);
    chartData = getSampleChartData();
  }

  // Fallback to mock data if needed
  if (!chartData || !chartData.chart_data || chartData.chart_data.length < 20) {
    console.warn('Insufficient data, generating mock data');
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
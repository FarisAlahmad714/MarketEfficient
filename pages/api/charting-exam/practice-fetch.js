import { createApiHandler } from '../../../lib/api-handler';
import { fetchAssetOHLCData } from '../../../lib/data-service';

async function practiceFetchHandler(req, res) {
  const { asset, assetType, timeframe } = req.body;

  if (!asset || !timeframe) {
    return res.status(400).json({ 
      error: true, 
      message: 'Missing required parameters' 
    });
  }

  try {
    // Fetch latest/live data
    // Calculate candles to show appropriate amount of historical data
    let candles;
    switch (timeframe) {
      case '1h':
        candles = 168; // 7 days of hourly data
        break;
      case '4h':
        candles = 336; // 56 days of 4h data (doubled for better practice)
        break;
      case '1day':
        candles = 180; // 180 days of daily data
        break;
      case '1week':
        candles = 104; // 2 years of weekly data
        break;
      default:
        candles = 180;
    }

    // Create asset object for data service
    const assetObj = {
      type: assetType,
      symbol: asset,
      apiId: assetType === 'crypto' ? 
        { btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin' }[asset] : 
        asset.toUpperCase()
    };

    // Fetch the data
    const ohlcData = await fetchAssetOHLCData(assetObj, timeframe, candles);

    // Format the data for the chart
    const chartData = ohlcData.map(candle => ({
      time: Math.floor(new Date(candle.date).getTime() / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      date: candle.date
    })).sort((a, b) => a.time - b.time);

    return res.status(200).json({
      chartData,
      asset: asset.toUpperCase(),
      timeframe,
      candleCount: chartData.length,
      isLive: true
    });
  } catch (error) {
    console.error('Error fetching practice chart data:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to fetch chart data'
    });
  }
}

export default createApiHandler(practiceFetchHandler, {
  methods: ['POST'],
  connectDatabase: false
});
//lib/data-service.js
import axios from 'axios';
import logger from './logger'; // Adjust path to your logger utility
// Simple cache to reduce API calls with timeouts
const dataCache = {
  crypto: {},
  stock: {},
  commodity: {},
  failedRequests: { crypto: 0, stock: 0, commodity: 0 },
  lastRequest: { crypto: 0, stock: 0, commodity: 0 }
};

// Reset cache after 24 hours to ensure fresh data
setInterval(() => {
  logger.log('Clearing data cache to ensure fresh data');
  dataCache.crypto = {};
  dataCache.stock = {};
  dataCache.commodity = {};
  dataCache.failedRequests = { crypto: 0, stock: 0, commodity: 0 };
}, 24 * 60 * 60 * 1000);

/**
 * Sleep function for rate limiting
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Resolves after specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a seedable random number generator
 * @param {number} seed - Seed value for PRNG
 * @returns {Function} - Seeded PRNG function returning values 0-1
 */
function seedRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return function () {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Fetches historical OHLC data for crypto assets using TwelveData API
 * @param {string} apiId - Crypto symbol (bitcoin -> BTC/USD)
 * @param {string} timeframe - Time interval (daily, weekly, etc.)
 * @param {number} days - Number of days of data to fetch
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchCryptoOHLCData(apiId, timeframe = 'daily', days = 30, startDate = null, seed = Date.now()) {
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.crypto || 0);
  if (timeSinceLastRequest < 200) {
    const waitTime = 200 - timeSinceLastRequest;
    logger.log(`Rate limiting: waiting ${waitTime}ms before next TwelveData API call (Pro tier optimized)`);
    await sleep(waitTime);
  }

  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${apiId}_${timeframe}_${days}_${randomParam}`;

  if (dataCache.crypto[cacheKey]) {
    logger.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.crypto[cacheKey]));
  }

  let ohlcData = [];
  let usesMockData = true;

  try {
    if (dataCache.failedRequests.crypto < 3) {
      dataCache.lastRequest.crypto = now;
      
      // Convert CoinGecko IDs to TwelveData crypto symbols (with slash format)
      const cryptoSymbolMap = {
        'bitcoin': 'BTC/USD',
        'ethereum': 'ETH/USD', 
        'solana': 'SOL/USD',
        'binancecoin': 'BNB/USD',
        'cardano': 'ADA/USD',
        'polkadot': 'DOT/USD',
        'chainlink': 'LINK/USD',
        'litecoin': 'LTC/USD',
        'ripple': 'XRP/USD',
        'cosmos': 'ATOM/USD'
      };
      
      const symbol = cryptoSymbolMap[apiId] || `${apiId.toUpperCase()}/USD`;
      const intervalMap = {
        '1h': '1h',
        'hourly': '1h',
        '4h': '4h',
        '1day': '1day',
        'daily': '1day',
        '1week': '1week',
        'weekly': '1week',
        '1month': '1month',
        'monthly': '1month'
      };
      const interval = intervalMap[timeframe] || '1day';
      const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
      const outputsize = Math.min(days * 2, 5000);
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

      logger.log(`Fetching crypto data from TwelveData: ${symbol}`);
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 15000 });
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'TwelveData API error');
      }
      
      if (!response.data.values || !Array.isArray(response.data.values)) {
        throw new Error('Invalid response format from TwelveData API');
      }
      
      dataCache.failedRequests.crypto = 0;

      // Transform TwelveData response to our format with proper time handling
      ohlcData = response.data.values.map(item => {
        let dateStr = item.datetime;
        
        // Handle different TwelveData datetime formats based on timeframe
        if (interval === '4h' && !dateStr.includes('T')) {
          // For 4h data, add time if missing (TwelveData sometimes returns just date)
          dateStr = dateStr + 'T00:00:00Z';
        } else if (interval === '1day' && !dateStr.includes('T')) {
          // For daily data, add noon time to center the day
          dateStr = dateStr + 'T12:00:00Z';
        } else if (interval === '1week' && !dateStr.includes('T')) {
          // For weekly data, add noon time
          dateStr = dateStr + 'T12:00:00Z';
        } else if (interval === '1month' && !dateStr.includes('T')) {
          // For monthly data, add noon time 
          dateStr = dateStr + 'T12:00:00Z';
        }
        
        return {
          date: new Date(dateStr).toISOString(),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || item.close * 1000 * (0.5 + Math.random()))
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-days);

      usesMockData = false;
      logger.log(`Successfully fetched real crypto data for ${apiId} from TwelveData`);
    } else {
      logger.log(`Skipping API call for ${apiId} due to previous failures`);
    }
  } catch (error) {
    dataCache.failedRequests.crypto++;
  }

  if (usesMockData) {
    logger.log(`Using mock data for ${apiId} with seed ${seed}`);
    const basePrice = apiId === 'bitcoin' ? 60000 : apiId === 'ethereum' ? 3000 : apiId === 'solana' ? 100 : apiId === 'binancecoin' ? 600 : 500;
    ohlcData = generateMockOHLCData(basePrice, days, timeframe, startDate, seed);
  }

  if (!startDate) dataCache.crypto[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
  return ohlcData;
}

/**
 * Fetches historical OHLC data for stock assets using TwelveData API
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Time interval (daily, weekly, etc.)
 * @param {number} candles - Number of candles to return
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchStockOHLCData(symbol, timeframe = 'daily', candles = 30, startDate = null, seed = Date.now()) {
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.stock || 0);
  if (timeSinceLastRequest < 200) {
    const waitTime = 200 - timeSinceLastRequest;
    logger.log(`Rate limiting: waiting ${waitTime}ms before next TwelveData API call (Pro tier optimized)`);
    await sleep(waitTime);
  }

  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${symbol}_${timeframe}_${candles}_${randomParam}`;

  if (dataCache.stock[cacheKey]) {
    logger.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.stock[cacheKey]));
  }

  let ohlcData = [];
  let usesMockData = true;

  try {
    if (dataCache.failedRequests.stock < 3) {
      dataCache.lastRequest.stock = now;
      
      const intervalMapStock = {
        '1h': '1h',
        'hourly': '1h',
        '4h': '4h',
        '1day': '1day',
        'daily': '1day',
        '1week': '1week',
        'weekly': '1week',
        '1month': '1month',
        'monthly': '1month'
      };
      const interval = intervalMapStock[timeframe] || '1day';
      const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
      const outputsize = Math.min(candles * 2, 5000);
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

      logger.log(`Fetching stock data from TwelveData: ${symbol}`);
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 15000 });
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'TwelveData API error');
      }
      
      if (!response.data.values || !Array.isArray(response.data.values)) {
        throw new Error('Invalid response format from TwelveData API');
      }
      
      dataCache.failedRequests.stock = 0;

      // Transform TwelveData response to our format with proper time handling
      ohlcData = response.data.values.map(item => {
        let dateStr = item.datetime;
        
        // Handle different TwelveData datetime formats based on timeframe
        if (interval === '4h' && !dateStr.includes('T')) {
          // For 4h data, add time if missing (TwelveData sometimes returns just date)
          dateStr = dateStr + 'T00:00:00Z';
        } else if (interval === '1day' && !dateStr.includes('T')) {
          // For daily data, add market close time (4 PM EST = 9 PM UTC)
          dateStr = dateStr + 'T21:00:00Z';
        } else if (interval === '1week' && !dateStr.includes('T')) {
          // For weekly data, add Friday market close time
          dateStr = dateStr + 'T21:00:00Z';
        } else if (interval === '1month' && !dateStr.includes('T')) {
          // For monthly data, add end of month market close time
          dateStr = dateStr + 'T21:00:00Z';
        }
        
        return {
          date: new Date(dateStr).toISOString(),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0)
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-candles);

      usesMockData = false;
      logger.log(`Successfully fetched real stock data for ${symbol} from TwelveData`);
    } else {
      logger.log(`Skipping API call for ${symbol} due to previous failures`);
    }
  } catch (error) {
    dataCache.failedRequests.stock++;
  }

  if (usesMockData) {
    logger.log(`Using mock data for ${symbol} as fallback`);
    const basePrice = symbol === 'NVDA' ? 800 : symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : symbol === 'GLD' ? 200 : symbol === 'SPY' ? 550 : symbol === 'QQQ' ? 460 : 190;
    ohlcData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
  }

  if (!startDate) dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
  return ohlcData;
}

/**
 * Fetches historical OHLC data for commodity assets using TwelveData API
 * @param {string} symbol - Commodity symbol (XAU/USD, CL=F, etc.)
 * @param {string} timeframe - Time interval (daily, weekly, etc.)
 * @param {number} candles - Number of candles to return
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchCommodityOHLCData(symbol, timeframe = 'daily', candles = 30, startDate = null, seed = Date.now()) {
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.commodity || 0);
  if (timeSinceLastRequest < 200) {
    const waitTime = 200 - timeSinceLastRequest;
    logger.log(`Rate limiting: waiting ${waitTime}ms before next TwelveData API call (Pro tier optimized)`);
    await sleep(waitTime);
  }

  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${symbol}_${timeframe}_${candles}_${randomParam}`;

  if (dataCache.commodity[cacheKey]) {
    logger.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.commodity[cacheKey]));
  }

  let ohlcData = [];
  let usesMockData = true;

  try {
    if (dataCache.failedRequests.commodity < 3) {
      dataCache.lastRequest.commodity = now;
      
      const intervalMapCommodity = {
        '1h': '1h',
        'hourly': '1h',
        '4h': '4h',
        '1day': '1day',
        'daily': '1day',
        '1week': '1week',
        'weekly': '1week',
        '1month': '1month',
        'monthly': '1month'
      };
      const interval = intervalMapCommodity[timeframe] || '1day';
      const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
      const outputsize = Math.min(candles * 2, 5000);
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

      logger.log(`Fetching commodity data from TwelveData: ${symbol}`);
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 15000 });
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'TwelveData API error');
      }
      
      if (!response.data.values || !Array.isArray(response.data.values)) {
        throw new Error('Invalid response format from TwelveData API');
      }
      
      dataCache.failedRequests.commodity = 0;

      // Transform TwelveData response to our format with proper time handling
      ohlcData = response.data.values.map(item => {
        let dateStr = item.datetime;
        
        // Handle different TwelveData datetime formats based on timeframe
        if (interval === '4h' && !dateStr.includes('T')) {
          // For 4h data, add time if missing (TwelveData sometimes returns just date)
          dateStr = dateStr + 'T00:00:00Z';
        } else if (interval === '1day' && !dateStr.includes('T')) {
          // For daily data, add market close time (5 PM EST = 10 PM UTC for commodities)
          dateStr = dateStr + 'T22:00:00Z';
        } else if (interval === '1week' && !dateStr.includes('T')) {
          // For weekly data, add Friday market close time
          dateStr = dateStr + 'T22:00:00Z';
        } else if (interval === '1month' && !dateStr.includes('T')) {
          // For monthly data, add end of month market close time
          dateStr = dateStr + 'T22:00:00Z';
        }
        
        return {
          date: new Date(dateStr).toISOString(),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0)
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-candles);

      usesMockData = false;
      logger.log(`Successfully fetched real commodity data for ${symbol} from TwelveData`);
    } else {
      logger.log(`Skipping API call for ${symbol} due to previous failures`);
    }
  } catch (error) {
    dataCache.failedRequests.commodity++;
  }

  if (usesMockData) {
    logger.log(`Using mock data for ${symbol} as fallback`);
    const basePrice = symbol === 'XAU/USD' ? 2000 : symbol === 'CL=F' ? 75 : symbol === 'XAG/USD' ? 25 : symbol === 'NG=F' ? 3 : 100;
    ohlcData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
  }

  if (!startDate) dataCache.commodity[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
  return ohlcData;
}

/**
 * Fetches historical OHLC data for any asset type
 * @param {Object} asset - Asset object with type, symbol, and apiId properties
 * @param {string} timeframe - Time interval (daily, weekly, etc.)
 * @param {number} candles - Number of candles to return
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchAssetOHLCData(asset, timeframe = 'daily', candles = 25, startDate = null, seed = Date.now()) {
  try {
    let ohlcData = [];
    if (asset.type === 'crypto') {
      ohlcData = await fetchCryptoOHLCData(asset.apiId, timeframe, candles, startDate, seed);
    } else if (asset.type === 'equity') {
      ohlcData = await fetchStockOHLCData(asset.apiId, timeframe, candles, startDate, seed);
    } else if (asset.type === 'commodity') {
      ohlcData = await fetchCommodityOHLCData(asset.apiId, timeframe, candles, startDate, seed);
    } else {
      ohlcData = generateMockOHLCData(100, candles, timeframe, startDate, seed);
    }

    return ohlcData.slice(-candles);
  } catch (error) {
    const basePrice = asset.type === 'crypto'
      ? (asset.symbol === 'btc' ? 60000 : asset.symbol === 'eth' ? 3000 : asset.symbol === 'sol' ? 100 : asset.symbol === 'bnb' ? 600 : 500)
      : asset.type === 'commodity'
      ? (asset.symbol === 'xau' ? 2000 : asset.symbol === 'crude' ? 75 : asset.symbol === 'silver' ? 25 : asset.symbol === 'gas' ? 3 : 100)
      : (asset.symbol === 'nvda' ? 800 : asset.symbol === 'aapl' ? 175 : asset.symbol === 'tsla' ? 250 : asset.symbol === 'gld' ? 200 : asset.symbol === 'spy' ? 550 : asset.symbol === 'qqq' ? 460 : 100);
    return generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
  }
}

/**
 * Generates mock OHLC data when APIs fail or for testing
 * @param {number} basePrice - Starting price
 * @param {number} count - Number of candles to generate
 * @param {string} timeframe - Time interval
 * @param {Date} startDate - Optional start date
 * @param {number} seed - Seed for random number generation
 * @returns {Array} - Array of OHLC data
 */
export function generateMockOHLCData(basePrice, count = 20, timeframe = 'daily', startDate = null, seed = Date.now()) {
  const data = [];
  let currentPrice = basePrice;
  const volatility = basePrice * 0.05;
  const now = new Date();
  const random = seedRandom(seed);

  const timeIncrementMap = {
    '1h': 1 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
    '1week': 7 * 24 * 60 * 60 * 1000,
    'weekly': 7 * 24 * 60 * 60 * 1000,
    '1month': 30 * 24 * 60 * 60 * 1000,
    'monthly': 30 * 24 * 60 * 60 * 1000
  };
  const timeIncrement = timeIncrementMap[timeframe] || 24 * 60 * 60 * 1000;

  let trendLength = Math.floor(random() * 5) + 3;
  let trendDirection = random() > 0.5 ? 1 : -1;
  let trendCounter = 0;
  let trendStrength = 0.6 + random() * 0.8;

  for (let i = 0; i < count; i++) {
    const date = new Date((startDate || now).getTime() - (count - 1 - i) * timeIncrement);
    
    // Adjust time based on timeframe for more realistic timestamps
    if (timeframe === '4h') {
      // Round to nearest 4-hour interval (0, 4, 8, 12, 16, 20)
      const hours = Math.floor(date.getHours() / 4) * 4;
      date.setHours(hours, 0, 0, 0);
    } else if (timeframe === 'daily') {
      // Set to market close time for realistic daily candles
      date.setHours(16, 0, 0, 0); // 4 PM
    } else if (timeframe === 'weekly') {
      // Set to Friday market close
      const dayOfWeek = date.getDay();
      const daysToFriday = (5 - dayOfWeek + 7) % 7;
      date.setDate(date.getDate() + daysToFriday);
      date.setHours(16, 0, 0, 0);
    } else if (timeframe === 'monthly') {
      // Set to last day of month
      date.setDate(1); // First day of month
      date.setMonth(date.getMonth() + 1); // Next month
      date.setDate(0); // Last day of previous month (which is our target month)
      date.setHours(16, 0, 0, 0);
    }
    if (trendCounter >= trendLength) {
      trendCounter = 0;
      trendLength = Math.floor(random() * 5) + 3;
      if (random() < 0.7) trendDirection *= -1;
      trendStrength = 0.6 + random() * 0.8;
    }

    const randomFactor = (random() - 0.4) * trendDirection * trendStrength;
    const change = randomFactor * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + random() * volatility * 0.5;
    const low = Math.min(open, close) - random() * volatility * 0.5;
    
    // Generate mock volume - higher on bigger price moves
    const priceMove = Math.abs(close - open);
    const baseVolume = basePrice * 1000; // Base volume proportional to price
    const volumeVariance = random() * 0.7 + 0.3; // 0.3 to 1.0 multiplier
    const volume = baseVolume * (1 + priceMove / basePrice * 10) * volumeVariance;

    data.push({ 
      date: date.toISOString(), 
      open, 
      high, 
      low, 
      close,
      volume 
    });
    
    currentPrice = close;
    trendCounter++;
  }

  return data;
}

/**
 * Fetches OHLC data directly from CoinGecko for Plotly charts
 * @param {string} coinId - CoinGecko ID for the coin
 * @param {number} days - Number of days of data
 * @param {string} vs_currency - Currency to fetch against (default: usd)
 * @returns {Promise<Object>} - Plotly-compatible OHLC data
 */
export async function fetchCoinGeckoOHLC(coinId, days, vs_currency = 'usd') {
  const cacheKey = `plotly_${coinId}_${days}_${vs_currency}`;
  if (dataCache.crypto[cacheKey]) {
    logger.log(`Using cached Plotly data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.crypto[cacheKey]));
  }

  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.crypto || 0);
  if (timeSinceLastRequest < 1500) {
    const waitTime = 1500 - timeSinceLastRequest;
    logger.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
    await sleep(waitTime);
  }

  try {
    dataCache.lastRequest.crypto = now;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=${vs_currency}&days=${days}`;
    logger.log(`Fetching CoinGecko OHLC data from: ${url}`);
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
    const plotlyData = transformCoinGeckoData(response.data);
    dataCache.crypto[cacheKey] = plotlyData;
    return plotlyData;
  } catch (error) {
    dataCache.failedRequests.crypto++;
    return generateMockPlotlyData(coinId, days);
  }
}

/**
 * Transform CoinGecko OHLC data to Plotly format
 * @param {Array} data - CoinGecko OHLC data [[timestamp, open, high, low, close], ...]
 * @returns {Object} - Plotly-compatible candlestick data
 */
export function transformCoinGeckoData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { x: [], open: [], high: [], low: [], close: [], type: 'candlestick' };
  }

  const plotlyData = {
    x: [], open: [], high: [], low: [], close: [], volume: [],
    type: 'candlestick',
    increasing: { line: { color: '#66bb6a' } },
    decreasing: { line: { color: '#ef5350' } }
  };

  data.forEach(([timestamp, open, high, low, close]) => {
    plotlyData.x.push(new Date(timestamp));
    plotlyData.open.push(open);
    plotlyData.high.push(high);
    plotlyData.low.push(low);
    plotlyData.close.push(close);
    // Generate mock volume since CoinGecko OHLC endpoint doesn't provide it
    plotlyData.volume.push(close * 1000 * (0.5 + Math.random()));
  });

  return plotlyData;
}

/**
 * Generate mock OHLC data in Plotly format when API fails
 * @param {string} coinId - CoinGecko ID for the coin
 * @param {number} days - Number of days to generate
 * @returns {Object} - Plotly-compatible candlestick data
 */
function generateMockPlotlyData(coinId, days) {
  const plotlyData = {
    x: [], open: [], high: [], low: [], close: [], volume: [],
    type: 'candlestick',
    increasing: { line: { color: '#66bb6a' } },
    decreasing: { line: { color: '#ef5350' } }
  };

  const seed = coinId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = seedRandom(seed);
  const basePrice = coinId === 'bitcoin' ? 20000 + random() * 15000 : coinId === 'ethereum' ? 1500 + random() * 1000 : 10 + random() * 90;

  let currentPrice = basePrice;
  const volatility = 0.03;
  const trend = random() > 0.5 ? 0.001 : -0.001;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const change = (random() * 2 - 1) * volatility + trend;
    const open = currentPrice;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + random() * 0.01);
    const low = Math.min(open, close) * (1 - random() * 0.01);
    
    // Generate mock volume - higher on bigger price moves
    const priceMove = Math.abs(close - open);
    const baseVolume = basePrice * 1000;
    const volumeVariance = random() * 0.7 + 0.3;
    const volume = baseVolume * (1 + priceMove / basePrice * 10) * volumeVariance;

    plotlyData.x.push(new Date(date));
    plotlyData.open.push(open);
    plotlyData.high.push(high);
    plotlyData.low.push(low);
    plotlyData.close.push(close);
    plotlyData.volume.push(volume);
    
    currentPrice = close;
  }

  return plotlyData;
}
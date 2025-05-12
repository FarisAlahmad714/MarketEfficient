//lib/data-service.js
import axios from 'axios';

// Simple cache to reduce API calls with timeouts
const dataCache = {
  crypto: {},
  stock: {},
  failedRequests: { crypto: 0, stock: 0 },
  lastRequest: { crypto: 0, stock: 0 }
};

// Reset cache after 24 hours to ensure fresh data
setInterval(() => {
  console.log('Clearing data cache to ensure fresh data');
  dataCache.crypto = {};
  dataCache.stock = {};
  dataCache.failedRequests = { crypto: 0, stock: 0 };
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
 * Fetches historical OHLC data for crypto assets with retries
 * @param {string} apiId - CoinGecko API ID
 * @param {string} timeframe - Time interval (daily, weekly, etc.)
 * @param {number} days - Number of days of data to fetch
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchCryptoOHLCData(apiId, timeframe = 'daily', days = 30, startDate = null, seed = Date.now()) {
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.crypto || 0);
  if (timeSinceLastRequest < 1500) {
    const waitTime = 1500 - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
    await sleep(waitTime);
  }

  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${apiId}_${timeframe}_${days}_${randomParam}`;

  if (dataCache.crypto[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.crypto[cacheKey]));
  }

  let ohlcData = [];
  let usesMockData = true;

  try {
    if (dataCache.failedRequests.crypto < 3) {
      dataCache.lastRequest.crypto = now;
      const interval = timeframe === '4h' ? 'hourly' : 'daily';
      let daysParam = days;
      if (timeframe === 'weekly') daysParam = Math.min(days * 7, 300);
      if (timeframe === 'monthly') daysParam = Math.min(days * 30, 300);
      if (timeframe === '4h') daysParam = Math.min(90, days);

      const url = `https://api.coingecko.com/api/v3/coins/${apiId}/market_chart?vs_currency=usd&days=${daysParam}&interval=${interval}&timestamp=${now}`;
      console.log(`Fetching crypto data from: ${url}`);

      const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
      const { prices } = response.data;
      dataCache.failedRequests.crypto = 0;

      if (interval === 'hourly' || interval === 'daily') {
        for (let i = 0; i < prices.length; i++) {
          const [timestamp, closePrice] = prices[i];
          const date = new Date(timestamp);
          const priceVariation = closePrice * 0.01;
          const open = i > 0 ? prices[i - 1][1] : closePrice * 0.998;
          const high = closePrice + Math.random() * priceVariation;
          const low = closePrice - Math.random() * priceVariation;

          ohlcData.push({ date: date.toISOString(), open, high, low, close: closePrice });
        }
      }

      if (timeframe === 'weekly' || timeframe === 'monthly') {
        const periodData = {};
        const periodLength = timeframe === 'weekly' ? 7 : 30;

        for (const [timestamp, price] of prices) {
          const date = new Date(timestamp);
          const periodStart = timeframe === 'weekly'
            ? new Date(date.setDate(date.getDate() - date.getDay())).setHours(0, 0, 0, 0)
            : new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          const periodKey = new Date(periodStart).toISOString();

          if (!periodData[periodKey]) {
            periodData[periodKey] = { date: periodStart, open: price, high: price, low: price, close: price };
          } else {
            periodData[periodKey].high = Math.max(periodData[periodKey].high, price);
            periodData[periodKey].low = Math.min(periodData[periodKey].low, price);
            periodData[periodKey].close = price;
          }
        }

        ohlcData = Object.values(periodData).map(({ date, open, high, low, close }) => ({
          date: new Date(date).toISOString(), open, high, low, close
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      usesMockData = false;
      console.log(`Successfully fetched real data for ${apiId}`);
    } else {
      console.log(`Skipping API call for ${apiId} due to previous failures`);
    }
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
      console.warn(`Rate limited by CoinGecko. Retry after ${retryAfter} seconds`);
      dataCache.failedRequests.crypto++;
      if (dataCache.failedRequests.crypto <= 1) {
        await sleep(retryAfter * 1000);
      }
    } else {
      console.error(`Error fetching OHLC data for ${apiId}:`, error.message);
      dataCache.failedRequests.crypto++;
    }
  }

  if (usesMockData) {
    console.log(`Using mock data for ${apiId} with seed ${seed}`);
    const basePrice = apiId === 'bitcoin' ? 60000 : apiId === 'ethereum' ? 3000 : apiId === 'solana' ? 100 : 500;
    ohlcData = generateMockOHLCData(basePrice, days, timeframe, startDate, seed);
  }

  if (!startDate) dataCache.crypto[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
  return ohlcData;
}

/**
 * Fetches historical OHLC data for stock assets
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
  if (timeSinceLastRequest < 12000) {
    const waitTime = 12000 - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next Alpha Vantage API call`);
    await sleep(waitTime);
  }

  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${symbol}_${timeframe}_${candles}_${randomParam}`;

  if (dataCache.stock[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.stock[cacheKey]));
  }

  if (Math.random() > 0.1 || dataCache.failedRequests.stock >= 2) {
    console.log(`Using mock data for ${symbol} to avoid API rate limits`);
    const basePrice = symbol === 'NVDA' ? 800 : symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : 190;
    const mockData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
    if (!startDate) dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(mockData));
    return mockData;
  }

  try {
    dataCache.lastRequest.stock = now;
    const interval = timeframe === '4h' ? '60min' : timeframe === 'daily' ? 'daily' : timeframe === 'weekly' ? 'weekly' : 'monthly';
    const functionName = interval === '60min' ? 'TIME_SERIES_INTRADAY' : interval === 'daily' ? 'TIME_SERIES_DAILY' : interval === 'weekly' ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_MONTHLY';
    const ALPHA_VANTAGE_API_KEY = 'QRL7874F7OJAGJHY';
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}${interval === '60min' ? '&interval=60min' : ''}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;

    console.log(`Fetching stock data from: ${url}`);
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
    dataCache.failedRequests.stock = 0;

    const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey || !response.data[timeSeriesKey]) throw new Error('Invalid response from Alpha Vantage API');

    const timeSeries = response.data[timeSeriesKey];
    const ohlcData = Object.entries(timeSeries).map(([date, dataPoint]) => ({
      date: new Date(date).toISOString(),
      open: parseFloat(dataPoint['1. open']),
      high: parseFloat(dataPoint['2. high']),
      low: parseFloat(dataPoint['3. low']),
      close: parseFloat(dataPoint['4. close'])
    })).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-candles);

    if (!startDate) dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
    console.log(`Successfully fetched real stock data for ${symbol}`);
    return ohlcData;
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    dataCache.failedRequests.stock++;

    console.log(`Using mock data for ${symbol} as fallback`);
    const basePrice = symbol === 'NVDA' ? 800 : symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : 190;
    const mockData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
    if (!startDate) dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(mockData));
    return mockData;
  }
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
    } else {
      ohlcData = generateMockOHLCData(100, candles, timeframe, startDate, seed);
    }

    return ohlcData.slice(-candles);
  } catch (error) {
    console.error(`Error fetching OHLC data for ${asset.symbol}:`, error.message);
    const basePrice = asset.type === 'crypto'
      ? (asset.symbol === 'btc' ? 60000 : asset.symbol === 'eth' ? 3000 : asset.symbol === 'sol' ? 100 : 500)
      : (asset.symbol === 'nvda' ? 800 : asset.symbol === 'aapl' ? 175 : asset.symbol === 'tsla' ? 250 : 100);
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

  const timeIncrement = timeframe === '4h' ? 4 * 60 * 60 * 1000 : timeframe === 'daily' ? 24 * 60 * 60 * 1000 : timeframe === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  let trendLength = Math.floor(random() * 5) + 3;
  let trendDirection = random() > 0.5 ? 1 : -1;
  let trendCounter = 0;
  let trendStrength = 0.6 + random() * 0.8;

  for (let i = 0; i < count; i++) {
    const date = new Date((startDate || now).getTime() - (count - 1 - i) * timeIncrement);
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

    data.push({ date: date.toISOString(), open, high, low, close });
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
    console.log(`Using cached Plotly data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.crypto[cacheKey]));
  }

  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.crypto || 0);
  if (timeSinceLastRequest < 1500) {
    const waitTime = 1500 - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
    await sleep(waitTime);
  }

  try {
    dataCache.lastRequest.crypto = now;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=${vs_currency}&days=${days}`;
    console.log(`Fetching CoinGecko OHLC data from: ${url}`);
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
    const plotlyData = transformCoinGeckoData(response.data);
    dataCache.crypto[cacheKey] = plotlyData;
    return plotlyData;
  } catch (error) {
    console.error(`Error fetching CoinGecko OHLC data: ${error.message}`);
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
    console.warn('Invalid or empty CoinGecko data');
    return { x: [], open: [], high: [], low: [], close: [], type: 'candlestick' };
  }

  const plotlyData = {
    x: [], open: [], high: [], low: [], close: [],
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
    x: [], open: [], high: [], low: [], close: [],
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

    plotlyData.x.push(new Date(date));
    plotlyData.open.push(open);
    plotlyData.high.push(high);
    plotlyData.low.push(low);
    plotlyData.close.push(close);
    currentPrice = close;
  }

  return plotlyData;
}
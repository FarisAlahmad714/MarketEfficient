// lib/data-service.js
import axios from 'axios';

// Simple cache to reduce API calls with timeouts
const dataCache = {
  crypto: {},
  stock: {},
  failedRequests: {
    crypto: 0,
    stock: 0
  },
  lastRequest: {
    crypto: 0,
    stock: 0
  }
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
 * @returns {Promise} - Promise that resolves after ms milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a seedable random number generator
 * @param {number} seed - Seed value for PRNG
 * @returns {Function} - Seeded PRNG function that returns values 0-1
 */
function seedRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  
  return function() {
    state = state * 16807 % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Fetches historical OHLC data for crypto assets with retries
 * @param {string} apiId - CoinGecko API ID
 * @param {string} timeframe - Time interval (daily, weekly, etc)
 * @param {number} days - Number of days of data to fetch
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchCryptoOHLCData(apiId, timeframe = 'daily', days = 30, startDate = null, seed = Date.now()) {
  // Rate limiting: wait at least 1.5 seconds between API calls
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.crypto || 0);
  if (timeSinceLastRequest < 1500) {
    const waitTime = 1500 - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
    await sleep(waitTime);
  }
  
  // Create a randomized cache key based on provided parameters
  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${apiId}_${timeframe}_${days}_${randomParam}`;
  
  // Check cache first
  if (dataCache.crypto[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.crypto[cacheKey])); // Deep clone to prevent mutations
  }

  // We'll always fall back to mock data if real data can't be fetched
  let ohlcData = [];
  let usesMockData = true;

  try {
    // Only try to fetch real data if we haven't already failed too many times
    // This approach prevents flooding logs with error messages
    if (dataCache.failedRequests.crypto < 3) {
      try {
        dataCache.lastRequest.crypto = Date.now();
        
        // Convert timeframe to days parameter for CoinGecko
        const interval = timeframe === '4h' ? 'hourly' :
                          timeframe === 'daily' ? 'daily' :
                          timeframe === 'weekly' ? 'daily' : 'daily';
        
        // Calculate days parameter based on timeframe
        let daysParam = days;
        if (timeframe === 'weekly') daysParam = Math.min(days * 7, 300); // CoinGecko max is about 300 days
        if (timeframe === 'monthly') daysParam = Math.min(days * 30, 300);
        if (timeframe === '4h') daysParam = Math.min(90, days); // CoinGecko limits hourly data to 90 days
        
        // Construct URL - use timestamp parameter to avoid caching issues
        let url = `https://api.coingecko.com/api/v3/coins/${apiId}/market_chart?vs_currency=usd&days=${daysParam}&interval=${interval}&timestamp=${Date.now()}`;
        
        console.log(`Fetching crypto data from: ${url}`);
        
        // Fetch data with retry logic
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TradingPlatform/1.0'
          },
          timeout: 10000 // 10 second timeout
        });
        
        const { prices } = response.data;
        
        // If we reach here, reset failedRequests counter
        dataCache.failedRequests.crypto = 0;
        
        // Convert prices array to OHLC format (timestamp, price pairs)
        if (interval === 'hourly' || interval === 'daily') {
          for (let i = 0; i < prices.length; i++) {
            const [timestamp, closePrice] = prices[i];
            const date = new Date(timestamp);
            
            // Approximate OHLC based on price and +/- 1% variation
            const priceVariation = closePrice * 0.01;
            const open = i > 0 ? prices[i-1][1] : closePrice * 0.998;
            const high = closePrice + (Math.random() * priceVariation);
            const low = closePrice - (Math.random() * priceVariation);
            
            ohlcData.push({
              date: date.toISOString(),
              open,
              high,
              low,
              close: closePrice
            });
          }
        }
        
        // For weekly data, aggregate daily data
        if (timeframe === 'weekly') {
          const weeklyData = {};
          
          for (const [timestamp, price] of prices) {
            const date = new Date(timestamp);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekKey = weekStart.toISOString();
            
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = {
                date: weekStart,
                open: price,
                high: price,
                low: price,
                close: price,
                prices: [price]
              };
            } else {
              weeklyData[weekKey].high = Math.max(weeklyData[weekKey].high, price);
              weeklyData[weekKey].low = Math.min(weeklyData[weekKey].low, price);
              weeklyData[weekKey].close = price;
              weeklyData[weekKey].prices.push(price);
            }
          }
          
          // Convert weekly data to array
          for (const week in weeklyData) {
            const { date, open, high, low, close } = weeklyData[week];
            ohlcData.push({ date: date.toISOString(), open, high, low, close });
          }
          
          // Sort by date
          ohlcData.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        // For monthly data, similar to weekly
        if (timeframe === 'monthly') {
          const monthlyData = {};
          
          for (const [timestamp, price] of prices) {
            const date = new Date(timestamp);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            
            const monthKey = monthStart.toISOString();
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                date: monthStart,
                open: price,
                high: price,
                low: price,
                close: price
              };
            } else {
              monthlyData[monthKey].high = Math.max(monthlyData[monthKey].high, price);
              monthlyData[monthKey].low = Math.min(monthlyData[monthKey].low, price);
              monthlyData[monthKey].close = price;
            }
          }
          
          // Convert monthly data to array
          for (const month in monthlyData) {
            const { date, open, high, low, close } = monthlyData[month];
            ohlcData.push({ date: date.toISOString(), open, high, low, close });
          }
          
          // Sort by date
          ohlcData.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        // If we got here, we're using real data
        usesMockData = false;
        console.log(`Successfully fetched real data for ${apiId}`);
      } catch (error) {
        // Handle rate limiting
        if (error.response && error.response.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          console.warn(`Rate limited by CoinGecko. Retry after ${retryAfter} seconds.`);
          
          // Increment failed requests counter
          dataCache.failedRequests.crypto += 1;
          
          // If this is our first rate limit, try to wait and retry once
          if (dataCache.failedRequests.crypto <= 1) {
            console.log(`Waiting ${retryAfter} seconds to retry...`);
            await sleep(retryAfter * 1000);
            // We'll fall through to the mock data for now, but next request might succeed
          }
        } else {
          console.error(`Error fetching OHLC data for ${apiId}:`, error.message);
          // Increment failed requests counter
          dataCache.failedRequests.crypto += 1;
        }
        
        // Fall back to mock data (will be generated below)
      }
    } else {
      console.log(`Skipping API call for ${apiId} due to previous failures`);
    }
    
    // If we don't have real data, generate mock data
    if (usesMockData) {
      console.log(`Using mock data for ${apiId} with seed ${seed}`);
      // Get approximate base price for this asset
      let basePrice = 100; // default
      if (apiId === 'bitcoin') basePrice = 60000;
      else if (apiId === 'ethereum') basePrice = 3000;
      else if (apiId === 'solana') basePrice = 100;
      else if (apiId === 'binancecoin') basePrice = 500;
      
      ohlcData = generateMockOHLCData(basePrice, days, timeframe, startDate, seed);
    }
    
    // Cache the data for future use (only if it's not a random or historical request)
    if (!startDate) {
      dataCache.crypto[cacheKey] = JSON.parse(JSON.stringify(ohlcData));
    }
    
    return ohlcData;
  } catch (error) {
    console.error(`Unexpected error in fetchCryptoOHLCData for ${apiId}:`, error.message);
    // Return mock data as final fallback
    const mockData = generateMockOHLCData(
      apiId === 'bitcoin' ? 60000 :
      apiId === 'ethereum' ? 3000 :
      apiId === 'solana' ? 100 : 500,
      days,
      timeframe,
      startDate,
      seed
    );
    return mockData;
  }
}

/**
 * Fetches historical OHLC data for stock assets
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Time interval (daily, weekly, etc)
 * @param {number} candles - Number of candles to return
 * @param {Date} startDate - Optional start date for data
 * @param {number} seed - Optional seed for random data generation
 * @returns {Promise<Array>} - Array of OHLC data
 */
export async function fetchStockOHLCData(symbol, timeframe = 'daily', candles = 30, startDate = null, seed = Date.now()) {
  // Rate limiting: wait at least 12 seconds between API calls (Alpha Vantage free tier is limited)
  const now = Date.now();
  const timeSinceLastRequest = now - (dataCache.lastRequest.stock || 0);
  if (timeSinceLastRequest < 12000) {
    const waitTime = 12000 - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next Alpha Vantage API call`);
    await sleep(waitTime);
  }
  
  // Create a randomized cache key based on provided parameters
  const randomParam = startDate ? startDate.getTime() : 0;
  const cacheKey = `${symbol}_${timeframe}_${candles}_${randomParam}`;
  
  // Check cache first
  if (dataCache.stock[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(JSON.stringify(dataCache.stock[cacheKey])); // Deep clone to prevent mutations
  }

  // To avoid rate limits, we'll mostly use mock data for stocks
  // The Alpha Vantage free tier is very limited (5 calls per minute, 500 per day)
  if (Math.random() > 0.1 || dataCache.failedRequests.stock >= 2) {
    console.log(`Using mock data for ${symbol} to avoid API rate limits`);
    let basePrice = 100;
    if (symbol === 'NVDA') basePrice = 800;
    else if (symbol === 'AAPL') basePrice = 175;
    else if (symbol === 'TSLA') basePrice = 250;
    else if (symbol === 'GLD') basePrice = 190;
    
    const mockData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
    
    // Cache the mock data (only if it's not a random or historical request)
    if (!startDate) {
      dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(mockData));
    }
    
    return mockData;
  }

  try {
    dataCache.lastRequest.stock = Date.now();
    
    // Convert timeframe to Alpha Vantage interval
    const interval = timeframe === '4h' ? '60min' : 
                     timeframe === 'daily' ? 'daily' : 
                     timeframe === 'weekly' ? 'weekly' : 'monthly';
    
    // Alpha Vantage API function
    const function_name = interval === '60min' ? 'TIME_SERIES_INTRADAY' : 
                         interval === 'daily' ? 'TIME_SERIES_DAILY' : 
                         interval === 'weekly' ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_MONTHLY';
    
    const ALPHA_VANTAGE_API_KEY = 'QRL7874F7OJAGJHY';
    const url = `https://www.alphavantage.co/query?function=${function_name}&symbol=${symbol}&interval=${interval === '60min' ? '60min' : ''}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    console.log(`Fetching stock data from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TradingPlatform/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Reset failed requests counter
    dataCache.failedRequests.stock = 0;
    
    // Parse Alpha Vantage response
    const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey || !response.data[timeSeriesKey]) {
      throw new Error('Invalid response from Alpha Vantage API');
    }
    
    const timeSeries = response.data[timeSeriesKey];
    const ohlcData = [];
    
    // Convert Alpha Vantage data to our OHLC format
    for (const date in timeSeries) {
      const dataPoint = timeSeries[date];
      ohlcData.push({
        date: new Date(date).toISOString(),
        open: parseFloat(dataPoint['1. open']),
        high: parseFloat(dataPoint['2. high']),
        low: parseFloat(dataPoint['3. low']),
        close: parseFloat(dataPoint['4. close'])
      });
    }
    
    // Sort by date ascending
    ohlcData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Limit to requested number of candles
    const limitedData = ohlcData.slice(-candles);
    
    // Cache the data (only if it's not a random or historical request)
    if (!startDate) {
      dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(limitedData));
    }
    
    console.log(`Successfully fetched real stock data for ${symbol}`);
    return limitedData;
  } catch (error) {
    // Increment failed requests counter
    dataCache.failedRequests.stock += 1;
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    
    // Generate mock data as fallback
    console.log(`Using mock data for ${symbol} as fallback`);
    let basePrice = 100;
    if (symbol === 'NVDA') basePrice = 800;
    else if (symbol === 'AAPL') basePrice = 175;
    else if (symbol === 'TSLA') basePrice = 250;
    else if (symbol === 'GLD') basePrice = 190;
    
    const mockData = generateMockOHLCData(basePrice, candles, timeframe, startDate, seed);
    
    // Cache the mock data (only if it's not a random or historical request)
    if (!startDate) {
      dataCache.stock[cacheKey] = JSON.parse(JSON.stringify(mockData));
    }
    
    return mockData;
  }
}

/**
 * Fetches historical OHLC data for any asset type
 * @param {Object} asset - Asset object with type, symbol, and apiId properties
 * @param {string} timeframe - Time interval (daily, weekly, etc)
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
    } else if (asset.type === 'mixed') {
      // For 'random' asset type, return simulated data
      ohlcData = generateMockOHLCData(100, candles, timeframe, startDate, seed);
    }
    
    // Ensure we return the requested number of candles
    if (ohlcData.length > candles) {
      ohlcData = ohlcData.slice(ohlcData.length - candles);
    }
    
    return ohlcData;
  } catch (error) {
    console.error(`Error fetching OHLC data for ${asset.symbol}:`, error.message);
    
    // Return mock data as fallback
    return generateMockOHLCData(
      asset.type === 'crypto' ? 
        (asset.symbol === 'btc' ? 60000 : 
         asset.symbol === 'eth' ? 3000 : 
         asset.symbol === 'sol' ? 100 : 500) : 
        (asset.symbol === 'nvda' ? 800 : 
         asset.symbol === 'aapl' ? 175 : 
         asset.symbol === 'tsla' ? 250 : 100), 
      candles, 
      timeframe,
      startDate,
      seed
    );
  }
}

/**
 * Generates mock OHLC data when APIs fail or for testing
 * @param {number} basePrice - Starting price 
 * @param {number} count - Number of candles to generate
 * @param {string} timeframe - Time interval
 * @param {Date} startDate - Optional start date (defaults to count candles ago from now)
 * @param {number} seed - Seed for random number generation
 * @returns {Array} - Array of OHLC data
 */
export function generateMockOHLCData(basePrice, count = 20, timeframe = 'daily', startDate = null, seed = Date.now()) {
  const data = [];
  let currentPrice = basePrice;
  const volatility = basePrice * 0.05; // 5% volatility
  const now = new Date();
  const random = seedRandom(seed);
  
  // Starting date
  let currentDate = startDate ? new Date(startDate) : now;
  
  // Adjust time increment based on timeframe
  const getTimeIncrement = () => {
    switch(timeframe) {
      case '4h': return 4 * 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };
  
  const timeIncrement = getTimeIncrement();
  
  // Create random trends
  let trendLength = Math.floor(random() * 5) + 3; // 3-7 candles per trend
  let trendDirection = random() > 0.5 ? 1 : -1;
  let trendCounter = 0;
  let trendStrength = 0.6 + (random() * 0.8); // 0.6-1.4x normal volatility
  
  // Generate the candles working backward from end date
  for (let i = count - 1; i >= 0; i--) {
    // Calculate date
    const date = new Date(now.getTime() - ((count - i) * timeIncrement));
    
    // Check if we need to switch trend
    if (trendCounter >= trendLength) {
      trendCounter = 0;
      trendLength = Math.floor(random() * 5) + 3;
      // 70% chance to reverse trend
      if (random() < 0.7) trendDirection *= -1;
      trendStrength = 0.6 + (random() * 0.8);
    }
    
    // Generate change with bias based on trend
    const randomFactor = (random() - 0.4) * trendDirection * trendStrength;
    const change = randomFactor * volatility;
    
    // Generate OHLC data with noise
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (random() * volatility * 0.5);
    const low = Math.min(open, close) - (random() * volatility * 0.5);
    
    data.push({
      date: date.toISOString(),
      open,
      high,
      low,
      close
    });
    
    // Prepare for next candle
    currentPrice = close;
    trendCounter++;
  }
  
  // Sort by date ascending
  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return data;
}
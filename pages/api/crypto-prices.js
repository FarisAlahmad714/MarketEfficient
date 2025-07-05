// pages/api/crypto-prices.js
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Cache to prevent hitting rate limits - MUCH LONGER for simple display
let priceCache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 300000 // 5 MINUTES cache for simple display
};

let lastApiCall = 0;
const MIN_API_INTERVAL = 2000; // 2 seconds between API calls

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still fresh (5 minute cache for simple display)
    if (priceCache.data && (now - priceCache.timestamp) < priceCache.CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: priceCache.data,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    // Rate limiting - wait if too soon since last call
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      const waitTime = MIN_API_INTERVAL - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastApiCall = Date.now();

    // Fetch crypto data from CoinGecko (all at once to reduce calls)
    let cryptoData = [];
    try {
      const cryptoResponse = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true`,
        { 
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        }
      );
      
      const cryptoMap = {
        bitcoin: 'BTC',
        ethereum: 'ETH', 
        solana: 'SOL',
        binancecoin: 'BNB'
      };
      
      for (const [coinId, symbol] of Object.entries(cryptoMap)) {
        const data = cryptoResponse.data[coinId];
        if (data && data.usd) {
          cryptoData.push({
            symbol,
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            type: 'crypto',
            realTime: true,
            source: 'coingecko'
          });
        }
      }
    } catch (error) {
      // Silent fail for production
    }

    // Fetch stock data from TwelveData (BATCH ALL STOCKS IN 1 CALL)
    let stockData = [];
    const stocks = ['AAPL', 'GLD', 'TSLA', 'NVDA'];
    const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
    
    try {
      // Use TwelveData batch endpoint - fetch all stocks in 1 API call
      const stockSymbols = stocks.join(',');
      const url = `https://api.twelvedata.com/quote?symbol=${stockSymbols}&apikey=${TWELVE_DATA_API_KEY}`;
      
      const stockResponse = await axios.get(url, { 
        timeout: 15000,
        headers: { 'Accept': 'application/json' }
      });
      
      // Handle batch response
      const responseData = stockResponse.data;
      
      // Check if rate limited
      if (responseData.status === 'error') {
        // Rate limited - skip stocks for this request, use cache next time
      } else if (responseData && typeof responseData === 'object') {
        for (const symbol of stocks) {
          const data = responseData[symbol];
          
          if (data && data.close && data.status !== 'error') {
            const currentPrice = parseFloat(data.close);
            const previousClose = parseFloat(data.previous_close || currentPrice);
            const change24h = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
            
            stockData.push({
              symbol,
              price: currentPrice,
              change24h: change24h,
              type: 'stock',
              realTime: true,
              source: 'twelvedata'
            });
          }
        }
      }
    } catch (error) {
      // Silent fail for production
    }

    // Combine all data
    const allPrices = [...cryptoData, ...stockData];
    
    // Cache the results for 5 minutes
    priceCache = {
      data: allPrices,
      timestamp: Date.now(),
      CACHE_DURATION: 300000
    };
    
    res.status(200).json({
      success: true,
      data: allPrices,
      timestamp: new Date().toISOString(),
      realTimeDataCount: allPrices.length,
      totalAssets: 8,
      cryptoCount: cryptoData.length,
      stockCount: stockData.length
    });

  } catch (error) {
    
    // Return cached data if available, even if old
    if (priceCache.data) {
      return res.status(200).json({
        success: true,
        data: priceCache.data,
        timestamp: new Date().toISOString(),
        stale: true
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time price data',
      timestamp: new Date().toISOString()
    });
  }
}
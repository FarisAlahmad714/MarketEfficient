// lib/data-service.js
import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_API_KEY = 'YOUR_API_KEY'; // Replace with your key

export async function fetchCryptoData(symbol, date) {
  try {
    // Convert symbol to CoinGecko ID
    const id = getCoinGeckoId(symbol);

    // Get historical data
    const to = new Date(date);
    const from = new Date(date);
    from.setDate(from.getDate() - 30); // Get 30 days of data

    const response = await axios.get(`${COINGECKO_API_URL}/coins/${id}/market_chart/range`, {
      params: {
        vs_currency: 'usd',
        from: Math.floor(from.getTime() / 1000),
        to: Math.floor(to.getTime() / 1000)
      }
    });

    // Process and format data
    return processCoingeckoData(response.data, date);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw error;
  }
}

// Helper functions
function getCoinGeckoId(symbol) {
  const ids = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    // Add more mappings as needed
  };

  return ids[symbol.toLowerCase()] || symbol.toLowerCase();
}

function processCoingeckoData(data, targetDate) {
  // Process the data and return in the format needed for charts
  // ...
}
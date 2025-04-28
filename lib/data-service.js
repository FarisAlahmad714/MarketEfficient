// lib/data-service.js
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'QRL7874F7OJAGJHY';

export async function fetchCryptoData(apiId, date, timeframe = 'daily') {
  const url = `https://api.coingecko.com/api/v3/coins/${apiId}/history?date=${date}${COINGECKO_API_KEY ? `&x_cg_pro_api_key=${COINGECKO_API_KEY}` : ''}`;
  try {
    const response = await axios.get(url);
    const data = response.data.market_data;
    // Mock historical data for simplicity; adjust based on actual API response
    return [
      { date: `${date}T00:00:00Z`, open: data.current_price.usd * 0.98, high: data.current_price.usd * 1.01, low: data.current_price.usd * 0.97, close: data.current_price.usd },
      { date: `${date}T23:59:59Z`, open: data.current_price.usd, high: data.current_price.usd * 1.02, low: data.current_price.usd * 0.99, close: data.current_price.usd * 1.01 },
    ];
  } catch (error) {
    console.error(`Error fetching data for ${apiId}:`, error);
    throw error;
  }
}
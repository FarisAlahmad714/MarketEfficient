// pages/api/charting-exam/fetch-chart.js
import { fetchChartData } from '../../../lib/data-service';
import fs from 'fs';
import path from 'path';

// Fallback to sample data from JSON file
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

export default async function handler(req, res) {
  try {
    // Get chart count from session if available
    const chartCount = req.session?.chartCount || 1;
    
    // Try to fetch chart data with API first (with fallback enabled)
    let chartData;
    try {
      chartData = await fetchChartData({ useApi: true });
    } catch (error) {
      console.warn('API fetch failed, trying fallback:', error.message);
      // Try direct fallback if the data service fails
      chartData = getSampleChartData();
    }
    
    // Validate the chart data
    if (!chartData || !chartData.chart_data || chartData.chart_data.length < 20) {
      console.warn('Insufficient chart data from primary sources, using generated data');
      
      // Use utility function to generate random chart data as last resort
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 86400;
      const generatedData = [];
      
      let basePrice = 100;
      const volatility = 5;
      
      // Generate 100 days of candles
      for (let i = 0; i < 100; i++) {
        const time = now - (100 - i) * oneDay;
        const open = basePrice;
        const change = (Math.random() - 0.5) * volatility;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        generatedData.push({
          time,
          open,
          high,
          low,
          close
        });
        
        basePrice = close;
      }
      
      chartData = {
        chart_data: generatedData,
        symbol: 'GENERATED',
        timeframe: '1d',
        chart_count: chartCount
      };
    }
    
    // Ensure data is properly formatted
    const processedData = {
      ...chartData,
      chart_data: chartData.chart_data
        .filter(candle => (
          candle && 
          typeof candle.open === 'number' &&
          typeof candle.high === 'number' &&
          typeof candle.low === 'number' &&
          typeof candle.close === 'number'
        ))
        .map(candle => ({
          ...candle,
          // Ensure time is a valid number
          time: typeof candle.time === 'number' && !isNaN(candle.time) 
            ? candle.time 
            : Math.floor(Date.now() / 1000) - (Math.random() * 86400 * 30)
        }))
        .sort((a, b) => a.time - b.time) // Sort by time
    };
    
    // Return the chart data with metadata
    res.status(200).json({
      chart_data: processedData.chart_data,
      symbol: processedData.symbol || 'UNKNOWN',
      timeframe: processedData.timeframe || '1d',
      chart_count: chartCount
    });
  } catch (error) {
    console.error("Error in fetch-chart API:", error);
    res.status(500).json({
      error: "Failed to fetch chart data",
      message: error.message
    });
  }
}
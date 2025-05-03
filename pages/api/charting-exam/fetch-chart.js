import { promises as fs } from 'fs';
import path from 'path';

// Cache for chart data
let chartDataCache = null;

export default async function handler(req, res) {
  try {
    // If we have cached data, use it
    if (chartDataCache) {
      return res.status(200).json(chartDataCache);
    }
    
    // Otherwise, load sample data from file
    const dataDirectory = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDirectory, 'chart-data.json');
    
    let chartData;
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      chartData = JSON.parse(fileContents);
    } catch (error) {
      // If file doesn't exist, generate random data
      chartData = generateSampleChartData();
      
      // Ensure the directory exists
      try {
        await fs.mkdir(dataDirectory, { recursive: true });
      } catch (err) {
        console.error('Error creating data directory:', err);
      }
      
      // Save the generated data
      try {
        await fs.writeFile(filePath, JSON.stringify(chartData), 'utf8');
      } catch (err) {
        console.error('Error saving generated chart data:', err);
      }
    }
    
    // Cache the data
    chartDataCache = chartData;
    
    return res.status(200).json(chartData);
  } catch (error) {
    console.error('Error in fetch-chart API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch chart data',
      message: error.message 
    });
  }
}

// Generate sample chart data
function generateSampleChartData() {
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;
  const chartData = [];
  
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
    
    chartData.push({
      time,
      open,
      high,
      low,
      close
    });
    
    basePrice = close;
  }
  
  return {
    chart_data: chartData,
    symbol: 'SAMPLE',
    timeframe: '1d',
    chart_count: 1
  };
}
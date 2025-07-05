// Test script to analyze timeframe behavior
const axios = require('axios');

// Function to get interval minutes (from market-data.js)
function getIntervalMinutes(interval) {
  const intervals = {
    '1min': 1,
    '5min': 5,
    '15min': 15,
    '1h': 60,
    '4h': 240,
    '1day': 1440
  };
  return intervals[interval] || 60;
}

// Function to get optimal output size (from SandboxChart.js)
function getOptimalOutputSize(timeframe) {
  const sizeMap = {
    '1min': 500,   // ~8 hours
    '5min': 1000,  // ~3.5 days  
    '15min': 1500, // ~15 days
    '1h': 2000,    // ~83 days
    '4h': 3000,    // ~1 year
    '1day': 5000   // ~13 years
  };
  return sizeMap[timeframe] || 1000;
}

// Function to simulate chart data generation (from market-data.js)
function generateSimulatedChartData(symbol, interval, outputsize) {
  const data = [];
  const now = new Date();
  const intervalMinutes = getIntervalMinutes(interval);
  const currentPrice = 95000; // BTC price

  
  // Generate data points going backwards in time
  for (let i = outputsize - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
    
    data.push({
      time: Math.floor(timestamp.getTime() / 1000),
      timestamp: timestamp.toISOString(),
      intervalBack: i,
      intervalMinutes: intervalMinutes
    });
  }
  
  return data;
}

// Test all timeframes
function testTimeframes() {
  
  const timeframes = ['1min', '5min', '15min', '1h', '4h', '1day'];
  
  timeframes.forEach(tf => {
    const outputSize = getOptimalOutputSize(tf);
    const intervalMins = getIntervalMinutes(tf);
    const data = generateSimulatedChartData('BTC', tf, outputSize);
    
    // Calculate time span
    const totalMinutes = outputSize * intervalMins;
    const totalHours = totalMinutes / 60;
    const totalDays = totalHours / 24;
    
    
    // Check if this provides realistic historical data
    if (totalDays < 1) {
    } else if (totalDays < 7) {
    } else if (totalDays < 30) {
    } else {
    }
  });
  
  
  timeframes.forEach(tf => {
    const outputSize = getOptimalOutputSize(tf);
    const intervalMins = getIntervalMinutes(tf);
    const totalHours = (outputSize * intervalMins) / 60;
    const totalDays = totalHours / 24;
    
  });
  
}

testTimeframes();
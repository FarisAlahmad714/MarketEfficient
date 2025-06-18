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

  console.log(`\nGenerating ${outputsize} candles for ${interval}`);
  console.log(`Interval: ${interval} = ${intervalMinutes} minutes per candle`);
  
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
  console.log('=== TIMEFRAME ANALYSIS ===\n');
  
  const timeframes = ['1min', '5min', '15min', '1h', '4h', '1day'];
  
  timeframes.forEach(tf => {
    const outputSize = getOptimalOutputSize(tf);
    const intervalMins = getIntervalMinutes(tf);
    const data = generateSimulatedChartData('BTC', tf, outputSize);
    
    // Calculate time span
    const totalMinutes = outputSize * intervalMins;
    const totalHours = totalMinutes / 60;
    const totalDays = totalHours / 24;
    
    console.log(`\n${tf.toUpperCase()} TIMEFRAME:`);
    console.log(`  Output size: ${outputSize} candles`);
    console.log(`  Interval: ${intervalMins} minutes per candle`);
    console.log(`  Total time span: ${totalMinutes} minutes (${totalHours.toFixed(1)} hours, ${totalDays.toFixed(1)} days)`);
    console.log(`  Oldest data: ${data[0].timestamp}`);
    console.log(`  Latest data: ${data[data.length - 1].timestamp}`);
    
    // Check if this provides realistic historical data
    if (totalDays < 1) {
      console.log(`  ⚠️  WARNING: Only ${totalDays.toFixed(1)} days of data - very short timeframe!`);
    } else if (totalDays < 7) {
      console.log(`  ⚠️  CAUTION: Only ${totalDays.toFixed(1)} days of data - might be too short`);
    } else if (totalDays < 30) {
      console.log(`  ✓ GOOD: ${totalDays.toFixed(1)} days of data - reasonable timeframe`);
    } else {
      console.log(`  ✅ EXCELLENT: ${totalDays.toFixed(1)} days of data - plenty for analysis`);
    }
  });
  
  console.log('\n=== COMPARISON TABLE ===');
  console.log('Timeframe | Candles | Minutes/Candle | Total Hours | Total Days');
  console.log('----------|---------|----------------|-------------|----------');
  
  timeframes.forEach(tf => {
    const outputSize = getOptimalOutputSize(tf);
    const intervalMins = getIntervalMinutes(tf);
    const totalHours = (outputSize * intervalMins) / 60;
    const totalDays = totalHours / 24;
    
    console.log(`${tf.padEnd(9)} | ${outputSize.toString().padEnd(7)} | ${intervalMins.toString().padEnd(14)} | ${totalHours.toFixed(1).padEnd(11)} | ${totalDays.toFixed(1)}`);
  });
  
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1min: Good for intraday scalping (8.3 hours of data)');
  console.log('5min: Good for short-term trading (3.5 days of data)');
  console.log('15min: Good for swing trading (15.6 days of data)');
  console.log('1h: Good for medium-term analysis (83.3 days of data)');
  console.log('4h: Good for long-term trends (500 days / 1.4 years of data)');
  console.log('1day: Good for macro analysis (5000 days / 13.7 years of data)');
}

testTimeframes();
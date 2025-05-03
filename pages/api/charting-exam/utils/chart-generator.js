// Generate sample chart data for testing
export function generateSampleChartData() {
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
  
  // Add price trends to make the chart more realistic
  export function addTrendToChart(chartData, trendType) {
    const updatedData = [...chartData];
    
    if (trendType === 'uptrend') {
      // Add uptrend
      let trendFactor = 0;
      const trendStrength = 0.5; // 0.5% per day
      
      updatedData.forEach((candle, index) => {
        trendFactor = (trendStrength * index) / 100;
        const factor = 1 + trendFactor;
        
        updatedData[index] = {
          ...candle,
          open: candle.open * factor,
          high: candle.high * factor,
          low: candle.low * factor,
          close: candle.close * factor
        };
      });
    } else if (trendType === 'downtrend') {
      // Add downtrend
      let trendFactor = 0;
      const trendStrength = 0.5; // 0.5% per day
      
      updatedData.forEach((candle, index) => {
        trendFactor = (trendStrength * index) / 100;
        const factor = 1 - trendFactor;
        
        updatedData[index] = {
          ...candle,
          open: candle.open * factor,
          high: candle.high * factor,
          low: candle.low * factor,
          close: candle.close * factor
        };
      });
    } else if (trendType === 'sideways') {
      // Keep as is
    }
    
    return updatedData;
  }
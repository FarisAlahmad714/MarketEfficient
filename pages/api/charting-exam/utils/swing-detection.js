// Detect swing high and low points
export function detectSwingPoints(chartData, lookback = 5) {
    const swingPoints = { highs: [], lows: [] };
    
    // Need at least 2*lookback + 1 candles for valid swing analysis
    if (!chartData || chartData.length < 2 * lookback + 1) {
      return swingPoints;
    }
    
    // Calculate price range for significance threshold
    const priceRange = Math.max(...chartData.map(c => c.high)) - 
                      Math.min(...chartData.map(c => c.low));
    const minPriceDiff = priceRange * 0.01; // 1% of total range
    
    // Detect swing highs
    for (let i = lookback; i < chartData.length - lookback; i++) {
      const current = chartData[i];
      const before = chartData.slice(i - lookback, i).map(c => c.high);
      const after = chartData.slice(i + 1, i + 1 + lookback).map(c => c.high);
      
      // Check if current high is higher than all lookback candles before and after
      if (current.high > Math.max(...before) && current.high > Math.max(...after)) {
        // Calculate minimum price in the window to determine significance
        const windowLows = [...chartData.slice(i - lookback, i + 1 + lookback)].map(c => c.low);
        const lowestLow = Math.min(...windowLows);
        const priceDiff = current.high - lowestLow;
        
        // Only add significant swing highs
        if (priceDiff >= minPriceDiff) {
          swingPoints.highs.push({
            time: current.time,
            price: current.high
          });
        }
      }
    }
    
    // Detect swing lows
    for (let i = lookback; i < chartData.length - lookback; i++) {
      const current = chartData[i];
      const before = chartData.slice(i - lookback, i).map(c => c.low);
      const after = chartData.slice(i + 1, i + 1 + lookback).map(c => c.low);
      
      // Check if current low is lower than all lookback candles before and after
      if (current.low < Math.min(...before) && current.low < Math.min(...after)) {
        // Calculate maximum price in the window to determine significance
        const windowHighs = [...chartData.slice(i - lookback, i + 1 + lookback)].map(c => c.high);
        const highestHigh = Math.max(...windowHighs);
        const priceDiff = highestHigh - current.low;
        
        // Only add significant swing lows
        if (priceDiff >= minPriceDiff) {
          swingPoints.lows.push({
            time: current.time,
            price: current.low
          });
        }
      }
    }
    
    return swingPoints;
  }
  
  // Sort and filter swing points to get the most significant ones
  export function getSignificantSwingPoints(swingPoints, maxPoints = 5) {
    // Sort highs and lows by significance (price deviation)
    const sortedHighs = [...swingPoints.highs].sort((a, b) => b.price - a.price);
    const sortedLows = [...swingPoints.lows].sort((a, b) => a.price - b.price);
    
    // Take the most significant points
    const significantHighs = sortedHighs.slice(0, maxPoints);
    const significantLows = sortedLows.slice(0, maxPoints);
    
    // Sort back by time for better visualization
    significantHighs.sort((a, b) => a.time - b.time);
    significantLows.sort((a, b) => a.time - b.time);
    
    return {
      highs: significantHighs,
      lows: significantLows
    };
  }
/**
 * Enhanced Fibonacci detection utilities with improved accuracy
 * Compatible with existing implementation
 */

/**
 * Detect significant swing points in chart data
 * @param {Array} chartData - Array of OHLC candle data
 * @param {Object} options - Configuration options
 * @returns {Object} Object containing arrays of swing highs and lows
 */
export function detectSwingPoints(chartData, options = {}) {
  // Default options
  const config = {
    lookback: 6,                // INCREASED: from 5 to detect more swing points
    highField: 'high',          // Field name for high value
    lowField: 'low',            // Field name for low value
    timeField: 'time',          // Field name for timestamp
    minSignificance: 0.008,     // REDUCED: from 0.01 to detect more potential swing points
    ...options
  };
  
  // Validate input data
  if (!chartData || !Array.isArray(chartData) || chartData.length < 2 * config.lookback + 1) {
    return { highs: [], lows: [] };
  }
  
  // Normalize chart data to ensure consistent structure
  const normalizedData = chartData
    .filter(candle => candle && typeof candle.high === 'number' && typeof candle.low === 'number')
    .map((candle, index) => {
      // Handle different time formats - ensure we have a numeric timestamp
      let time;
      if (typeof candle[config.timeField] === 'number') {
        time = candle[config.timeField];
      } else if (candle.date) {
        try {
          time = Math.floor(new Date(candle.date).getTime() / 1000);
        } catch (e) {
          time = index; // Fallback to array index
        }
      } else {
        time = index; // Use array index as time
      }
      
      return {
        high: candle[config.highField],
        low: candle[config.lowField],
        time,
        originalIndex: index
      };
    });
  
  // Calculate price range for significance threshold
  const highValues = normalizedData.map(c => c.high);
  const lowValues = normalizedData.map(c => c.low);
  const maxPrice = Math.max(...highValues);
  const minPrice = Math.min(...lowValues);
  const priceRange = maxPrice - minPrice;
  const minPriceDiff = priceRange * config.minSignificance;
  
  // Arrays to store swing points
  const swingHighs = [];
  const swingLows = [];
  
  // NEW: Add lookahead window options for variable detection sensitivity
  const lookAheadOptions = [config.lookback, Math.floor(config.lookback * 0.6)];
  
  // Detect swing highs with multiple sensitivities
  for (const lookAhead of lookAheadOptions) {
    for (let i = config.lookback; i < normalizedData.length - lookAhead; i++) {
      const current = normalizedData[i];
      const lookbackCandles = normalizedData.slice(i - config.lookback, i);
      const lookforwardCandles = normalizedData.slice(i + 1, i + 1 + lookAhead);
      
      // Check if current high is higher than all lookback and lookforward candles
      const isSwingHigh = lookbackCandles.every(c => c.high < current.high) && 
                        lookforwardCandles.every(c => c.high < current.high);
      
      if (isSwingHigh) {
        // Calculate significance as percentage of total range
        const significance = (current.high - minPrice) / priceRange;
        
        // Check if this point is already in the array (avoid duplicates)
        const isDuplicate = swingHighs.some(point => 
          Math.abs(point.time - current.time) < 60 && 
          Math.abs(point.price - current.high) < minPriceDiff);
        
        if (!isDuplicate) {
          swingHighs.push({
            time: current.time,
            price: current.high,
            index: i,
            significance
          });
        }
      }
    }
  }
  
  // Detect swing lows with multiple sensitivities
  for (const lookAhead of lookAheadOptions) {
    for (let i = config.lookback; i < normalizedData.length - lookAhead; i++) {
      const current = normalizedData[i];
      const lookbackCandles = normalizedData.slice(i - config.lookback, i);
      const lookforwardCandles = normalizedData.slice(i + 1, i + 1 + lookAhead);
      
      // Check if current low is lower than all lookback and lookforward candles
      const isSwingLow = lookbackCandles.every(c => c.low > current.low) && 
                      lookforwardCandles.every(c => c.low > current.low);
      
      if (isSwingLow) {
        // Calculate significance as percentage of total range
        const significance = (maxPrice - current.low) / priceRange;
        
        // Check if this point is already in the array (avoid duplicates)
        const isDuplicate = swingLows.some(point => 
          Math.abs(point.time - current.time) < 60 && 
          Math.abs(point.price - current.low) < minPriceDiff);
        
        if (!isDuplicate) {
          swingLows.push({
            time: current.time,
            price: current.low,
            index: i,
            significance
          });
        }
      }
    }
  }
  
  // NEW: Add special swing point detection for chart extremes
  // Sometimes significant points are at the edges of the chart
  const firstFewCandles = normalizedData.slice(0, Math.min(config.lookback * 2, normalizedData.length / 5));
  const lastFewCandles = normalizedData.slice(Math.max(0, normalizedData.length - config.lookback * 2));
  
  // Check for significant lows/highs at chart start
  if (firstFewCandles.length > 0) {
    const lowestAtStart = firstFewCandles.reduce((lowest, current) => 
      current.low < lowest.low ? current : lowest, firstFewCandles[0]);
      
    const highestAtStart = firstFewCandles.reduce((highest, current) => 
      current.high > highest.high ? current : highest, firstFewCandles[0]);
    
    // Add if significant
    const lowestSignificance = (maxPrice - lowestAtStart.low) / priceRange;
    const highestSignificance = (highestAtStart.high - minPrice) / priceRange;
    
    if (lowestSignificance > config.minSignificance * 3) {
      swingLows.push({
        time: lowestAtStart.time,
        price: lowestAtStart.low,
        index: lowestAtStart.originalIndex,
        significance: lowestSignificance
      });
    }
    
    if (highestSignificance > config.minSignificance * 3) {
      swingHighs.push({
        time: highestAtStart.time,
        price: highestAtStart.high,
        index: highestAtStart.originalIndex,
        significance: highestSignificance
      });
    }
  }
  
  // Check for significant lows/highs at chart end
  if (lastFewCandles.length > 0) {
    const lowestAtEnd = lastFewCandles.reduce((lowest, current) => 
      current.low < lowest.low ? current : lowest, lastFewCandles[0]);
      
    const highestAtEnd = lastFewCandles.reduce((highest, current) => 
      current.high > highest.high ? current : highest, lastFewCandles[0]);
    
    // Add if significant
    const lowestSignificance = (maxPrice - lowestAtEnd.low) / priceRange;
    const highestSignificance = (highestAtEnd.high - minPrice) / priceRange;
    
    if (lowestSignificance > config.minSignificance * 3) {
      swingLows.push({
        time: lowestAtEnd.time,
        price: lowestAtEnd.low,
        index: lowestAtEnd.originalIndex,
        significance: lowestSignificance
      });
    }
    
    if (highestSignificance > config.minSignificance * 3) {
      swingHighs.push({
        time: highestAtEnd.time,
        price: highestAtEnd.high,
        index: highestAtEnd.originalIndex,
        significance: highestSignificance
      });
    }
  }
  
  // Sort by significance for better selection
  swingHighs.sort((a, b) => b.significance - a.significance);
  swingLows.sort((a, b) => b.significance - a.significance);
  
  return { highs: swingHighs, lows: swingLows };
}

/**
 * Get the optimal Fibonacci retracement for uptrend or downtrend
 * @param {Array} chartData - OHLC chart data
 * @param {String} direction - 'uptrend' or 'downtrend'
 * @returns {Object} Fibonacci retracement points
 */
export function getFibonacciRetracement(chartData, direction = 'uptrend') {
  // First detect swing points with more lenient settings for drawing uptrends
  const swingPoints = detectSwingPoints(chartData, { 
    lookback: 6 // INCREASED: from 5/7 to 6 for better detection
  });
  
  if (swingPoints.highs.length === 0 || swingPoints.lows.length === 0) {
    return {
      start: { time: 0, price: 0 },
      end: { time: 0, price: 0 },
      direction: direction
    };
  }
  
  // Sort points by time for chronological analysis
  const sortedHighs = [...swingPoints.highs].sort((a, b) => a.time - b.time);
  const sortedLows = [...swingPoints.lows].sort((a, b) => a.time - b.time);
  
  if (direction === 'uptrend') {
    // For uptrend, find most significant high followed by a low
    // (Drawing from high to low is an uptrend in our component)
    let bestHigh = null;
    let bestLow = null;
    let bestMovement = 0;
    
    // INCREASED: Consider more top highs for better detection
    const topHighs = sortedHighs.slice(0, 10);  // Increased from 5 to 10
    
    for (const high of topHighs) {
      // Find all lows that come after this high
      const subsequentLows = sortedLows.filter(l => l.time > high.time);
      
      if (subsequentLows.length > 0) {
        // Find lowest subsequent low with consideration for significance
        let bestSubLow = null;
        let bestSubMovement = 0;
        
        for (const low of subsequentLows) {
          const movement = high.price - low.price;
          const movementSignificance = movement * (high.significance + low.significance);
          
          // NEW: Additional criteria - prefer lows that are after a certain time threshold
          // This avoids picking lows that are too close to the high in time
          const timeGap = low.time - high.time;
          const timeMultiplier = timeGap > 86400 ? 1.2 : 1; // Prefer gaps of more than a day
          
          if (movementSignificance * timeMultiplier > bestSubMovement) {
            bestSubMovement = movementSignificance * timeMultiplier;
            bestSubLow = low;
          }
        }
        
        if (bestSubLow && bestSubMovement > bestMovement) {
          bestMovement = bestSubMovement;
          bestHigh = high;
          bestLow = bestSubLow;
        }
      }
    }
    
    if (bestHigh && bestLow) {
      return {
        start: bestHigh,
        end: bestLow,
        direction: 'uptrend'
      };
    }
  } else {
    // For downtrend, find most significant low followed by a high
    // (Drawing from low to high is a downtrend in our component)
    let bestLow = null;
    let bestHigh = null;
    let bestMovement = 0;
    
    // INCREASED: Consider more top lows for better detection
    const topLows = sortedLows.slice(0, 10);  // Increased from 5 to 10
    
    for (const low of topLows) {
      // Find all highs that come after this low
      const subsequentHighs = sortedHighs.filter(h => h.time > low.time);
      
      if (subsequentHighs.length > 0) {
        // Find highest subsequent high with consideration for significance
        let bestSubHigh = null;
        let bestSubMovement = 0;
        
        for (const high of subsequentHighs) {
          const movement = high.price - low.price;
          const movementSignificance = movement * (low.significance + high.significance);
          
          // NEW: Additional criteria - prefer highs that are after a certain time threshold
          const timeGap = high.time - low.time;
          const timeMultiplier = timeGap > 86400 ? 1.2 : 1; // Prefer gaps of more than a day
          
          if (movementSignificance * timeMultiplier > bestSubMovement) {
            bestSubMovement = movementSignificance * timeMultiplier;
            bestSubHigh = high;
          }
        }
        
        if (bestSubHigh && bestSubMovement > bestMovement) {
          bestMovement = bestSubMovement;
          bestLow = low;
          bestHigh = bestSubHigh;
        }
      }
    }
    
    if (bestLow && bestHigh) {
      return {
        start: bestLow,
        end: bestHigh,
        direction: 'downtrend'
      };
    }
  }
  
  // Fallback to find any meaningful retracement if the above methods fail
  if (direction === 'uptrend') {
    // Find a high followed by lower low
    for (let i = 0; i < sortedHighs.length; i++) {
      const high = sortedHighs[i];
      const lowsAfter = sortedLows.filter(l => l.time > high.time);
      
      if (lowsAfter.length > 0) {
        const lowestAfter = lowsAfter.reduce((lowest, current) => 
          current.price < lowest.price ? current : lowest, lowsAfter[0]);
        
        return {
          start: high,
          end: lowestAfter,
          direction: 'uptrend'
        };
      }
    }
  } else {
    // Find a low followed by a higher high
    for (let i = 0; i < sortedLows.length; i++) {
      const low = sortedLows[i];
      const highsAfter = sortedHighs.filter(h => h.time > low.time);
      
      if (highsAfter.length > 0) {
        const highestAfter = highsAfter.reduce((highest, current) => 
          current.price > highest.price ? current : highest, highsAfter[0]);
        
        return {
          start: low,
          end: highestAfter,
          direction: 'downtrend'
        };
      }
    }
  }
  
  // If no suitable points found, return default
  return {
    start: { time: 0, price: 0 },
    end: { time: 0, price: 0 },
    direction: direction
  };
}

/**
 * Calculate all Fibonacci levels for a given start and end point
 * @param {Object} start - Start point { time, price }
 * @param {Object} end - End point { time, price }
 * @returns {Object} Calculated Fibonacci levels
 */
export function calculateFibonacciLevels(start, end) {
  if (!start || !end || !start.price || !end.price) return { levels: [] };
  
  // Level 1 is at start point, level 0 is at end point
  const priceDiff = start.price - end.price;
  
  // Determine direction based on price movement
  const direction = start.price > end.price ? 'uptrend' : 'downtrend';
  
  // Standard Fibonacci levels
  const fibLevels = [
    { level: 0, label: "0" },
    { level: 0.236, label: "0.236" },
    { level: 0.382, label: "0.382" },
    { level: 0.5, label: "0.5" },
    { level: 0.618, label: "0.618" },
    { level: 0.705, label: "0.705" }, // Special level often used in crypto
    { level: 0.786, label: "0.786" },
    { level: 1, label: "1" },
    { level: 1.272, label: "1.272" },
    { level: 1.618, label: "1.618" }
  ];
  
  // Calculate price for each level with end as the base
  const levels = fibLevels.map(fib => ({
    ...fib,
    price: end.price + (priceDiff * fib.level)
  }));
  
  return {
    direction,
    start,
    end,
    levels
  };
}
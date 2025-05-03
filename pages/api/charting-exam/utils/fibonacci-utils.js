/**
 * Enhanced Fibonacci detection utilities
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
      lookback: 5,                // Number of candles to look back/forward
      highField: 'high',          // Field name for high value
      lowField: 'low',            // Field name for low value
      timeField: 'time',          // Field name for timestamp
      minSignificance: 0.01,      // Minimum price difference as percentage of range
      ...options
    };
    
    // Validate input data
    if (!chartData || !Array.isArray(chartData) || chartData.length < 2 * config.lookback + 1) {
      console.warn("Insufficient chart data for swing detection");
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
    
    // Detect swing highs
    for (let i = config.lookback; i < normalizedData.length - config.lookback; i++) {
      const current = normalizedData[i];
      const lookbackCandles = normalizedData.slice(i - config.lookback, i);
      const lookforwardCandles = normalizedData.slice(i + 1, i + 1 + config.lookback);
      
      // Check if current high is higher than all lookback and lookforward candles
      const isSwingHigh = lookbackCandles.every(c => c.high < current.high) && 
                          lookforwardCandles.every(c => c.high < current.high);
      
      if (isSwingHigh) {
        // Calculate significance as percentage of total range
        const significance = (current.high - minPrice) / priceRange;
        
        swingHighs.push({
          time: current.time,
          price: current.high,
          index: i,
          significance
        });
      }
    }
    
    // Detect swing lows
    for (let i = config.lookback; i < normalizedData.length - config.lookback; i++) {
      const current = normalizedData[i];
      const lookbackCandles = normalizedData.slice(i - config.lookback, i);
      const lookforwardCandles = normalizedData.slice(i + 1, i + 1 + config.lookback);
      
      // Check if current low is lower than all lookback and lookforward candles
      const isSwingLow = lookbackCandles.every(c => c.low > current.low) && 
                        lookforwardCandles.every(c => c.low > current.low);
      
      if (isSwingLow) {
        // Calculate significance as percentage of total range
        const significance = (maxPrice - current.low) / priceRange;
        
        swingLows.push({
          time: current.time,
          price: current.low,
          index: i,
          significance
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
    // First detect swing points
    const swingPoints = detectSwingPoints(chartData, { 
      lookback: direction === 'uptrend' ? 5 : 7 // Use different lookback for trend types
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
      // For uptrend, find most significant low followed by a high
      // We'll look for the longest and most significant uptrend movement
      let bestLow = null;
      let bestHigh = null;
      let bestMovement = 0;
      
      // Consider only the top most significant lows
      const topLows = sortedLows.slice(0, 5);
      
      for (const low of topLows) {
        // Find all highs that come after this low
        const subsequentHighs = sortedHighs.filter(h => h.time > low.time);
        
        if (subsequentHighs.length > 0) {
          // Find highest subsequent high
          const highestHigh = subsequentHighs.reduce((highest, current) => 
            current.price > highest.price ? current : highest, subsequentHighs[0]);
          
          // Calculate movement size and significance
          const movement = highestHigh.price - low.price;
          const movementSignificance = movement * (low.significance + highestHigh.significance);
          
          // If this movement is more significant than what we've found
          if (movementSignificance > bestMovement) {
            bestMovement = movementSignificance;
            bestLow = low;
            bestHigh = highestHigh;
          }
        }
      }
      
      if (bestLow && bestHigh) {
        return {
          start: bestLow,
          end: bestHigh,
          direction: 'uptrend'
        };
      }
    } else {
      // For downtrend, find most significant high followed by a low
      let bestHigh = null;
      let bestLow = null;
      let bestMovement = 0;
      
      // Consider only the top most significant highs
      const topHighs = sortedHighs.slice(0, 5);
      
      for (const high of topHighs) {
        // Find all lows that come after this high
        const subsequentLows = sortedLows.filter(l => l.time > high.time);
        
        if (subsequentLows.length > 0) {
          // Find lowest subsequent low
          const lowestLow = subsequentLows.reduce((lowest, current) => 
            current.price < lowest.price ? current : lowest, subsequentLows[0]);
          
          // Calculate movement size and significance
          const movement = high.price - lowestLow.price;
          const movementSignificance = movement * (high.significance + lowestLow.significance);
          
          // If this movement is more significant than what we've found
          if (movementSignificance > bestMovement) {
            bestMovement = movementSignificance;
            bestHigh = high;
            bestLow = lowestLow;
          }
        }
      }
      
      if (bestHigh && bestLow) {
        return {
          start: bestHigh,
          end: bestLow,
          direction: 'downtrend'
        };
      }
    }
    
    // Fallback to find any meaningful retracement if the above methods fail
    if (direction === 'uptrend') {
      // Find a low followed by higher high
      for (let i = 0; i < sortedLows.length; i++) {
        const low = sortedLows[i];
        const highsAfter = sortedHighs.filter(h => h.time > low.time);
        
        if (highsAfter.length > 0) {
          const highestAfter = highsAfter.reduce((highest, current) => 
            current.price > highest.price ? current : highest, highsAfter[0]);
          
          return {
            start: low,
            end: highestAfter,
            direction: 'uptrend'
          };
        }
      }
    } else {
      // Find a high followed by a lower low
      for (let i = 0; i < sortedHighs.length; i++) {
        const high = sortedHighs[i];
        const lowsAfter = sortedLows.filter(l => l.time > high.time);
        
        if (lowsAfter.length > 0) {
          const lowestAfter = lowsAfter.reduce((lowest, current) => 
            current.price < lowest.price ? current : lowest, lowsAfter[0]);
          
          return {
            start: high,
            end: lowestAfter,
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
    
    const priceDiff = end.price - start.price;
    const direction = priceDiff > 0 ? 'uptrend' : 'downtrend';
    
    // Standard Fibonacci levels
    const fibLevels = [
      { level: 0, label: "0" },
      { level: 0.236, label: "0.236" },
      { level: 0.382, label: "0.382" },
      { level: 0.5, label: "0.5" },
      { level: 0.618, label: "0.618" },
      { level: 0.786, label: "0.786" },
      { level: 1, label: "1" },
      { level: 1.272, label: "1.272" },
      { level: 1.618, label: "1.618" }
    ];
    
    // Calculate price for each level
    const levels = fibLevels.map(fib => ({
      ...fib,
      price: start.price + (priceDiff * fib.level)
    }));
    
    return {
      direction,
      start,
      end,
      levels
    };
  }
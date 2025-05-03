// Enhanced swing detection algorithm with better accuracy and flexibility
// This replaces the existing function in /pages/api/charting-exam/utils/swing-detection.js

/**
 * Detect swing high and low points in chart data
 * @param {Array} chartData - Array of OHLC candle data
 * @param {Object} options - Configuration options
 * @returns {Object} Object containing arrays of swing highs and lows
 */
export function detectSwingPoints(chartData, options = {}) {
    // Default options
    const config = {
      lookback: 5,                 // Number of candles to look back/forward for confirmation
      minSignificance: 0.01,       // Minimum price difference as a percentage of the range
      highField: 'high',           // The field name for high value
      lowField: 'low',             // The field name for low value
      timeField: 'time',           // The field name for timestamp
      minSwings: 3,                // Minimum number of swing points to identify
      maxSwings: 12,               // Maximum number of swing points to identify
      ...options
    };
    
    const swingPoints = { highs: [], lows: [] };
    
    // Validate input data
    if (!chartData || !Array.isArray(chartData) || chartData.length < 2 * config.lookback + 1) {
      console.warn("Insufficient chart data for swing detection");
      return swingPoints;
    }
    
    // Normalize chart data to ensure consistent structure
    const normalizedData = normalizeChartData(chartData, config);
    if (normalizedData.length === 0) {
      console.warn("Failed to normalize chart data");
      return swingPoints;
    }
    
    // Calculate price range for significance threshold
    const highValues = normalizedData.map(c => c.high);
    const lowValues = normalizedData.map(c => c.low);
    const priceRange = Math.max(...highValues) - Math.min(...lowValues);
    const minPriceDiff = priceRange * config.minSignificance;
    
    // Detect potential swing highs
    const potentialHighs = [];
    for (let i = config.lookback; i < normalizedData.length - config.lookback; i++) {
      const current = normalizedData[i];
      const before = normalizedData.slice(i - config.lookback, i).map(c => c.high);
      const after = normalizedData.slice(i + 1, i + 1 + config.lookback).map(c => c.high);
      
      // Check if current high is higher than all lookback candles before and after
      if (current.high > Math.max(...before) && current.high > Math.max(...after)) {
        // Calculate minimum price in the window to determine significance
        const windowLows = [...normalizedData.slice(i - config.lookback, i + 1 + config.lookback)].map(c => c.low);
        const lowestLow = Math.min(...windowLows);
        const priceDiff = current.high - lowestLow;
        
        // Add to potential highs with significance score
        if (priceDiff >= minPriceDiff) {
          potentialHighs.push({
            time: current.time,
            price: current.high,
            index: i,
            significance: priceDiff / priceRange,
            type: 'high'
          });
        }
      }
    }
    
    // Detect potential swing lows
    const potentialLows = [];
    for (let i = config.lookback; i < normalizedData.length - config.lookback; i++) {
      const current = normalizedData[i];
      const before = normalizedData.slice(i - config.lookback, i).map(c => c.low);
      const after = normalizedData.slice(i + 1, i + 1 + config.lookback).map(c => c.low);
      
      // Check if current low is lower than all lookback candles before and after
      if (current.low < Math.min(...before) && current.low < Math.min(...after)) {
        // Calculate maximum price in the window to determine significance
        const windowHighs = [...normalizedData.slice(i - config.lookback, i + 1 + config.lookback)].map(c => c.high);
        const highestHigh = Math.max(...windowHighs);
        const priceDiff = highestHigh - current.low;
        
        // Add to potential lows with significance score
        if (priceDiff >= minPriceDiff) {
          potentialLows.push({
            time: current.time,
            price: current.low,
            index: i,
            significance: priceDiff / priceRange,
            type: 'low'
          });
        }
      }
    }
    
    // Filter out less significant swing points if we have too many
    // Sort by significance (most significant first)
    const sortedHighs = [...potentialHighs].sort((a, b) => b.significance - a.significance);
    const sortedLows = [...potentialLows].sort((a, b) => b.significance - a.significance);
    
    // Ensure we have at least minSwings but no more than maxSwings
    const selectedHighs = selectSignificantSwings(sortedHighs, config.minSwings, config.maxSwings);
    const selectedLows = selectSignificantSwings(sortedLows, config.minSwings, config.maxSwings);
    
    // Sort back by time/index for chronological order
    swingPoints.highs = selectedHighs.sort((a, b) => a.index - b.index)
      .map(({time, price, significance}) => ({time, price, significance}));
    swingPoints.lows = selectedLows.sort((a, b) => a.index - b.index)
      .map(({time, price, significance}) => ({time, price, significance}));
    
    return swingPoints;
  }
  
  /**
   * Normalize chart data to ensure consistent structure
   * @param {Array} chartData - Array of candle data
   * @param {Object} config - Configuration with field names
   * @returns {Array} Normalized data with consistent fields
   */
  function normalizeChartData(chartData, config) {
    return chartData.map((candle, index) => {
      // Handle different possible field names and formats
      const high = typeof candle[config.highField] === 'number' ? 
        candle[config.highField] : (candle.h || candle.High || candle.high || 0);
      
      const low = typeof candle[config.lowField] === 'number' ? 
        candle[config.lowField] : (candle.l || candle.Low || candle.low || 0);
      
      // Handle different time formats - ensure we have a numeric timestamp
      let time;
      if (typeof candle[config.timeField] === 'number') {
        time = candle[config.timeField];
      } else if (candle.date || candle.time || candle.timestamp) {
        const timeValue = candle.date || candle.time || candle.timestamp;
        if (typeof timeValue === 'number') {
          time = timeValue;
        } else if (typeof timeValue === 'string') {
          // Convert ISO string or other date formats to timestamp
          try {
            time = Math.floor(new Date(timeValue).getTime() / 1000);
          } catch (e) {
            // If date parsing fails, use array index as fallback
            console.warn(`Failed to parse date: ${timeValue}`, e);
            time = index;
          }
        } else {
          time = index; // Fallback to array index
        }
      } else {
        time = index; // Use array index as time
      }
      
      return {
        high,
        low,
        time,
        // Include other fields if they exist
        open: candle.open || candle.o || candle.Open || null,
        close: candle.close || candle.c || candle.Close || null,
        volume: candle.volume || candle.v || candle.Volume || null,
        originalIndex: index
      };
    }).filter(candle => 
      // Filter out invalid entries
      typeof candle.high === 'number' && 
      typeof candle.low === 'number' && 
      !isNaN(candle.high) && 
      !isNaN(candle.low) && 
      candle.high >= candle.low
    );
  }
  
  /**
   * Select the most significant swing points while respecting minimum/maximum constraints
   * @param {Array} points - Array of potential swing points sorted by significance
   * @param {Number} min - Minimum number of points to select
   * @param {Number} max - Maximum number of points to select
   * @returns {Array} Selected swing points
   */
  function selectSignificantSwings(points, min, max) {
    if (points.length <= max) return points;
    
    // First take the most significant points up to the minimum
    const selected = points.slice(0, min);
    
    // For the remaining points, use a more balanced approach
    // that considers both significance and distribution
    const remaining = points.slice(min);
    
    // Sort remaining by index (time)
    remaining.sort((a, b) => a.index - b.index);
    
    // Add more points until we reach max, prioritizing points that are well-spaced
    while (selected.length < max && remaining.length > 0) {
      // Find the largest gap in indices
      let maxGap = 0;
      let maxGapIndex = 0;
      
      // Sort selected by index for gap calculation
      const sortedSelected = [...selected].sort((a, b) => a.index - b.index);
      
      for (let i = 0; i < sortedSelected.length - 1; i++) {
        const gap = sortedSelected[i + 1].index - sortedSelected[i].index;
        if (gap > maxGap) {
          maxGap = gap;
          maxGapIndex = i;
        }
      }
      
      // Find a point that fills the largest gap
      const gapStart = sortedSelected[maxGapIndex].index;
      const gapEnd = sortedSelected[maxGapIndex + 1]?.index || Number.MAX_SAFE_INTEGER;
      
      const pointInGap = remaining.find(p => p.index > gapStart && p.index < gapEnd);
      
      if (pointInGap) {
        selected.push(pointInGap);
        remaining.splice(remaining.indexOf(pointInGap), 1);
      } else {
        // If no point in gap, take the most significant remaining point
        selected.push(remaining[0]);
        remaining.shift();
      }
    }
    
    return selected;
  }
  
  /**
   * Get the most significant swing points for visualization or analysis
   * @param {Object} swingPoints - Object with highs and lows arrays
   * @param {Number} maxPoints - Maximum points to return (total)
   * @returns {Object} Object with filtered highs and lows arrays
   */
  export function getSignificantSwingPoints(swingPoints, maxPoints = 10) {
    // Calculate how many points to select from each type
    const highsCount = Math.min(
      Math.ceil(maxPoints / 2), 
      swingPoints.highs.length
    );
    
    const lowsCount = Math.min(
      Math.ceil(maxPoints / 2),
      swingPoints.lows.length
    );
    
    // Sort by significance
    const sortedHighs = [...swingPoints.highs]
      .sort((a, b) => (b.significance || 0) - (a.significance || 0))
      .slice(0, highsCount);
      
    const sortedLows = [...swingPoints.lows]
      .sort((a, b) => (b.significance || 0) - (a.significance || 0))
      .slice(0, lowsCount);
    
    // Sort back by time for visualization
    sortedHighs.sort((a, b) => a.time - b.time);
    sortedLows.sort((a, b) => a.time - b.time);
    
    return {
      highs: sortedHighs,
      lows: sortedLows
    };
  }
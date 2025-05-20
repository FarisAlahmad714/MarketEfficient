/**
 * Fair Value Gap (FVG) Detection Utilities
 * 
 * A Fair Value Gap is a three-candlestick sequence where:
 * 
 * For Bullish FVG:
 * 1. Candlestick #2's high must be above Candlestick #1's high AND it must close above it
 * 2. Candlestick #3's low must stay above Candlestick #1's high (no overlap)
 * 
 * For Bearish FVG:
 * 1. Candlestick #2's low must be below Candlestick #1's low AND it must close below it
 * 2. Candlestick #3's high must stay below Candlestick #1's low (no overlap)
 */

/**
 * Calculate adaptive minimum gap percentage based on asset volatility and timeframe
 * @param {Array} chartData - OHLC chart data
 * @param {string} timeframe - Timeframe of the chart (1h, 4h, 1d, 1w)
 * @param {string} assetSymbol - Symbol of the asset being analyzed
 * @returns {number} - Adaptive minimum gap percentage
 */
export function calculateAdaptiveMinGapPercent(chartData, timeframe = '1d', assetSymbol = 'UNKNOWN') {
  // Calculate historical volatility (using ATR-like approach)
  const volatility = calculateVolatility(chartData);
  
  // Base minimum gap percentages by timeframe
  const timeframeBasePercentages = {
    '1h': 0.003,  // Lower threshold for shorter timeframes
    '4h': 0.004,
    '1d': 0.005,  // Default value (0.5%)
    '1w': 0.008   // Higher threshold for higher timeframes
  };
  
  // Get base percentage based on timeframe (default to daily if not found)
  const basePercentage = timeframeBasePercentages[timeframe] || 0.005;
  
  // Asset-specific adjustments (optional enhancement)
  const assetMultiplier = getAssetVolatilityMultiplier(assetSymbol);
  
  // Calculate final adaptive gap percentage
  // Scale by volatility - more volatile markets need larger gaps to be significant
  const adaptivePercentage = basePercentage * (volatility * 0.8 + 0.6) * assetMultiplier;
  
  // Ensure we have reasonable bounds
  const finalPercentage = Math.max(0.002, Math.min(0.015, adaptivePercentage));
  
  // Log details for monitoring
  console.log(`[FVG Adaptive Detection] Asset=${assetSymbol}, Timeframe=${timeframe}, ` +
              `Base=${basePercentage.toFixed(4)}, Volatility=${volatility.toFixed(2)}, ` +
              `AssetMult=${assetMultiplier.toFixed(2)}, Final=${finalPercentage.toFixed(4)}`);
              
  return finalPercentage;
}

/**
 * Calculate volatility using a simple ATR-like approach
 * @param {Array} chartData - Chart data array
 * @returns {number} - Normalized volatility score (1.0 is average)
 */
function calculateVolatility(chartData) {
  if (!chartData || chartData.length < 5) return 1.0; // Default to neutral
  
  // Calculate true ranges
  const trueRanges = [];
  
  for (let i = 1; i < chartData.length; i++) {
    const current = chartData[i];
    const previous = chartData[i-1];
    
    const tr1 = current.high - current.low; // Current candle range
    const tr2 = Math.abs(current.high - previous.close); // High vs previous close
    const tr3 = Math.abs(current.low - previous.close); // Low vs previous close
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate average true range
  const atr = trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  
  // Normalize by price to get percentage volatility
  const averagePrice = chartData.reduce((sum, candle) => sum + (candle.high + candle.low) / 2, 0) / chartData.length;
  
  return (atr / averagePrice) * 100; // As a percentage of price
}

/**
 * Get volatility multiplier based on asset type
 * @param {string} assetSymbol - Symbol of the asset
 * @returns {number} - Multiplier for the base percentage
 */
function getAssetVolatilityMultiplier(assetSymbol) {
  // Example classifications based on typical asset volatility
  const highVolatilityAssets = ['BTC', 'ETH', 'SOL', 'LINK']; // Cryptocurrencies
  const mediumVolatilityAssets = ['NVDA', 'TSLA']; // Growth stocks
  const lowVolatilityAssets = ['AAPL', 'GLD']; // Blue chips, gold
  
  // Convert to uppercase for comparison
  const symbol = assetSymbol.toUpperCase();
  
  if (highVolatilityAssets.includes(symbol)) {
    return 1.2; // 20% higher threshold
  } else if (mediumVolatilityAssets.includes(symbol)) {
    return 1.0; // Neutral
  } else if (lowVolatilityAssets.includes(symbol)) {
    return 0.8; // 20% lower threshold
  }
  
  return 1.0; // Default multiplier
}

/**
 * Detect Fair Value Gaps in chart data
 * @param {Array} chartData - Array of candle data objects
 * @param {string} gapType - Type of gap to detect ('bullish' or 'bearish')
 * @param {number} minGapPercent - Optional override for minimum gap percentage
 * @param {string} timeframe - Timeframe of the chart
 * @param {string} assetSymbol - Symbol of the asset
 * @returns {Array} - Array of detected gaps
 */
export function detectFairValueGaps(
  chartData, 
  gapType = 'bullish', 
  minGapPercent = null,
  timeframe = '1d',
  assetSymbol = 'UNKNOWN'
) {
  if (!chartData || chartData.length < 3) {
    return [];
  }
  
  const gaps = [];
  
  // If minGapPercent isn't explicitly provided, calculate it adaptively
  const adaptiveMinGapPercent = minGapPercent || 
    calculateAdaptiveMinGapPercent(chartData, timeframe, assetSymbol);
  
  // Calculate minimum gap size for significance
  const priceRange = Math.max(...chartData.map(c => c.high)) - 
                    Math.min(...chartData.map(c => c.low));
  const minGapSize = priceRange * adaptiveMinGapPercent;
  
  // Log the effective minimum gap size for debugging
  console.log(`[FVG Detection] ${gapType} FVG search with min gap size: ${minGapSize.toFixed(4)} (${(adaptiveMinGapPercent * 100).toFixed(2)}% of range)`);
  
  // Look for exactly THREE candle patterns
  for (let i = 0; i < chartData.length - 2; i++) {
    const firstCandle = chartData[i];
    const middleCandle = chartData[i + 1];
    const thirdCandle = chartData[i + 2];
    
    if (gapType === 'bullish') {
      // For bullish FVG:
      // 1. Middle candle's high must be above first candle's high AND must close above it
      // 2. Third candle's low must be above first candle's high (no overlap)
      
      const middleCondition = middleCandle.high > firstCandle.high && middleCandle.close > firstCandle.high;
      const gapSize = thirdCandle.low - firstCandle.high;
      
      if (middleCondition && gapSize > 0 && gapSize >= minGapSize) {
        gaps.push({
          startTime: firstCandle.time || Math.floor(new Date(firstCandle.date).getTime() / 1000),
          endTime: thirdCandle.time || Math.floor(new Date(thirdCandle.date).getTime() / 1000),
          topPrice: thirdCandle.low,
          bottomPrice: firstCandle.high,
          type: 'bullish',
          size: gapSize,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2
        });
      }
    } else if (gapType === 'bearish') {
      // For bearish FVG:
      // 1. Middle candle's low must be below first candle's low AND must close below it
      // 2. Third candle's high must be below first candle's low (no overlap)
      
      const middleCondition = middleCandle.low < firstCandle.low && middleCandle.close < firstCandle.low;
      const gapSize = firstCandle.low - thirdCandle.high;
      
      if (middleCondition && gapSize > 0 && gapSize >= minGapSize) {
        gaps.push({
          startTime: firstCandle.time || Math.floor(new Date(firstCandle.date).getTime() / 1000),
          endTime: thirdCandle.time || Math.floor(new Date(thirdCandle.date).getTime() / 1000),
          topPrice: firstCandle.low,
          bottomPrice: thirdCandle.high,
          type: 'bearish',
          size: gapSize,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2
        });
      }
    }
  }
  
  // Sort gaps by size (largest first)
  gaps.sort((a, b) => b.size - a.size);
  
  // Log found gaps
  console.log(`[FVG Detection] Found ${gaps.length} ${gapType} FVGs`);
  
  // Limit to the 5 most significant gaps to avoid overcrowding
  return gaps.slice(0, 5);
}

/**
 * Check if an FVG has been filled by subsequent price action
 * @param {Object} gap - The FVG object to check
 * @param {Array} subsequentCandles - Array of candles that occurred after the FVG formation
 * @returns {boolean} - Whether the gap has been filled
 */
export function checkFVGFilled(gap, subsequentCandles) {
  for (const candle of subsequentCandles) {
    if (gap.type === 'bullish') {
      // Bullish FVG is filled if price goes back down into the gap
      if (candle.low <= gap.topPrice) {
        return true;
      }
    } else {
      // Bearish FVG is filled if price goes back up into the gap
      if (candle.high >= gap.bottomPrice) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Determine if a gap has been partially filled and adjust the gap size accordingly
 * @param {Object} gap - The original FVG object
 * @param {Array} subsequentCandles - Array of candles after the FVG formation
 * @returns {Object} - The adjusted gap, or the original if not partially filled
 */
export function adjustPartiallyFilledFVG(gap, subsequentCandles) {
  let adjustedGap = { ...gap };
  let partiallyFilled = false;
  
  for (const candle of subsequentCandles) {
    if (gap.type === 'bullish') {
      // If price went into the gap but didn't completely fill it
      if (candle.low < gap.topPrice && candle.low > gap.bottomPrice) {
        // Adjust the top of the gap to the lowest point reached
        adjustedGap.topPrice = Math.min(adjustedGap.topPrice, candle.low);
        adjustedGap.size = adjustedGap.topPrice - adjustedGap.bottomPrice;
        partiallyFilled = true;
      } else if (candle.low <= gap.bottomPrice) {
        // Completely filled
        return null;
      }
    } else { // bearish gap
      // If price went into the gap but didn't completely fill it
      if (candle.high > gap.bottomPrice && candle.high < gap.topPrice) {
        // Adjust the bottom of the gap to the highest point reached
        adjustedGap.bottomPrice = Math.max(adjustedGap.bottomPrice, candle.high);
        adjustedGap.size = adjustedGap.topPrice - adjustedGap.bottomPrice;
        partiallyFilled = true;
      } else if (candle.high >= gap.topPrice) {
        // Completely filled
        return null;
      }
    }
  }
  
  return partiallyFilled ? adjustedGap : gap;
}

/**
 * Find all untested Fair Value Gaps
 * @param {Array} chartData - Full candle data array
 * @param {string} gapType - Type of gaps to find ('bullish' or 'bearish')
 * @param {string} timeframe - Timeframe of the chart
 * @param {string} assetSymbol - Symbol of the asset
 * @returns {Array} - Array of untested gaps
 */
export function findUntestedFVGs(chartData, gapType = 'bullish', timeframe = '1d', assetSymbol = 'UNKNOWN') {
  const allGaps = detectFairValueGaps(chartData, gapType, null, timeframe, assetSymbol);
  const untestedGaps = [];
  
  for (const gap of allGaps) {
    // Get all candles that occurred after the FVG formation
    const subsequentCandles = chartData.slice(gap.thirdCandleIndex + 1);
    
    // Check if the gap has been filled
    if (!checkFVGFilled(gap, subsequentCandles)) {
      // If not filled, check if it's been partially filled and adjust
      const adjustedGap = adjustPartiallyFilledFVG(gap, subsequentCandles);
      
      if (adjustedGap) {
        untestedGaps.push(adjustedGap);
      }
    }
  }
  
  return untestedGaps;
}

export default {
  detectFairValueGaps,
  checkFVGFilled,
  adjustPartiallyFilledFVG,
  findUntestedFVGs,
  calculateAdaptiveMinGapPercent
};
/**
 * FIXED Fair Value Gap (FVG) Detection Utilities - Consistent Version
 * 
 * A Fair Value Gap is a three-candlestick imbalance where:
 * 
 * For Bullish FVG:
 * - The gap exists between Candle 1's HIGH and Candle 3's LOW
 * - Candle 2 must show bullish momentum (typically a strong bullish candle)
 * - There must be NO OVERLAP between Candle 1's high and Candle 3's low
 * 
 * For Bearish FVG:
 * - The gap exists between Candle 1's LOW and Candle 3's HIGH  
 * - Candle 2 must show bearish momentum (typically a strong bearish candle)
 * - There must be NO OVERLAP between Candle 1's low and Candle 3's high
 */

/**
 * Calculate adaptive minimum gap percentage based on asset volatility and timeframe
 * FIXED: Made calculation deterministic and consistent
 */
export function calculateAdaptiveMinGapPercent(chartData, timeframe = '1d', assetSymbol = 'UNKNOWN') {
  // FIXED: Use fixed thresholds instead of volatility-based calculation
  // This ensures consistent results across multiple runs
  const timeframeBasePercentages = {
    '1m': 0.0008,   // 0.08% for 1-minute
    '5m': 0.0012,   // 0.12% for 5-minute
    '15m': 0.0018,  // 0.18% for 15-minute
    '1h': 0.0025,   // 0.25% for hourly
    '4h': 0.003,    // 0.3% for 4-hour
    '1d': 0.004,    // 0.4% for daily (increased for better detection)
    '1w': 0.002     // 0.2% for weekly (reduced from previous)
  };
  
  const basePercentage = timeframeBasePercentages[timeframe] || 0.003;
  
  // FIXED: Simplified asset multiplier without volatility calculation
  const assetMultiplier = getSimpleAssetMultiplier(assetSymbol);
  
  // Direct calculation without volatility
  const finalPercentage = basePercentage * assetMultiplier;
  
  console.log(`[FVG Adaptive] Asset=${assetSymbol}, TF=${timeframe}, ` +
              `Base=${basePercentage.toFixed(4)}, Multiplier=${assetMultiplier}, ` +
              `Final=${finalPercentage.toFixed(4)}`);
              
  return finalPercentage;
}

/**
 * Get simple asset multiplier based on asset type
 * FIXED: Removed timeframe dependency for consistency
 */
function getSimpleAssetMultiplier(assetSymbol) {
  const symbol = assetSymbol.toUpperCase();
  
  // Crypto assets typically have larger gaps
  if (['BTC', 'ETH', 'DOGE', 'SHIB', 'SOL', 'CRYPTO'].some(asset => symbol.includes(asset))) {
    return 1.2;
  }
  // High volatility stocks
  else if (['NVDA', 'TSLA', 'AMD', 'NFLX', 'GME', 'AMC'].some(asset => symbol.includes(asset))) {
    return 1.0;
  }
  // Stable stocks and indices
  else if (['AAPL', 'MSFT', 'JNJ', 'KO', 'GLD', 'SPY', 'QQQ'].some(asset => symbol.includes(asset))) {
    return 0.8;
  }
  // Forex pairs
  else if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) {
    return 0.6;
  }
  
  return 1.0; // Default multiplier
}

/**
 * FIXED: Detect Fair Value Gaps with more consistent logic
 */
export function detectFairValueGaps(
  chartData, 
  gapType = 'bullish', 
  minGapPercent = null,
  timeframe = '1d',
  assetSymbol = 'UNKNOWN'
) {
  if (!chartData || chartData.length < 3) {
    console.log('[FVG Detection] Insufficient data for FVG detection');
    return [];
  }
  
  // Ensure chart data is sorted by time
  const sortedData = [...chartData].sort((a, b) => {
    const timeA = a.time || Math.floor(new Date(a.date).getTime() / 1000);
    const timeB = b.time || Math.floor(new Date(b.date).getTime() / 1000);
    return timeA - timeB;
  });
  
  const gaps = [];
  
  // Calculate adaptive minimum gap
  const adaptiveMinGapPercent = minGapPercent || 
    calculateAdaptiveMinGapPercent(sortedData, timeframe, assetSymbol);
  
  // Use average price for more stable gap size calculation
  const avgPrice = sortedData.reduce((sum, candle) => 
    sum + (candle.high + candle.low) / 2, 0) / sortedData.length;
  
  // FIXED: Use average price for gap size to avoid extreme values
  const minGapSize = avgPrice * adaptiveMinGapPercent;
  
  console.log(`[FVG Detection] Searching for ${gapType} FVGs on ${timeframe} timeframe:`);
  console.log(`- Average price: ${avgPrice.toFixed(2)}`);
  console.log(`- Min gap size: ${minGapSize.toFixed(4)} (${(adaptiveMinGapPercent * 100).toFixed(3)}%)`);
  console.log(`- Total candles: ${sortedData.length}`);
  
  // Scan for three-candle patterns
  for (let i = 0; i < sortedData.length - 2; i++) {
    const candle1 = sortedData[i];
    const candle2 = sortedData[i + 1];
    const candle3 = sortedData[i + 2];
    
    // Validate candle data
    if (!isValidCandle(candle1) || !isValidCandle(candle2) || !isValidCandle(candle3)) {
      continue;
    }
    
    if (gapType === 'bullish') {
      // BULLISH FVG CONDITIONS:
      const gapExists = candle3.low > candle1.high;
      const gapSize = candle3.low - candle1.high;
      
      // Candle 2 momentum checks
      const candle2IsBullish = candle2.close > candle2.open;
      const candle2BreaksHigher = candle2.high > candle1.high;
      
      // FIXED: Consistent momentum check for all timeframes
      let momentumValid = false;
      if (timeframe === '1w') {
        // For weekly, just need candle 2 to break higher
        momentumValid = candle2BreaksHigher;
      } else {
        // For other timeframes, need both bullish candle and break higher
        momentumValid = candle2IsBullish && candle2BreaksHigher;
      }
      
      // Additional validation: gap should be reasonable (not too large)
      const gapPercentage = gapSize / avgPrice;
      const maxGapPercentage = adaptiveMinGapPercent * 50; // Max 50x the minimum
      
      if (gapExists && gapSize >= minGapSize && momentumValid && gapPercentage <= maxGapPercentage) {
        console.log(`[Bullish FVG Found] Candles ${i+1}-${i+3}:`);
        console.log(`- C1 High: ${candle1.high.toFixed(4)}, C3 Low: ${candle3.low.toFixed(4)}`);
        console.log(`- Gap Size: ${gapSize.toFixed(4)} (${(gapPercentage * 100).toFixed(3)}%)`);
        console.log(`- C2 Bullish: ${candle2IsBullish}, Breaks Higher: ${candle2BreaksHigher}`);
        
        gaps.push({
          startTime: candle1.time || Math.floor(new Date(candle1.date).getTime() / 1000),
          endTime: candle3.time || Math.floor(new Date(candle3.date).getTime() / 1000),
          topPrice: candle3.low,      // Top of the gap
          bottomPrice: candle1.high,   // Bottom of the gap
          type: 'bullish',
          size: gapSize,
          sizePercent: gapPercentage,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2,
          candle2Bullish: candle2IsBullish,
          candle2BreaksHigher: candle2BreaksHigher
        });
      }
    } else if (gapType === 'bearish') {
      // BEARISH FVG CONDITIONS:
      const gapExists = candle3.high < candle1.low;
      const gapSize = candle1.low - candle3.high;
      
      // Candle 2 momentum checks
      const candle2IsBearish = candle2.close < candle2.open;
      const candle2BreaksLower = candle2.low < candle1.low;
      
      // FIXED: Consistent momentum check for all timeframes
      let momentumValid = false;
      if (timeframe === '1w') {
        // For weekly, just need candle 2 to break lower
        momentumValid = candle2BreaksLower;
      } else {
        // For other timeframes, need both bearish candle and break lower
        momentumValid = candle2IsBearish && candle2BreaksLower;
      }
      
      // Additional validation: gap should be reasonable (not too large)
      const gapPercentage = gapSize / avgPrice;
      const maxGapPercentage = adaptiveMinGapPercent * 50; // Max 50x the minimum
      
      if (gapExists && gapSize >= minGapSize && momentumValid && gapPercentage <= maxGapPercentage) {
        console.log(`[Bearish FVG Found] Candles ${i+1}-${i+3}:`);
        console.log(`- C1 Low: ${candle1.low.toFixed(4)}, C3 High: ${candle3.high.toFixed(4)}`);
        console.log(`- Gap Size: ${gapSize.toFixed(4)} (${(gapPercentage * 100).toFixed(3)}%)`);
        console.log(`- C2 Bearish: ${candle2IsBearish}, Breaks Lower: ${candle2BreaksLower}`);
        
        gaps.push({
          startTime: candle1.time || Math.floor(new Date(candle1.date).getTime() / 1000),
          endTime: candle3.time || Math.floor(new Date(candle3.date).getTime() / 1000),
          topPrice: candle1.low,      // Top of the gap
          bottomPrice: candle3.high,   // Bottom of the gap
          type: 'bearish',
          size: gapSize,
          sizePercent: gapPercentage,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2,
          candle2Bearish: candle2IsBearish,
          candle2BreaksLower: candle2BreaksLower
        });
      }
    }
  }
  
  // Sort gaps by size percentage (most significant first)
  gaps.sort((a, b) => b.sizePercent - a.sizePercent);
  
  console.log(`[FVG Detection] Total ${gapType} FVGs found: ${gaps.length}`);
  
  // Return top 10 most significant gaps
  return gaps.slice(0, 10);
}

/**
 * Validate candle data
 */
function isValidCandle(candle) {
  return candle && 
         typeof candle.open === 'number' && 
         typeof candle.high === 'number' && 
         typeof candle.low === 'number' && 
         typeof candle.close === 'number' &&
         candle.high >= candle.low &&
         candle.high >= candle.open &&
         candle.high >= candle.close &&
         candle.low <= candle.open &&
         candle.low <= candle.close;
}

/**
 * IMPROVED: Validate user FVG markings with better matching logic
 */
export function validateFairValueGaps(drawings, expectedGaps, chartData, gapType, timeframe = '1d') {
  // Handle "No FVGs Found" case
  if (drawings.length === 1 && drawings[0].no_fvgs_found) {
    if (expectedGaps.length === 0) {
      return {
        success: true,
        message: `Correct! No ${gapType} fair value gaps in this chart.`,
        score: 1,
        totalExpectedPoints: 1,
        feedback: {
          correct: [{
            type: 'no_gaps',
            advice: `You correctly identified that there are no ${gapType} fair value gaps.`
          }],
          incorrect: []
        }
      };
    } else {
      return {
        success: false,
        message: `${expectedGaps.length} ${gapType} FVG(s) were present.`,
        score: 0,
        totalExpectedPoints: expectedGaps.length,
        feedback: {
          correct: [],
          incorrect: expectedGaps.map(gap => ({
            type: 'missed_gap',
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            size: gap.size,
            advice: getMissedGapAdvice(gap, gapType)
          }))
        }
      };
    }
  }
  
  // No gaps expected but user marked some
  if (expectedGaps.length === 0) {
    return {
      success: false,
      message: `No ${gapType} FVGs detected. Use "No FVGs Found" button.`,
      score: 0,
      totalExpectedPoints: 1,
      feedback: {
        correct: [],
        incorrect: drawings.map(d => ({
          type: 'incorrect_gap',
          topPrice: d.topPrice,
          bottomPrice: d.bottomPrice,
          advice: `No valid ${gapType} FVGs exist in this chart.`
        }))
      }
    };
  }
  
  // Calculate tolerances based on average price
  const avgPrice = chartData.reduce((sum, candle) => 
    sum + (candle.high + candle.low) / 2, 0) / chartData.length;
  
  // FIXED: Use average price-based tolerance for consistency
  let priceTolerance;
  if (timeframe === '1w') {
    priceTolerance = avgPrice * 0.015; // 1.5% for weekly
  } else if (timeframe === '1d') {
    priceTolerance = avgPrice * 0.01;  // 1% for daily
  } else {
    priceTolerance = avgPrice * 0.008; // 0.8% for intraday
  }
  
  // Time tolerance
  const timePoints = chartData.map(c => c.time || Math.floor(new Date(c.date).getTime() / 1000));
  const avgTimeIncrement = (timePoints[timePoints.length - 1] - timePoints[0]) / (timePoints.length - 1);
  const timeTolerance = avgTimeIncrement * 4;
  
  console.log(`[Validation] TF=${timeframe}, Price tolerance: ±${priceTolerance.toFixed(4)}, Time tolerance: ±${timeTolerance}s`);
  
  let matched = 0;
  const feedback = { correct: [], incorrect: [] };
  const usedGaps = new Set();
  const usedDrawings = new Set();
  
  // First pass: Find exact and near-exact matches
  for (let d = 0; d < drawings.length; d++) {
    const drawing = drawings[d];
    if (drawing.no_fvgs_found) continue;
    
    let bestMatch = null;
    let bestScore = 0;
    let bestGapIndex = -1;
    
    for (let g = 0; g < expectedGaps.length; g++) {
      if (usedGaps.has(g)) continue;
      
      const gap = expectedGaps[g];
      
      // Calculate match score based on price accuracy
      const topDiff = Math.abs(drawing.topPrice - gap.topPrice);
      const bottomDiff = Math.abs(drawing.bottomPrice - gap.bottomPrice);
      
      // Check if prices are within tolerance
      if (topDiff <= priceTolerance && bottomDiff <= priceTolerance) {
        // Score based on accuracy (closer = higher score)
        const priceScore = 1 - (topDiff + bottomDiff) / (2 * priceTolerance);
        
        // Time matching - more lenient
        const drawingMidTime = (drawing.startTime + drawing.endTime) / 2;
        const gapMidTime = (gap.startTime + gap.endTime) / 2;
        const timeDiff = Math.abs(drawingMidTime - gapMidTime);
        
        if (timeDiff <= timeTolerance) {
          const timeScore = 1 - (timeDiff / timeTolerance);
          const totalScore = (priceScore * 0.8) + (timeScore * 0.2); // Price matters more
          
          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMatch = gap;
            bestGapIndex = g;
          }
        }
      }
    }
    
    if (bestMatch && bestScore > 0.5) {
      matched++;
      usedGaps.add(bestGapIndex);
      usedDrawings.add(d);
      
      feedback.correct.push({
        type: gapType,
        topPrice: bestMatch.topPrice,
        bottomPrice: bestMatch.bottomPrice,
        size: bestMatch.size,
        accuracy: Math.round(bestScore * 100),
        advice: getMatchAdvice(bestScore, drawing.drawingType)
      });
    }
  }
  
  // Second pass: Mark unmatched drawings as incorrect
  for (let d = 0; d < drawings.length; d++) {
    if (!usedDrawings.has(d) && !drawings[d].no_fvgs_found) {
      feedback.incorrect.push({
        type: 'incorrect_gap',
        topPrice: drawings[d].topPrice,
        bottomPrice: drawings[d].bottomPrice,
        advice: getIncorrectGapAdvice(drawings[d], expectedGaps, gapType)
      });
    }
  }
  
  // Third pass: Mark missed gaps
  for (let g = 0; g < expectedGaps.length; g++) {
    if (!usedGaps.has(g)) {
      const gap = expectedGaps[g];
      feedback.incorrect.push({
        type: 'missed_gap',
        topPrice: gap.topPrice,
        bottomPrice: gap.bottomPrice,
        size: gap.size,
        advice: getMissedGapAdvice(gap, gapType)
      });
    }
  }
  
  const success = matched === expectedGaps.length && 
                  feedback.incorrect.filter(f => f.type === 'incorrect_gap').length === 0;
  
  return {
    success,
    message: `${gapType} FVGs: ${matched}/${expectedGaps.length} correct`,
    score: matched,
    totalExpectedPoints: expectedGaps.length,
    feedback
  };
}

// Helper functions for advice messages
function getMatchAdvice(score, drawingType) {
  if (score > 0.9) {
    return "Excellent! Precisely identified FVG.";
  } else if (score > 0.7) {
    return "Good! FVG identified with minor boundary differences.";
  } else {
    return "Acceptable. Consider more precise boundary marking.";
  }
}

function getIncorrectGapAdvice(drawing, expectedGaps, gapType) {
  const drawingMid = (drawing.topPrice + drawing.bottomPrice) / 2;
  
  for (const gap of expectedGaps) {
    const gapMid = (gap.topPrice + gap.bottomPrice) / 2;
    const distance = Math.abs(drawingMid - gapMid);
    const gapSize = gap.topPrice - gap.bottomPrice;
    
    if (distance < gapSize * 2) {
      return `Close to a valid FVG but boundaries are incorrect. Check the 3-candle pattern.`;
    }
  }
  
  return `No valid ${gapType} FVG at this location. Remember: ${gapType === 'bullish' 
    ? 'Gap must be between candle 1 high and candle 3 low with no overlap.'
    : 'Gap must be between candle 1 low and candle 3 high with no overlap.'}`;
}

function getMissedGapAdvice(gap, gapType) {
  const gapInfo = `${gap.bottomPrice.toFixed(4)} to ${gap.topPrice.toFixed(4)}`;
  
  if (gapType === 'bullish') {
    return `Missed bullish FVG (${gapInfo}). Look for 3-candle patterns where candle 3's low stays above candle 1's high.`;
  } else {
    return `Missed bearish FVG (${gapInfo}). Look for 3-candle patterns where candle 3's high stays below candle 1's low.`;
  }
}

// Export all functions
export default {
  detectFairValueGaps,
  validateFairValueGaps,
  calculateAdaptiveMinGapPercent
};
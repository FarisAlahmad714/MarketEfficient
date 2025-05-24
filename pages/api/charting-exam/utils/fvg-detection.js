/**
 * FIXED Fair Value Gap (FVG) Detection Utilities
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
 */
export function calculateAdaptiveMinGapPercent(chartData, timeframe = '1d', assetSymbol = 'UNKNOWN') {
  // Calculate historical volatility
  const volatility = calculateVolatility(chartData);
  
  // REVISED base minimum gap percentages - made less restrictive
  const timeframeBasePercentages = {
    '1m': 0.0005,  // 0.05% for 1-minute
    '5m': 0.001,   // 0.1% for 5-minute
    '15m': 0.0015, // 0.15% for 15-minute
    '1h': 0.002,   // 0.2% for hourly (reduced from 0.3%)
    '4h': 0.0025,  // 0.25% for 4-hour (reduced from 0.4%)
    '1d': 0.003,   // 0.3% for daily (reduced from 0.5%)
    '1w': 0.005    // 0.5% for weekly (reduced from 0.8%)
  };
  
  const basePercentage = timeframeBasePercentages[timeframe] || 0.003;
  const assetMultiplier = getAssetVolatilityMultiplier(assetSymbol);
  
  // Adjusted calculation - less aggressive scaling
  const adaptivePercentage = basePercentage * (volatility * 0.5 + 0.8) * assetMultiplier;
  
  // Tighter bounds to catch more gaps
  const finalPercentage = Math.max(0.0005, Math.min(0.01, adaptivePercentage));
  
  console.log(`[FVG Adaptive] Asset=${assetSymbol}, TF=${timeframe}, ` +
              `Base=${basePercentage.toFixed(4)}, Vol=${volatility.toFixed(2)}, ` +
              `Final=${finalPercentage.toFixed(4)}`);
              
  return finalPercentage;
}

/**
 * Calculate volatility using ATR-based approach
 */
function calculateVolatility(chartData) {
  if (!chartData || chartData.length < 5) return 1.0;
  
  const trueRanges = [];
  
  for (let i = 1; i < chartData.length; i++) {
    const current = chartData[i];
    const previous = chartData[i-1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  const atr = trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  const averagePrice = chartData.reduce((sum, candle) => sum + (candle.high + candle.low) / 2, 0) / chartData.length;
  
  return (atr / averagePrice) * 100;
}

/**
 * Get volatility multiplier based on asset type
 */
function getAssetVolatilityMultiplier(assetSymbol) {
  const highVolatilityAssets = ['BTC', 'ETH', 'DOGE', 'SHIB', 'SOL'];
  const mediumVolatilityAssets = ['NVDA', 'TSLA', 'AMD', 'NFLX'];
  const lowVolatilityAssets = ['AAPL', 'MSFT', 'JNJ', 'KO', 'GLD', 'SPY'];
  
  const symbol = assetSymbol.toUpperCase();
  
  if (highVolatilityAssets.some(asset => symbol.includes(asset))) {
    return 1.3; // Higher threshold for crypto
  } else if (mediumVolatilityAssets.some(asset => symbol.includes(asset))) {
    return 1.0;
  } else if (lowVolatilityAssets.some(asset => symbol.includes(asset))) {
    return 0.7; // Lower threshold for stable assets
  }
  
  return 1.0;
}

/**
 * FIXED: Detect Fair Value Gaps with corrected logic
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
  
  // Calculate adaptive minimum gap
  const adaptiveMinGapPercent = minGapPercent || 
    calculateAdaptiveMinGapPercent(chartData, timeframe, assetSymbol);
  
  // Use actual price range for gap size calculation
  const allPrices = chartData.flatMap(c => [c.high, c.low]);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const priceRange = maxPrice - minPrice;
  
  // Calculate minimum gap size
  const minGapSize = priceRange * adaptiveMinGapPercent;
  
  console.log(`[FVG Detection] Searching for ${gapType} FVGs:`);
  console.log(`- Price range: ${minPrice.toFixed(2)} to ${maxPrice.toFixed(2)}`);
  console.log(`- Min gap size: ${minGapSize.toFixed(4)} (${(adaptiveMinGapPercent * 100).toFixed(3)}%)`);
  
  // Scan for three-candle patterns
  for (let i = 0; i < chartData.length - 2; i++) {
    const candle1 = chartData[i];
    const candle2 = chartData[i + 1];
    const candle3 = chartData[i + 2];
    
    // Ensure we have valid price data
    if (!candle1.high || !candle1.low || !candle2.high || !candle2.low || 
        !candle3.high || !candle3.low || !candle2.close) {
      continue;
    }
    
    if (gapType === 'bullish') {
      // BULLISH FVG CONDITIONS:
      // 1. Gap exists between candle1.high and candle3.low (no overlap)
      // 2. Candle2 shows bullish momentum
      
      const gapExists = candle3.low > candle1.high;
      const gapSize = candle3.low - candle1.high;
      
      // Momentum check: Candle 2 should be bullish and break above candle 1
      const candle2IsBullish = candle2.close > candle2.open;
      const candle2BreaksHigher = candle2.high > candle1.high;
      
      // Additional check: Candle 2's body should extend beyond candle 1's high
      const candle2BodyAboveCandle1 = Math.min(candle2.open, candle2.close) > candle1.high;
      
      if (gapExists && gapSize >= minGapSize && candle2BreaksHigher) {
        console.log(`[Bullish FVG Found] Candles ${i+1}-${i+3}:`);
        console.log(`- Candle 1 High: ${candle1.high.toFixed(4)}`);
        console.log(`- Candle 3 Low: ${candle3.low.toFixed(4)}`);
        console.log(`- Gap Size: ${gapSize.toFixed(4)}`);
        console.log(`- Momentum: ${candle2IsBullish ? 'Bullish' : 'Bearish'} candle 2`);
        
        gaps.push({
          startTime: candle1.time || Math.floor(new Date(candle1.date).getTime() / 1000),
          endTime: candle3.time || Math.floor(new Date(candle3.date).getTime() / 1000),
          topPrice: candle3.low,      // Top of the gap
          bottomPrice: candle1.high,   // Bottom of the gap
          type: 'bullish',
          size: gapSize,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2,
          candle2Bullish: candle2IsBullish,
          candle2BodyExtends: candle2BodyAboveCandle1
        });
      }
    } else if (gapType === 'bearish') {
      // BEARISH FVG CONDITIONS:
      // 1. Gap exists between candle1.low and candle3.high (no overlap)
      // 2. Candle2 shows bearish momentum
      
      const gapExists = candle3.high < candle1.low;
      const gapSize = candle1.low - candle3.high;
      
      // Momentum check: Candle 2 should be bearish and break below candle 1
      const candle2IsBearish = candle2.close < candle2.open;
      const candle2BreaksLower = candle2.low < candle1.low;
      
      // Additional check: Candle 2's body should extend below candle 1's low
      const candle2BodyBelowCandle1 = Math.max(candle2.open, candle2.close) < candle1.low;
      
      if (gapExists && gapSize >= minGapSize && candle2BreaksLower) {
        console.log(`[Bearish FVG Found] Candles ${i+1}-${i+3}:`);
        console.log(`- Candle 1 Low: ${candle1.low.toFixed(4)}`);
        console.log(`- Candle 3 High: ${candle3.high.toFixed(4)}`);
        console.log(`- Gap Size: ${gapSize.toFixed(4)}`);
        console.log(`- Momentum: ${candle2IsBearish ? 'Bearish' : 'Bullish'} candle 2`);
        
        gaps.push({
          startTime: candle1.time || Math.floor(new Date(candle1.date).getTime() / 1000),
          endTime: candle3.time || Math.floor(new Date(candle3.date).getTime() / 1000),
          topPrice: candle1.low,      // Top of the gap
          bottomPrice: candle3.high,   // Bottom of the gap
          type: 'bearish',
          size: gapSize,
          firstCandleIndex: i,
          thirdCandleIndex: i + 2,
          candle2Bearish: candle2IsBearish,
          candle2BodyExtends: candle2BodyBelowCandle1
        });
      }
    }
  }
  
  // Sort gaps by size (largest first) and return top 10
  gaps.sort((a, b) => b.size - a.size);
  
  console.log(`[FVG Detection] Total ${gapType} FVGs found: ${gaps.length}`);
  
  return gaps.slice(0, 10); // Return up to 10 most significant gaps
}

/**
 * IMPROVED: Validate user FVG markings with better matching logic
 */
export function validateFairValueGaps(drawings, expectedGaps, chartData, gapType) {
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
  
  // Calculate tolerances based on actual data
  const allPrices = chartData.flatMap(c => [c.high, c.low]);
  const priceRange = Math.max(...allPrices) - Math.min(...allPrices);
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  
  // Dynamic price tolerance: 2% of price range or 0.5% of average price (whichever is larger)
  const priceTolerance = Math.max(priceRange * 0.02, avgPrice * 0.005);
  
  // Time tolerance: Allow marking anywhere within the 3-candle formation
  const timePoints = chartData.map(c => c.time || Math.floor(new Date(c.date).getTime() / 1000));
  const avgTimeIncrement = (timePoints[timePoints.length - 1] - timePoints[0]) / (timePoints.length - 1);
  const timeTolerance = avgTimeIncrement * 4; // Allow 4 candle periods of tolerance
  
  console.log(`[Validation] Price tolerance: ±${priceTolerance.toFixed(4)}, Time tolerance: ±${timeTolerance}s`);
  
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
      
      // Also check for horizontal line matches
      if (drawing.drawingType === 'hline' || 
          Math.abs(drawing.topPrice - drawing.bottomPrice) < priceTolerance / 10) {
        const linePrice = (drawing.topPrice + drawing.bottomPrice) / 2;
        const gapMidPrice = (gap.topPrice + gap.bottomPrice) / 2;
        
        if (Math.abs(linePrice - gapMidPrice) <= priceTolerance &&
            linePrice >= gap.bottomPrice - priceTolerance &&
            linePrice <= gap.topPrice + priceTolerance) {
          const score = 0.7; // Horizontal lines get partial credit
          if (score > bestScore) {
            bestScore = score;
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
    return drawingType === 'hline' 
      ? "Good! H-line correctly marks the FVG zone."
      : "Good! FVG identified with minor boundary differences.";
  } else {
    return "Acceptable. Consider more precise boundary marking.";
  }
}

function getIncorrectGapAdvice(drawing, expectedGaps, gapType) {
  // Check if drawing is in wrong location
  const drawingMid = (drawing.topPrice + drawing.bottomPrice) / 2;
  
  for (const gap of expectedGaps) {
    const gapMid = (gap.topPrice + gap.bottomPrice) / 2;
    const distance = Math.abs(drawingMid - gapMid);
    const gapSize = gap.topPrice - gap.bottomPrice;
    
    // If drawing is close to a real gap but misaligned
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
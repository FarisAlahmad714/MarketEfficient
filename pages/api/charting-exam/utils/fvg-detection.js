// pages/api/charting-exam/utils/fvg-detection.js

// Detect Fair Value Gaps in chart data
export function detectFairValueGaps(chartData, gapType = 'bullish', minGapPercent = 0.005) {
    if (!chartData || chartData.length < 3) {
      return [];
    }
    
    const gaps = [];
    
    // Calculate minimum gap size for significance
    const priceRange = Math.max(...chartData.map(c => c.high)) - 
                      Math.min(...chartData.map(c => c.low));
    const minGapSize = priceRange * minGapPercent;
    
    // Look for exactly THREE candle patterns
    for (let i = 0; i < chartData.length - 2; i++) {
      const firstCandle = chartData[i];
      const middleCandle = chartData[i + 1];
      const thirdCandle = chartData[i + 2];
      
      if (gapType === 'bullish') {
        // For bullish FVG: FIRST candle high and THIRD candle low must NOT overlap
        const gapSize = thirdCandle.low - firstCandle.high;
        
        if (gapSize > 0 && gapSize >= minGapSize) {
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
        // For bearish FVG: FIRST candle low and THIRD candle high must NOT overlap
        const gapSize = firstCandle.low - thirdCandle.high;
        
        if (gapSize > 0 && gapSize >= minGapSize) {
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
    
    // Limit to the 5 most significant gaps to avoid overcrowding
    return gaps.slice(0, 5);
  }
  
  // Check if an FVG has been filled
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
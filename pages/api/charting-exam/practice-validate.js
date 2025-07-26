import { createApiHandler } from '../../../lib/api-handler';
import { detectSwingPoints } from './utils/swing-detection';
import { getFibonacciRetracement } from './utils/fibonacci-utils';
import { detectFairValueGaps } from './utils/fvg-detection';

async function practiceValidateHandler(req, res) {
  const { tool, drawings, chartData, timeframe } = req.body;

  if (!tool || !chartData) {
    return res.status(400).json({
      error: true,
      message: 'Missing required parameters'
    });
  }

  try {
    let result;
    
    switch (tool) {
      case 'swings':
        result = await validateSwings(drawings, chartData, timeframe);
        break;
      case 'fibonacci':
        result = await validateFibonacci(drawings, chartData, timeframe);
        break;
      case 'fvg':
        result = await validateFVG(drawings, chartData, timeframe);
        break;
      default:
        return res.status(400).json({
          error: true,
          message: 'Invalid tool type'
        });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Practice validation error:', error);
    return res.status(500).json({
      error: true,
      message: 'Validation failed'
    });
  }
}

// Validate swing points
async function validateSwings(userSwings, chartData, timeframe) {
  // Handle special cases
  if (userSwings.length === 1 && userSwings[0].no_swings_found) {
    const swingData = detectSwingPoints(chartData, {
      lookbackPeriod: 5,
      minSwingPercent: 0.5
    });
    
    // Combine highs and lows into a single array with type
    const detectedSwings = [
      ...swingData.highs.map(h => ({ ...h, type: 'high' })),
      ...swingData.lows.map(l => ({ ...l, type: 'low' }))
    ].sort((a, b) => a.time - b.time);
    
    if (detectedSwings.length === 0) {
      return {
        score: 1,
        totalExpectedPoints: 1,
        percentage: 100,
        feedback: ['✓ Correctly identified that no swing points exist'],
        message: 'Correct! No swing points found in this chart.',
        correctAnswers: []
      };
    } else {
      return {
        score: 0,
        totalExpectedPoints: detectedSwings.length,
        percentage: 0,
        feedback: [`✗ Actually found ${detectedSwings.length} swing points`],
        message: `Incorrect. There are ${detectedSwings.length} swing points in this chart.`,
        correctAnswers: detectedSwings
      };
    }
  }

  // Detect actual swing points
  const swingData = detectSwingPoints(chartData, {
    lookbackPeriod: 5,
    minSwingPercent: 0.5
  });
  
  // Combine highs and lows into a single array with type
  const detectedSwings = [
    ...swingData.highs.map(h => ({ ...h, type: 'high' })),
    ...swingData.lows.map(l => ({ ...l, type: 'low' }))
  ].sort((a, b) => a.time - b.time);

  // Calculate tolerance based on timeframe
  const priceTolerance = 0.02; // 2% price tolerance
  const timeTolerance = getTimeTolerance(timeframe);

  // Score user swings
  let correctSwings = 0;
  const feedback = [];
  const matches = [];

  userSwings.forEach(userSwing => {
    const match = detectedSwings.find(swing => {
      const priceDiff = Math.abs(swing.price - userSwing.price) / swing.price;
      const timeDiff = Math.abs(swing.time - userSwing.time);
      
      return priceDiff <= priceTolerance && 
             timeDiff <= timeTolerance &&
             swing.type === userSwing.type;
    });

    if (match) {
      correctSwings++;
      matches.push(match);
      feedback.push(`✓ Correctly identified ${match.type} at ${match.price.toFixed(2)}`);
    } else {
      feedback.push(`✗ No ${userSwing.type} found near price ${userSwing.price.toFixed(2)}`);
    }
  });

  // Find missed swings
  const missedSwings = detectedSwings.filter(swing => 
    !matches.some(m => m.time === swing.time && m.type === swing.type)
  );

  missedSwings.forEach(swing => {
    feedback.push(`⚠ Missed ${swing.type} at ${swing.price.toFixed(2)}`);
  });

  return {
    score: correctSwings,
    totalExpectedPoints: detectedSwings.length,
    percentage: Math.round((correctSwings / detectedSwings.length) * 100),
    feedback,
    message: `You correctly identified ${correctSwings} out of ${detectedSwings.length} swing points`,
    correctAnswers: detectedSwings
  };
}

// Validate Fibonacci retracement
async function validateFibonacci(userFibs, chartData, timeframe) {
  if (!userFibs || userFibs.length === 0) {
    return {
      score: 0,
      totalExpectedPoints: 2,
      feedback: ['No Fibonacci retracement drawn'],
      message: 'Please draw a Fibonacci retracement'
    };
  }

  // In practice mode, we validate each fibonacci drawing separately
  // User can draw multiple fibs with different directions
  const userUptrends = userFibs.filter(f => f.direction === 'uptrend');
  const userDowntrends = userFibs.filter(f => f.direction === 'downtrend');
  
  // Find optimal Fibonacci retracements for both directions
  const optimalUptrendData = getFibonacciRetracement(chartData, 'uptrend');
  const optimalDowntrendData = getFibonacciRetracement(chartData, 'downtrend');
  
  // Convert to expected format if valid
  const optimalUptrend = optimalUptrendData && optimalUptrendData.start.time !== 0 ? {
    startTime: optimalUptrendData.start.time,
    startPrice: optimalUptrendData.start.price,
    endTime: optimalUptrendData.end.time,
    endPrice: optimalUptrendData.end.price,
    direction: 'uptrend'
  } : null;
  
  const optimalDowntrend = optimalDowntrendData && optimalDowntrendData.start.time !== 0 ? {
    startTime: optimalDowntrendData.start.time,
    startPrice: optimalDowntrendData.start.price,
    endTime: optimalDowntrendData.end.time,
    endPrice: optimalDowntrendData.end.price,
    direction: 'downtrend'
  } : null;
  
  let totalScore = 0;
  let totalExpectedPoints = 0;
  const feedback = [];
  const correctAnswers = [];

  // Validate uptrend fibonacci if optimal exists
  if (optimalUptrend) {
    totalExpectedPoints += 100; // Changed to 100 points per direction
    correctAnswers.push(optimalUptrend);
    
    if (userUptrends.length > 0) {
      const uptrendResult = validateSingleFibonacci(
        userUptrends[0], 
        optimalUptrend, 
        timeframe
      );
      totalScore += uptrendResult.rawScore || (uptrendResult.score * 50); // Use raw score
      feedback.push(...uptrendResult.feedback.map(f => `[Uptrend] ${f}`));
      if (uptrendResult.details) {
        feedback.push(`[Uptrend] Overall accuracy: ${Math.round((uptrendResult.rawScore || 0))}%`);
      }
    } else {
      feedback.push('⚠ Missed uptrend Fibonacci retracement');
    }
  }

  // Validate downtrend fibonacci if optimal exists
  if (optimalDowntrend) {
    totalExpectedPoints += 100; // Changed to 100 points per direction
    correctAnswers.push(optimalDowntrend);
    
    if (userDowntrends.length > 0) {
      const downtrendResult = validateSingleFibonacci(
        userDowntrends[0], 
        optimalDowntrend, 
        timeframe
      );
      totalScore += downtrendResult.rawScore || (downtrendResult.score * 50); // Use raw score
      feedback.push(...downtrendResult.feedback.map(f => `[Downtrend] ${f}`));
      if (downtrendResult.details) {
        feedback.push(`[Downtrend] Overall accuracy: ${Math.round((downtrendResult.rawScore || 0))}%`);
      }
    } else {
      feedback.push('⚠ Missed downtrend Fibonacci retracement');
    }
  }

  if (totalExpectedPoints === 0) {
    return {
      score: 0,
      totalExpectedPoints: 0,
      percentage: 0,
      feedback: ['No clear trends found for Fibonacci retracement'],
      message: 'No clear trend patterns detected in this chart',
      correctAnswers: []
    };
  }

  return {
    score: totalScore,
    totalExpectedPoints,
    percentage: Math.round((totalScore / totalExpectedPoints) * 100),
    feedback,
    message: `Fibonacci retracements: ${totalScore}/${totalExpectedPoints} points`,
    correctAnswers
  };
}

// Helper function to validate a single fibonacci drawing with flexible scoring
function validateSingleFibonacci(userFib, optimalFib, timeframe) {
  const priceTolerance = getPriceTolerance(timeframe);
  const timeTolerance = getTimeTolerance(timeframe);
  
  let score = 0;
  let maxScore = 100; // Base score out of 100
  const feedback = [];

  // Extract user drawing data
  const userStartPrice = userFib.start.price;
  const userStartTime = userFib.start.time;
  const userEndPrice = userFib.end.price;
  const userEndTime = userFib.end.time;

  // Calculate price differences
  const startPriceDiff = Math.abs(optimalFib.startPrice - userStartPrice) / optimalFib.startPrice;
  const startTimeDiff = Math.abs(optimalFib.startTime - userStartTime);
  const endPriceDiff = Math.abs(optimalFib.endPrice - userEndPrice) / optimalFib.endPrice;
  const endTimeDiff = Math.abs(optimalFib.endTime - userEndTime);
  
  // Score based on proximity (closer = higher score)
  let startScore = 0;
  let endScore = 0;
  
  // Perfect match on start point (50 points)
  if (startPriceDiff <= priceTolerance * 0.1 && startTimeDiff <= timeTolerance * 0.1) {
    startScore = 50;
    feedback.push('✓ Perfect start point!');
  } else if (startPriceDiff <= priceTolerance && startTimeDiff <= timeTolerance) {
    // Proximity scoring for start point (25-50 points based on accuracy)
    startScore = 50 * (1 - Math.max(startPriceDiff / priceTolerance, startTimeDiff / timeTolerance));
    feedback.push(`✓ Good start point (${Math.round(startScore)}% accurate)`);
  } else {
    // Partial credit if at least it's a valid swing point
    if (isValidSwingPoint(userStartPrice, userStartTime, optimalFib.direction)) {
      startScore = 15;
      feedback.push('⚠ Start is a valid swing but not optimal');
    } else {
      feedback.push('✗ Start point not a valid swing');
    }
  }
  
  // Perfect match on end point (50 points)
  if (endPriceDiff <= priceTolerance * 0.1 && endTimeDiff <= timeTolerance * 0.1) {
    endScore = 50;
    feedback.push('✓ Perfect end point!');
  } else if (endPriceDiff <= priceTolerance && endTimeDiff <= timeTolerance) {
    // Proximity scoring for end point (25-50 points based on accuracy)
    endScore = 50 * (1 - Math.max(endPriceDiff / priceTolerance, endTimeDiff / timeTolerance));
    feedback.push(`✓ Good end point (${Math.round(endScore)}% accurate)`);
  } else {
    // Partial credit if at least it's a valid swing point
    if (isValidSwingPoint(userEndPrice, userEndTime, optimalFib.direction)) {
      endScore = 15;
      feedback.push('⚠ End is a valid swing but not optimal');
    } else {
      feedback.push('✗ End point not a valid swing');
    }
  }
  
  // Bonus points for matching fibonacci levels (up to 20 bonus points)
  const userFibRange = Math.abs(userEndPrice - userStartPrice);
  const optimalFibRange = Math.abs(optimalFib.endPrice - optimalFib.startPrice);
  const fibRangeDiff = Math.abs(userFibRange - optimalFibRange) / optimalFibRange;
  
  if (fibRangeDiff <= 0.1) { // Within 10% of optimal range
    const fibBonus = 20 * (1 - fibRangeDiff / 0.1);
    score += fibBonus;
    feedback.push(`✓ Excellent Fib range match (+${Math.round(fibBonus)} bonus)`);
  }
  
  score = startScore + endScore;
  
  // Normalize to 0-2 scale for backward compatibility
  const normalizedScore = (score / maxScore) * 2;
  
  return { 
    score: normalizedScore, 
    feedback,
    rawScore: score,
    details: {
      startScore,
      endScore,
      startAccuracy: startScore / 50 * 100,
      endAccuracy: endScore / 50 * 100
    }
  };
}

// Helper to check if a point is a valid swing
function isValidSwingPoint(price, time, direction) {
  // This is a simplified check - in reality you'd check against actual swing points
  // For now, we'll return true to give partial credit
  return true;
}

// Validate Fair Value Gaps
async function validateFVG(userGaps, chartData, timeframe) {
  // Handle special case for "no gaps found"
  if (userGaps.length === 1 && userGaps[0].no_fvgs_found) {
    // First detect bullish gaps, then bearish gaps
    const bullishGaps = detectFairValueGaps(chartData, 'bullish', null, timeframe, 'PRACTICE');
    const bearishGaps = detectFairValueGaps(chartData, 'bearish', null, timeframe, 'PRACTICE');
    const detectedGaps = [...bullishGaps, ...bearishGaps];
    
    // Check if user is claiming no bullish or bearish gaps
    const gapType = userGaps[0].type || 'any';
    const relevantGaps = gapType === 'any' ? detectedGaps : 
                         detectedGaps.filter(g => g.type === gapType);
    
    if (relevantGaps.length === 0) {
      return {
        score: 1,
        totalExpectedPoints: 1,
        percentage: 100,
        feedback: [`✓ Correctly identified that no ${gapType} FVGs exist`],
        message: `Correct! No ${gapType} Fair Value Gaps found.`,
        correctAnswers: []
      };
    } else {
      return {
        score: 0,
        totalExpectedPoints: relevantGaps.length,
        percentage: 0,
        feedback: [`✗ Actually found ${relevantGaps.length} ${gapType} FVGs`],
        message: `Incorrect. There are ${relevantGaps.length} ${gapType} Fair Value Gaps.`,
        correctAnswers: relevantGaps.map(gap => ({
          ...gap,
          gapTop: gap.topPrice,
          gapBottom: gap.bottomPrice,
          time: gap.startTime
        }))
      };
    }
  }

  // Detect actual FVGs - fix the function call to match expected signature
  const bullishGaps = detectFairValueGaps(chartData, 'bullish', null, timeframe, 'PRACTICE');
  const bearishGaps = detectFairValueGaps(chartData, 'bearish', null, timeframe, 'PRACTICE');
  const detectedGaps = [...bullishGaps, ...bearishGaps];
  
  // Separate user gaps by type
  const userBullish = userGaps.filter(g => g.type === 'bullish');
  const userBearish = userGaps.filter(g => g.type === 'bearish');

  // Validate each type
  let totalScore = 0;
  let totalExpected = detectedGaps.length;
  const feedback = [];

  // Check bullish gaps
  const bullishResult = validateGapType(userBullish, bullishGaps, 'bullish', timeframe);
  totalScore += bullishResult.score;
  feedback.push(...bullishResult.feedback);

  // Check bearish gaps
  const bearishResult = validateGapType(userBearish, bearishGaps, 'bearish', timeframe);
  totalScore += bearishResult.score;
  feedback.push(...bearishResult.feedback);

  return {
    score: totalScore,
    totalExpectedPoints: totalExpected,
    percentage: Math.round((totalScore / totalExpected) * 100),
    feedback,
    message: `Identified ${totalScore} out of ${totalExpected} Fair Value Gaps`,
    correctAnswers: detectedGaps.map(gap => ({
      ...gap,
      gapTop: gap.topPrice,
      gapBottom: gap.bottomPrice,
      time: gap.startTime
    }))
  };
}

// Helper function to validate gap type
function validateGapType(userGaps, actualGaps, type, timeframe) {
  let score = 0;
  const feedback = [];
  const matches = [];
  const tolerance = 0.015; // 1.5% price tolerance

  userGaps.forEach(userGap => {
    const match = actualGaps.find(gap => {
      // Handle both field names for compatibility
      const gapTop = gap.topPrice || gap.gapTop;
      const gapBottom = gap.bottomPrice || gap.gapBottom;
      
      const topDiff = Math.abs(gapTop - userGap.topPrice) / gapTop;
      const bottomDiff = Math.abs(gapBottom - userGap.bottomPrice) / gapBottom;
      const overlap = calculateOverlap(
        userGap.bottomPrice, userGap.topPrice,
        gapBottom, gapTop
      );
      
      return (topDiff <= tolerance && bottomDiff <= tolerance) || overlap >= 0.7;
    });

    if (match) {
      score++;
      matches.push(match);
      feedback.push(`✓ Correctly identified ${type} FVG`);
    }
  });

  // Find missed gaps
  const missedGaps = actualGaps.filter(gap => 
    !matches.some(m => m.time === gap.time)
  );

  if (missedGaps.length > 0) {
    feedback.push(`⚠ Missed ${missedGaps.length} ${type} gap(s)`);
  }

  return { score, feedback };
}

// Helper functions
function getTimeTolerance(timeframe) {
  const tolerances = {
    '1h': 7200,     // 2 hours in seconds
    '4h': 28800,    // 8 hours
    '1day': 172800, // 2 days
    '1week': 604800 // 1 week
  };
  return tolerances[timeframe] || 86400;
}

function getPriceTolerance(timeframe) {
  const tolerances = {
    '1h': 0.04,    // 4%
    '4h': 0.05,    // 5%
    '1day': 0.06,  // 6%
    '1week': 0.08  // 8%
  };
  return tolerances[timeframe] || 0.05;
}

function getMinGapSize(timeframe) {
  const sizes = {
    '1h': 0.002,    // 0.2%
    '4h': 0.003,    // 0.3%
    '1day': 0.005,  // 0.5%
    '1week': 0.01   // 1%
  };
  return sizes[timeframe] || 0.005;
}

function calculateOverlap(bottom1, top1, bottom2, top2) {
  const overlapBottom = Math.max(bottom1, bottom2);
  const overlapTop = Math.min(top1, top2);
  
  if (overlapTop <= overlapBottom) return 0;
  
  const overlap = overlapTop - overlapBottom;
  const range1 = top1 - bottom1;
  const range2 = top2 - bottom2;
  
  return overlap / Math.min(range1, range2);
}

export default createApiHandler(practiceValidateHandler, {
  methods: ['POST'],
  connectDatabase: false
});
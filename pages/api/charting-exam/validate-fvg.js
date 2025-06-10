// pages/api/charting-exam/validate-fvg.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { detectFairValueGaps } from './utils/fvg-detection';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger';
import { validateTimeWindow, recordSubmission, endChartSession } from '../../../lib/timeWindow';
async function validateFvgHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  // Get the data from the request body instead of relying on session
  const { drawings, chartData, chartCount, part, timeframe } = req.body;
  
  // Validate time window
  const timeValidation = validateTimeWindow(userId, 'fvg', chartCount, part);
  if (!timeValidation.valid) {
    return res.status(400).json({
      error: timeValidation.error,
      message: timeValidation.message,
      code: timeValidation.code,
      timeSpent: timeValidation.timeSpent,
      attempts: timeValidation.attempts
    });
  }
  
  if (!drawings) {
    return res.status(400).json({ 
      error: 'Invalid drawings data',
      code: 'INVALID_DRAWINGS'
    });
  }
  
  // Validate chart data is provided in the request
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return res.status(400).json({ 
      error: 'No chart data provided in request',
      code: 'MISSING_CHART_DATA'
    });
  }
  
  // Extract asset symbol and timeframe from the request
  const symbol = 'MULTIASSET';
  const chartTimeframe = timeframe || chartData.timeframe || '1d';
  
  logger.log(`Validating ${part === 1 ? 'bullish' : 'bearish'} FVGs for ${symbol} on ${chartTimeframe} timeframe`);
  
  // Detect expected FVGs with adaptive minimum gap size
  const gapType = part === 1 ? 'bullish' : 'bearish';
  const expectedGaps = detectFairValueGaps(chartData, gapType, null, chartTimeframe, symbol);
  
  // Validate user drawings against expected gaps
  const validationResult = validateFairValueGaps(drawings, expectedGaps, chartData, gapType, chartTimeframe);
  
  // Save test result to database
  const testResult = new TestResults({
    userId: userId,
    testType: 'chart-exam',
    subType: 'fair-value-gaps',
    assetSymbol: symbol,
    score: validationResult.score,
    totalPoints: validationResult.totalExpectedPoints,
    details: {
      feedback: validationResult.feedback,
      expected: { gaps: expectedGaps },
      part: part,
      timeframe: chartTimeframe
    },
    completedAt: new Date()
  });
  
  await testResult.save();
  logger.log(`FVG test result saved, score: ${validationResult.score}/${validationResult.totalExpectedPoints}`);
  
  // Record submission for analytics
  recordSubmission(timeValidation.session.sessionKey || `${userId}_fvg_${chartCount}_${part}`, {
    score: validationResult.score,
    totalPoints: validationResult.totalExpectedPoints,
    drawings: drawings.length,
    timeSpent: timeValidation.timeSpent,
    part: part
  });
  
  // End session and collect analytics
  const sessionAnalytics = endChartSession(userId, 'fvg', chartCount, part);
  
  return res.status(200).json({
    success: true,
    message: validationResult.message,
    score: validationResult.score,
    totalExpectedPoints: validationResult.totalExpectedPoints,
    feedback: validationResult.feedback,
    expected: { gaps: expectedGaps },
    chart_count: chartCount,
    next_part: part === 1 ? 2 : null,
    timeRemaining: timeValidation.timeRemaining,
    timeSpent: timeValidation.timeSpent,
    attempts: timeValidation.attempts
  });
}

// Validate user FVG markings against expected gaps
function validateFairValueGaps(drawings, expectedGaps, chartData, gapType, chartTimeframe) {
  // Handle "No FVGs Found" case
  if (drawings.length === 1 && drawings[0].no_fvgs_found) {
    if (expectedGaps.length === 0) {
      // Correctly identified no gaps
      return {
        success: true,
        message: `Correct! No significant ${gapType} fair value gaps in this chart.`,
        score: 1,
        totalExpectedPoints: 1,
        feedback: {
          correct: [{
            type: 'no_gaps',
            advice: `You correctly identified that there are no ${gapType} fair value gaps in this chart.`
          }],
          incorrect: []
        }
      };
    } else {
      // Incorrectly marked "No FVGs" when gaps exist
      return {
        success: false,
        message: `Incorrect. ${expectedGaps.length} ${gapType} fair value gaps were present in this chart.`,
        score: 0,
        totalExpectedPoints: expectedGaps.length,
        feedback: {
          correct: [],
          incorrect: [{
            type: 'missed_all_gaps',
            advice: `You marked "No FVGs Found" but there are ${expectedGaps.length} ${gapType} fair value gaps in this chart.`
          }]
        }
      };
    }
  }
  
  // If expected has no gaps but user marked some
  if (expectedGaps.length === 0) {
    return {
      success: false,
      message: `No significant ${gapType} fair value gaps detected in this chart.`,
      score: 0,
      totalExpectedPoints: 1,
      feedback: {
        correct: [],
        incorrect: [{
          type: 'no_gaps',
          advice: `There are no significant ${gapType} fair value gaps in this chart. Use the "No FVGs Found" button when appropriate.`
        }]
      }
    };
  }
  
  // Calculate price range for tolerance
  const priceRange = Math.max(...chartData.map(c => c.high)) - 
                   Math.min(...chartData.map(c => c.low));
  
  const priceTolerance = priceRange * 0.015; // 1.5% of the price range
  
  // Get time increment based on chart data
  const timePoints = chartData.map(c => c.time || Math.floor(new Date(c.date).getTime() / 1000)).sort();
  const avgTimeIncrement = timePoints.length > 1 
    ? (timePoints[timePoints.length - 1] - timePoints[0]) / timePoints.length 
    : 86400; // 1 day in seconds
  
  const timeTolerance = avgTimeIncrement * 3;
  
  let matched = 0;
  const feedback = { correct: [], incorrect: [] };
  const usedGaps = new Set();
  
  // Analyze each drawing
  for (const drawing of drawings) {
    const drawingType = drawing.type || gapType;
    
    // Skip the No FVGs Found entry which was handled earlier
    if (drawing.no_fvgs_found) continue;
    
    if (drawingType !== gapType) {
      feedback.incorrect.push({
        type: 'incorrect_type',
        topPrice: drawing.topPrice,
        bottomPrice: drawing.bottomPrice,
        advice: `You marked a ${drawingType} gap, but we're looking for ${gapType} gaps in this part.`
      });
      continue;
    }
    
    let gapMatched = false;
    
    for (let i = 0; i < expectedGaps.length; i++) {
      if (usedGaps.has(i)) continue;
      
      const gap = expectedGaps[i];
      const isHLine = drawing.drawingType === 'hline' || 
                    Math.abs(drawing.topPrice - drawing.bottomPrice) < priceTolerance / 10;
      
      if (isHLine) {
        // For horizontal lines, check if line is in the gap area
        const price = drawing.topPrice;
        const gapMedian = (gap.topPrice + gap.bottomPrice) / 2;
        const priceMatch = Math.abs(price - gapMedian) <= priceTolerance;
        
        // Time should be within the FVG timeframe
        const timeMatch = drawing.startTime >= gap.startTime - timeTolerance && 
                        drawing.startTime <= gap.endTime + timeTolerance;
        
        if (priceMatch && timeMatch) {
          matched++;
          usedGaps.add(i);
          gapMatched = true;
          
          feedback.correct.push({
            type: gapType,
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            advice: `Good! You correctly identified a ${gapType} FVG at ${gap.topPrice.toFixed(2)} - ${gap.bottomPrice.toFixed(2)}.`
          });
          break;
        }
      } else {
        // For rectangles, check if the drawing overlaps with the gap
        const priceOverlap = Math.max(0, 
          Math.min(drawing.topPrice, gap.topPrice) - Math.max(drawing.bottomPrice, gap.bottomPrice)
        );
        const gapHeight = gap.topPrice - gap.bottomPrice;
        const overlapRatio = priceOverlap / gapHeight;
        
        // Time should be within the FVG timeframe
        const timeMatch = drawing.startTime >= gap.startTime - timeTolerance && 
                        drawing.endTime <= gap.endTime + timeTolerance;
        
        if (overlapRatio >= 0.7 && timeMatch) { // 70% overlap required
          matched++;
          usedGaps.add(i);
          gapMatched = true;
          
          feedback.correct.push({
            type: gapType,
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            advice: `Great! You correctly identified a ${gapType} FVG from ${gap.topPrice.toFixed(2)} to ${gap.bottomPrice.toFixed(2)}.`
          });
          break;
        }
      }
    }
    
    if (!gapMatched) {
      feedback.incorrect.push({
        type: 'no_match',
        topPrice: drawing.topPrice,
        bottomPrice: drawing.bottomPrice,
        advice: getFVGAdviceMessage(gapType)
      });
    }
  }
  
  // Add feedback for missed gaps
  for (let i = 0; i < expectedGaps.length; i++) {
    if (!usedGaps.has(i)) {
      const gap = expectedGaps[i];
      feedback.incorrect.push({
        type: 'missed',
        topPrice: gap.topPrice,
        bottomPrice: gap.bottomPrice,
        advice: `You missed a ${gapType} FVG at ${gap.topPrice.toFixed(2)} - ${gap.bottomPrice.toFixed(2)}. ${getFVGFormationMessage(gapType)}`
      });
    }
  }
  
  const percentage = expectedGaps.length > 0 ? (matched / expectedGaps.length) * 100 : 0;
  
  return {
    success: matched === expectedGaps.length,
    message: `You identified ${matched} out of ${expectedGaps.length} ${gapType} fair value gaps (${percentage.toFixed(0)}%)`,
    score: matched,
    totalExpectedPoints: expectedGaps.length,
    feedback
  };
}

function getFVGAdviceMessage(gapType) {
  return gapType === 'bullish' 
    ? 'Look for gaps where the low of one candle is above the high of another candle, typically after strong upward moves.'
    : 'Look for gaps where the high of one candle is below the low of another candle, typically after strong downward moves.';
}

function getFVGFormationMessage(gapType) {
  return gapType === 'bullish'
    ? 'Bullish FVGs form when price gaps up, leaving empty space between the low of the current candle and the high of a previous candle.'
    : 'Bearish FVGs form when price gaps down, leaving empty space between the high of the current candle and the low of a previous candle.';
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, validateFvgHandler),
  { methods: ['POST'] }
);
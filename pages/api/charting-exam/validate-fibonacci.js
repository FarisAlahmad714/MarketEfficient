// pages/api/charting-exam/validate-fibonacci.js
import { getFibonacciRetracement, calculateFibonacciLevels } from './utils/fibonacci-utils.js';
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger';
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { validateTimeWindow, recordSubmission, endChartSession } from '../../../lib/timeWindow';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // User is already verified by requireAuth middleware
    const userId = req.user.id;
    
    const { drawings, chartData, chartCount, part } = req.body;
    
    // Validate time window
    const timeValidation = validateTimeWindow(userId, 'fibonacci', chartCount, part);
    if (!timeValidation.valid) {
      return res.status(400).json({
        error: timeValidation.error,
        message: timeValidation.message,
        code: timeValidation.code,
        timeSpent: timeValidation.timeSpent,
        attempts: timeValidation.attempts
      });
    }
    
    if (!drawings || !Array.isArray(drawings)) {
      return res.status(400).json({ error: 'Invalid drawings data' });
    }
    
    // Ensure we have chart data to work with
    if (!chartData || !Array.isArray(chartData) || chartData.length < 10) {
      return res.status(400).json({
        error: 'Invalid chart data',
        message: 'Chart data is missing or insufficient for analysis'
      });
    }
    
    // Calculate expected Fibonacci retracement
    const expectedRetracement = getFibonacciRetracement(
      chartData, 
      part === 1 ? 'uptrend' : 'downtrend'
    );
    
    // Validate user drawings against expected retracement
    const validationResult = validateFibonacciRetracement(drawings, expectedRetracement, chartData, part);
    
    // Connect to database before saving the test result
    await connectDB();
    
    // Save test result to database
    const symbol = req.body.symbol || 'MULTIASSET';
    
    // FIXED: Added missing variable declaration
    const testResult = new TestResults({
      userId: userId,
      testType: 'chart-exam',
      subType: 'fibonacci-retracement',
      assetSymbol: symbol,
      score: validationResult.score,
      totalPoints: validationResult.totalExpectedPoints,
      details: {
        feedback: validationResult.feedback,
        expected: {
          start: expectedRetracement.start,
          end: expectedRetracement.end,
          direction: expectedRetracement.direction,
          levels: calculateFibonacciLevels(expectedRetracement.start, expectedRetracement.end).levels
        },
        part: part
      },
      completedAt: new Date()
    });
    
    await testResult.save();
  logger.log(`Fibonacci test result saved, score: ${validationResult.score}/${validationResult.totalExpectedPoints}`);
    
    // Check for new badges after saving test result
    try {
      const { checkAndNotifyNewBadges } = await import('../../../lib/badge-service');
      const badgeResult = await checkAndNotifyNewBadges(userId);
      if (badgeResult.success && badgeResult.newBadges > 0) {
        logger.log(`User ${userId} earned ${badgeResult.newBadges} new badges:`, badgeResult.badges);
      }
    } catch (badgeError) {
      logger.error('Error checking for new badges:', badgeError);
      // Don't fail the main request if badge checking fails
    }
    
    // Record submission for analytics
    recordSubmission(timeValidation.session.sessionKey || `${userId}_fibonacci_${chartCount}_${part}`, {
      score: validationResult.score,
      totalPoints: validationResult.totalExpectedPoints,
      drawings: drawings.length,
      timeSpent: timeValidation.timeSpent,
      part: part
    });
    
    // End session and collect analytics
    const sessionAnalytics = await endChartSession(userId, 'fibonacci', chartCount, part);
    
    return res.status(200).json({
      success: true,
      message: validationResult.message,
      score: validationResult.score,
      totalExpectedPoints: validationResult.totalExpectedPoints,
      feedback: validationResult.feedback,
      expected: {
        start: expectedRetracement.start,
        end: expectedRetracement.end,
        direction: expectedRetracement.direction,
        levels: calculateFibonacciLevels(expectedRetracement.start, expectedRetracement.end).levels,
        analysis: generateFibonacciAnalysis(expectedRetracement, chartData, validationResult.alternativeRetracements || [])
      },
      chart_count: chartCount,
      next_part: part === 1 ? 2 : null,
      timeRemaining: timeValidation.timeRemaining,
      timeSpent: timeValidation.timeSpent,
      attempts: timeValidation.attempts
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
}

/**
 * Determine the timeframe of chart data
 * @param {Array} chartData - Chart data
 * @returns {String} Timeframe code (1h, 4h, 1d, 1w)
 */
function determineTimeframe(chartData) {
  if (!chartData || chartData.length < 2) return '1d';
  
  // Get timestamps, handling different possible formats
  const timestamps = [];
  
  for (let i = 0; i < Math.min(chartData.length, 10); i++) {
    const candle = chartData[i];
    let time;
    
    if (typeof candle.time === 'number') {
      time = candle.time;
    } else if (candle.date) {
      if (typeof candle.date === 'number') {
        time = candle.date;
      } else if (typeof candle.date === 'string') {
        time = new Date(candle.date).getTime() / 1000;
      }
    }
    
    if (time && !isNaN(time)) timestamps.push(time);
  }
  
  if (timestamps.length < 2) return '1d';
  
  // Calculate average interval between candles
  let sumIntervals = 0;
  let countIntervals = 0;
  
  for (let i = 1; i < timestamps.length; i++) {
    const interval = Math.abs(timestamps[i] - timestamps[i-1]);
    if (interval > 0) {
      sumIntervals += interval;
      countIntervals++;
    }
  }
  
  const avgInterval = countIntervals > 0 ? sumIntervals / countIntervals : 86400;
  
  // Determine timeframe based on average interval
  if (avgInterval < 7200) return '1h';       // < 2 hours
  if (avgInterval < 21600) return '4h';      // < 6 hours
  if (avgInterval < 172800) return '1d';     // < 2 days
  return '1w';                               // >= 2 days
}

/**
 * Validate user Fibonacci retracement against expected
 * @param {Array} drawings - User's Fibonacci drawings
 * @param {Object} expected - Expected Fibonacci retracement
 * @param {Array} chartData - Original chart data
 * @param {Number} part - Exam part (1 for uptrend, 2 for downtrend)
 * @returns {Object} Validation results with feedback
 */
function validateFibonacciRetracement(drawings, expected, chartData, part) {
  // Calculate price range for tolerance
  const priceRange = Math.max(...chartData.map(c => c.high)) - 
                    Math.min(...chartData.map(c => c.low));
  
  // Determine timeframe for appropriate tolerances
  const timeframe = determineTimeframe(chartData);
logger.log(`Detected timeframe for validation: ${timeframe}`);
  
  // MODIFIED: Increased tolerance percentages to be more forgiving
  const priceTolerances = {
    '1h': 0.04,  // Increased from 0.02 to 4%
    '4h': 0.05,  // Increased from 0.025 to 5%
    '1d': 0.06,  // Increased from 0.03 to 6%
    '1w': 0.08   // Increased from 0.04 to 8%
  };
  
  // MODIFIED: Increased time tolerances to be more forgiving
  const timeTolerances = {
    '1h': 12 * 3600,    // Increased from 6 to 12 hours
    '4h': 48 * 3600,    // Increased from 24 to 48 hours
    '1d': 5 * 86400,    // Increased from 3 to 5 days
    '1w': 14 * 86400    // Increased from 7 to 14 days
  };
  
  const priceTolerance = priceRange * (priceTolerances[timeframe] || 0.06);
  const timeTolerance = timeTolerances[timeframe] || (5 * 86400);
  
logger.log(`Validation tolerances: price=${priceTolerance.toFixed(4)}, time=${timeTolerance/3600}h`);
  
  const totalCredits = 2; // 1 for start point, 1 for end point
  let creditsEarned = 0;
  const feedback = { correct: [], incorrect: [] };
  
  // ADDED: Check for potential special cases or alternative valid retracements
  // Sometimes there can be multiple valid ways to interpret a chart
  let alternativeRetracements = findAlternativeRetracements(chartData, part);
  
  if (expected.start.time === 0 || expected.end.time === 0) {
    // No valid expected retracement found
    return {
      success: false,
      message: `No significant ${part === 1 ? 'uptrend' : 'downtrend'} retracement found in this chart.`,
      score: 0,
      totalExpectedPoints: totalCredits,
      feedback: {
        correct: [],
        incorrect: [{
          type: 'missed_retracement',
          direction: part === 1 ? 'uptrend' : 'downtrend',
          advice: `Couldn't find a clear ${part === 1 ? 'uptrend' : 'downtrend'} retracement in this chart.`
        }]
      }
    };
  }
  
  if (drawings.length === 0) {
    // No user drawings
    feedback.incorrect.push({
      type: 'missed_retracement',
      direction: expected.direction,
      startPrice: expected.start.price,
      endPrice: expected.end.price,
      advice: `You missed the ${expected.direction} retracement from ${expected.start.price.toFixed(2)} to ${expected.end.price.toFixed(2)}.`
    });
  } else {
    // Analyze each drawing
    for (const drawing of drawings) {
      // Skip invalid drawings
      if (!drawing.start || !drawing.end) {
        continue;
      }
      
      // Check direction based on price difference
      const userDirection = drawing.start.price > drawing.end.price ? 'uptrend' : 'downtrend';
      const directionMatched = userDirection === expected.direction;
      
      if (!directionMatched) {
        feedback.incorrect.push({
          type: 'incorrect_direction',
          direction: userDirection,
          startPrice: drawing.start.price,
          endPrice: drawing.end.price,
          advice: `Direction incorrect: Expected ${expected.direction}, but you drew a ${userDirection} from ${drawing.start.price.toFixed(2)} to ${drawing.end.price.toFixed(2)}.`
        });
        continue;
      }
      
      // Calculate percentage price difference for better feedback
      const startPriceDiffPercent = Math.abs(drawing.start.price - expected.start.price) / expected.start.price * 100;
      const endPriceDiffPercent = Math.abs(drawing.end.price - expected.end.price) / expected.end.price * 100;
      
      // Log detailed validation info for debugging
    logger.log(`Validating drawing: 
        Direction: ${userDirection}
        User Start: time=${drawing.start.time}, price=${drawing.start.price}
        Expected Start: time=${expected.start.time}, price=${expected.start.price}
        Start Diff: time=${Math.abs(drawing.start.time - expected.start.time)}s, price=${startPriceDiffPercent.toFixed(2)}%
        User End: time=${drawing.end.time}, price=${drawing.end.price}
        Expected End: time=${expected.end.time}, price=${expected.end.price}
        End Diff: time=${Math.abs(drawing.end.time - expected.end.time)}s, price=${endPriceDiffPercent.toFixed(2)}%
      `);
      
      // First check against primary expected retracement
      let startCredits = 0;
      let endCredits = 0;
      
      // Check start point
      const startTimeMatch = Math.abs(drawing.start.time - expected.start.time) < timeTolerance;
      const startPriceMatch = Math.abs(drawing.start.price - expected.start.price) < priceTolerance;
      
      const startExact = startTimeMatch && startPriceMatch;
      
      // Give partial credit for close matches
      const startClose = (Math.abs(drawing.start.time - expected.start.time) < timeTolerance * 2 &&
                        Math.abs(drawing.start.price - expected.start.price) < priceTolerance * 2);
      
      startCredits = startExact ? 1 : (startClose ? 0.5 : 0);
      
      // Check end point
      const endTimeMatch = Math.abs(drawing.end.time - expected.end.time) < timeTolerance;
      const endPriceMatch = Math.abs(drawing.end.price - expected.end.price) < priceTolerance;
      
      const endExact = endTimeMatch && endPriceMatch;
      
      // Give partial credit for close matches
      const endClose = (Math.abs(drawing.end.time - expected.end.time) < timeTolerance * 2 &&
                      Math.abs(drawing.end.price - expected.end.price) < priceTolerance * 2);
      
      endCredits = endExact ? 1 : (endClose ? 0.5 : 0);
      
      // NEW: Check alternative retracements if available
      if ((startCredits + endCredits) < 1 && alternativeRetracements.length > 0) {
        // Try checking against alternative retracements
        for (const alt of alternativeRetracements) {
          const altStartTimeMatch = Math.abs(drawing.start.time - alt.start.time) < timeTolerance;
          const altStartPriceMatch = Math.abs(drawing.start.price - alt.start.price) < priceTolerance;
          const altStartExact = altStartTimeMatch && altStartPriceMatch;
          
          const altStartClose = (Math.abs(drawing.start.time - alt.start.time) < timeTolerance * 2 &&
                           Math.abs(drawing.start.price - alt.start.price) < priceTolerance * 2);
          
          const altStartCredits = altStartExact ? 1 : (altStartClose ? 0.5 : 0);
          
          const altEndTimeMatch = Math.abs(drawing.end.time - alt.end.time) < timeTolerance;
          const altEndPriceMatch = Math.abs(drawing.end.price - alt.end.price) < priceTolerance;
          const altEndExact = altEndTimeMatch && altEndPriceMatch;
          
          const altEndClose = (Math.abs(drawing.end.time - alt.end.time) < timeTolerance * 2 &&
                         Math.abs(drawing.end.price - alt.end.price) < priceTolerance * 2);
          
          const altEndCredits = altEndExact ? 1 : (altEndClose ? 0.5 : 0);
          
          // Use alternative if better than primary expected retracement
          if ((altStartCredits + altEndCredits) > (startCredits + endCredits)) {
            startCredits = altStartCredits;
            endCredits = altEndCredits;
            // Update the expected retracement reference to the better matching alternative
            expected = alt;
          }
        }
      }
      
      // Add credits to total
      creditsEarned += startCredits + endCredits;
      
      // Add feedback based on accuracy
      if (startCredits > 0 || endCredits > 0) {
        // Generate detailed feedback for partial matches
        let startFeedback, endFeedback;
        
        if (startCredits >= 1) {
          startFeedback = 'Exact match';
        } else if (startCredits > 0) {
          startFeedback = `Close enough (${startPriceDiffPercent.toFixed(1)}% price diff)`;
        } else {
          startFeedback = 'Incorrect';
        }
        
        if (endCredits >= 1) {
          endFeedback = 'Exact match';
        } else if (endCredits > 0) {
          endFeedback = `Close enough (${endPriceDiffPercent.toFixed(1)}% price diff)`;
        } else {
          endFeedback = 'Incorrect';
        }
        
        feedback.correct.push({
          direction: userDirection,
          startPrice: drawing.start.price,
          endPrice: drawing.end.price,
          startCredits,
          endCredits,
          advice: `Start Point: ${startCredits}/1 (${startFeedback}), End Point: ${endCredits}/1 (${endFeedback})`
        });
      } else {
        // Provide specific feedback about why the drawing was incorrect
        let advice;
        
        // NEW: Special feedback for points near the correct area but still outside tolerance
        if (startPriceDiffPercent <= 15 || endPriceDiffPercent <= 15) {
          advice = `Your points are close, but not quite matching the significant ${expected.direction} retracement. Try adjusting to the major swing points.`;
        } else if (Math.abs(drawing.start.time - expected.start.time) > timeTolerance * 3 && 
            Math.abs(drawing.end.time - expected.end.time) > timeTolerance * 3) {
          advice = `Your Fibonacci points are in a completely different area of the chart than the expected ${expected.direction}.`;
        } else if (startPriceDiffPercent > 10 && endPriceDiffPercent > 10) {
          advice = `Your price levels are significantly off (${Math.min(startPriceDiffPercent, endPriceDiffPercent).toFixed(1)}% difference).`;
        } else {
          advice = `Your Fibonacci points don't match the significant ${expected.direction} move in this chart.`;
        }
        
        feedback.incorrect.push({
          type: 'completely_wrong',
          direction: userDirection,
          startPrice: drawing.start.price,
          endPrice: drawing.end.price,
          advice
        });
      }
    }
  }
  
  // If no credit earned, add specific feedback about the missed retracement
  if (creditsEarned === 0) {
    feedback.incorrect.push({
      type: 'missed_retracement',
      direction: expected.direction,
      startPrice: expected.start.price,
      endPrice: expected.end.price,
      advice: `You missed the ${expected.direction} retracement from ${expected.start.price.toFixed(2)} to ${expected.end.price.toFixed(2)}.`
    });
  }
  
  // NEW: Be more generous with partial credit
  // Round to nearest 0.5, but ensure at least 0.5 point if they got anything right
  if (creditsEarned > 0 && creditsEarned < 0.5) {
    creditsEarned = 0.5;
  } else {
    creditsEarned = Math.round(creditsEarned * 2) / 2;
  }
  
  // Cap at maximum points
  creditsEarned = Math.min(creditsEarned, totalCredits);
  
  const success = creditsEarned > 0;
  
  // Generate a more detailed and helpful message
  let message;
  if (creditsEarned === totalCredits) {
    message = `Perfect! You identified the ${expected.direction} Fibonacci retracement exactly.`;
  } else if (creditsEarned > 0) {
    message = `You correctly identified parts of the ${expected.direction} Fibonacci retracement. ${creditsEarned.toFixed(1)}/${totalCredits} points earned.`;
  } else {
    message = `Try again. Look for a significant ${part === 1 ? 'uptrend' : 'downtrend'} movement in the chart.`;
  }
  
  return {
    success,
    message,
    score: creditsEarned,
    totalExpectedPoints: totalCredits,
    feedback,
    alternativeRetracements: alternativeRetracements
  };
}

/**
 * Find alternative valid Fibonacci retracements in the chart
 * This helps identify multiple potential retracements that could be valid
 * @param {Array} chartData - OHLC chart data
 * @param {Number} part - Exam part (1 for uptrend, 2 for downtrend)
 * @returns {Array} Array of alternative retracements
 */
function findAlternativeRetracements(chartData, part) {
  // Prepare results array
  const alternatives = [];
  
  // Calculate min/max range for reference
  const maxPrice = Math.max(...chartData.map(c => c.high));
  const minPrice = Math.min(...chartData.map(c => c.low));
  const priceRange = maxPrice - minPrice;
  
  // If chart data is insufficient, return empty array
  if (!chartData || !Array.isArray(chartData) || chartData.length < 10) {
    return alternatives;
  }
  
  try {
    // Find local extremes (potential swing points)
    const localHighs = [];
    const localLows = [];
    
    // Simple algorithm to find local extremes with a lookback window
    const lookbackWindow = 3;
    
    for (let i = lookbackWindow; i < chartData.length - lookbackWindow; i++) {
      // Check for local high
      let isHigh = true;
      for (let j = i - lookbackWindow; j <= i + lookbackWindow; j++) {
        if (j !== i && chartData[j].high > chartData[i].high) {
          isHigh = false;
          break;
        }
      }
      
      if (isHigh) {
        localHighs.push({
          time: chartData[i].time,
          price: chartData[i].high,
          index: i,
          significance: (chartData[i].high - minPrice) / priceRange
        });
      }
      
      // Check for local low
      let isLow = true;
      for (let j = i - lookbackWindow; j <= i + lookbackWindow; j++) {
        if (j !== i && chartData[j].low < chartData[i].low) {
          isLow = false;
          break;
        }
      }
      
      if (isLow) {
        localLows.push({
          time: chartData[i].time,
          price: chartData[i].low,
          index: i,
          significance: (maxPrice - chartData[i].low) / priceRange
        });
      }
    }
    
    // Sort by significance
    localHighs.sort((a, b) => b.significance - a.significance);
    localLows.sort((a, b) => b.significance - a.significance);
    
    // Generate alternative retracements based on combinations of significant swing points
    // Consider top 5 most significant highs and lows
    const topHighs = localHighs.slice(0, 5);
    const topLows = localLows.slice(0, 5);
    
    if (part === 1) { // Uptrend retracement (high to low)
      // Create all combinations of significant highs to lows that occur after them
      for (const high of topHighs) {
        for (const low of topLows) {
          // Only consider valid time sequence (low after high for uptrend)
          if (low.time > high.time) {
            alternatives.push({
              start: high,
              end: low,
              direction: 'uptrend',
              significance: (high.price - low.price) / priceRange * (high.significance + low.significance)
            });
          }
        }
      }
    } else { // Downtrend retracement (low to high)
      // Create all combinations of significant lows to highs that occur after them
      for (const low of topLows) {
        for (const high of topHighs) {
          // Only consider valid time sequence (high after low for downtrend)
          if (high.time > low.time) {
            alternatives.push({
              start: low,
              end: high,
              direction: 'downtrend',
              significance: (high.price - low.price) / priceRange * (high.significance + low.significance)
            });
          }
        }
      }
    }
    
    // Sort alternatives by significance
    alternatives.sort((a, b) => b.significance - a.significance);
    
    // Return top alternatives (limit to 3 to avoid excessive checking)
    return alternatives.slice(0, 3);
  } catch (error) {
    return [];
  }
}

/**
 * Generate human-readable analysis explaining why these Fibonacci points were chosen
 * @param {Object} retracement - The chosen Fibonacci retracement
 * @param {Array} chartData - The full chart data
 * @param {Array} alternatives - Alternative valid retracements
 * @returns {Object} Analysis object with various explanation aspects
 */
function generateFibonacciAnalysis(retracement, chartData, alternatives = []) {
  try {
    // Format dates
    const startDate = new Date(retracement.start.time * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const endDate = new Date(retracement.end.time * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Calculate time span
    const timeDays = Math.floor((retracement.end.time - retracement.start.time) / 86400);
    const timeHours = Math.floor((retracement.end.time - retracement.start.time) / 3600);
    const timeSpan = timeDays > 0 ? `${timeDays} day${timeDays > 1 ? 's' : ''}` : `${timeHours} hours`;
    
    // Calculate price movement
    const priceMove = Math.abs(retracement.start.price - retracement.end.price);
    const priceMovePercent = ((priceMove / retracement.start.price) * 100).toFixed(1);
    
    // Analyze what happened before the start point (context)
    const startContext = analyzePreSwingMovement(chartData, retracement.start, retracement.direction);
    
    // Analyze the retracement characteristics
    const retracementType = analyzeRetracementType(chartData, retracement);
    
    // Build the main explanation
    const mainExplanation = retracement.direction === 'uptrend' 
      ? `This uptrend Fibonacci retracement was identified from the swing high at $${retracement.start.price.toFixed(2)} on ${startDate} to the swing low at $${retracement.end.price.toFixed(2)} on ${endDate}. ${startContext} The ${priceMovePercent}% retracement over ${timeSpan} ${retracementType}`
      : `This downtrend Fibonacci retracement was identified from the swing low at $${retracement.start.price.toFixed(2)} on ${startDate} to the swing high at $${retracement.end.price.toFixed(2)} on ${endDate}. ${startContext} The ${priceMovePercent}% retracement over ${timeSpan} ${retracementType}`;
    
    // Explain why this was optimal
    const whyOptimal = explainWhyOptimal(retracement, chartData);
    
    // Explain alternatives if any
    const alternativeExplanations = alternatives.length > 0 
      ? alternatives.slice(0, 2).map(alt => {
          const altStartDate = new Date(alt.start.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const altEndDate = new Date(alt.end.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `$${alt.start.price.toFixed(2)} (${altStartDate}) to $${alt.end.price.toFixed(2)} (${altEndDate})`;
        })
      : [];
    
    return {
      summary: mainExplanation,
      keyPoints: {
        startPoint: `The ${retracement.direction === 'uptrend' ? 'high' : 'low'} at $${retracement.start.price.toFixed(2)} on ${startDate} marked ${startContext}`,
        endPoint: `The ${retracement.direction === 'uptrend' ? 'low' : 'high'} at $${retracement.end.price.toFixed(2)} on ${endDate} completed the retracement`,
        movement: `${priceMovePercent}% price movement over ${timeSpan}`,
        significance: whyOptimal
      },
      technicalDetails: {
        priceRange: `$${priceMove.toFixed(2)} (${priceMovePercent}%)`,
        timeframe: timeSpan,
        direction: retracement.direction,
        startSignificance: `${(retracement.start.significance * 100).toFixed(1)}% of price range`,
        endSignificance: `${(retracement.end.significance * 100).toFixed(1)}% of price range`
      },
      alternatives: alternativeExplanations.length > 0 ? {
        exists: true,
        count: alternatives.length,
        examples: alternativeExplanations,
        note: "Other valid Fibonacci retracements exist in this chart, but this one showed the strongest technical characteristics"
      } : {
        exists: false,
        note: "This was the most prominent Fibonacci retracement pattern in the chart"
      }
    };
  } catch (error) {
    logger.error('Error generating Fibonacci analysis:', error);
    return {
      summary: "Technical analysis completed",
      keyPoints: {},
      technicalDetails: {},
      alternatives: { exists: false }
    };
  }
}

/**
 * Analyze what happened before the swing point
 */
function analyzePreSwingMovement(chartData, swingPoint, direction) {
  try {
    // Find the swing point in chart data
    const swingIndex = chartData.findIndex(c => 
      Math.abs(c.time - swingPoint.time) < 3600 || 
      (c.date && Math.abs(new Date(c.date).getTime()/1000 - swingPoint.time) < 3600)
    );
    
    if (swingIndex < 5) {
      return "the beginning of a significant price movement";
    }
    
    // Look at 5-10 candles before
    const lookback = Math.min(10, swingIndex);
    const priorCandles = chartData.slice(swingIndex - lookback, swingIndex);
    
    // Calculate the trend leading to this point
    const startPrice = priorCandles[0].close;
    const endPrice = priorCandles[priorCandles.length - 1].close;
    const priceChange = ((endPrice - startPrice) / startPrice * 100).toFixed(1);
    
    if (direction === 'uptrend') {
      if (parseFloat(priceChange) > 5) {
        return `the peak after a strong ${Math.abs(priceChange)}% rally`;
      } else if (parseFloat(priceChange) > 2) {
        return `a significant high following steady upward movement`;
      } else {
        return `a key resistance level in the price action`;
      }
    } else {
      if (parseFloat(priceChange) < -5) {
        return `the bottom after a ${Math.abs(priceChange)}% decline`;
      } else if (parseFloat(priceChange) < -2) {
        return `a significant low following downward pressure`;
      } else {
        return `a key support level in the price action`;
      }
    }
  } catch (error) {
    return "a significant turning point";
  }
}

/**
 * Analyze the type of retracement
 */
function analyzeRetracementType(chartData, retracement) {
  const priceMove = Math.abs(retracement.start.price - retracement.end.price);
  const priceMovePercent = (priceMove / retracement.start.price) * 100;
  
  // Find how many candles in the retracement
  const startIndex = chartData.findIndex(c => 
    Math.abs(c.time - retracement.start.time) < 3600 || 
    (c.date && Math.abs(new Date(c.date).getTime()/1000 - retracement.start.time) < 3600)
  );
  const endIndex = chartData.findIndex(c => 
    Math.abs(c.time - retracement.end.time) < 3600 || 
    (c.date && Math.abs(new Date(c.date).getTime()/1000 - retracement.end.time) < 3600)
  );
  
  const candleCount = Math.abs(endIndex - startIndex);
  
  if (priceMovePercent > 10) {
    return `represents a deep retracement, ideal for Fibonacci analysis`;
  } else if (priceMovePercent > 5) {
    return `shows a healthy pullback with clear structure`;
  } else if (candleCount > 20) {
    return `demonstrates a gradual, controlled retracement`;
  } else {
    return `provides a clear retracement pattern`;
  }
}

/**
 * Explain why this retracement was optimal
 */
function explainWhyOptimal(retracement, chartData) {
  const aspects = [];
  
  // Price range coverage
  const maxPrice = Math.max(...chartData.map(c => c.high));
  const minPrice = Math.min(...chartData.map(c => c.low));
  const priceRange = maxPrice - minPrice;
  const moveSize = Math.abs(retracement.start.price - retracement.end.price);
  const rangeCoverage = (moveSize / priceRange) * 100;
  
  if (rangeCoverage > 30) {
    aspects.push(`covers ${rangeCoverage.toFixed(0)}% of the chart's price range`);
  }
  
  // Significance of points
  if (retracement.start.significance > 0.7 || retracement.end.significance > 0.7) {
    aspects.push("connects major swing points");
  }
  
  // Time spacing
  const timeDays = Math.floor((retracement.end.time - retracement.start.time) / 86400);
  if (timeDays > 5) {
    aspects.push(`spans a significant ${timeDays}-day period`);
  }
  
  if (aspects.length === 0) {
    return "This retracement showed the clearest technical structure";
  }
  
  return `This retracement was optimal because it ${aspects.join(" and ")}`;
}

export default createApiHandler(
  composeMiddleware(requireAuth, handler),
  { methods: ['POST'] }
);
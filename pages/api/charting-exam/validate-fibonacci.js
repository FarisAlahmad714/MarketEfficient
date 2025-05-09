// pages/api/charting-exam/validate-fibonacci.js
import { getFibonacciRetracement, calculateFibonacciLevels } from './utils/fibonacci-utils.js';
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Extract token and decode user ID
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { drawings, chartData, chartCount, part } = req.body;
    
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
    const symbol = chartData.symbol || 'UNKNOWN';
    
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
    console.log(`Fibonacci test result saved for user ${userId}, score: ${validationResult.score}/${validationResult.totalExpectedPoints}`);
    
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
        levels: calculateFibonacciLevels(expectedRetracement.start, expectedRetracement.end).levels
      },
      chart_count: chartCount,
      next_part: part === 1 ? 2 : null
    });
  } catch (error) {
    console.error('Error in validate-fibonacci API:', error);
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
  console.log(`Detected timeframe for validation: ${timeframe}`);
  
  // Timeframe-specific price tolerances (% of range)
  const priceTolerances = {
    '1h': 0.02,  // 2% for 1-hour charts (more precise)
    '4h': 0.025, // 2.5% for 4-hour charts
    '1d': 0.03,  // 3% for daily charts
    '1w': 0.04   // 4% for weekly charts (more forgiving)
  };
  
  // Timeframe-specific time tolerances
  const timeTolerances = {
    '1h': 6 * 3600,     // 6 hours
    '4h': 24 * 3600,    // 24 hours
    '1d': 3 * 86400,    // 3 days
    '1w': 7 * 86400     // 7 days
  };
  
  const priceTolerance = priceRange * (priceTolerances[timeframe] || 0.03);
  const timeTolerance = timeTolerances[timeframe] || (3 * 86400);
  
  console.log(`Validation tolerances: price=${priceTolerance.toFixed(4)}, time=${timeTolerance/3600}h`);
  
  const totalCredits = 2; // 1 for start point, 1 for end point
  let creditsEarned = 0;
  const feedback = { correct: [], incorrect: [] };
  
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
      
      const userDirection = drawing.end.price > drawing.start.price ? 'uptrend' : 'downtrend';
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
      console.log(`Validating drawing: 
        Direction: ${userDirection}
        User Start: time=${drawing.start.time}, price=${drawing.start.price}
        Expected Start: time=${expected.start.time}, price=${expected.start.price}
        Start Diff: time=${Math.abs(drawing.start.time - expected.start.time)}s, price=${startPriceDiffPercent.toFixed(2)}%
        User End: time=${drawing.end.time}, price=${drawing.end.price}
        Expected End: time=${expected.end.time}, price=${expected.end.price}
        End Diff: time=${Math.abs(drawing.end.time - expected.end.time)}s, price=${endPriceDiffPercent.toFixed(2)}%
      `);
      
      // Check start point
      const startTimeMatch = Math.abs(drawing.start.time - expected.start.time) < timeTolerance;
      const startPriceMatch = Math.abs(drawing.start.price - expected.start.price) < priceTolerance;
      
      const startExact = startTimeMatch && startPriceMatch;
      
      // Give partial credit for close matches
      const startClose = (Math.abs(drawing.start.time - expected.start.time) < timeTolerance * 2 &&
                        Math.abs(drawing.start.price - expected.start.price) < priceTolerance * 2);
      
      const startCredits = startExact ? 1 : (startClose ? 0.5 : 0);
      creditsEarned += startCredits;
      
      // Check end point
      const endTimeMatch = Math.abs(drawing.end.time - expected.end.time) < timeTolerance;
      const endPriceMatch = Math.abs(drawing.end.price - expected.end.price) < priceTolerance;
      
      const endExact = endTimeMatch && endPriceMatch;
      
      // Give partial credit for close matches
      const endClose = (Math.abs(drawing.end.time - expected.end.time) < timeTolerance * 2 &&
                      Math.abs(drawing.end.price - expected.end.price) < priceTolerance * 2);
      
      const endCredits = endExact ? 1 : (endClose ? 0.5 : 0);
      creditsEarned += endCredits;
      
      // Add feedback based on accuracy
      if (startCredits > 0 || endCredits > 0) {
        // Generate detailed feedback for partial matches
        let startFeedback, endFeedback;
        
        if (startExact) {
          startFeedback = 'Exact match';
        } else if (startClose) {
          startFeedback = startTimeMatch ? 
            `Time is correct, price is close (${startPriceDiffPercent.toFixed(1)}% off)` : 
            startPriceMatch ? 
              `Price is correct, time is a bit off` : 
              `Close enough (${startPriceDiffPercent.toFixed(1)}% price diff)`;
        } else {
          startFeedback = 'Incorrect';
        }
        
        if (endExact) {
          endFeedback = 'Exact match';
        } else if (endClose) {
          endFeedback = endTimeMatch ? 
            `Time is correct, price is close (${endPriceDiffPercent.toFixed(1)}% off)` : 
            endPriceMatch ? 
              `Price is correct, time is a bit off` : 
              `Close enough (${endPriceDiffPercent.toFixed(1)}% price diff)`;
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
        
        if (Math.abs(drawing.start.time - expected.start.time) > timeTolerance * 3 && 
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
  
  // Round to nearest 0.5
  creditsEarned = Math.round(creditsEarned * 2) / 2;
  
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
    feedback
  };
}
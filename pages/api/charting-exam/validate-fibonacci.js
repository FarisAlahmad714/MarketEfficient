import { getFibonacciRetracement, calculateFibonacciLevels } from './utils/fibonacci-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
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
  
  const priceTolerance = priceRange * 0.03; // 3% of the total price range
  const timeTolerance = 3 * 86400; // 3 days in seconds
  
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
        feedback.correct.push({
          direction: userDirection,
          startPrice: drawing.start.price,
          endPrice: drawing.end.price,
          startCredits,
          endCredits,
          advice: `Start Point: ${startCredits}/1 (${startExact ? 'Exact' : startClose ? 'Close' : 'Incorrect'}), End Point: ${endCredits}/1 (${endExact ? 'Exact' : endClose ? 'Close' : 'Incorrect'})`
        });
      } else {
        feedback.incorrect.push({
          type: 'completely_wrong',
          direction: userDirection,
          startPrice: drawing.start.price,
          endPrice: drawing.end.price,
          advice: `Your Fibonacci points don't match the significant ${expected.direction} move in this chart.`
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
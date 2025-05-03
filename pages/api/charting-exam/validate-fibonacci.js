import { detectSwingPoints } from './utils/fibonacci-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { drawings, chartCount, part } = req.body;
    
    if (!drawings || !Array.isArray(drawings)) {
      return res.status(400).json({ error: 'Invalid drawings data' });
    }
    
    // Get chart data from session or fetch new
    const chartData = req.session?.chartData || await getChartData();
    
    // Calculate expected Fibonacci retracement
    const expectedRetracement = calculateFibonacciRetracement(chartData, part);
    
    // Validate user drawings against expected retracement
    const validationResult = validateFibonacciRetracement(drawings, expectedRetracement, chartData, part);
    
    return res.status(200).json({
      success: true,
      message: validationResult.message,
      score: validationResult.score,
      totalExpectedPoints: validationResult.totalExpectedPoints,
      feedback: validationResult.feedback,
      expected: expectedRetracement,
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

// Get chart data (from cache or generate new)
async function getChartData() {
  // Implementation depends on your data strategy
  // For simplicity, this example uses a placeholder
  return [];
}

// Calculate expected Fibonacci retracement points
function calculateFibonacciRetracement(chartData, part) {
  // Detect swing points first
  const swingPoints = detectSwingPoints(chartData);
  
  // Get significant swing points based on part
  if (part === 1) {
    // Uptrend: Find a low followed by a high
    const lows = swingPoints.lows.slice().sort((a, b) => a.time - b.time);
    const highs = swingPoints.highs.slice().sort((a, b) => a.time - b.time);
    
    // Find a low with a subsequent high
    for (const low of lows) {
      const subsequentHighs = highs.filter(h => h.time > low.time);
      
      if (subsequentHighs.length > 0) {
        // Get the highest subsequent high
        const high = subsequentHighs.reduce((highest, current) => 
          current.price > highest.price ? current : highest, subsequentHighs[0]);
          
        return {
          start: low, 
          end: high,
          direction: 'uptrend'
        };
      }
    }
  } else {
    // Downtrend: Find a high followed by a low
    const highs = swingPoints.highs.slice().sort((a, b) => a.time - b.time);
    const lows = swingPoints.lows.slice().sort((a, b) => a.time - b.time);
    
    // Find a high with a subsequent low
    for (const high of highs) {
      const subsequentLows = lows.filter(l => l.time > high.time);
      
      if (subsequentLows.length > 0) {
        // Get the lowest subsequent low
        const low = subsequentLows.reduce((lowest, current) => 
          current.price < lowest.price ? current : lowest, subsequentLows[0]);
          
        return {
          start: high, 
          end: low,
          direction: 'downtrend'
        };
      }
    }
  }
  
  // If no suitable points found, return default
  return {
    start: { time: 0, price: 0 },
    end: { time: 0, price: 0 },
    direction: part === 1 ? 'uptrend' : 'downtrend'
  };
}

// Validate user Fibonacci retracement against expected
function validateFibonacciRetracement(drawings, expected, chartData, part) {
  // Calculate price range for tolerance
  const priceRange = Math.max(...chartData.map(c => c.high)) - 
                    Math.min(...chartData.map(c => c.low));
  
  const priceTolerance = priceRange * 0.02; // 2% of the price range
  const timeTolerance = 3 * 86400; // 3 days in seconds
  
  const totalCredits = 2; // 1 for start point, 1 for end point
  let creditsEarned = 0;
  const feedback = { correct: [], incorrect: [] };
  
  if (expected.start.time === 0 || expected.end.time === 0) {
    // No valid expected retracement found
    return {
      success: false,
      message: `No significant ${part === 1 ? 'uptrend' : 'downtrend'} retracement found.`,
      score: 0,
      totalExpectedPoints: totalCredits,
      feedback: {
        correct: [],
        incorrect: [{
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
      const startExact = (Math.abs(drawing.start.time - expected.start.time) < timeTolerance &&
                          Math.abs(drawing.start.price - expected.start.price) < priceTolerance);
                          
      const startClose = (Math.abs(drawing.start.time - expected.start.time) < timeTolerance * 2 &&
                         Math.abs(drawing.start.price - expected.start.price) < priceTolerance * 2);
      
      const startCredits = startExact ? 1 : (startClose ? 0.5 : 0);
      creditsEarned += startCredits;
      
      // Check end point
      const endExact = (Math.abs(drawing.end.time - expected.end.time) < timeTolerance &&
                        Math.abs(drawing.end.price - expected.end.price) < priceTolerance);
                        
      const endClose = (Math.abs(drawing.end.time - expected.end.time) < timeTolerance * 2 &&
                       Math.abs(drawing.end.price - expected.end.price) < priceTolerance * 2);
      
      const endCredits = endExact ? 1 : (endClose ? 0.5 : 0);
      creditsEarned += endCredits;
      
      feedback.correct.push({
        direction: userDirection,
        startPrice: drawing.start.price,
        endPrice: drawing.end.price,
        startCredits,
        endCredits,
        advice: `Start Point: ${startCredits}/1 credit (${startExact ? 'Exact' : startClose ? 'Close' : 'Incorrect'}), End Point: ${endCredits}/1 credit (${endExact ? 'Exact' : endClose ? 'Close' : 'Incorrect'})`
      });
    }
  }
  
  if (creditsEarned === 0) {
    feedback.incorrect.push({
      type: 'missed_retracement',
      direction: expected.direction,
      startPrice: expected.start.price,
      endPrice: expected.end.price,
      advice: `You missed the ${expected.direction} retracement from ${expected.start.price.toFixed(2)} to ${expected.end.price.toFixed(2)}.`
    });
  }
  
  const success = creditsEarned > 0;
  
  return {
    success,
    message: `${part === 1 ? 'Uptrend' : 'Downtrend'} retracement: ${creditsEarned.toFixed(1)}/${totalCredits} credits earned!`,
    score: creditsEarned,
    totalExpectedPoints: totalCredits,
    feedback
  };
}
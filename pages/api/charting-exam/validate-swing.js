import { detectSwingPoints } from './utils/swing-detection';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { drawings, chartCount } = req.body;
    
    if (!drawings || !Array.isArray(drawings)) {
      return res.status(400).json({ error: 'Invalid drawings data' });
    }
    
    // Get chart data from session or fetch new
    const chartData = req.session?.chartData || await getChartData();
    
    // Detect swing points
    const expectedSwingPoints = detectSwingPoints(chartData);
    
    // Validate user drawings against expected points
    const validationResult = validateSwingPoints(drawings, expectedSwingPoints, chartData);
    
    return res.status(200).json({
      success: true,
      message: validationResult.message,
      score: validationResult.score,
      totalExpectedPoints: validationResult.totalExpectedPoints,
      feedback: validationResult.feedback,
      expected: expectedSwingPoints,
      chart_count: chartCount
    });
  } catch (error) {
    console.error('Error in validate-swing API:', error);
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

// Validate user swing points against expected points
function validateSwingPoints(userPoints, expectedPoints, chartData) {
  // Calculate price range for tolerance
  const priceRange = Math.max(...chartData.map(c => c.high)) - 
                    Math.min(...chartData.map(c => c.low));
  
  const priceTolerance = priceRange * 0.02; // 2% of the price range
  const timeTolerance = 3 * 86400; // 3 days in seconds
  
  let matched = 0;
  const feedback = { correct: [], incorrect: [] };
  const usedPoints = new Set();
  
  // Check each user point against expected points
  for (const userPoint of userPoints) {
    let pointMatched = false;
    
    // Compare with all highs
    for (let i = 0; i < expectedPoints.highs.length; i++) {
      const point = expectedPoints.highs[i];
      
      if (usedPoints.has(`high-${i}`)) continue;
      
      if (Math.abs(userPoint.time - point.time) < timeTolerance &&
          Math.abs(userPoint.price - point.price) < priceTolerance) {
        matched++;
        pointMatched = true;
        usedPoints.add(`high-${i}`);
        
        feedback.correct.push({
          type: 'high',
          price: point.price,
          time: point.time,
          advice: 'Correct! You identified this swing high accurately.'
        });
        
        break;
      }
    }
    
    // If not matched with a high, try lows
    if (!pointMatched) {
      for (let i = 0; i < expectedPoints.lows.length; i++) {
        const point = expectedPoints.lows[i];
        
        if (usedPoints.has(`low-${i}`)) continue;
        
        if (Math.abs(userPoint.time - point.time) < timeTolerance &&
            Math.abs(userPoint.price - point.price) < priceTolerance) {
          matched++;
          pointMatched = true;
          usedPoints.add(`low-${i}`);
          
          feedback.correct.push({
            type: 'low',
            price: point.price,
            time: point.time,
            advice: 'Correct! You identified this swing low accurately.'
          });
          
          break;
        }
      }
    }
    
    // If still not matched, it's incorrect
    if (!pointMatched) {
      feedback.incorrect.push({
        type: userPoint.type,
        price: userPoint.price,
        time: userPoint.time,
        advice: `This point doesn't match any significant swing ${userPoint.type}.`
      });
    }
  }
  
  // Add missed points to feedback
  for (let i = 0; i < expectedPoints.highs.length; i++) {
    if (!usedPoints.has(`high-${i}`)) {
      const point = expectedPoints.highs[i];
      
      feedback.incorrect.push({
        type: 'missed_point',
        price: point.price,
        time: point.time,
        advice: 'You missed this significant swing high.'
      });
    }
  }
  
  for (let i = 0; i < expectedPoints.lows.length; i++) {
    if (!usedPoints.has(`low-${i}`)) {
      const point = expectedPoints.lows[i];
      
      feedback.incorrect.push({
        type: 'missed_point',
        price: point.price,
        time: point.time,
        advice: 'You missed this significant swing low.'
      });
    }
  }
  
  const totalExpectedPoints = expectedPoints.highs.length + expectedPoints.lows.length;
  const success = matched === totalExpectedPoints;
  
  return {
    success,
    message: success ? 'All swing points identified correctly!' : 'Some swing points were missed or incorrect.',
    score: matched,
    totalExpectedPoints,
    feedback
  };
}
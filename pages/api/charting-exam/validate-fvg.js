// pages/api/charting-exam/validate-fvg.js
import { detectFairValueGaps } from './utils/fvg-detection';
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
    
    // Get the data from the request body instead of relying on session
    const { drawings, chartData, chartCount, part, timeframe } = req.body;
    
    if (!drawings) {
      return res.status(400).json({ error: 'Invalid drawings data' });
    }
    
    // Validate chart data is provided in the request
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      return res.status(400).json({ error: 'No chart data provided in request' });
    }
    
    // Extract asset symbol and timeframe from the request
    const symbol = chartData.symbol || req.body.symbol || 'UNKNOWN';
    const chartTimeframe = timeframe || chartData.timeframe || '1d';
    
    console.log(`Validating ${part === 1 ? 'bullish' : 'bearish'} FVGs for ${symbol} on ${chartTimeframe} timeframe`);
    
    // Detect expected FVGs with adaptive minimum gap size
    const gapType = part === 1 ? 'bullish' : 'bearish';
    const expectedGaps = detectFairValueGaps(chartData, gapType, null, chartTimeframe, symbol);
    
    // Validate user drawings against expected gaps
    const validationResult = validateFairValueGaps(drawings, expectedGaps, chartData, gapType, chartTimeframe);
    
    // Connect to database before saving the test result
    await connectDB();
    
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
    console.log(`FVG test result saved for user ${userId}, score: ${validationResult.score}/${validationResult.totalExpectedPoints}`);
    
    return res.status(200).json({
      success: true,
      message: validationResult.message,
      score: validationResult.score,
      totalExpectedPoints: validationResult.totalExpectedPoints,
      feedback: validationResult.feedback,
      expected: { gaps: expectedGaps },
      chart_count: chartCount,
      next_part: part === 1 ? 2 : null
    });
  } catch (error) {
    console.error('Error in validate-fvg API:', error);
    return res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
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
          gapMatched = true;
          usedGaps.add(i);
          
          feedback.correct.push({
            type: gapType,
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            size: gap.size,
            advice: `Good job! You correctly identified this ${gapType} fair value gap with a horizontal line.`
          });
          break;
        }
      } else {
        // For rectangle drawings, check price and time boundaries
        const priceMatch = Math.abs(drawing.topPrice - gap.topPrice) <= priceTolerance &&
                         Math.abs(drawing.bottomPrice - gap.bottomPrice) <= priceTolerance;
        
        const timeMatch = Math.abs(drawing.startTime - gap.startTime) <= timeTolerance &&
                        Math.abs(drawing.endTime - gap.endTime) <= timeTolerance;
        
        if (priceMatch && timeMatch) {
          matched++;
          gapMatched = true;
          usedGaps.add(i);
          
          feedback.correct.push({
            type: gapType,
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            size: gap.size,
            advice: `Excellent! You correctly identified this ${gapType} fair value gap.`
          });
          break;
        }
        
        // Check for significant overlap (for partial credit)
        const topOverlap = Math.min(drawing.topPrice, gap.topPrice);
        const bottomOverlap = Math.max(drawing.bottomPrice, gap.bottomPrice);
        
        if (topOverlap > bottomOverlap && 
            (topOverlap - bottomOverlap) >= gap.size * 0.5 &&
            drawing.startTime <= gap.endTime && 
            drawing.endTime >= gap.startTime) {
          
          matched++;
          gapMatched = true;
          usedGaps.add(i);
          
          feedback.correct.push({
            type: gapType,
            topPrice: gap.topPrice,
            bottomPrice: gap.bottomPrice,
            size: gap.size,
            advice: `You identified this ${gapType} fair value gap correctly, though the boundaries could be more precise.`
          });
          break;
        }
      }
    }
    
    if (!gapMatched) {
      feedback.incorrect.push({
        type: 'incorrect_gap',
        topPrice: drawing.topPrice,
        bottomPrice: drawing.bottomPrice,
        advice: getFVGAdviceMessage(gapType)
      });
    }
  }
  
  // Add missed gaps to feedback
  for (let i = 0; i < expectedGaps.length; i++) {
    if (!usedGaps.has(i)) {
      const gap = expectedGaps[i];
      
      feedback.incorrect.push({
        type: 'missed_gap',
        topPrice: gap.topPrice,
        bottomPrice: gap.bottomPrice,
        size: gap.size,
        advice: `You missed a ${gapType} FVG from ${gap.bottomPrice.toFixed(4)} to ${gap.topPrice.toFixed(4)}. ${getFVGFormationMessage(gapType)}`
      });
    }
  }
  
  const success = matched === expectedGaps.length && matched > 0;
  
  return {
    success,
    message: `${gapType.charAt(0).toUpperCase() + gapType.slice(1)} Fair Value Gaps: ${matched}/${expectedGaps.length} correctly identified!`,
    score: matched,
    totalExpectedPoints: expectedGaps.length,
    feedback
  };
}

// Helper function to get detailed advice about FVG formation
function getFVGAdviceMessage(gapType) {
  if (gapType === 'bullish') {
    return "This is not a valid bullish FVG. Remember: A bullish FVG requires a three-candle pattern where: 1) Middle candle's high is above first candle's high AND closes above it, 2) Third candle's low stays above first candle's high (no overlap between them)."
  } else {
    return "This is not a valid bearish FVG. Remember: A bearish FVG requires a three-candle pattern where: 1) Middle candle's low is below first candle's low AND closes below it, 2) Third candle's high stays below first candle's low (no overlap between them)."
  }
}

// Helper function to get message about FVG formation for missed gaps
function getFVGFormationMessage(gapType) {
  if (gapType === 'bullish') {
    return "This gap forms between the high of the 1st candle and the low of the 3rd candle, with the 2nd candle closing above the 1st candle's high."
  } else {
    return "This gap forms between the low of the 1st candle and the high of the 3rd candle, with the 2nd candle closing below the 1st candle's low."
  }
}
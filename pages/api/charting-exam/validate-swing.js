// pages/api/charting-exam/validate-swing.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { detectSwingPoints } from './utils/swing-detection';
import { validateSwingPoints } from './utils/validation';
import TestResults from '../../../models/TestResults';

async function validateSwingHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  const { drawings, chartData, chartCount } = req.body;
  
  if (!drawings || !Array.isArray(drawings)) {
    return res.status(400).json({ 
      error: 'Invalid drawings data',
      code: 'INVALID_DRAWINGS',
      message: 'Missing or invalid drawing data' 
    });
  }
  
  // IMPORTANT: Use the chartData provided from the frontend
  // This ensures we're validating against the same data shown to the user
  const dataToAnalyze = chartData || req.session?.chartData || await getChartData();
  
  if (!dataToAnalyze || !Array.isArray(dataToAnalyze) || dataToAnalyze.length === 0) {
    return res.status(400).json({
      error: 'No chart data available',
      code: 'MISSING_CHART_DATA',
      message: 'Chart data is missing or invalid'
    });
  }
  
  // Log some info about the data to help with debugging
  console.log(`Analyzing ${dataToAnalyze.length} candles for swing points`);
  
  // Get chart timeframe to adjust detection parameters
  const timeframe = determineTimeframe(dataToAnalyze);
  console.log(`Detected timeframe: ${timeframe}`);
  
  // Detect swing points with parameters optimized for the timeframe
  const options = getDetectionOptions(timeframe);
  const expectedSwingPoints = detectSwingPoints(dataToAnalyze, options);
  
  console.log(`Detected ${expectedSwingPoints.highs.length} swing highs and ${expectedSwingPoints.lows.length} swing lows`);
  
  // Validate user drawings against expected points
  const validationResult = validateSwingPoints(drawings, expectedSwingPoints, dataToAnalyze);
  
  // Add chart data inspection info to help with debugging (only in development)
  const debugInfo = process.env.NODE_ENV !== 'production' ? {
    dataLength: dataToAnalyze.length,
    dataRange: getDataRange(dataToAnalyze),
    timeframe,
    detectionOptions: options
  } : undefined;

  // IMPORTANT: Save test result to database
  const symbol = req.body.symbol || 'MULTIASSET';
  
  const testResult = new TestResults({
    userId: userId,
    testType: 'chart-exam',
    subType: 'swing-analysis',
    assetSymbol:  'MULTIASSET',
    score: validationResult.score,
    totalPoints: validationResult.totalExpectedPoints,
    details: {
      feedback: validationResult.feedback,
      expected: expectedSwingPoints
    },
    completedAt: new Date()
  });
  
  await testResult.save();
  console.log(`Test result saved, score: ${validationResult.score}/${validationResult.totalExpectedPoints}`);
  
  return res.status(200).json({
    success: true,
    message: validationResult.message,
    score: validationResult.score,
    totalExpectedPoints: validationResult.totalExpectedPoints,
    feedback: validationResult.feedback,
    expected: expectedSwingPoints,
    chart_count: chartCount,
    debug: debugInfo
  });
}

/**
 * Get chart data - placeholder that should be replaced with actual implementation
 * @returns {Array} Chart data array
 */
async function getChartData() {
  // This is a placeholder - in production, this would fetch from a database or API
  // For testing, you could return hardcoded sample data here
  
  console.warn('Using fallback getChartData() - this should be replaced with actual data source');
  
  // Return empty array as fallback - the frontend should be sending the chart data
  return [];
}

/**
 * Determine timeframe of chart data
 * @param {Array} chartData - OHLC chart data
 * @returns {String} Timeframe code (1m, 5m, 1h, 1d, etc.)
 */
function determineTimeframe(chartData) {
  if (!chartData || chartData.length < 2) return '1d'; // Default to daily
  
  // Extract timestamps from data
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
  
  // Calculate average interval
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
  if (avgInterval < 120) return '1m';         // 1-2 minute
  if (avgInterval < 600) return '5m';         // 5-10 minute
  if (avgInterval < 3600) return '15m';       // 15-60 minute
  if (avgInterval < 14400) return '1h';       // 1-4 hour
  if (avgInterval < 43200) return '4h';       // 4-12 hour
  if (avgInterval < 172800) return '1d';      // 1-2 day
  if (avgInterval < 604800) return '3d';      // 3-7 day
  return '1w';                                // 1 week or more
}

/**
 * Get detection options optimized for a specific timeframe
 * @param {String} timeframe - Timeframe code
 * @returns {Object} Detection options
 */
function getDetectionOptions(timeframe) {
  switch (timeframe) {
    case '1m':
    case '5m':
      return {
        lookback: 3,                // Shorter lookback for intraday timeframes
        minSignificance: 0.005,     // Lower threshold for smaller price moves
        minSwings: 4,               // More swing points for intraday
        maxSwings: 15
      };
    case '15m':
    case '1h':
      return {
        lookback: 4,
        minSignificance: 0.007,
        minSwings: 3,
        maxSwings: 12
      };
    case '4h':
      return {
        lookback: 5,
        minSignificance: 0.008,
        minSwings: 3,
        maxSwings: 10
      };
    case '1d':
    case '3d':
      return {
        lookback: 6,
        minSignificance: 0.010,     // Higher threshold for daily timeframes
        minSwings: 2,               // Fewer swings expected
        maxSwings: 8
      };
    case '1w':
    default:
      return {
        lookback: 8,
        minSignificance: 0.015,
        minSwings: 2,
        maxSwings: 6
      };
  }
}

/**
 * Get data range info for debugging
 * @param {Array} chartData - Chart data
 * @returns {Object} Data range information
 */
function getDataRange(chartData) {
  if (!chartData || chartData.length === 0) return null;
  
  const prices = chartData.flatMap(c => [c.open, c.high, c.low, c.close]).filter(p => p != null);
  
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    priceRange: Math.max(...prices) - Math.min(...prices),
    dataPoints: chartData.length
  };
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, validateSwingHandler),
  { methods: ['POST'] }
);
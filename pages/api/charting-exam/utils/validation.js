// Enhanced validation for swing points
// This replaces the existing validation in /pages/api/charting-exam/validate-swing.js

/**
 * Validate user swing points against expected points with improved tolerance
 * @param {Array} userPoints - User marked swing points
 * @param {Object} expectedPoints - Expected swing points detected by algorithm
 * @param {Array} chartData - Original chart data used for context
 * @returns {Object} Validation results with feedback
 */
export function validateSwingPoints(userPoints, expectedPoints, chartData) {
    if (!userPoints || !Array.isArray(userPoints) || userPoints.length === 0) {
      return {
        success: false,
        message: 'No swing points marked. Please mark swing highs and lows before submitting.',
        score: 0,
        totalExpectedPoints: (expectedPoints.highs?.length || 0) + (expectedPoints.lows?.length || 0),
        feedback: {
          correct: [],
          incorrect: []
        }
      };
    }
    
    if (!expectedPoints || (!expectedPoints.highs && !expectedPoints.lows)) {
      return {
        success: false,
        message: 'No expected swing points detected in chart data.',
        score: 0,
        totalExpectedPoints: 0,
        feedback: {
          correct: [],
          incorrect: []
        }
      };
    }
  
    // Calculate price range for adaptive tolerance
    const highValues = chartData.map(c => c.high || c.h || c.High || 0).filter(v => !isNaN(v));
    const lowValues = chartData.map(c => c.low || c.l || c.Low || 0).filter(v => !isNaN(v));
    
    const priceRange = Math.max(...highValues) - Math.min(...lowValues);
    
    // Adaptive tolerance - larger for bigger price ranges, smaller for tighter ones
    const priceTolerance = Math.max(priceRange * 0.02, 0.5); // 2% of range or minimum 0.5 units
    
    // Time tolerance - 3 days in seconds for daily charts
    // For intraday charts, this should be adjusted proportionally
    const timeframe = determineTimeframe(chartData);
    const timeTolerance = getTimeTolerance(timeframe);
    
    let matched = 0;
    const feedback = { correct: [], incorrect: [] };
    const usedPoints = new Set();
    
    // Track matching for statistics
    const matchStats = {
      swingHighs: { matched: 0, total: expectedPoints.highs?.length || 0 },
      swingLows: { matched: 0, total: expectedPoints.lows?.length || 0 }
    };
    
    // First pass - match user points to expected points (more lenient on user errors)
    for (const userPoint of userPoints) {
      let pointMatched = false;
      let pointType = userPoint.type || '';
      
      // If user specified a point type (high or low), try that type first
      if (pointType === 'high' || pointType === '') {
        // Try matching with highs first
        for (let i = 0; i < (expectedPoints.highs?.length || 0); i++) {
          const point = expectedPoints.highs[i];
          
          if (usedPoints.has(`high-${i}`)) continue;
          
          // Check time and price are within tolerance
          if (isWithinTolerance(userPoint, point, timeTolerance, priceTolerance)) {
            matched++;
            matchStats.swingHighs.matched++;
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
      }
      
      // If not matched yet and type is low or not specified, try matching with lows
      if (!pointMatched && (pointType === 'low' || pointType === '')) {
        for (let i = 0; i < (expectedPoints.lows?.length || 0); i++) {
          const point = expectedPoints.lows[i];
          
          if (usedPoints.has(`low-${i}`)) continue;
          
          // Check time and price are within tolerance
          if (isWithinTolerance(userPoint, point, timeTolerance, priceTolerance)) {
            matched++;
            matchStats.swingLows.matched++;
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
        // Determine if it might be too close to another point
        const closestPoint = findClosestPoint(userPoint, [...(expectedPoints.highs || []), ...(expectedPoints.lows || [])]);
        let adviceMessage = '';
        
        if (closestPoint) {
          const timeDiff = Math.abs(userPoint.time - closestPoint.time);
          const priceDiff = Math.abs(userPoint.price - closestPoint.price);
          
          if (timeDiff < timeTolerance * 2 && priceDiff > priceTolerance * 1.5) {
            adviceMessage = `This point is close in time but too far in price from a ${closestPoint.type || ''} swing point.`;
          } else if (priceDiff < priceTolerance * 2 && timeDiff > timeTolerance * 1.5) {
            adviceMessage = `This point is close in price but too far in time from a ${closestPoint.type || ''} swing point.`;
          } else {
            adviceMessage = `This doesn't match any significant swing points in the chart.`;
          }
        } else {
          adviceMessage = `This doesn't appear to be a significant swing ${userPoint.type || 'point'}.`;
        }
        
        feedback.incorrect.push({
          type: userPoint.type || 'point',
          price: userPoint.price,
          time: userPoint.time,
          advice: adviceMessage
        });
      }
    }
    
    // Add missed points to feedback
    for (let i = 0; i < (expectedPoints.highs?.length || 0); i++) {
      if (!usedPoints.has(`high-${i}`)) {
        const point = expectedPoints.highs[i];
        
        feedback.incorrect.push({
          type: 'missed_point',
          pointType: 'high',
          price: point.price,
          time: point.time,
          significance: point.significance || 1,
          advice: 'You missed this significant swing high.'
        });
      }
    }
    
    for (let i = 0; i < (expectedPoints.lows?.length || 0); i++) {
      if (!usedPoints.has(`low-${i}`)) {
        const point = expectedPoints.lows[i];
        
        feedback.incorrect.push({
          type: 'missed_point',
          pointType: 'low',
          price: point.price,
          time: point.time,
          significance: point.significance || 1,
          advice: 'You missed this significant swing low.'
        });
      }
    }
    
    // Sort missed points by significance to show most important ones first
    feedback.incorrect.sort((a, b) => (b.significance || 0) - (a.significance || 0));
    
    const totalExpectedPoints = (expectedPoints.highs?.length || 0) + (expectedPoints.lows?.length || 0);
    const success = matched === totalExpectedPoints && totalExpectedPoints > 0;
    
    // Generate performance metrics
    const highPercentage = matchStats.swingHighs.total > 0 
      ? Math.round((matchStats.swingHighs.matched / matchStats.swingHighs.total) * 100) 
      : 0;
      
    const lowPercentage = matchStats.swingLows.total > 0
      ? Math.round((matchStats.swingLows.matched / matchStats.swingLows.total) * 100)
      : 0;
    
    const matchPercentage = totalExpectedPoints > 0
      ? Math.round((matched / totalExpectedPoints) * 100)
      : 0;
    
    // Enhanced message with performance stats
    let message = '';
    
    if (success) {
      message = 'All swing points identified correctly! Great work!';
    } else if (matched > 0) {
      message = `You found ${matched} out of ${totalExpectedPoints} swing points (${matchPercentage}%).`;
      if (matchStats.swingHighs.total > 0) {
        message += ` Highs: ${matchStats.swingHighs.matched}/${matchStats.swingHighs.total} (${highPercentage}%).`;
      }
      if (matchStats.swingLows.total > 0) {
        message += ` Lows: ${matchStats.swingLows.matched}/${matchStats.swingLows.total} (${lowPercentage}%).`;
      }
    } else {
      message = 'No swing points matched. Try again!';
    }
    
    return {
      success,
      message,
      score: matched,
      totalExpectedPoints,
      matchPercentage,
      highs: highPercentage,
      lows: lowPercentage,
      feedback
    };
  }
  
  /**
   * Determine if a point is within tolerance of an expected point
   * @param {Object} point - The point to check
   * @param {Object} expected - The expected point
   * @param {Number} timeTolerance - Time tolerance in seconds
   * @param {Number} priceTolerance - Price tolerance
   * @returns {Boolean} True if within tolerance
   */
  function isWithinTolerance(point, expected, timeTolerance, priceTolerance) {
    const timeMatch = Math.abs(point.time - expected.time) <= timeTolerance;
    const priceMatch = Math.abs(point.price - expected.price) <= priceTolerance;
    return timeMatch && priceMatch;
  }
  
  /**
   * Find the closest expected point to a user point
   * @param {Object} userPoint - User marked point
   * @param {Array} expectedPoints - Array of expected points
   * @returns {Object|null} The closest point or null if no points
   */
  function findClosestPoint(userPoint, expectedPoints) {
    if (!expectedPoints || expectedPoints.length === 0) return null;
    
    let closest = expectedPoints[0];
    let minDistance = Infinity;
    
    for (const point of expectedPoints) {
      // Calculate distance (normalized to account for time and price scale differences)
      const timeDistance = Math.abs(userPoint.time - point.time) / 86400; // Normalize to days
      const priceDistance = Math.abs(userPoint.price - point.price) / point.price; // Percentage difference
      
      const distance = Math.sqrt(timeDistance * timeDistance + priceDistance * priceDistance);
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }
    
    return closest;
  }
  
  /**
   * Determine the timeframe of the chart data
   * @param {Array} chartData - Chart data array
   * @returns {String} Timeframe identifier (1m, 1h, 1d, etc.)
   */
  function determineTimeframe(chartData) {
    if (!chartData || chartData.length < 2) return '1d'; // Default to daily
    
    // Look at consecutive time values to determine interval
    const timestamps = [];
    
    // Get timestamps, handling different possible formats
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
      } else if (candle.timestamp) {
        time = typeof candle.timestamp === 'number' ? 
          candle.timestamp : 
          new Date(candle.timestamp).getTime() / 1000;
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
   * Get appropriate time tolerance based on timeframe
   * @param {String} timeframe - Timeframe identifier
   * @returns {Number} Time tolerance in seconds
   */
  function getTimeTolerance(timeframe) {
    switch (timeframe) {
      case '1m': return 60 * 2;         // 2 minutes
      case '5m': return 60 * 10;        // 10 minutes
      case '15m': return 60 * 30;       // 30 minutes
      case '1h': return 60 * 60 * 2;    // 2 hours
      case '4h': return 60 * 60 * 8;    // 8 hours
      case '1d': return 60 * 60 * 24 * 3; // 3 days
      case '3d': return 60 * 60 * 24 * 6; // 6 days
      case '1w': return 60 * 60 * 24 * 10; // 10 days
      default: return 60 * 60 * 24 * 3;  // Default: 3 days
    }
  }
// lib/biasTestAnalytics.js
// Analytics collection service for bias tests

import BiasTestAnalytics from '../models/BiasTestAnalytics';

/**
 * Process and save bias test analytics from TestResults data
 * @param {Object} testResult - TestResults document from MongoDB
 * @param {Object} deviceInfo - Device and environment information
 * @returns {Promise<Object>} Analytics record
 */
export async function processBiasTestAnalytics(testResult, deviceInfo = {}) {
  try {
    console.log('Processing bias test analytics for:', testResult._id);
    console.log('Test result testType:', testResult.testType);
    console.log('Test result assetSymbol:', testResult.assetSymbol);
    
    // Determine test type based on asset symbol
    const getAssetType = (assetSymbol) => {
      const cryptoAssets = ['btc', 'eth', 'sol', 'bnb'];
      const stockAssets = ['aapl', 'nvda', 'tsla', 'gld'];
      const forexAssets = ['eurusd', 'gbpusd', 'usdjpy', 'audusd'];
      
      const symbol = assetSymbol.toLowerCase();
      if (cryptoAssets.includes(symbol)) return 'crypto';
      if (stockAssets.includes(symbol)) return 'stocks';
      if (forexAssets.includes(symbol)) return 'forex';
      return 'crypto'; // default
    };

    // Extract basic session info
    const mappedTestType = getAssetType(testResult.assetSymbol);
    console.log('Mapped test type:', mappedTestType);
    
    const sessionData = {
      userId: testResult.userId,
      sessionId: `bias_${testResult.userId}_${testResult.assetSymbol}_${Date.now()}`,
      testType: mappedTestType,
      assetSymbol: testResult.assetSymbol,
      sessionStartTime: testResult.completedAt ? 
        new Date(testResult.completedAt.getTime() - (testResult.details?.totalTime || 300) * 1000) : 
        new Date(),
      sessionEndTime: testResult.completedAt || new Date(),
      totalSessionTime: testResult.details?.totalTime || 0,
      finalScore: testResult.score || 0,
      finalAccuracy: testResult.totalPoints > 0 ? testResult.score / testResult.totalPoints : 0,
      totalQuestions: testResult.details?.testDetails?.length || 5,
      correctAnswers: testResult.details?.testDetails?.filter(q => q.isCorrect).length || 0
    };

    // Process question-level analytics
    const questionAnalytics = [];
    const testDetails = testResult.details?.testDetails || [];
    
    for (let i = 0; i < testDetails.length; i++) {
      const question = testDetails[i];
      // Convert Mongoose document to plain object to access all fields
      const questionData = question.toObject ? question.toObject() : question;
      
      // Extract technical factors from reasoning
      const technicalFactors = extractTechnicalFactors(questionData.reasoning || '');
      
      // Calculate technical complexity score
      const technicalComplexity = calculateTechnicalComplexity(technicalFactors, questionData.reasoning);
      
      // Calculate confidence accuracy
      const confidenceAccuracy = calculateConfidenceAccuracy(questionData.confidenceLevel, questionData.isCorrect);
      
      console.log(`Processing question ${i + 1}:`, {
        hasReasoning: !!questionData.reasoning,
        reasoningLength: (questionData.reasoning || '').length,
        hasAiAnalysis: !!questionData.aiAnalysis,
        aiAnalysisLength: (questionData.aiAnalysis || '').length,
        aiAnalysisValue: questionData.aiAnalysis ? questionData.aiAnalysis.substring(0, 100) + '...' : 'MISSING'
      });
      
      questionAnalytics.push({
        questionNumber: i + 1,
        timeSpent: questionData.timeSpent || 60,
        prediction: questionData.prediction?.toLowerCase() || 'bullish',
        correctAnswer: questionData.correctAnswer?.toLowerCase() || 'bullish',
        isCorrect: questionData.isCorrect || false,
        confidenceLevel: questionData.confidenceLevel || 5,
        confidenceAccuracy: confidenceAccuracy,
        reasoning: questionData.reasoning || '',
        reasoningLength: (questionData.reasoning || '').length,
        aiAnalysis: questionData.aiAnalysis || '',
        aiAnalysisLength: (questionData.aiAnalysis || '').length,
        technicalFactors: technicalFactors,
        technicalComplexity: technicalComplexity,
        marketCondition: questionData.marketCondition || 'trending',
        volumeProfile: questionData.volumeProfile || {
          avgVolume: 0,
          volumeTrend: 'stable',
          volumeSpikes: 0
        },
        submittedAt: questionData.submittedAt || new Date()
      });
    }

    // Calculate progression metrics
    const progressionMetrics = calculateProgressionMetrics(questionAnalytics);
    
    // Calculate behavioral metrics
    const behaviorMetrics = calculateBehaviorMetrics(questionAnalytics, sessionData);
    
    // Calculate comparative metrics
    const comparativeMetrics = calculateComparativeMetrics(questionAnalytics, sessionData);
    
    // Calculate monetization flags
    const monetizationFlags = calculateMonetizationFlags(sessionData, progressionMetrics, behaviorMetrics);
    
    // Set device and environment info
    const testEnvironment = {
      timeOfDay: getTimeOfDay(sessionData.sessionStartTime),
      dayOfWeek: getDayOfWeek(sessionData.sessionStartTime),
      isWeekend: isWeekend(sessionData.sessionStartTime),
      marketHours: isMarketHours(sessionData.sessionStartTime, sessionData.testType)
    };

    // Calculate research value
    const researchValue = calculateResearchValue(questionAnalytics, behaviorMetrics);

    // Create complete analytics record
    const analyticsData = {
      ...sessionData,
      questionAnalytics,
      progressionMetrics,
      behaviorMetrics,
      comparativeMetrics,
      monetizationFlags,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || '',
        screenResolution: deviceInfo.screenResolution || '',
        isMobile: deviceInfo.isMobile || false,
        timezone: deviceInfo.timezone || 'UTC',
        language: deviceInfo.language || 'en'
      },
      testEnvironment,
      researchValue
    };

    // Save to database
    const analyticsRecord = new BiasTestAnalytics(analyticsData);
    await analyticsRecord.save();
    
    console.log('Bias test analytics saved successfully:', analyticsRecord._id);
    return analyticsRecord;
    
  } catch (error) {
    console.error('Error processing bias test analytics:', error);
    throw error;
  }
}

/**
 * Extract technical factors from reasoning text
 */
function extractTechnicalFactors(reasoning) {
  const technicalTerms = [
    'support', 'resistance', 'breakout', 'reversal', 'trend', 'momentum',
    'volume', 'rsi', 'macd', 'moving average', 'fibonacci', 'bollinger',
    'candlestick', 'pattern', 'consolidation', 'divergence', 'oversold',
    'overbought', 'bounce', 'pullback', 'rejection', 'confluence',
    'bullish', 'bearish', 'hammer', 'doji', 'engulfing', 'triangle',
    'flag', 'pennant', 'channel', 'wedge', 'double top', 'double bottom',
    'head and shoulders', 'cup and handle', 'ascending', 'descending'
  ];
  
  const text = reasoning.toLowerCase();
  return technicalTerms.filter(term => text.includes(term));
}

/**
 * Calculate technical complexity score (1-5)
 */
function calculateTechnicalComplexity(technicalFactors, reasoning) {
  const factorCount = technicalFactors.length;
  const reasoningLength = reasoning.length;
  
  if (factorCount === 0) return 1;
  if (factorCount <= 2 && reasoningLength < 50) return 2;
  if (factorCount <= 4 && reasoningLength < 100) return 3;
  if (factorCount <= 6 && reasoningLength < 200) return 4;
  return 5;
}

/**
 * Calculate confidence accuracy (how well-calibrated confidence is)
 */
function calculateConfidenceAccuracy(confidenceLevel, isCorrect) {
  const normalizedConfidence = confidenceLevel / 10; // 0-1 scale
  const actualAccuracy = isCorrect ? 1 : 0;
  return 1 - Math.abs(normalizedConfidence - actualAccuracy);
}

/**
 * Calculate progression metrics
 */
function calculateProgressionMetrics(questionAnalytics) {
  const totalQuestions = questionAnalytics.length;
  
  // Average time per question
  const averageTimePerQuestion = questionAnalytics.reduce((sum, q) => sum + q.timeSpent, 0) / totalQuestions;
  
  // Time consistency (lower variance = more consistent)
  const timeMean = averageTimePerQuestion;
  const timeVariance = questionAnalytics.reduce((sum, q) => sum + Math.pow(q.timeSpent - timeMean, 2), 0) / totalQuestions;
  const timeConsistency = 1 - Math.min(1, timeVariance / 3600); // Normalize
  
  // Average technical complexity
  const averageTechnicalComplexity = questionAnalytics.reduce((sum, q) => sum + q.technicalComplexity, 0) / totalQuestions;
  
  // Market condition accuracy
  const marketConditionAccuracy = {
    trending: 0,
    sideways: 0,
    volatile: 0
  };
  
  ['trending', 'sideways', 'volatile'].forEach(condition => {
    const conditionQuestions = questionAnalytics.filter(q => q.marketCondition === condition);
    if (conditionQuestions.length > 0) {
      marketConditionAccuracy[condition] = conditionQuestions.filter(q => q.isCorrect).length / conditionQuestions.length;
    }
  });
  
  // Consistency score (performance consistency across questions)
  const accuracies = questionAnalytics.map(q => q.isCorrect ? 1 : 0);
  const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / totalQuestions;
  const accuracyVariance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - avgAccuracy, 2), 0) / totalQuestions;
  const consistencyScore = 1 - accuracyVariance;
  
  return {
    averageTimePerQuestion,
    timeConsistency,
    averageTechnicalComplexity,
    marketConditionAccuracy,
    consistencyScore,
    // These will be calculated by the model's pre-save middleware
    overconfidenceScore: 0,
    confidenceConsistency: 0,
    technicalAnalysisScore: 0,
    improvementTrend: 0
  };
}

/**
 * Calculate behavioral metrics
 */
function calculateBehaviorMetrics(questionAnalytics, sessionData) {
  const totalTime = questionAnalytics.reduce((sum, q) => sum + q.timeSpent, 0);
  const avgReasoningLength = questionAnalytics.reduce((sum, q) => sum + q.reasoningLength, 0) / questionAnalytics.length;
  
  // Reasoning quality based on length and technical factors
  const avgTechnicalFactors = questionAnalytics.reduce((sum, q) => sum + q.technicalFactors.length, 0) / questionAnalytics.length;
  const reasoningQuality = Math.min(1, (avgReasoningLength / 150) * 0.6 + (avgTechnicalFactors / 5) * 0.4);
  
  // Exploration depth (placeholder - would need to track feature usage)
  const explorationDepth = 0.5; // Default medium exploration
  
  // Risk tolerance based on predictions and confidence
  const avgConfidence = questionAnalytics.reduce((sum, q) => sum + q.confidenceLevel, 0) / questionAnalytics.length;
  const bullishPredictions = questionAnalytics.filter(q => q.prediction === 'bullish').length;
  const riskTolerance = (avgConfidence / 10) * 0.6 + (bullishPredictions / questionAnalytics.length) * 0.4;
  
  return {
    sessionEngagement: 0, // Will be calculated by pre-save middleware
    reasoningQuality,
    explorationDepth,
    riskTolerance
  };
}

/**
 * Calculate comparative metrics
 */
function calculateComparativeMetrics(questionAnalytics, sessionData) {
  // Asset specialization (placeholder - would need historical data comparison)
  const assetSpecialization = sessionData.finalAccuracy;
  
  // Determine strongest market condition
  const conditionPerformance = {
    trending: questionAnalytics.filter(q => q.marketCondition === 'trending' && q.isCorrect).length,
    sideways: questionAnalytics.filter(q => q.marketCondition === 'sideways' && q.isCorrect).length,
    volatile: questionAnalytics.filter(q => q.marketCondition === 'volatile' && q.isCorrect).length
  };
  
  const marketConditionStrength = Object.keys(conditionPerformance).reduce((a, b) => 
    conditionPerformance[a] > conditionPerformance[b] ? a : b
  ) || 'balanced';
  
  // Detect bias pattern
  const bullishPredictions = questionAnalytics.filter(q => q.prediction === 'bullish').length;
  const avgConfidence = questionAnalytics.reduce((sum, q) => sum + q.confidenceLevel, 0) / questionAnalytics.length;
  
  let biasPattern = 'balanced';
  if (bullishPredictions > 3) biasPattern = 'bullish_bias';
  else if (bullishPredictions < 2) biasPattern = 'bearish_bias';
  else if (avgConfidence > 7) biasPattern = 'overconfident';
  else if (avgConfidence < 4) biasPattern = 'underconfident';
  
  return {
    assetSpecialization,
    marketConditionStrength,
    timeframePreference: '1h', // Would need to track from UI
    biasPattern
  };
}

/**
 * Calculate monetization flags
 */
function calculateMonetizationFlags(sessionData, progressionMetrics, behaviorMetrics) {
  // Learning velocity based on improvement and consistency
  const learningVelocity = (progressionMetrics.consistencyScore + sessionData.finalAccuracy) / 2;
  
  // Feature utilization (placeholder)
  const featureUtilization = 0.6; // Default 60%
  
  // Engagement level
  let engagementLevel = 'medium';
  if (behaviorMetrics.sessionEngagement > 0.7) engagementLevel = 'high';
  else if (behaviorMetrics.sessionEngagement < 0.4) engagementLevel = 'low';
  
  return {
    premiumCandidate: false, // Will be calculated by pre-save middleware
    churnRisk: 0, // Will be calculated by pre-save middleware
    engagementLevel,
    learningVelocity,
    featureUtilization
  };
}

/**
 * Calculate research value
 */
function calculateResearchValue(questionAnalytics, behaviorMetrics) {
  const uniqueInsights = questionAnalytics.reduce((count, q) => {
    return count + (q.technicalFactors.length > 2 && q.reasoningLength > 100 ? 1 : 0);
  }, 0);
  
  const marketableInsights = [];
  
  // Add insights based on patterns
  const avgTechnicalComplexity = questionAnalytics.reduce((sum, q) => sum + q.technicalComplexity, 0) / questionAnalytics.length;
  if (avgTechnicalComplexity > 3.5) {
    marketableInsights.push('advanced_technical_analysis');
  }
  
  return {
    dataQuality: 0, // Will be calculated by pre-save middleware
    uniqueInsights,
    marketableInsights
  };
}

/**
 * Utility functions
 */
function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getDayOfWeek(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isMarketHours(date, testType) {
  const hour = date.getUTCHours();
  
  if (testType === 'crypto') return true; // Crypto markets are 24/7
  if (testType === 'forex') {
    // Forex markets: Sunday 5 PM ET to Friday 5 PM ET
    const day = date.getUTCDay();
    if (day === 0 && hour < 22) return false; // Sunday before 5 PM ET
    if (day === 5 && hour >= 22) return false; // Friday after 5 PM ET
    if (day === 6) return false; // Saturday
    return true;
  }
  if (testType === 'stocks') {
    // US stock market: Monday-Friday 9:30 AM - 4:00 PM ET
    const day = date.getUTCDay();
    if (day === 0 || day === 6) return false; // Weekend
    return hour >= 14 && hour < 21; // 9:30 AM - 4:00 PM ET in UTC
  }
  
  return false;
}

export default {
  processBiasTestAnalytics
};
// lib/sandbox-bias-detection.js
// Bias Detection Service for Sandbox Trading Pre-Trade Analysis

import { filterContent, checkTradingRelevance } from './contentFilter.js';

/**
 * Enhanced validation and bias detection for pre-trade analysis
 */
export function validateAndDetectBias(preTradeAnalysis) {
  const { entryReason, technicalAnalysis, riskManagement, biasCheck, confidenceLevel } = preTradeAnalysis;
  
  // 1. Basic validation
  const basicErrors = validateBasicRequirements(preTradeAnalysis);
  if (basicErrors.length > 0) {
    return {
      isValid: false,
      errors: basicErrors
    };
  }
  
  // 2. Content filtering (using existing system)
  const contentCheck = filterContent(entryReason, { strictMode: true });
  if (!contentCheck.isValid) {
    return {
      isValid: false,
      errors: [contentCheck.reason],
      code: contentCheck.code
    };
  }
  
  // 3. Trading relevance check
  const relevanceCheck = checkTradingRelevance(entryReason);
  if (!relevanceCheck.isRelevant) {
    return {
      isValid: false,
      errors: ['Analysis must be trading-related and contain technical reasoning'],
      code: 'NOT_TRADING_RELEVANT'
    };
  }
  
  // 4. Extract technical factors
  const technicalFactors = extractTechnicalFactors(entryReason);
  
  // 5. Detect bias patterns
  const biasPatterns = detectBiasPatterns({
    reasoning: entryReason,
    technicalAnalysis,
    riskManagement,
    technicalFactors,
    confidenceLevel
  });
  
  // 6. Calculate analysis quality score
  const qualityScore = calculateAnalysisQuality({
    reasoningLength: entryReason.length,
    technicalFactors: technicalFactors.length,
    confidenceLevel,
    hasTechnicalAnalysis: !!technicalAnalysis,
    hasRiskManagement: !!riskManagement,
    tradingRelevance: relevanceCheck.score
  });
  
  // 7. Determine if biases are blocking (severe) or just warnings
  const severeBiases = biasPatterns.filter(b => b.severity === 'high' || b.severity === 'critical');
  const isBlocked = severeBiases.length > 0;
  
  return {
    isValid: !isBlocked,
    biasDetection: {
      patterns: biasPatterns,
      technicalFactors,
      qualityScore,
      tradingRelevance: relevanceCheck.score,
      isBlocked,
      severeBiases: severeBiases.length
    },
    warnings: biasPatterns.filter(b => b.severity === 'low' || b.severity === 'medium'),
    blockers: severeBiases
  };
}

/**
 * Basic validation requirements (same as existing system)
 */
function validateBasicRequirements(analysis) {
  const errors = [];
  
  // Only require entry reason for simplified trading experience
  if (!analysis.entryReason || analysis.entryReason.length < 10) {
    errors.push('Entry reason must be at least 10 characters');
  }
  
  // Optional fields - validate only if provided
  if (analysis.technicalAnalysis && analysis.technicalAnalysis.length < 10) {
    errors.push('Technical analysis must be at least 10 characters');
  }
  
  if (analysis.riskManagement && analysis.riskManagement.length < 10) {
    errors.push('Risk management plan must be at least 10 characters');
  }
  
  if (analysis.biasCheck && analysis.biasCheck.length < 10) {
    errors.push('Bias check must be at least 10 characters');
  }
  
  if (analysis.confidenceLevel && (analysis.confidenceLevel < 1 || analysis.confidenceLevel > 10)) {
    errors.push('Confidence level must be between 1 and 10');
  }
  
  if (analysis.expectedHoldTime && !['minutes', 'hours', 'days', 'weeks'].includes(analysis.expectedHoldTime)) {
    errors.push('Expected hold time must be valid');
  }
  
  if (analysis.emotionalState && !['calm', 'excited', 'fearful', 'confident', 'uncertain'].includes(analysis.emotionalState)) {
    errors.push('Emotional state must be valid');
  }
  
  return errors;
}

/**
 * Extract technical factors from reasoning (using bias test logic)
 */
function extractTechnicalFactors(reasoning) {
  const text = reasoning.toLowerCase();
  
  const technicalTerms = [
    // Price Action
    'support', 'resistance', 'breakout', 'breakdown', 'reversal', 'trend', 'uptrend', 'downtrend',
    'momentum', 'consolidation', 'sideways', 'range', 'channel', 'triangle', 'wedge',
    
    // Patterns
    'head and shoulders', 'double top', 'double bottom', 'cup and handle', 'flag', 'pennant',
    'ascending triangle', 'descending triangle', 'symmetrical triangle', 'falling wedge', 'rising wedge',
    
    // Technical Indicators
    'rsi', 'relative strength index', 'macd', 'moving average', 'ema', 'sma', 'bollinger bands',
    'fibonacci', 'retracement', 'extension', 'stochastic', 'williams %r', 'cci',
    'atr', 'average true range', 'adx', 'directional movement', 'volume profile',
    
    // Volume Analysis
    'volume', 'high volume', 'low volume', 'volume spike', 'accumulation', 'distribution',
    'volume weighted average price', 'vwap', 'on balance volume', 'obv',
    
    // Market Structure
    'higher highs', 'higher lows', 'lower highs', 'lower lows', 'swing high', 'swing low',
    'pivot point', 'key level', 'confluence', 'institutional level', 'round number',
    
    // Time Frames
    'daily chart', 'weekly chart', 'hourly chart', '4h chart', 'monthly chart',
    'timeframe', 'multi-timeframe', 'higher timeframe', 'lower timeframe',
    
    // Risk Management
    'stop loss', 'take profit', 'risk reward', 'position size', 'risk management',
    'money management', 'drawdown', 'leverage', 'margin'
  ];
  
  return technicalTerms.filter(term => text.includes(term));
}

/**
 * Detect bias patterns in the analysis
 */
function detectBiasPatterns({ reasoning, technicalAnalysis, riskManagement, technicalFactors, confidenceLevel }) {
  const patterns = [];
  const text = reasoning.toLowerCase();
  
  // 1. Overconfidence Bias
  if (confidenceLevel > 8 && technicalFactors.length < 3) {
    patterns.push({
      type: 'overconfidence',
      severity: 'high',
      message: 'High confidence (9-10/10) with limited technical analysis. Consider more factors before trading.',
      suggestion: 'Add more technical indicators or wait for stronger confluence.'
    });
  } else if (confidenceLevel > 9 && technicalFactors.length < 5) {
    patterns.push({
      type: 'overconfidence',
      severity: 'medium',
      message: 'Very high confidence with moderate technical analysis.',
      suggestion: 'Verify your analysis with additional timeframes or indicators.'
    });
  }
  
  // 2. Confirmation Bias
  const absoluteWords = ['always', 'never', 'certain', 'guaranteed', 'definitely', 'impossible', 'can\'t fail'];
  const foundAbsoluteWords = absoluteWords.filter(word => text.includes(word));
  if (foundAbsoluteWords.length > 0) {
    patterns.push({
      type: 'confirmation_bias',
      severity: 'medium',
      message: `Absolute language detected: "${foundAbsoluteWords.join(', ')}". Markets are probabilistic, not certain.`,
      suggestion: 'Use probabilistic language like "likely", "probable", or "high chance".'
    });
  }
  
  // 3. Emotional Trading Bias
  const emotionalWords = ['excited', 'fear', 'fomo', 'must', 'urgent', 'quickly', 'immediately', 'can\'t miss'];
  const foundEmotionalWords = emotionalWords.filter(word => text.includes(word));
  if (foundEmotionalWords.length > 0) {
    patterns.push({
      type: 'emotional_trading',
      severity: 'high',
      message: `Emotional language detected: "${foundEmotionalWords.join(', ')}". Emotion-driven decisions often lead to losses.`,
      suggestion: 'Wait for emotional clarity before trading. Set rules and stick to them.'
    });
  }
  
  // 4. Insufficient Risk Management
  if (!riskManagement && confidenceLevel > 6) {
    patterns.push({
      type: 'risk_management',
      severity: 'medium',
      message: 'No risk management plan provided for moderate to high confidence trade.',
      suggestion: 'Define your stop loss, take profit, and position size before entering.'
    });
  }
  
  // 5. Analysis Quality Issues
  if (reasoning.length < 30) {
    patterns.push({
      type: 'analysis_quality',
      severity: 'medium',
      message: 'Very brief analysis. Detailed reasoning leads to better outcomes.',
      suggestion: 'Explain your technical setup, market context, and reasoning in more detail.'
    });
  }
  
  // 6. Recency Bias
  const recentWords = ['just broke', 'just happened', 'right now', 'just saw', 'immediately after'];
  const foundRecentWords = recentWords.filter(phrase => text.includes(phrase));
  if (foundRecentWords.length > 0) {
    patterns.push({
      type: 'recency_bias',
      severity: 'low',
      message: 'Analysis may be overly focused on recent price action.',
      suggestion: 'Consider longer-term context and multiple timeframes.'
    });
  }
  
  // 7. Anchoring Bias
  const anchorWords = ['resistance turned support', 'previous high', 'previous low', 'same level'];
  const foundAnchorWords = anchorWords.filter(phrase => text.includes(phrase));
  if (foundAnchorWords.length > 2) {
    patterns.push({
      type: 'anchoring_bias',
      severity: 'low',
      message: 'Heavy reliance on historical price levels.',
      suggestion: 'Consider current market dynamics and changing conditions.'
    });
  }
  
  // 8. Insufficient Technical Analysis
  if (technicalFactors.length < 2 && confidenceLevel > 5) {
    patterns.push({
      type: 'insufficient_analysis',
      severity: 'medium',
      message: 'Limited technical factors for moderate to high confidence trade.',
      suggestion: 'Include more technical indicators, patterns, or confluence factors.'
    });
  }
  
  return patterns;
}

/**
 * Calculate analysis quality score (0-100)
 */
function calculateAnalysisQuality({ reasoningLength, technicalFactors, confidenceLevel, hasTechnicalAnalysis, hasRiskManagement, tradingRelevance }) {
  let score = 0;
  
  // Reasoning depth (0-25 points)
  if (reasoningLength >= 100) score += 25;
  else if (reasoningLength >= 50) score += 20;
  else if (reasoningLength >= 30) score += 15;
  else score += 10;
  
  // Technical factors (0-25 points)
  if (technicalFactors >= 5) score += 25;
  else if (technicalFactors >= 3) score += 20;
  else if (technicalFactors >= 2) score += 15;
  else if (technicalFactors >= 1) score += 10;
  else score += 0;
  
  // Confidence calibration (0-20 points)
  if (confidenceLevel >= 1 && confidenceLevel <= 10) {
    const factorToConfidenceRatio = technicalFactors / (confidenceLevel || 1);
    if (factorToConfidenceRatio >= 0.5) score += 20;
    else if (factorToConfidenceRatio >= 0.3) score += 15;
    else if (factorToConfidenceRatio >= 0.2) score += 10;
    else score += 5;
  }
  
  // Additional analysis (0-15 points)
  if (hasTechnicalAnalysis) score += 8;
  if (hasRiskManagement) score += 7;
  
  // Trading relevance (0-15 points)
  if (tradingRelevance >= 0.8) score += 15;
  else if (tradingRelevance >= 0.6) score += 12;
  else if (tradingRelevance >= 0.4) score += 8;
  else score += 5;
  
  return Math.min(100, Math.max(0, score));
}

export default { validateAndDetectBias };
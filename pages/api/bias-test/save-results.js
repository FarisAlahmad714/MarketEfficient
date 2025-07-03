// pages/api/bias-test/save-results.js
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { sanitizeInput, sanitizeAssetSymbol, sanitizeObjectId } from '../../../middleware/sanitization';
import { withCsrfProtect } from '../../../middleware/csrf';
import TestResults from '../../../models/TestResults';
import { processBiasTestAnalytics } from '../../../lib/biasTestAnalytics';
import logger from '../../../lib/logger';

// Validation function for test results
function validateTestData(data) {
  const { assetSymbol, timeframe, sessionId, answers, results } = data;
  
  // Validate sessionId
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
    return { valid: false, error: 'Invalid session ID' };
  }
  
  // Validate asset symbol
  const validAssets = ['btc', 'eth', 'sol', 'bnb', 'nvda', 'aapl', 'tsla', 'gld', 'random'];
  if (!assetSymbol || !validAssets.includes(assetSymbol.toLowerCase())) {
    return { valid: false, error: 'Invalid asset symbol' };
  }
  
  // Validate timeframe if provided
  const validTimeframes = ['daily', 'hourly', '1h', '4h', '1d', '1w'];
  if (timeframe && !validTimeframes.includes(timeframe.toLowerCase())) {
    return { valid: false, error: 'Invalid timeframe' };
  }
  
  // Validate answers/results structure
  const answersArray = results?.answers || answers;
  if (answersArray) {
    if (!Array.isArray(answersArray) || answersArray.length === 0 || answersArray.length > 20) {
      return { valid: false, error: 'Invalid answers data' };
    }
    
    // Validate each answer
    for (const answer of answersArray) {
      if (answer.user_prediction && !['bullish', 'bearish'].includes(answer.user_prediction.toLowerCase())) {
        return { valid: false, error: 'Invalid prediction value' };
      }
    }
  }
  
  return { valid: true };
}

async function saveResultsHandler(req, res) {
  const userId = req.user.id;
  
  // Apply sanitization
  sanitizeInput()(req, res, async () => {
    const { 
      assetSymbol, 
      timeframe, 
      score, 
      totalQuestions, 
      answers, 
      sessionId,
      results,
      updateAnalysis
    } = req.body;
    
    // Validate all input data
    const validation = validateTestData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Sanitize specific fields
    const sanitizedAssetSymbol = sanitizeAssetSymbol(assetSymbol);
    if (!sanitizedAssetSymbol) {
      return res.status(400).json({ 
        error: 'Invalid asset symbol format',
        code: 'INVALID_ASSET_FORMAT'
      });
    }
    
    try {
      // Check if this session has already been saved
      const existingResult = await TestResults.findOne({
        userId: userId,
        'details.sessionId': sessionId,
        testType: 'bias-test'
      });
      
      // Handle analysis update
      if (updateAnalysis && existingResult) {
        logger.log(`Updating AI analysis for session`);
        
        const analysisUpdates = answers.map(answer => ({
          test_id: answer.test_id,
          ai_analysis: answer.ai_analysis
        }));
        
        await existingResult.updateAnalysis(analysisUpdates);
        
        return res.status(200).json({
          success: true,
          message: 'AI analysis updated successfully'
        });
      }
      
      // If result already exists and we're not updating analysis
      if (existingResult) {
        return res.status(200).json({ 
          success: true, 
          message: 'Results already saved to database',
          alreadySaved: true
        });
      }
      
      // Prepare test details
      let testDetails = [];
      let finalScore = 0;
      let totalPoints = 0;
      let analysisStatus = 'pending';
      
      // Process results or answers
      if (results && results.answers && Array.isArray(results.answers)) {
        testDetails = results.answers.map(answer => ({
          question: parseInt(answer.test_id) || 0,
          prediction: (answer.user_prediction || answer.prediction || '').toLowerCase(),
          correctAnswer: (answer.correct_answer || '').toLowerCase(),
          isCorrect: Boolean(answer.is_correct),
          reasoning: answer.user_reasoning || answer.reasoning || '',
          aiAnalysis: answer.ai_analysis || null,
          ohlcData: Array.isArray(answer.ohlc_data) ? answer.ohlc_data.slice(0, 100) : [], // Limit array size
          outcomeData: Array.isArray(answer.outcome_data) ? answer.outcome_data.slice(0, 100) : [], // Limit array size
          analysisStatus: answer.ai_analysis ? 'completed' : 'pending',
          // Enhanced metadata fields
          setupImageUrl: answer.setupImageUrl || null,
          setupImagePath: answer.setupImagePath || null,
          outcomeImageUrl: answer.outcomeImageUrl || null,
          outcomeImagePath: answer.outcomeImagePath || null,
          confidenceLevel: parseInt(answer.confidenceLevel) || 5,
          timeSpent: parseInt(answer.timeSpent) || 0,
          marketCondition: answer.marketCondition || 'unknown',
          volumeProfile: answer.volumeProfile || null,
          technicalFactors: Array.isArray(answer.technicalFactors) ? answer.technicalFactors : [],
          submittedAt: answer.submittedAt ? new Date(answer.submittedAt) : new Date()
        }));
        
        finalScore = parseInt(results.score) || 0;
        totalPoints = parseInt(results.total) || results.answers.length || 0;
        analysisStatus = results.status || 'processing';
      } else if (answers && Array.isArray(answers)) {
        testDetails = answers.map(answer => ({
          question: parseInt(answer.test_id) || 0,
          prediction: (answer.user_prediction || answer.prediction || '').toLowerCase(),
          correctAnswer: (answer.correct_answer || '').toLowerCase(),
          isCorrect: Boolean(answer.is_correct),
          reasoning: answer.user_reasoning || answer.reasoning || '',
          aiAnalysis: answer.ai_analysis || null,
          ohlcData: Array.isArray(answer.ohlc_data) ? answer.ohlc_data.slice(0, 100) : [],
          outcomeData: Array.isArray(answer.outcome_data) ? answer.outcome_data.slice(0, 100) : [],
          analysisStatus: answer.ai_analysis ? 'completed' : 'pending',
          // Enhanced metadata fields
          setupImageUrl: answer.setupImageUrl || null,
          setupImagePath: answer.setupImagePath || null,
          outcomeImageUrl: answer.outcomeImageUrl || null,
          outcomeImagePath: answer.outcomeImagePath || null,
          confidenceLevel: parseInt(answer.confidenceLevel) || 5,
          timeSpent: parseInt(answer.timeSpent) || 0,
          marketCondition: answer.marketCondition || 'unknown',
          volumeProfile: answer.volumeProfile || null,
          technicalFactors: Array.isArray(answer.technicalFactors) ? answer.technicalFactors : [],
          submittedAt: answer.submittedAt ? new Date(answer.submittedAt) : new Date()
        }));
        
        finalScore = parseInt(score) || 0;
        totalPoints = parseInt(totalQuestions) || answers.length || 0;
        analysisStatus = testDetails.every(detail => detail.aiAnalysis) ? 'completed' : 'processing';
      } else {
        return res.status(400).json({ 
          error: 'Invalid data format',
          code: 'INVALID_DATA_FORMAT',
          message: 'No valid answers data provided'
        });
      }
      
      // Validate score ranges
      if (finalScore < 0 || finalScore > totalPoints || totalPoints > 20 || totalPoints < 1) {
        return res.status(400).json({ 
          error: 'Invalid score values',
          code: 'INVALID_SCORE'
        });
      }
      
      // Save to database
      if (testDetails.length > 0) {
        const testResult = new TestResults({
          userId: userId,
          testType: 'bias-test',
          assetSymbol: sanitizedAssetSymbol.toLowerCase(),
          score: finalScore,
          totalPoints: totalPoints,
          status: analysisStatus,
          details: {
            timeframe: timeframe || 'daily',
            sessionId: sessionId,
            testDetails: testDetails
          },
          completedAt: new Date()
        });
        
        if (analysisStatus === 'completed') {
          testResult.analysisCompletedAt = new Date();
        }
        
        await testResult.save();
        logger.log(`Bias test result saved, score: ${finalScore}/${totalPoints} for ${sanitizedAssetSymbol}`);
        
        // Check for new badges and send notifications
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
        
        // Process analytics data asynchronously (only for bias tests)
        if (testResult.testType === 'bias-test') {
          try {
            logger.log(`Starting analytics processing for test result: ${testResult._id}`);
            const deviceInfo = {
              userAgent: req.headers['user-agent'] || '',
              screenResolution: req.headers['x-screen-resolution'] || '',
              isMobile: /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent'] || ''),
              timezone: req.headers['x-timezone'] || 'UTC',
              language: req.headers['accept-language']?.split(',')[0] || 'en'
            };
            
            logger.log(`Device info prepared:`, deviceInfo);
            logger.log(`Test result data for analytics:`, {
              testType: testResult.testType,
              assetSymbol: testResult.assetSymbol,
              score: testResult.score,
              totalPoints: testResult.totalPoints,
              testDetailsCount: testResult.details?.testDetails?.length || 0
            });
            
            await processBiasTestAnalytics(testResult, deviceInfo);
            logger.log(`Analytics processed successfully for bias test: ${testResult._id}`);
          } catch (analyticsError) {
            logger.error('Error processing bias test analytics:', analyticsError);
            logger.error('Analytics error stack:', analyticsError.stack);
            logger.error('Analytics error details:', {
              message: analyticsError.message,
              name: analyticsError.name,
              testResultId: testResult._id
            });
            // Don't fail the main request if analytics processing fails
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Results saved to database successfully',
          status: analysisStatus
        });
      }
      
      return res.status(400).json({ 
        error: 'Invalid test details',
        code: 'INVALID_TEST_DETAILS',
        message: 'Unable to process test results'
      });
      
    } catch (error) {
      logger.error('Save results error:', error);
      throw error; // Let the API handler deal with it
    }
  });
}

// Export the wrapped handler
import { composeMiddleware } from '../../../lib/api-handler';
export default createApiHandler(
  composeMiddleware(requireAuth, withCsrfProtect, saveResultsHandler),
  { methods: ['POST'] }
);
// pages/api/bias-test/save-results.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import TestResults from '../../../models/TestResults';

// Main handler function - now much cleaner!
async function saveResultsHandler(req, res) {
  // User is already authenticated and attached to req.user
  const userId = req.user.id;
  
  // Get the data from the request body
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
  
  if (!sessionId) {
    return res.status(400).json({ 
      error: 'Session ID is required',
      code: 'SESSION_ID_REQUIRED'
    });
  }
  
  // Check if this session has already been saved
  const existingResult = await TestResults.findOne({
    userId: userId,
    'details.sessionId': sessionId,
    testType: 'bias-test'
  });
  
  // Handle analysis update
  if (updateAnalysis && existingResult) {
    console.log(`Updating AI analysis for session ${sessionId}`);
    
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
      question: answer.test_id || 0,
      prediction: answer.user_prediction || answer.prediction,
      correctAnswer: answer.correct_answer,
      isCorrect: answer.is_correct,
      reasoning: answer.user_reasoning || answer.reasoning,
      aiAnalysis: answer.ai_analysis,
      ohlcData: answer.ohlc_data || [],
      outcomeData: answer.outcome_data || [],
      analysisStatus: answer.ai_analysis ? 'completed' : 'pending'
    }));
    
    finalScore = results.score || 0;
    totalPoints = results.total || results.answers.length || 0;
    analysisStatus = results.status || 'processing';
  } else if (answers && Array.isArray(answers)) {
    testDetails = answers.map(answer => ({
      question: answer.test_id || 0,
      prediction: answer.user_prediction || answer.prediction,
      correctAnswer: answer.correct_answer,
      isCorrect: answer.is_correct,
      reasoning: answer.user_reasoning || answer.reasoning,
      aiAnalysis: answer.ai_analysis,
      ohlcData: answer.ohlc_data || [],
      outcomeData: answer.outcome_data || [],
      analysisStatus: answer.ai_analysis ? 'completed' : 'pending'
    }));
    
    finalScore = score || 0;
    totalPoints = totalQuestions || answers.length || 0;
    analysisStatus = testDetails.every(detail => detail.aiAnalysis) ? 'completed' : 'processing';
  } else {
    return res.status(400).json({ 
      error: 'Invalid data format',
      code: 'INVALID_DATA_FORMAT',
      message: 'No valid answers data provided'
    });
  }
  
  // Save to database
  if (testDetails.length > 0) {
    const testResult = new TestResults({
      userId: userId,
      testType: 'bias-test',
      assetSymbol: assetSymbol,
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
    console.log(`Bias test result saved, score: ${finalScore}/${totalPoints} for ${assetSymbol}`);
    
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
}

// Export the wrapped handler
export default createApiHandler(
  composeMiddleware(requireAuth, saveResultsHandler),
  { methods: ['POST'] }
);

// For easier migration, also export a composed middleware version
import { composeMiddleware } from '../../../lib/api-handler';
export const handler = createApiHandler(
  composeMiddleware(requireAuth, saveResultsHandler),
  { methods: ['POST'] }
);
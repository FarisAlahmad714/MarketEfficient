// pages/api/bias-test/get-results.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { optionalAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import TestResults from '../../../models/TestResults';

async function getResultsHandler(req, res) {
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ 
      error: 'Session ID is required',
      code: 'SESSION_ID_REQUIRED'
    });
  }
  
  // Build search query - if user is authenticated, prioritize their results
  let dbResult = null;
  
  if (req.user) {
    // First try to find results for authenticated user
    dbResult = await TestResults.findOne({
      userId: req.user.id,
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
  }
  
  // If not found with userId or user not authenticated, try session-only search
  if (!dbResult) {
    dbResult = await TestResults.findOne({
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
  }
  
  if (!dbResult) {
    return res.status(404).json({ 
      error: 'Results not found',
      code: 'RESULTS_NOT_FOUND',
      message: 'No results found for this session ID'
    });
  }
  
  // DEBUGGING: Log the first question's chart data
  if (dbResult.details && dbResult.details.testDetails && dbResult.details.testDetails.length > 0) {
    const firstQuestion = dbResult.details.testDetails[0];
    console.log('DATABASE CHART DATA CHECK:');
    console.log('- First question has ohlcData:', 
      firstQuestion.ohlcData ? 
      `Yes, ${firstQuestion.ohlcData.length} candles` : 
      'No'
    );
    console.log('- First question has outcomeData:', 
      firstQuestion.outcomeData ? 
      `Yes, ${firstQuestion.outcomeData.length} candles` : 
      'No'
    );
  }
  
  // Format results for response
  const formattedResults = {
    asset_name: dbResult.assetSymbol,
    asset_symbol: dbResult.assetSymbol,
    session_id: session_id,
    score: dbResult.score,
    total: dbResult.totalPoints,
    selected_timeframe: dbResult.details.timeframe || 'daily',
    answers: dbResult.details.testDetails.map(detail => ({
      test_id: detail.question,
      user_prediction: detail.prediction,
      correct_answer: detail.correctAnswer,
      is_correct: detail.isCorrect,
      user_reasoning: detail.reasoning || null,
      ai_analysis: detail.aiAnalysis || null,
      timeframe: dbResult.details.timeframe || 'daily',
      // Return the stored chart data for each question
      ohlc_data: detail.ohlcData || [],
      outcome_data: detail.outcomeData || []
    })),
    source: 'database',
    status: dbResult.status,
    completedAt: dbResult.completedAt,
    analysisCompletedAt: dbResult.analysisCompletedAt
  };

  // DEBUGGING: Check formatted data
  if (formattedResults.answers && formattedResults.answers.length > 0) {
    console.log('FORMATTED RESULTS CHECK:');
    console.log('- First answer has ohlc_data:', 
      formattedResults.answers[0].ohlc_data ? 
      `Yes, ${formattedResults.answers[0].ohlc_data.length} candles` : 
      'No'
    );
  }
  
  return res.status(200).json(formattedResults);
}

// Export with optional auth (allows both authenticated and public access)
export default createApiHandler(
  composeMiddleware(optionalAuth, getResultsHandler),
  { methods: ['GET'] }
);
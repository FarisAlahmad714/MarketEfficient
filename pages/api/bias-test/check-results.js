// pages/api/bias-test/check-results.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { optionalAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import TestResults from '../../../models/TestResults';

async function checkResultsHandler(req, res) {
  // Get session_id from query
  const { session_id } = req.query;
  
  if (!session_id) {
    return res.status(400).json({ 
      error: 'Session ID is required',
      code: 'SESSION_ID_REQUIRED'
    });
  }
  
  // User ID is available if authenticated (via optionalAuth middleware)
  const userId = req.user?.id;
  
  // If we have a userId, try to find by user and session
  let dbResult = null;
  if (userId) {
    dbResult = await TestResults.findOne({
      userId: userId,
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
  }
  
  // If not found with userId, try to find by session only
  if (!dbResult) {
    dbResult = await TestResults.findOne({
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
  }
  
  // If we have database results, return them
  if (dbResult) {
    return res.status(200).json({
      ready: true,
      source: 'database',
      status: dbResult.status,
      score: dbResult.score,
      totalPoints: dbResult.totalPoints,
      analysisComplete: dbResult.status === 'completed',
      timeframe: dbResult.details.timeframe,
      completedAt: dbResult.completedAt,
      analysisCompletedAt: dbResult.analysisCompletedAt
    });
  }
  
  // If results are not found in database, check if we have pending test data
  const testData = await TestResults.findOne({
    'details.sessionId': `${session_id}_test`,
    testType: 'bias-test-data'
  });
  
  if (testData) {
    return res.status(200).json({
      ready: false,
      source: 'test-data',
      message: 'Test has been generated but no results submitted yet.'
    });
  }
  
  // If nothing found, return not ready
  return res.status(200).json({
    ready: false,
    message: 'No results found for this session.'
  });
}

// Export with optional auth (allows both authenticated and public access)
export default createApiHandler(
  composeMiddleware(optionalAuth, checkResultsHandler),
  { methods: ['GET'] }
);
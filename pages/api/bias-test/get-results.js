// pages/api/bias-test/get-results.js
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Get Authorization header (optional)
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.log('Token verification failed, proceeding without user ID');
      }
    }
    
    // Connect to database
    await connectDB();
    
    // Find test results
    let dbResult;
    if (userId) {
      // Try to find by user and session first
      dbResult = await TestResults.findOne({
        userId: userId,
        'details.sessionId': session_id,
        testType: 'bias-test'
      });
    }
    
    if (!dbResult) {
      // If not found with userId or no userId, try by session only
      dbResult = await TestResults.findOne({
        'details.sessionId': session_id,
        testType: 'bias-test'
      });
    }
    
    if (!dbResult) {
      return res.status(404).json({ 
        error: 'Results not found',
        message: 'No results found for this session ID'
      });
    }
    
    // Get the asset name if possible
    let assetName = dbResult.assetSymbol;
    // Could add asset name lookup based on symbol here if needed
    
    // Convert database model to format expected by results page
    const formattedResults = {
      asset_name: assetName,
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
        // Note: We can't include ohlc_data and outcome_data here
        // unless they were also stored in the database
        ohlc_data: [],
        outcome_data: []
      })),
      source: 'database',
      status: dbResult.status,
      completedAt: dbResult.completedAt,
      analysisCompletedAt: dbResult.analysisCompletedAt
    };
    
    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error retrieving test results:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve test results',
      message: error.message 
    });
  }
}
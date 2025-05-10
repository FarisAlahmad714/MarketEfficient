import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get session_id from query
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Get Authorization header (optional - we'll still check results even if not authenticated)
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extract token and decode user ID
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.log('Token verification failed, proceeding without user ID');
      }
    }
    
    // Connect to database
    await connectDB();
    
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
  } catch (error) {
    console.error('Error checking results status:', error);
    return res.status(500).json({ 
      error: 'Failed to check results status',
      message: error.message 
    });
  }
}
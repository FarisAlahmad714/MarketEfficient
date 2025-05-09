// pages/api/bias-test/check-results.js
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
    
    // First check if there are any matching results in the database
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
    
    // If we have database results, return them
    if (dbResult) {
      return res.status(200).json({
        ready: true,
        source: 'database',
        score: dbResult.score,
        totalPoints: dbResult.totalPoints,
        timeframe: dbResult.details.timeframe,
        results: true
      });
    }
    
    // Next check if results exist on the server (session-based storage)
    // Make a call to the test API to check results status
    const testApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/status?session_id=${session_id}`;
    
    try {
      const response = await fetch(testApiUrl);
      const data = await response.json();
      
      // If results are ready, tell the client
      if (data.resultsReady) {
        return res.status(200).json({
          ready: true,
          source: 'session',
          results: true
        });
      }
      
      // If results are not ready, tell the client to try again later
      return res.status(200).json({
        ready: false,
        message: 'Results are still being processed. Please wait a moment and try again.'
      });
    } catch (error) {
      console.error('Error checking test API status:', error);
      return res.status(200).json({
        ready: false,
        message: 'Unable to check results status. Please try again in a moment.'
      });
    }
  } catch (error) {
    console.error('Error checking results status:', error);
    return res.status(500).json({ 
      error: 'Failed to check results status',
      message: error.message 
    });
  }
}
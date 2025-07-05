import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';

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
    
    // Connect to database
    await connectDB();
    
    // Check for results in database
    const testResult = await TestResults.findOne({
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
    
    if (testResult) {
      return res.status(200).json({
        resultsReady: true,
        status: testResult.status,
        analysisComplete: testResult.status === 'completed'
      });
    }
    
    // Check for test data
    const testData = await TestResults.findOne({
      'details.sessionId': `${session_id}_test`,
      testType: 'bias-test-data'
    });
    
    if (testData) {
      return res.status(200).json({
        resultsReady: false,
        testDataReady: true,
        message: 'Test data found, but no results yet'
      });
    }
    
    // Nothing found
    return res.status(200).json({
      resultsReady: false,
      testDataReady: false,
      message: 'No data found for this session'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to check test status',
      message: error.message
    });
  }
}
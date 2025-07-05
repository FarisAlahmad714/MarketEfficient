import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Extract token and decode user ID
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { session_id, question_index, data_type, chart_data } = req.body;
    
    if (!session_id || question_index === undefined || !data_type || !chart_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Connect to database
    await connectDB();
    
    // Find the test results
    const testResult = await TestResults.findOne({
      userId: userId,
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
    
    if (!testResult) {
      return res.status(404).json({ error: 'Test results not found' });
    }
    
    // Update the chart data for the specific question
    if (testResult.details.testDetails && testResult.details.testDetails[question_index]) {
      if (data_type === 'setup') {
        testResult.details.testDetails[question_index].ohlcData = chart_data;
      } else if (data_type === 'outcome') {
        testResult.details.testDetails[question_index].outcomeData = chart_data;
      }
      
      await testResult.save();
      
      return res.status(200).json({
        success: true,
        message: `Chart data updated successfully for question ${question_index + 1}`
      });
    } else {
      return res.status(400).json({ error: 'Invalid question index' });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to update chart data',
      message: error.message 
    });
  }
}
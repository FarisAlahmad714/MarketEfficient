import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Connect to database
    await connectDB();
    
    // Find test results
    const dbResult = await TestResults.findOne({
      'details.sessionId': session_id,
      testType: 'bias-test'
    });
    
    if (!dbResult) {
      return res.status(404).json({ 
        error: 'Results not found',
        message: 'No results found for this session ID'
      });
    }
    
    // Check for chart data
    const testDetails = dbResult.details?.testDetails || [];
    const chartDataInfo = testDetails.map(detail => ({
      question: detail.question,
      has_ohlc_data: detail.ohlcData ? true : false,
      ohlc_data_length: detail.ohlcData?.length || 0,
      has_outcome_data: detail.outcomeData ? true : false,
      outcome_data_length: detail.outcomeData?.length || 0,
    }));
    
    return res.status(200).json({
      session_id,
      hasTestDetails: testDetails.length > 0,
      testDetailsCount: testDetails.length,
      chartDataInfo
    });
  } catch (error) {
    console.error('Error checking chart data:', error);
    return res.status(500).json({ 
      error: 'Failed to check chart data',
      message: error.message 
    });
  }
}
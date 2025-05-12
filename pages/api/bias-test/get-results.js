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
    
    // Connect to database
    await connectDB();
    
    // Find test results (simplified query for debugging)
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
    
    // Rest of your code as before...
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
  } catch (error) {
    console.error('Error retrieving test results:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve test results',
      message: error.message 
    });
  }
}
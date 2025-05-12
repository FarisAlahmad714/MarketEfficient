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
    
    // Get the data from the request body
    const { 
      assetSymbol, 
      timeframe, 
      score, 
      totalQuestions, 
      answers, 
      sessionId,
      results, // This is the full results object from the API
      updateAnalysis // New flag to indicate updating just the analysis
    } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Connect to database
    await connectDB();
    
    // Check if this session has already been saved to avoid duplicates
    const existingResult = await TestResults.findOne({
      userId: userId,
      'details.sessionId': sessionId,
      testType: 'bias-test'
    });
    
    // If this is an analysis update, handle it differently
    if (updateAnalysis && existingResult) {
      console.log(`Updating AI analysis for session ${sessionId}`);
      
      // Extract just the analysis updates from answers
      const analysisUpdates = answers.map(answer => ({
        test_id: answer.test_id,
        ai_analysis: answer.ai_analysis
      }));
      
      // Update the existing result with new analysis
      await existingResult.updateAnalysis(analysisUpdates);
      
      return res.status(200).json({
        success: true,
        message: 'AI analysis updated successfully'
      });
    }
    
    // If result already exists and we're not updating analysis, return success
    if (existingResult) {
      return res.status(200).json({ 
        success: true, 
        message: 'Results already saved to database',
        alreadySaved: true
      });
    }
    
    // Prepare test details based on the format of the data we received
    let testDetails = [];
    let finalScore = 0;
    let totalPoints = 0;
    let analysisStatus = 'pending';
    
    // First try to get data from results object (which comes directly from the API)
    if (results && results.answers && Array.isArray(results.answers)) {
      testDetails = results.answers.map(answer => ({
        question: answer.test_id || 0,
        prediction: answer.user_prediction || answer.prediction,
        correctAnswer: answer.correct_answer,
        isCorrect: answer.is_correct,
        reasoning: answer.user_reasoning || answer.reasoning,
        aiAnalysis: answer.ai_analysis,
        // Store chart data for each question
        ohlcData: answer.ohlc_data || [],
        outcomeData: answer.outcome_data || [],
        analysisStatus: answer.ai_analysis ? 'completed' : 'pending'
      }));
      
      finalScore = results.score || 0;
      totalPoints = results.total || results.answers.length || 0;
      analysisStatus = results.status || 'processing';
    } 
    // Otherwise try to use the answers array that was passed directly
    else if (answers && Array.isArray(answers)) {
      testDetails = answers.map(answer => ({
        question: answer.test_id || 0,
        prediction: answer.user_prediction || answer.prediction,
        correctAnswer: answer.correct_answer,
        isCorrect: answer.is_correct,
        reasoning: answer.user_reasoning || answer.reasoning,
        aiAnalysis: answer.ai_analysis,
        // Store chart data for each question
        ohlcData: answer.ohlc_data || [],
        outcomeData: answer.outcome_data || [],
        analysisStatus: answer.ai_analysis ? 'completed' : 'pending'
      }));
      
      finalScore = score || 0;
      totalPoints = totalQuestions || answers.length || 0;
      analysisStatus = testDetails.every(detail => detail.aiAnalysis) ? 'completed' : 'processing';
    } 
    // If we don't have either, return an error
    else {
      return res.status(400).json({ 
        error: 'Invalid data format',
        message: 'No valid answers data provided'
      });
    }
    
    // If we have valid test details, save to database
    if (testDetails.length > 0) {
      // Create and save the test result
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
      
      // If all analysis is complete, set analysisCompletedAt
      if (analysisStatus === 'completed') {
        testResult.analysisCompletedAt = new Date();
      }
      
      await testResult.save();
      console.log(`Bias test result saved for user ${userId}, score: ${finalScore}/${totalPoints} for ${assetSymbol}`);
      
      return res.status(200).json({
        success: true,
        message: 'Results saved to database successfully',
        status: analysisStatus
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid test details',
        message: 'Unable to process test results'
      });
    }
  } catch (error) {
    console.error('Error saving bias test results:', error);
    return res.status(500).json({ 
      error: 'Failed to save results',
      message: error.message 
    });
  }
}
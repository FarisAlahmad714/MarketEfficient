// pages/api/bias-test/save-results.js
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
      results // This is the full results object from the API
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
    
    // First try to get data from results object (which comes directly from the API)
    if (results && results.answers && Array.isArray(results.answers)) {
      testDetails = results.answers.map(answer => ({
        question: answer.test_id || 0,
        prediction: answer.user_prediction || answer.prediction,
        correctAnswer: answer.correct_answer,
        isCorrect: answer.is_correct,
        reasoning: answer.user_reasoning || answer.reasoning,
        aiAnalysis: answer.ai_analysis
      }));
      
      finalScore = results.score || 0;
      totalPoints = results.total || results.answers.length || 0;
    } 
    // Otherwise try to use the answers array that was passed directly
    else if (answers && Array.isArray(answers)) {
      testDetails = answers.map(answer => ({
        question: answer.test_id || 0,
        prediction: answer.user_prediction || answer.prediction,
        correctAnswer: answer.correct_answer,
        isCorrect: answer.is_correct,
        reasoning: answer.user_reasoning || answer.reasoning,
        aiAnalysis: answer.ai_analysis
      }));
      
      finalScore = score || 0;
      totalPoints = totalQuestions || answers.length || 0;
    } 
    // If we don't have either, try to fetch from the test API directly
    else {
      try {
        const testUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/${assetSymbol}?session_id=${sessionId}`;
        const response = await fetch(testUrl);
        const data = await response.json();
        
        if (data && data.answers && Array.isArray(data.answers)) {
          testDetails = data.answers.map(answer => ({
            question: answer.test_id || 0,
            prediction: answer.user_prediction || answer.prediction,
            correctAnswer: answer.correct_answer,
            isCorrect: answer.is_correct,
            reasoning: answer.user_reasoning || answer.reasoning,
            aiAnalysis: answer.ai_analysis
          }));
          
          finalScore = data.score || 0;
          totalPoints = data.total || data.answers.length || 0;
        } else {
          console.log('Unable to extract test details from API response');
          return res.status(400).json({ 
            error: 'Unable to extract test details',
            message: 'Results data format is not recognized'
          });
        }
      } catch (error) {
        console.error('Error fetching test results from API:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch test results',
          message: error.message
        });
      }
    }
    
    // If we still don't have valid test details, return an error
    if (testDetails.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid test details',
        message: 'Unable to process test results'
      });
    }
    
    // Save test result to database
    const testResult = new TestResults({
      userId: userId,
      testType: 'bias-test',
      assetSymbol: assetSymbol,
      score: finalScore,
      totalPoints: totalPoints,
      details: {
        timeframe: timeframe || 'daily',
        sessionId: sessionId,
        testDetails: testDetails
      },
      completedAt: new Date()
    });
    
    await testResult.save();
    console.log(`Bias test result saved for user ${userId}, score: ${finalScore}/${totalPoints} for ${assetSymbol}`);
    
    return res.status(200).json({
      success: true,
      message: 'Results saved to database successfully'
    });
  } catch (error) {
    console.error('Error saving bias test results:', error);
    return res.status(500).json({ 
      error: 'Failed to save results',
      message: error.message 
    });
  }
}
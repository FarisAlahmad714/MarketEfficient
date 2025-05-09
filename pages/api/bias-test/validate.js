// pages/api/bias-test/validate.js
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
    const { predictions, correctAnswers, assetSymbol, timeframe, chartData } = req.body;
    
    if (!predictions || !correctAnswers || !assetSymbol) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    
    // Calculate score based on correct predictions
    let score = 0;
    const details = [];
    
    for (let i = 0; i < predictions.length; i++) {
      const isCorrect = predictions[i] === correctAnswers[i];
      if (isCorrect) {
        score++;
      }
      
      details.push({
        question: i + 1,
        prediction: predictions[i],
        correctAnswer: correctAnswers[i],
        isCorrect: isCorrect
      });
    }
    
    // Connect to database
    await connectDB();
    
    // Save test result to database
    const testResult = new TestResults({
      userId: userId,
      testType: 'bias-test',
      assetSymbol: assetSymbol,
      score: score,
      totalPoints: predictions.length,
      details: {
        testDetails: details,
        timeframe: timeframe,
        chartData: chartData ? true : false // Just store if chart data was provided, not the actual data
      },
      completedAt: new Date()
    });
    
    await testResult.save();
    console.log(`Bias test result saved for user ${userId}, score: ${score}/${predictions.length} for ${assetSymbol}`);
    
    return res.status(200).json({
      success: true,
      message: `Bias Test: ${score}/${predictions.length} correct predictions!`,
      score: score,
      totalPoints: predictions.length,
      details: details,
      assetSymbol: assetSymbol
    });
  } catch (error) {
    console.error('Error in bias-test validation API:', error);
    return res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
}
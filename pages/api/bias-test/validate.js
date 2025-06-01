// pages/api/bias-test/validate.js
// MIGRATED VERSION - Using centralized middleware

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger'; // Adjust path to your logger utility
async function validateHandler(req, res) {
  // User is already authenticated via middleware
  const userId = req.user.id;
  
  // Get the data from the request body
  const { predictions, correctAnswers, assetSymbol, timeframe, chartData } = req.body;
  
  if (!predictions || !correctAnswers || !assetSymbol) {
    return res.status(400).json({ 
      error: 'Invalid data provided',
      code: 'INVALID_DATA',
      message: 'predictions, correctAnswers, and assetSymbol are required'
    });
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
  logger.log(`Bias test result saved, score: ${score}/${predictions.length} for ${assetSymbol}`);
  
  return res.status(200).json({
    success: true,
    message: `Bias Test: ${score}/${predictions.length} correct predictions!`,
    score: score,
    totalPoints: predictions.length,
    details: details,
    assetSymbol: assetSymbol
  });
}

// Export with required auth
export default createApiHandler(
  composeMiddleware(requireAuth, validateHandler),
  { methods: ['POST'] }
);
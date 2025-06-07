// pages/api/bias-test/update-outcome-images.js
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { sanitizeInput } from '../../../middleware/sanitization';
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger';

async function updateOutcomeImagesHandler(req, res) {
  const userId = req.user.id;
  
  try {
    const { sessionId, outcomeImages } = req.body;
    
    logger.log(`Updating outcome images for session: ${sessionId}`);
    
    if (!sessionId || !outcomeImages || !Array.isArray(outcomeImages)) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, outcomeImages array',
        code: 'MISSING_FIELDS'
      });
    }
    
    await connectDB();
    
    // Find the test result by session ID
    const testResult = await TestResults.findOne({
      userId: userId,
      'details.sessionId': sessionId,
      testType: 'bias-test'
    });
    
    if (!testResult) {
      return res.status(404).json({ 
        error: 'Test session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    // Update outcome image URLs and paths for each question
    let updatedCount = 0;
    outcomeImages.forEach(({ questionId, imageUrl, gcsPath }) => {
      const testDetail = testResult.details.testDetails.find(td => td.question === questionId);
      if (testDetail) {
        testDetail.outcomeImageUrl = imageUrl;
        testDetail.outcomeImagePath = gcsPath;
        updatedCount++;
        logger.log(`Updated outcome image for question ${questionId}`);
      }
    });
    
    if (updatedCount > 0) {
      await testResult.save();
      logger.log(`Updated ${updatedCount} outcome images for session ${sessionId}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} outcome images`,
      updatedCount
    });
    
  } catch (error) {
    logger.error('Update outcome images error:', error);
    return res.status(500).json({ 
      error: 'Failed to update outcome images',
      code: 'UPDATE_ERROR',
      details: error.message
    });
  }
}

// Export the wrapped handler
import { composeMiddleware } from '../../../lib/api-handler';
export default createApiHandler(
  composeMiddleware(requireAuth, updateOutcomeImagesHandler),
  { methods: ['POST'] }
);
// pages/api/bias-test/update-chart-images.js
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger';

async function updateChartImagesHandler(req, res) {
  const userId = req.user.id;
  
  try {
    const { sessionId, chartImages, imageType = 'setup' } = req.body;
    
    logger.log(`Updating ${imageType} chart images for session: ${sessionId}`);
    
    if (!sessionId || !chartImages || !Array.isArray(chartImages)) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, chartImages (array)',
        code: 'MISSING_FIELDS'
      });
    }
    
    let updatedCount = 0;
    
    // Update each chart image in the database
    for (const chartImage of chartImages) {
      const { questionId, imageUrl, gcsPath } = chartImage;
      
      if (!questionId || !imageUrl || !gcsPath) {
        logger.warn(`Skipping invalid chart image data:`, chartImage);
        continue;
      }
      
      try {
        const updateField = imageType === 'setup' ? 'setupImageUrl' : 'outcomeImageUrl';
        const pathField = imageType === 'setup' ? 'setupImagePath' : 'outcomeImagePath';
        
        // Update the specific answer in the test results
        const result = await TestResults.updateOne(
          { 
            user_id: userId, 
            session_id: sessionId,
            'answers.test_id': questionId 
          },
          { 
            $set: { 
              [`answers.$.${updateField}`]: imageUrl,
              [`answers.$.${pathField}`]: gcsPath,
              [`answers.$.${imageType}ImageUpdatedAt`]: new Date()
            }
          }
        );
        
        if (result.matchedCount > 0) {
          updatedCount++;
          logger.log(`Updated ${imageType} image for question ${questionId} in session ${sessionId}`);
        } else {
          logger.warn(`No matching document found for question ${questionId} in session ${sessionId}`);
        }
      } catch (updateError) {
        logger.error(`Error updating ${imageType} image for question ${questionId}:`, updateError);
      }
    }
    
    logger.log(`Successfully updated ${updatedCount} ${imageType} chart images`);
    
    return res.status(200).json({
      success: true,
      updatedCount: updatedCount,
      message: `Updated ${updatedCount} ${imageType} chart images`
    });
    
  } catch (error) {
    logger.error('Error updating chart images:', error);
    return res.status(500).json({ 
      error: 'Failed to update chart images',
      code: 'UPDATE_ERROR',
      details: error.message
    });
  }
}

// Export the wrapped handler
import { composeMiddleware } from '../../../lib/api-handler';
export default createApiHandler(
  composeMiddleware(requireAuth, updateChartImagesHandler),
  { methods: ['POST'] }
);
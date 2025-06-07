// pages/api/bias-test/get-chart-image.js
import { createApiHandler } from '../../../lib/api-handler';
import { optionalAuth } from '../../../middleware/auth';
import { getSignedUrlForImage } from '../../../lib/gcs-service';
import logger from '../../../lib/logger';

async function getChartImageHandler(req, res) {
  const { gcsPath } = req.query;
  
  if (!gcsPath) {
    return res.status(400).json({ 
      error: 'GCS path is required',
      code: 'MISSING_GCS_PATH'
    });
  }
  
  try {
    // Generate a fresh signed URL for the chart image
    const signedUrl = await getSignedUrlForImage(gcsPath);
    
    logger.log(`Generated signed URL for chart image: ${gcsPath}`);
    
    return res.status(200).json({
      success: true,
      imageUrl: signedUrl
    });
    
  } catch (error) {
    logger.error('Error generating signed URL for chart image:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image URL',
      code: 'URL_GENERATION_ERROR'
    });
  }
}

// Export with optional auth (allows both authenticated and public access)
import { composeMiddleware } from '../../../lib/api-handler';
export default createApiHandler(
  composeMiddleware(optionalAuth, getChartImageHandler),
  { methods: ['GET'] }
);
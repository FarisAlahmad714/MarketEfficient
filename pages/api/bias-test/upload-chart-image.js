// pages/api/bias-test/upload-chart-image.js
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { sanitizeInput } from '../../../middleware/sanitization';
import { uploadChartImageToGCS, getSignedUrlForImage } from '../../../lib/gcs-service';
import logger from '../../../lib/logger';

async function uploadChartImageHandler(req, res) {
  const userId = req.user.id;
  
  try {
    const { imageBlob, sessionId, questionId, imageType } = req.body;
    
    // Log the request for debugging
    logger.log(`Chart upload request - sessionId: ${sessionId}, questionId: ${questionId}, imageType: ${imageType}`);
    logger.log(`imageBlob present: ${!!imageBlob}, imageBlob type: ${typeof imageBlob}`);
    
    if (!imageBlob || !sessionId || !questionId) {
      logger.error('Missing required fields in chart upload:', { imageBlob: !!imageBlob, sessionId, questionId });
      return res.status(400).json({ 
        error: 'Missing required fields: imageBlob, sessionId, questionId',
        code: 'MISSING_FIELDS',
        received: { imageBlob: !!imageBlob, sessionId, questionId }
      });
    }
    
    try {
      // Validate image format
      if (typeof imageBlob !== 'string' || !imageBlob.startsWith('data:image/')) {
        return res.status(400).json({ 
          error: 'Invalid image format. Expected base64 data URL.',
          code: 'INVALID_IMAGE_FORMAT'
        });
      }
      
      // Upload to GCS
      const { gcsPath } = await uploadChartImageToGCS(
        imageBlob, 
        userId, 
        sessionId, 
        questionId, 
        imageType || 'setup'
      );
      
      // Generate signed URL for immediate access
      const signedUrl = await getSignedUrlForImage(gcsPath);
      
      logger.log(`Chart image uploaded successfully for session ${sessionId}, question ${questionId}`);
      
      return res.status(200).json({
        success: true,
        imageUrl: signedUrl,
        gcsPath: gcsPath,
        message: 'Chart image uploaded successfully'
      });
      
    } catch (innerError) {
      logger.error('Inner upload chart image error:', innerError);
      return res.status(500).json({ 
        error: 'Failed to process chart image',
        code: 'PROCESSING_ERROR',
        details: innerError.message
      });
    }
  } catch (outerError) {
    logger.error('Outer upload chart image error:', outerError);
    return res.status(500).json({ 
      error: 'Failed to upload chart image',
      code: 'UPLOAD_ERROR',
      details: outerError.message
    });
  }
}

// Export the wrapped handler
import { composeMiddleware } from '../../../lib/api-handler';
export default createApiHandler(
  composeMiddleware(requireAuth, uploadChartImageHandler),
  { methods: ['POST'] }
);
import { getSignedUrlForImage } from '../../lib/gcs-service';
import logger from '../../lib/logger';
import { cache } from '../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Support both GET and POST for backward compatibility
    const gcsPath = req.method === 'GET' ? req.query.gcsPath : req.body.gcsPath;
    const userId = req.method === 'GET' ? req.query.userId : req.body.userId;

    if (!gcsPath) {
      return res.status(400).json({ error: 'GCS path is required' });
    }

    // Check cache first (if userId provided)
    let signedUrl;
    if (userId) {
      signedUrl = cache.profileImages.get(userId);
      if (signedUrl) {
        // Set cache headers for browser caching
        res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes
        return res.status(200).json({ profileImageUrl: signedUrl });
      }
    }

    // Generate new signed URL
    signedUrl = await getSignedUrlForImage(gcsPath);
    
    // Cache the result if userId provided
    if (userId && signedUrl) {
      cache.profileImages.set(userId, signedUrl, 1800); // 30 minutes
    }

    // Set cache headers for browser caching
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes
    
    return res.status(200).json({ 
      profileImageUrl: signedUrl 
    });

  } catch (error) {
    logger.error('Error generating signed URL:', error);
    return res.status(500).json({ 
      error: 'Failed to generate signed URL',
      details: error.message 
    });
  }
}
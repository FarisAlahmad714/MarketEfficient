import { getSignedUrlForImage } from '../../lib/gcs-service';
import logger from '../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { gcsPath } = req.body;

    if (!gcsPath) {
      return res.status(400).json({ error: 'GCS path is required' });
    }

    const signedUrl = await getSignedUrlForImage(gcsPath);
    
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
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const envStatus = {
      hasGoogleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      hasGoogleServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      hasGcsBucketName: !!process.env.GCS_BUCKET_NAME,
      gcsBucketName: process.env.GCS_BUCKET_NAME || 'NOT_SET',
      googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT_SET',
    };

    // Try to initialize storage
    let storageStatus = 'unknown';
    let bucketAccessible = false;
    
    try {
      const { Storage } = require('@google-cloud/storage');
      let storage;
      
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        storage = new Storage({ credentials });
        storageStatus = 'initialized_with_service_account_key';
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        storage = new Storage();
        storageStatus = 'initialized_with_application_credentials';
      } else {
        storageStatus = 'no_credentials_available';
      }

      if (storage && process.env.GCS_BUCKET_NAME) {
        const [exists] = await storage.bucket(process.env.GCS_BUCKET_NAME).exists();
        bucketAccessible = exists;
      }
    } catch (error) {
      storageStatus = `error: ${error.message}`;
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      envStatus,
      storageStatus,
      bucketAccessible,
    };

    logger.log('GCS Debug Info:', debugInfo);
    
    return res.status(200).json(debugInfo);
  } catch (error) {
    logger.error('Error in GCS debug endpoint:', error);
    return res.status(500).json({ 
      error: 'Debug endpoint failed',
      details: error.message 
    });
  }
}
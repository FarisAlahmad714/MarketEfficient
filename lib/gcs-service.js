import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
import path from 'path';
import logger from './logger';

let storage;
let bucketName;

try {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.warn(
      'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. GCS operations will fail'
    );
  }
  if (!process.env.GCS_BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME environment variable is not defined.');
  }

  storage = new Storage(); // SDK automatically uses GOOGLE_APPLICATION_CREDENTIALS
  bucketName = process.env.GCS_BUCKET_NAME;

  // Test connection / bucket existence (optional, but good for startup)
  storage.bucket(bucketName).exists().then(data => {
    const [exists] = data;
    if (exists) {
      logger.log(`Successfully connected to GCS bucket`);
    } else {
      logger.error(`GCS bucket does not exist or is not accessible`);
    }
  }).catch(err => {
    logger.error(`Error checking GCS bucket existence:`, err.message);
  });

} catch (error) {
  logger.error('Failed to initialize Google Cloud Storage:', error.message);
}

export const uploadImageToGCS = async (base64String, destinationFolder = 'profile-images') => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage not initialized. Cannot upload file.');
  }
  if (!base64String || !base64String.startsWith('data:image')) {
    throw new Error('Invalid base64 image string provided.');
  }

  try {
    const [metadata, base64Data] = base64String.split(',');
    if (!metadata || !base64Data) {
      throw new Error('Invalid base64 string format.');
    }
    
    const mimeType = metadata.match(/:(.*?);/)?.[1];
    if (!mimeType || !mimeType.startsWith('image/')) {
      throw new Error('Invalid or unsupported image MIME type.');
    }
    const extension = mimeType.split('/')[1];
    
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueFilename = `${uuidv4()}.${extension}`;
    const gcsPath = `${destinationFolder}/${uniqueFilename}`;
    
    const file = storage.bucket(bucketName).file(gcsPath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year (client-side)
      },
      // public: true, // Ensure this is removed or commented out
      resumable: false, 
    });
    
    // DO NOT return a public URL directly if bucket is not public
    // const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;

    logger.log(`Image uploaded to GCS successfully`);
    // Return only the gcsPath. The actual URL will be a signed URL generated on demand.
    return { gcsPath }; // MODIFIED: Return only gcsPath

  } catch (error) {
    logger.error('Error uploading image to GCS:', error);
    throw error;
  }
};

export const getSignedUrlForImage = async (gcsPath) => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage not initialized. Cannot generate signed URL.');
  }
  if (!gcsPath) {
    throw new Error('No GCS path provided for signed URL.');
  }

  try {
    const options = {
      version: 'v4', // Recommended version for signed URLs
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    // Generate a signed URL for the file.
    const [signedUrl] = await storage.bucket(bucketName).file(gcsPath).getSignedUrl(options);
    
    return signedUrl;
  } catch (error) {
    logger.error(`Error generating signed URL:`, error);
    // Rethrow or handle as appropriate for your API
    throw new Error('Could not generate signed URL.'); 
  }
};

export const uploadChartImageToGCS = async (base64String, userId, sessionId, questionId, imageType = 'setup') => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage not initialized. Cannot upload chart image.');
  }
  if (!base64String || !base64String.startsWith('data:image')) {
    throw new Error('Invalid base64 image string provided for chart.');
  }

  try {
    const [metadata, base64Data] = base64String.split(',');
    if (!metadata || !base64Data) {
      throw new Error('Invalid base64 string format for chart image.');
    }

    // Extract image format from metadata
    const mimeType = metadata.match(/data:image\/([a-zA-Z]*);base64/)?.[1] || 'png';
    
    // Generate readable timestamp
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const timestamp = `${dateString}_${timeString}`;
    
    // Create organized, readable path for chart images
    const fileName = `Q${questionId}_${imageType}_${timestamp}.${mimeType}`;
    const sessionFolder = sessionId.length > 8 ? sessionId.substring(0, 8) : sessionId; // Shorten session ID for readability
    const gcsPath = `bias-test-charts/user-${userId}/session-${sessionFolder}/${fileName}`;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create a reference to the file
    const file = storage.bucket(bucketName).file(gcsPath);
    
    // Upload the buffer
    await file.save(buffer, {
      metadata: {
        contentType: `image/${mimeType}`,
        metadata: {
          uploadedBy: userId,
          sessionId: sessionId,
          questionId: questionId.toString(),
          imageType: imageType,
          uploadedAt: now.toISOString(),
          humanReadableDate: now.toLocaleString()
        }
      },
      resumable: false, 
    });
    
    logger.log(`Chart image uploaded to GCS: ${gcsPath}`);
    return { gcsPath };

  } catch (error) {
    logger.error('Error uploading chart image to GCS:', error);
    throw error;
  }
};

export const deleteImageFromGCS = async (gcsPath) => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage not initialized. Cannot delete file.');
  }
  if (!gcsPath) {
    logger.warn('No GCS path provided for deletion, skipping');
    return;
  }

  try {
    await storage.bucket(bucketName).file(gcsPath).delete();
    logger.log(`Image deleted from GCS successfully`);
  } catch (error) {
    if (error.code === 404) {
      logger.warn(`Attempted to delete non-existent GCS file`);
      return;
    }
    logger.error(`Error deleting image from GCS:`, error);
    throw error;
  }
}; 
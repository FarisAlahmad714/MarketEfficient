import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
import path from 'path';
import logger from './logger';

/**
 * Validates image buffer against expected MIME type by checking file headers
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimeType - Expected MIME type
 * @returns {boolean} - True if valid image
 */
function isValidImageBuffer(buffer, mimeType) {
  if (!buffer || buffer.length < 8) return false;
  
  const header = buffer.subarray(0, 8);
  
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      // JPEG starts with FF D8 FF
      return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
    
    case 'image/png':
      // PNG starts with 89 50 4E 47 0D 0A 1A 0A
      return header[0] === 0x89 && header[1] === 0x50 && 
             header[2] === 0x4E && header[3] === 0x47 &&
             header[4] === 0x0D && header[5] === 0x0A &&
             header[6] === 0x1A && header[7] === 0x0A;
    
    case 'image/gif':
      // GIF starts with "GIF87a" or "GIF89a"
      const gifHeader = buffer.subarray(0, 6).toString('ascii');
      return gifHeader === 'GIF87a' || gifHeader === 'GIF89a';
    
    case 'image/webp':
      // WEBP starts with "RIFF" and "WEBP" at offset 8
      const riffHeader = buffer.subarray(0, 4).toString('ascii');
      const webpHeader = buffer.subarray(8, 12).toString('ascii');
      return riffHeader === 'RIFF' && webpHeader === 'WEBP';
    
    default:
      return false;
  }
}

let storage;
let bucketName;

try {
  // Check for credentials
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.warn(
      'Neither GOOGLE_SERVICE_ACCOUNT_KEY nor GOOGLE_APPLICATION_CREDENTIALS environment variable is set. GCS operations will fail'
    );
  }
  if (!process.env.GCS_BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME environment variable is not defined.');
  }

  // Initialize Storage with credentials
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    storage = new Storage({ credentials });
  } else {
    storage = new Storage(); // Fall back to GOOGLE_APPLICATION_CREDENTIALS
  }
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
  logger.error('Full error:', error);
  // Don't set storage to null, let the functions handle the undefined case
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
    
    // Validate allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    const extension = mimeType.split('/')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Security: File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      throw new Error(`File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`);
    }
    
    // Security: Basic image header validation
    if (!isValidImageBuffer(buffer, mimeType)) {
      throw new Error('File content does not match image type or contains invalid data');
    }
    
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

    // Extract and validate MIME type properly
    const fullMimeType = metadata.match(/:(.*?);/)?.[1];
    if (!fullMimeType || !fullMimeType.startsWith('image/')) {
      throw new Error('Invalid or unsupported image MIME type for chart.');
    }
    
    // Validate allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fullMimeType)) {
      throw new Error(`Unsupported chart image type: ${fullMimeType}. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    const mimeType = fullMimeType.split('/')[1];
    
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
    
    // Security: File size validation (10MB limit for chart images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      throw new Error(`Chart image size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`);
    }
    
    // Security: Basic image header validation
    if (!isValidImageBuffer(buffer, fullMimeType)) {
      throw new Error('Chart image content does not match image type or contains invalid data');
    }
    
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
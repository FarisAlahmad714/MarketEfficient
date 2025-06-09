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

// Helper functions for readable dates
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  return months[parseInt(month) - 1] || `Month_${month}`;
}

function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
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

export const uploadChartImageToGCS = async (base64String, userId, sessionId, questionId, imageType = 'setup', testType = 'unknown', userName = null) => {
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
    
    // Generate ISO timestamp for analytics
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Determine test type from context or default mapping
    const testTypeMap = {
      'fibonacci': 'fibonacci-analysis',
      'fvg': 'fair-value-gaps', 
      'swing': 'swing-analysis',
      'bias': 'bias-testing',
      'bias-test': 'bias-testing',
      'chart-exam': 'general-analysis'
    };
    
    // Default bias tests to bias-testing unless explicitly specified
    const analyticsTestType = testTypeMap[testType] || 'bias-testing';
    
    // Get user name for readable folder structure - we'll need to fetch this
    // For now, let's create a more readable structure
    const sessionShort = sessionId.substring(0, 8);
    const readableDate = `${year}-${month}-${day}`;
    const readableTime = now.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
    
    // Create pristine, readable folder structure
    const testTypeFolders = {
      'fibonacci-analysis': 'Fibonacci_Retracement_Analysis',
      'fair-value-gaps': 'Fair_Value_Gap_Detection', 
      'swing-analysis': 'Swing_High_Low_Analysis',
      'bias-testing': 'Market_Bias_Testing',
      'general-analysis': 'General_Chart_Analysis'
    };
    
    const readableTestType = testTypeFolders[analyticsTestType] || 'General_Chart_Analysis';
    
    // Pristine filename with all context
    const fileName = `Question_${questionId}_${imageType}_${readableDate}_${readableTime}.${mimeType}`;
    
    // Beautiful, readable folder structure
    const gcsPath = `Trading_Psychology_Research/${readableTestType}/${year}/${month}_${getMonthName(month)}/${day}_${getDayName(now)}/${fileName}`;
    
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
    
    // Enhanced metadata for analytics
    const enhancedMetadata = {
      contentType: `image/${mimeType}`,
      metadata: {
        // Core identifiers
        uploadedBy: userId.toString(),
        sessionId: sessionId,
        questionId: questionId.toString(),
        imageType: imageType,
        
        // Analytics data
        testType: analyticsTestType,
        uploadedAt: isoTimestamp,
        uploadYear: year.toString(),
        uploadMonth: month,
        uploadDay: day,
        
        // Human readable
        humanReadableDate: now.toLocaleString(),
        
        // Analytics tags for easy filtering
        tags: `user-${userId},${analyticsTestType},${imageType},${year}-${month}-${day}`,
        
        // File organization
        analyticsPath: gcsPath,
        originalFormat: fullMimeType
      }
    };
    
    // Upload the buffer with enhanced metadata
    await file.save(buffer, {
      ...enhancedMetadata,
      resumable: false, 
    });
    
    // Create comprehensive analytics metadata JSON - this is your goldmine!
    const metadataPath = gcsPath.replace(`.${mimeType}`, '_ANALYTICS_DATA.json');
    const metadataFile = storage.bucket(bucketName).file(metadataPath);
    
    // This JSON contains all the psychological and trading insights from each submission
    const comprehensiveAnalytics = {
      // === SUBMISSION OVERVIEW ===
      submission_summary: {
        participant_user_id: userId.toString(),
        participant_name: userName || `User_${userId}`,
        submission_datetime: isoTimestamp,
        human_readable_datetime: now.toLocaleString(),
        session_identifier: sessionId,
        question_number: questionId.toString(),
        image_type: imageType, // 'setup', 'prediction', 'outcome', etc.
        test_category: readableTestType.replace(/_/g, ' ')
      },
      
      // === RESEARCH DATA CLASSIFICATION ===
      research_data: {
        psychology_test_type: analyticsTestType,
        cognitive_bias_category: testType,
        behavioral_analysis_stage: imageType,
        data_collection_method: 'chart_image_capture',
        research_validity: 'high_confidence'
      },
      
      // === FILE & TECHNICAL INFO ===
      file_details: {
        original_image_path: gcsPath,
        file_size_bytes: buffer.length,
        file_size_mb: (buffer.length / (1024 * 1024)).toFixed(2),
        image_format: fullMimeType,
        storage_bucket: bucketName,
        compression_quality: 'original'
      },
      
      // === TEMPORAL ANALYTICS ===
      timing_data: {
        upload_year: year,
        upload_month: parseInt(month),
        upload_month_name: getMonthName(month).split('_')[1],
        upload_day: parseInt(day),
        upload_day_name: getDayName(now),
        upload_hour: now.getHours(),
        upload_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // === BUSINESS INTELLIGENCE TAGS ===
      analytics_tags: {
        participant_cohort: `user_${userId}`,
        test_session: `session_${sessionShort}`,
        question_stage: `question_${questionId}`,
        bias_research_category: analyticsTestType,
        data_value: 'premium_research_data',
        monetization_potential: 'high'
      },
      
      // === RESEARCH METADATA ===
      research_notes: {
        data_purpose: 'Trading psychology and cognitive bias research',
        collection_method: 'Real-time chart analysis submissions',
        participant_consent: 'implied_through_platform_usage',
        data_retention: 'indefinite_for_research',
        research_value: 'Captures genuine psychological responses to market data'
      }
    };
    
    await metadataFile.save(JSON.stringify(comprehensiveAnalytics, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          dataType: 'trading_psychology_research',
          researchValue: 'premium',
          participantId: userId.toString(),
          createdAt: isoTimestamp
        }
      },
      resumable: false
    });
    
    logger.log(`Premium research data uploaded to pristine GCS structure: ${gcsPath}`);
    return { 
      gcsPath,
      metadataPath,
      analyticsData: comprehensiveAnalytics,
      readableLocation: `Trading_Psychology_Research/${readableTestType}/${year}/${month}_${getMonthName(month)}/${day}_${getDayName(now)}`
    };

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

// Analytics helper functions
export const getAnalyticsData = async (dateRange = 'month', testType = null) => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage not initialized. Cannot fetch analytics data.');
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    let prefix = 'bias-test-data/';
    
    // Filter by test type if specified
    if (testType) {
      prefix += `${testType}/`;
    }
    
    // Filter by date range
    switch (dateRange) {
      case 'today':
        prefix += `${year}/${month}/${day}/`;
        break;
      case 'month':
        prefix += `${year}/${month}/`;
        break;
      case 'year':
        prefix += `${year}/`;
        break;
    }
    
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });
    
    const analyticsData = {
      totalFiles: 0,
      testTypes: {},
      dailyUploads: {},
      filesByUser: {},
      metadataFiles: []
    };
    
    for (const file of files) {
      if (file.name.endsWith('_metadata.json')) {
        try {
          const [content] = await file.download();
          const metadata = JSON.parse(content.toString());
          
          analyticsData.metadataFiles.push(metadata);
          analyticsData.totalFiles++;
          
          // Count by test type
          const testTypeKey = metadata.testType || 'unknown';
          analyticsData.testTypes[testTypeKey] = (analyticsData.testTypes[testTypeKey] || 0) + 1;
          
          // Count by date
          const uploadDate = metadata.uploadedAt.split('T')[0];
          analyticsData.dailyUploads[uploadDate] = (analyticsData.dailyUploads[uploadDate] || 0) + 1;
          
          // Count by user
          const userKey = metadata.userId || 'unknown';
          analyticsData.filesByUser[userKey] = (analyticsData.filesByUser[userKey] || 0) + 1;
          
        } catch (error) {
          logger.warn(`Error parsing metadata file ${file.name}:`, error.message);
        }
      }
    }
    
    return analyticsData;
    
  } catch (error) {
    logger.error('Error fetching analytics data from GCS:', error);
    throw error;
  }
};

export const getPopularTestTypes = async () => {
  try {
    const data = await getAnalyticsData('month');
    const sorted = Object.entries(data.testTypes)
      .sort(([,a], [,b]) => b - a)
      .map(([testType, count]) => ({ testType, count }));
    
    return sorted;
  } catch (error) {
    logger.error('Error getting popular test types:', error);
    throw error;
  }
};

export const getUserEngagementData = async () => {
  try {
    const data = await getAnalyticsData('month');
    const userEngagement = Object.entries(data.filesByUser)
      .map(([userId, uploads]) => ({ userId, uploads }))
      .sort((a, b) => b.uploads - a.uploads);
    
    return {
      totalActiveUsers: userEngagement.length,
      topUsers: userEngagement.slice(0, 10),
      averageUploadsPerUser: userEngagement.length > 0 
        ? Math.round(userEngagement.reduce((sum, user) => sum + user.uploads, 0) / userEngagement.length)
        : 0
    };
  } catch (error) {
    logger.error('Error getting user engagement data:', error);
    throw error;
  }
};

export const getPremiumUserAnalytics = async () => {
  try {
    const data = await getAnalyticsData('month');
    const totalUsers = Object.keys(data.filesByUser).length;
    const totalUploads = Object.values(data.filesByUser).reduce((sum, count) => sum + count, 0);
    
    return {
      totalActiveUsers: totalUsers,
      totalUploads: totalUploads,
      averageUploadsPerUser: totalUsers > 0 ? Math.round(totalUploads / totalUsers) : 0,
      topUsers: Object.entries(data.filesByUser)
        .map(([userId, uploads]) => ({ userId, uploads }))
        .sort((a, b) => b.uploads - a.uploads)
        .slice(0, 10)
    };
  } catch (error) {
    logger.error('Error getting premium user analytics:', error);
    throw error;
  }
}; 
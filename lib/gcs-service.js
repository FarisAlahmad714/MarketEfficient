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
    
    case 'image/avif':
      // AVIF starts with "ftyp" at offset 4 and contains "avif" at offset 8
      const ftypHeader = buffer.subarray(4, 8).toString('ascii');
      const avifHeader = buffer.subarray(8, 12).toString('ascii');
      return ftypHeader === 'ftyp' && avifHeader === 'avif';
    
    case 'image/heic':
    case 'image/heif':
      // HEIC/HEIF starts with "ftyp" at offset 4 and can have various brand codes
      const heicFtypHeader = buffer.subarray(4, 8).toString('ascii');
      if (heicFtypHeader !== 'ftyp') return false;
      
      // Check for HEIC/HEIF brand codes (heic, heix, hevc, hevx, heim, heis, hevm, hevs, mif1, msf1)
      const brandCode = buffer.subarray(8, 12).toString('ascii');
      const heifBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
      return heifBrands.includes(brandCode);
    
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

  bucketName = process.env.GCS_BUCKET_NAME;

  // Initialize Storage with credentials - try both methods
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      storage = new Storage({ 
        credentials,
        projectId: credentials.project_id 
      });
      logger.log('GCS initialized with service account key');
    } catch (keyError) {
      logger.error('Failed to parse service account key:', keyError.message);
      // Fall back to application credentials
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        storage = new Storage();
        logger.log('GCS falling back to application credentials');
      }
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    storage = new Storage();
    logger.log('GCS initialized with application credentials file');
  }

  if (!storage) {
    throw new Error('Could not initialize Google Cloud Storage with any available credentials');
  }

  // Test connection / bucket existence
  storage.bucket(bucketName).exists().then(data => {
    const [exists] = data;
    if (exists) {
      logger.log(`Successfully connected to GCS bucket: ${bucketName}`);
      
      // Test file access permissions
      storage.bucket(bucketName).getFiles({ maxResults: 1 }).then(([files]) => {
        logger.log(`GCS permissions check: Can list files (${files.length} files found)`);
      }).catch(err => {
        logger.error(`GCS permissions check failed: ${err.message}`);
      });
      
    } else {
      logger.error(`GCS bucket '${bucketName}' does not exist or is not accessible`);
    }
  }).catch(err => {
    logger.error(`Error checking GCS bucket existence:`, err.message);
    logger.error('This usually means authentication or permissions issues');
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
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
    // First try to make the file public to avoid signed URL permission issues
    const file = storage.bucket(bucketName).file(gcsPath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found in storage');
    }
    
    // For uniform bucket-level access, just return public URL
    // The bucket should have allUsers with Storage Object Viewer for profile images
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
    logger.log(`Generated public URL for ${gcsPath}: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    logger.error(`Error generating URL for ${gcsPath}:`, error);
    
    // Provide more specific error messages
    if (error.message.includes('File not found')) {
      throw new Error('Profile image file not found in storage');
    } else if (error.message.includes('Permission denied') || error.code === 403) {
      throw new Error('Storage access permission denied. Please check service account permissions.');
    } else {
      throw new Error(`Could not generate image URL: ${error.message}`);
    }
  }
};

export const uploadChartImageToGCS = async (base64String, userId, sessionId, questionId, imageType = 'setup', testType = 'unknown', userName = null, testResultId = null) => {
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
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
    
    // This JSON complements MongoDB data with file metadata and analytics
    const comprehensiveAnalytics = {
      // === MONGODB CONNECTION ===
      database_reference: {
        mongodb_testresult_id: testResultId,
        mongodb_collection: 'TestResults',
        data_relationship: 'This image belongs to the TestResults document above',
        query_hint: `db.TestResults.findById("${testResultId}") for psychological data`
      },
      
      // === IMAGE METADATA (NOT in MongoDB) ===
      image_analytics: {
        image_type: imageType, // 'setup', 'outcome', 'prediction'
        question_number: questionId.toString(),
        session_reference: sessionId,
        participant_name: userName || `User_${userId}`,
        upload_timestamp: isoTimestamp,
        readable_upload_time: now.toLocaleString()
      },
      
      // === FILE STORAGE DATA ===
      storage_details: {
        gcs_path: gcsPath,
        file_size_bytes: buffer.length,
        file_size_mb: (buffer.length / (1024 * 1024)).toFixed(2),
        image_format: fullMimeType,
        storage_bucket: bucketName,
        folder_structure: `Trading_Psychology_Research/${readableTestType}/${year}/${month}_${getMonthName(month)}/${day}_${getDayName(now)}`
      },
      
      // === ANALYTICS CLASSIFICATION ===
      research_classification: {
        test_category: readableTestType.replace(/_/g, ' '),
        cognitive_analysis_type: analyticsTestType,
        behavioral_stage: imageType,
        research_value: 'premium_psychological_data'
      },
      
      // === TEMPORAL PATTERNS ===
      temporal_analytics: {
        upload_year: year,
        upload_month: parseInt(month),
        upload_month_name: getMonthName(month),
        upload_day: parseInt(day),
        upload_day_name: getDayName(now),
        upload_hour: now.getHours(),
        upload_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_weekend: [0, 6].includes(now.getDay()),
        is_trading_hours: now.getHours() >= 9 && now.getHours() <= 16
      },
      
      // === BUSINESS INTELLIGENCE ===
      analytics_tags: {
        data_source: 'gcs_image_metadata',
        complements_mongodb: true,
        aggregation_friendly: true,
        monetization_potential: 'high',
        research_grade: 'premium'
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
    
    // Try multiple prefixes to find data - UPDATED VERSION
    const prefixesToTry = [
      '', // No prefix - search everything FIRST
      'Trading_Psychology_Research/', // New format
      'bias-test-data/', // Old format
      'bias-test-charts/', // Very old format
      'profile-images/', // Profile images
      'chart-images/' // Possible chart images location
    ];
    
    logger.log('🔍 UPDATED SEARCH - Starting comprehensive GCS search...');
    
    const analyticsData = {
      totalFiles: 0,
      testTypes: {},
      dailyUploads: {},
      filesByUser: {},
      metadataFiles: []
    };

    for (const basePrefix of prefixesToTry) {
      try {
        let prefix = basePrefix;
        
        // For empty prefix, don't add any filters - search everything
        if (basePrefix !== '') {
          // Add test type filter if specified
          if (testType && basePrefix === 'Trading_Psychology_Research/') {
            const testTypeMap = {
              'bias-test': 'Market_Bias_Testing',
              'chart-exam': 'General_Chart_Analysis',
              'fibonacci-retracement': 'Fibonacci_Retracement_Analysis',
              'fair-value-gaps': 'Fair_Value_Gap_Detection',
              'swing-analysis': 'Swing_High_Low_Analysis'
            };
            const mappedTestType = testTypeMap[testType] || 'General_Chart_Analysis';
            prefix += `${mappedTestType}/`;
          } else if (testType && basePrefix === 'bias-test-data/') {
            prefix += `${testType}/`;
          }
          
          // Add date filter
          switch (dateRange) {
            case 'today':
              if (basePrefix === 'Trading_Psychology_Research/') {
                prefix += `${year}/${month}_${getMonthName(month)}/${day}_${getDayName(now)}/`;
              } else {
                prefix += `${year}/${month}/${day}/`;
              }
              break;
            case 'month':
              if (basePrefix === 'Trading_Psychology_Research/') {
                prefix += `${year}/${month}_${getMonthName(month)}/`;
              } else {
                prefix += `${year}/${month}/`;
              }
              break;
            case 'year':
              prefix += `${year}/`;
              break;
          }
        }
        
        logger.log(`Searching GCS with prefix: ${prefix}`);
        const [files] = await storage.bucket(bucketName).getFiles({ prefix });
        logger.log(`Found ${files.length} files with prefix: ${prefix}`);
        
        // If this is the empty prefix search, log first 10 files to see what's actually there
        if (prefix === '' && files.length > 0) {
          logger.log('First 10 files in bucket:', files.slice(0, 10).map(f => f.name));
        }
        
        for (const file of files) {
          // Check for new metadata format
          if (file.name.endsWith('_ANALYTICS_DATA.json')) {
            try {
              const [content] = await file.download();
              const metadata = JSON.parse(content.toString());
              
              analyticsData.metadataFiles.push(metadata);
              analyticsData.totalFiles++;
              
              // Extract data from new format
              const testTypeKey = metadata.research_classification?.cognitive_analysis_type || 
                                metadata.research_data?.psychology_test_type || 'unknown';
              analyticsData.testTypes[testTypeKey] = (analyticsData.testTypes[testTypeKey] || 0) + 1;
              
              const uploadDate = metadata.image_analytics?.upload_timestamp?.split('T')[0] || 
                               metadata.submission_summary?.submission_datetime?.split('T')[0];
              if (uploadDate) {
                analyticsData.dailyUploads[uploadDate] = (analyticsData.dailyUploads[uploadDate] || 0) + 1;
              }
              
              const userKey = metadata.submission_summary?.participant_user_id || 
                            metadata.database_reference?.mongodb_testresult_id || 'unknown';
              analyticsData.filesByUser[userKey] = (analyticsData.filesByUser[userKey] || 0) + 1;
              
            } catch (error) {
              logger.warn(`Error parsing new metadata file ${file.name}:`, error.message);
            }
          }
          // Check for old metadata format
          else if (file.name.endsWith('_metadata.json')) {
            try {
              const [content] = await file.download();
              const metadata = JSON.parse(content.toString());
              
              analyticsData.metadataFiles.push(metadata);
              analyticsData.totalFiles++;
              
              // Extract data from old format
              const testTypeKey = metadata.testType || 'unknown';
              analyticsData.testTypes[testTypeKey] = (analyticsData.testTypes[testTypeKey] || 0) + 1;
              
              const uploadDate = metadata.uploadedAt?.split('T')[0];
              if (uploadDate) {
                analyticsData.dailyUploads[uploadDate] = (analyticsData.dailyUploads[uploadDate] || 0) + 1;
              }
              
              const userKey = metadata.userId || 'unknown';
              analyticsData.filesByUser[userKey] = (analyticsData.filesByUser[userKey] || 0) + 1;
              
            } catch (error) {
              logger.warn(`Error parsing old metadata file ${file.name}:`, error.message);
            }
          }
          // Count image files even without metadata
          else if (file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
            analyticsData.totalFiles++;
            
            // Try to extract info from filename/path
            const pathParts = file.name.split('/');
            const fileName = pathParts[pathParts.length - 1];
            
            // Extract user ID from path if possible
            const userMatch = file.name.match(/user-(\w+)/);
            if (userMatch) {
              const userKey = userMatch[1];
              analyticsData.filesByUser[userKey] = (analyticsData.filesByUser[userKey] || 0) + 1;
            }
          }
        }
        
        // If we found data, we can stop trying other prefixes
        if (analyticsData.totalFiles > 0) {
          break;
        }
        
      } catch (error) {
        logger.warn(`Error searching with prefix ${basePrefix}:`, error.message);
        continue;
      }
    }
    
    logger.log(`Analytics data summary: ${analyticsData.totalFiles} files, ${analyticsData.metadataFiles.length} metadata files`);
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
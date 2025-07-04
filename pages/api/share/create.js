// pages/api/share/create.js
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Follow from '../../../models/Follow';
import Notification from '../../../models/Notification';
import dbConnect from '../../../lib/database';
import SharedContent from '../../../models/SharedContent';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  console.log('=== SHARE API CALLED ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get user from token (check both authorization header and cookies)
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies.auth_token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    // Validate type
    const validTypes = ['achievement', 'badge', 'test_result', 'trading_highlight', 'profile'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid share type' });
    }

    // Generate unique share ID
    const shareId = uuidv4().replace(/-/g, '').substring(0, 12);

    // Enhanced data for bias test results
    let enhancedData = data;
    
    // If sharing a bias test result, fetch detailed session data including chart images
    console.log('Share API - Type:', type, 'SessionId:', data.sessionId, 'TestType:', data.testType);
    if (type === 'test_result' && data.sessionId && data.testType && data.testType.toLowerCase().includes('bias')) {
      try {
        console.log('Fetching detailed bias test data for sessionId:', data.sessionId);
        
        // Import TestResults model
        const TestResults = (await import('../../../models/TestResults')).default;
        
        // Fetch detailed test results from database
        console.log('Searching for test result with sessionId:', data.sessionId, 'userId:', user._id);
        
        // Fetch detailed test results from database using correct query path
        const detailedResult = await TestResults.findOne({ 
          'details.sessionId': data.sessionId,
          userId: user._id 
        }).lean();
        
        console.log('Query result:', detailedResult ? 'Found!' : 'Not found');
        
        if (detailedResult && detailedResult.details && detailedResult.details.testDetails) {
          console.log('Found detailed test result with', detailedResult.details.testDetails.length, 'questions');
          
          // Extract chart images from all questions
          const chartImages = {
            setupImages: [],
            outcomeImages: []
          };
          
          detailedResult.details.testDetails.forEach((question, index) => {
            if (question.setupImageUrl || question.setupImagePath) {
              chartImages.setupImages.push({
                questionIndex: index,
                url: question.setupImageUrl,
                path: question.setupImagePath
              });
            }
            if (question.outcomeImageUrl || question.outcomeImagePath) {
              chartImages.outcomeImages.push({
                questionIndex: index,
                url: question.outcomeImageUrl,
                path: question.outcomeImagePath
              });
            }
          });
          
          // Find chart images in GCS for today's date
          let setupImageUrl = null;
          let outcomeImageUrl = null;
          let setupFile = null;
          let outcomeFile = null;
          let allSetupImages = [];
          let allOutcomeImages = [];
          
          try {
            // Import GCS service to search for images
            const { Storage } = await import('@google-cloud/storage');
            const storage = new Storage();
            const bucket = storage.bucket('chartsensebucket');
            
            // Search for today's chart images
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0') + '_' + now.toLocaleString('en-US', { month: 'long' });
            const day = String(now.getDate()).padStart(2, '0') + '_' + now.toLocaleString('en-US', { weekday: 'long' });
            const dateStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            const prefix = `Trading_Psychology_Research/Market_Bias_Testing/${year}/${month}/${day}/`;
            console.log('Searching for images with prefix:', prefix);
            
            const [files] = await bucket.getFiles({ prefix });
            console.log('Found', files.length, 'files in GCS for today');
            console.log('Looking for files with dateStr:', dateStr);
            console.log('First few files:', files.slice(0, 5).map(f => f.name));
            
            // Find ALL setup and outcome images for ALL 5 questions
            allSetupImages = [];
            allOutcomeImages = [];
            
            // Search for all 5 questions
            for (let questionNum = 1; questionNum <= 5; questionNum++) {
              // Find setup image for this question
              const setupImage = files.find(file => 
                (file.name.includes(`Question_${questionNum}_setup`) || file.name.includes(`question_${questionNum}_setup`)) && 
                (file.name.includes(dateStr) || file.name.includes(year.toString()))
              );
              
              if (setupImage) {
                allSetupImages.push({
                  questionNumber: questionNum,
                  url: `https://storage.googleapis.com/chartsensebucket/${setupImage.name}`,
                  path: setupImage.name
                });
                console.log(`Found setup image for Question ${questionNum}:`, setupImage.name);
              }
              
              // Find outcome image for this question
              const outcomeImage = files.find(file => 
                (file.name.includes(`Question_${questionNum}_outcome`) || file.name.includes(`question_${questionNum}_outcome`)) && 
                (file.name.includes(dateStr) || file.name.includes(year.toString()))
              );
              
              if (outcomeImage) {
                allOutcomeImages.push({
                  questionNumber: questionNum,
                  url: `https://storage.googleapis.com/chartsensebucket/${outcomeImage.name}`,
                  path: outcomeImage.name
                });
                console.log(`Found outcome image for Question ${questionNum}:`, outcomeImage.name);
              }
            }
            
            console.log(`Total images found: ${allSetupImages.length} setup, ${allOutcomeImages.length} outcome`);
            
            // Set the first images for backward compatibility
            if (allSetupImages.length > 0) {
              setupFile = { name: allSetupImages[0].path };
              setupImageUrl = allSetupImages[0].url;
            }
            if (allOutcomeImages.length > 0) {
              outcomeFile = { name: allOutcomeImages[0].path };
              outcomeImageUrl = allOutcomeImages[0].url;
            }
          } catch (gcsError) {
            console.error('Error searching GCS for chart images:', gcsError);
          }

          enhancedData = {
            ...data,
            setupImageUrl: setupImageUrl,
            setupImagePath: setupFile ? setupFile.name : null,
            outcomeImageUrl: outcomeImageUrl,
            outcomeImagePath: outcomeFile ? outcomeFile.name : null,
            allSetupImages: allSetupImages || [], // All 5 setup images
            allOutcomeImages: allOutcomeImages || [], // All 5 outcome images
            chartImages, // All chart images for potential future use
            userReasoning: detailedResult.details.testDetails.map(q => q.userReasoning).filter(Boolean),
            aiAnalysis: detailedResult.details.testDetails.map(q => q.aiAnalysis).filter(Boolean),
            detailedAnswers: detailedResult.details.testDetails.map(q => ({
              question: q.question,
              userAnswer: q.userAnswer,
              correctAnswer: q.correctAnswer,
              isCorrect: q.isCorrect,
              userReasoning: q.userReasoning,
              aiAnalysis: q.aiAnalysis
            })),
            // Enhanced question data with charts and analysis combined
            questionsWithCharts: detailedResult.details.testDetails.map((q, index) => {
              const questionNum = q.question || (index + 1);
              const setupImg = allSetupImages.find(img => img.questionNumber === questionNum);
              const outcomeImg = allOutcomeImages.find(img => img.questionNumber === questionNum);
              
              return {
                questionNumber: questionNum,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect: q.isCorrect,
                userReasoning: q.userReasoning,
                aiAnalysis: q.aiAnalysis,
                setupImage: setupImg,
                outcomeImage: outcomeImg
              };
            })
          };
            
          console.log('Enhanced data with chart images:', {
            setupImageUrl: enhancedData.setupImageUrl,
            outcomeImageUrl: enhancedData.outcomeImageUrl,
            totalSetupImages: enhancedData.allSetupImages?.length || 0,
            totalOutcomeImages: enhancedData.allOutcomeImages?.length || 0,
            userReasoningCount: enhancedData.userReasoning?.length,
            aiAnalysisCount: enhancedData.aiAnalysis?.length
          });
        } else {
          console.log('No detailed test result found for sessionId:', data.sessionId);
        }
      } catch (error) {
        console.error('Error fetching detailed bias test data:', error);
        // Continue with original data if fetching fails
      }
    }

    // Create shared content
    const sharedContent = new SharedContent({
      shareId,
      type,
      username: user.username,
      name: user.name,
      userId: user._id,
      data: enhancedData
    });

    await sharedContent.save();

    // Notify followers about new shared content
    try {
      const followers = await Follow.find({ following: user._id })
        .populate('follower', '_id username name')
        .lean();

      if (followers.length > 0) {
        const notifications = followers.map(follow => ({
          recipient: follow.follower._id,
          actor: user._id,
          type: 'content_shared',
          title: 'New Content',
          message: `${user.name} shared ${type === 'trading_highlight' ? 'a trade' : 'test results'}`,
          actionUrl: `/u/${user.username}`,
          metadata: {
            contentType: type,
            shareId: shareId,
            sharerUsername: user.username,
            sharerName: user.name
          }
        }));

        // Bulk create notifications for all followers
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error('Error creating content notifications:', notificationError);
      // Don't fail the share action if notifications fail
    }

    // Return the share ID and URL
    const domain = process.env.NODE_ENV === 'production' ? 'https://chartsense.trade' : 'http://localhost:3000';
    const shareUrl = `${domain}/share/${shareId}`;

    res.status(201).json({
      shareId,
      shareUrl,
      type,
      createdAt: sharedContent.createdAt
    });

  } catch (error) {
    console.error('Error creating shared content:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: user ? { id: user._id, username: user.username } : 'No user'
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
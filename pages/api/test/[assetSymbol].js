// pages/api/test/[assetSymbol].js
import { v4 as uuidv4 } from 'uuid';
import { fetchAssetOHLCData, generateMockOHLCData } from '../../../lib/data-service';
import connectDB from '../../../lib/database';
import TestResults from '../../../models/TestResults';
import logger from '../../../lib/logger';
import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import { processBiasTestAnalytics } from '../../../lib/biasTestAnalytics';

// Store sessions in memory (in a real app, this would be a database)
// Use global to persist across Next.js module reloads in development
if (!global.biasTestSessions) {
  global.biasTestSessions = {};
  logger.log('Initialized new global bias test sessions object');
}
const sessions = global.biasTestSessions;

// Clean up old sessions to prevent memory leaks (temporarily disabled for debugging)
const SESSION_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
// Disable automatic cleanup during development
// setInterval(() => {
//   const now = Date.now();
//   Object.keys(sessions).forEach(key => {
//     if (sessions[key].timestamp && (now - sessions[key].timestamp) > SESSION_EXPIRY) {
//       delete sessions[key];
//       logger.log(`Cleaned up expired session: ${key}`);
//     }
//   });
// }, 60 * 60 * 1000); // Check every hour

// Import OpenAI directly to avoid proxy issues in serverless
import OpenAI from 'openai';

// Get AI analysis for a trading decision with correct parameter order
async function getAIAnalysis(chartData, outcomeData, prediction, reasoning, correctAnswer, wasCorrect) {
  try {
    // Check if we have OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not set, skipping AI analysis');
      return null;
    }
    
    if (!apiKey.startsWith('sk-')) {
      console.warn('Invalid OPENAI_API_KEY format, skipping AI analysis');
      return null;
    }
    
    // Initialize OpenAI client directly
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Get the most recent candle data for explicit reference
    const lastCandle = chartData[chartData.length - 1];
    const firstOutcomeCandle = outcomeData && outcomeData.length > 0 ? outcomeData[0] : null;
    
    // Calculate what actually happened
    const setupClose = lastCandle?.close;
    const outcomeOpen = firstOutcomeCandle?.open;
    const outcomeClose = firstOutcomeCandle?.close;
    
    const gapPercentage = setupClose && outcomeOpen ? 
      (((outcomeOpen - setupClose) / setupClose) * 100).toFixed(2) : 0;
    const outcomeMovePercentage = firstOutcomeCandle ? 
      (((outcomeClose - outcomeOpen) / outcomeOpen) * 100).toFixed(2) : 0;

    // Create enhanced analysis prompt with "What Actually Happened" section
    const prompt = `You are a professional trading analyst providing expert feedback on a trader's market prediction.

TRADING SCENARIO:
- Trader's Prediction: ${prediction.toUpperCase()}
- Actual Outcome: ${correctAnswer.toUpperCase()}
- Prediction Was: ${wasCorrect ? "CORRECT" : "INCORRECT"}
- Trader's Reasoning: "${reasoning}"

PRICE DATA:
- Setup Close: $${setupClose}
- Outcome Open: $${outcomeOpen} (${gapPercentage}% ${outcomeOpen > setupClose ? 'gap up' : outcomeOpen < setupClose ? 'gap down' : 'flat'})
- Outcome Close: $${outcomeClose}
- Outcome Move: ${outcomeMovePercentage}% ${correctAnswer.toLowerCase()}

Please provide a comprehensive analysis in HTML format with the following sections:

<h3>📊 Market Scenario Analysis</h3>
<p>Analyze what happened in this specific trading scenario and why the outcome was ${correctAnswer.toUpperCase()}.</p>

<h3>📈 What Actually Happened</h3>
<p>Provide a detailed narrative of exactly what occurred in the market following the setup:

"After the setup closed at $${setupClose}, the market ${correctAnswer === 'Bullish' ? 'responded bullishly' : 'declined bearishly'}. ${firstOutcomeCandle ? `The next session opened at $${outcomeOpen} (${Math.abs(gapPercentage)}% ${outcomeOpen > setupClose ? 'gap up' : outcomeOpen < setupClose ? 'gap down' : 'unchanged'}) and ${outcomeClose > outcomeOpen ? `rallied to close at $${outcomeClose}` : `declined to close at $${outcomeClose}`}, creating a ${Math.abs(outcomeMovePercentage)}% ${correctAnswer.toLowerCase()} move.` : `moved ${correctAnswer.toLowerCase()} as expected.`}"

Explain WHY this happened:
- What market forces drove this move
- How technical factors played out
- Whether patterns completed as expected
- How price interacted with key levels</p>

<h3>🎯 Analysis of Your Reasoning</h3>
<p>Examine the trader's reasoning: "${reasoning}" and explain how it related to the actual outcome.</p>

<h3>✅ Strengths in Your Analysis</h3>
<ul>
<li>Identify what the trader did well in their analysis</li>
</ul>

<h3>🔍 Areas for Improvement</h3>
<ul>
<li>Point out what could be improved in their analysis</li>
</ul>

<h3>🎓 Key Takeaway</h3>
<p>Provide the most important lesson from this trade.</p>

Keep the analysis specific and educational.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional trading analyst providing expert feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return null;
  }
}

// Asset definitions
const assets = [
  { id: 1, symbol: 'btc', name: 'Bitcoin', apiId: 'bitcoin', type: 'crypto', basePrice: 60000 },
  { id: 2, symbol: 'eth', name: 'Ethereum', apiId: 'ethereum', type: 'crypto', basePrice: 3000 },
  { id: 3, symbol: 'sol', name: 'Solana', apiId: 'solana', type: 'crypto', basePrice: 100 },
  { id: 4, symbol: 'bnb', name: 'Binance Coin', apiId: 'binancecoin', type: 'crypto', basePrice: 500 },
  { id: 5, symbol: 'nvda', name: 'Nvidia', apiId: 'NVDA', type: 'equity', basePrice: 800 },
  { id: 6, symbol: 'aapl', name: 'Apple', apiId: 'AAPL', type: 'equity', basePrice: 175 },
  { id: 7, symbol: 'tsla', name: 'Tesla', apiId: 'TSLA', type: 'equity', basePrice: 250 },
  { id: 8, symbol: 'gld', name: 'Gold', apiId: 'GLD', type: 'equity', basePrice: 190 },
  { id: 9, symbol: 'random', name: 'Random Mix', apiId: 'random', type: 'mixed', basePrice: 100 },
];

/**
 * Generate a random date within a reasonable past range for data fetching
 * This helps randomize the data segments used in each test
 */
function getRandomHistoricalDate() {
  const now = new Date();
  // Get a random date between 1 month and 2 years ago
  const minMonthsAgo = 1;
  const maxMonthsAgo = 24;
  const randomMonthsAgo = Math.floor(Math.random() * (maxMonthsAgo - minMonthsAgo + 1)) + minMonthsAgo;
  
  now.setMonth(now.getMonth() - randomMonthsAgo);
  return now;
}

/**
 * Generate a random seed value to ensure different mock data patterns
 */
function getRandomSeed() {
  return Math.floor(Math.random() * 100000);
}

/**
 * Fetch a large dataset once, then slice it into different segments for each question
 * @param {Object} asset - Asset object
 * @param {string} timeframe - Timeframe for the chart
 * @param {number} questionCount - Number of questions to generate
 * @returns {Promise<Array>} Array of data segments for each question
 */
async function fetchSegmentedData(asset, timeframe, questionCount) {
  // Configure candle counts for setup and outcome
  // Making both equal to have consistent chart sizes
  const SETUP_CANDLES = 25;  // Number of candles to show in the setup chart
  const OUTCOME_CANDLES = 25;  // Number of candles to show in the outcome (now equal)
  
  // Calculate how much data we need
  const OVERLAP = 10; // Overlap between segments for diversity
  
  const totalCandles = (questionCount * (SETUP_CANDLES + OUTCOME_CANDLES)) - 
                      ((questionCount - 1) * OVERLAP);
  
  try {
    // Fetch a large dataset, starting from a random historical date
    // This ensures we get different data segments each time
    const randomHistoricalDate = getRandomHistoricalDate();
    logger.log(`Fetching ${totalCandles} candles for ${asset.symbol} at ${timeframe} timeframe, starting from ${randomHistoricalDate.toISOString()}`);
    
    // Use the random date as a seed for generating different data patterns
    const randomSeed = getRandomSeed();
    logger.log(`Using random seed: ${randomSeed} for data generation`);
    
    // Fetch real data with randomization
    const allData = await fetchAssetOHLCData(asset, timeframe, totalCandles, randomHistoricalDate, randomSeed);
    
    // Create segments for each question
    const segments = [];
    const segmentSize = SETUP_CANDLES + OUTCOME_CANDLES;
    
    // Instead of fixed steps, use random offsets for each segment to increase variability
    let currentIdx = 0;
    
    for (let i = 0; i < questionCount; i++) {
      // Add some randomness to the step size between segments
      const randomStepVariation = Math.floor(Math.random() * 5); // 0-4 extra candles
      const stepSize = segmentSize - OVERLAP + randomStepVariation;
      
      // Ensure we don't go out of bounds
      currentIdx = Math.min(currentIdx, allData.length - segmentSize);
      
      if (currentIdx < 0 || currentIdx >= allData.length || currentIdx + SETUP_CANDLES >= allData.length) {
        // Generate mock data if we don't have enough real data
        logger.log(`Not enough data for question ${i+1}, generating mock data`);
        const mockSegment = generateMockSegment(
          asset.basePrice, 
          SETUP_CANDLES, 
          OUTCOME_CANDLES, 
          timeframe,
          randomSeed + i // Use a different seed for each question
        );
        segments.push(mockSegment);
      } else {
        // Extract a segment from the real data
        const segment = allData.slice(currentIdx, currentIdx + segmentSize);
        segments.push(segment);
      }
      
      // Move to the next segment with random offset
      currentIdx += stepSize;
    }
    
    // Shuffle the segments to add more randomness
    return shuffleArray(segments);
  } catch (error) {
    console.error(`Error fetching segmented data for ${asset.symbol}:`, error.message);
    
    // Generate mock data for all segments with different patterns
    const segments = [];
    for (let i = 0; i < questionCount; i++) {
      const adjustedSeed = getRandomSeed() + i;
      segments.push(generateMockSegment(
        asset.basePrice, 
        SETUP_CANDLES, 
        OUTCOME_CANDLES, 
        timeframe,
        adjustedSeed
      ));
    }
    return segments;
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generate a mock data segment for a question
 */
function generateMockSegment(basePrice, setupCount, outcomeCount, timeframe, seed = Date.now()) {
  // Vary the base price randomly using the seed
  const prng = seedrandom(seed);
  const adjustedBasePrice = basePrice * (0.8 + (prng() * 0.4)); // 0.8-1.2x base price
  
  // Generate setup data
  const setupData = generateMockOHLCDataWithSeed(
    adjustedBasePrice, 
    setupCount, 
    timeframe, 
    basePrice * (0.03 + (prng() * 0.04)), // 3-7% volatility
    seed
  );
  
  // Generate outcome data continuing from the last candle of setup
  const lastSetupCandle = setupData[setupData.length - 1];
  const outcomeData = generateMockOHLCDataWithSeed(
    lastSetupCandle.close,
    outcomeCount,
    timeframe,
    basePrice * (0.03 + (prng() * 0.04)), // 3-7% volatility
    seed + 500 // Slight change in seed for outcome
  );
  
  // Adjust outcome data dates to be continuous from setup
  const lastSetupDate = new Date(lastSetupCandle.date);
  const timeIncrement = getTimeIncrement(timeframe);
  
  outcomeData.forEach((candle, i) => {
    const date = new Date(lastSetupDate.getTime() + ((i + 1) * timeIncrement));
    candle.date = date.toISOString();
  });
  
  // Combine setup and outcome into a single segment
  return [...setupData, ...outcomeData];
}

/**
 * Seedable random number generator
 */
function seedrandom(seed) {
  const m = 2**35 - 31; // a large prime number
  const a = 185852;
  let s = seed % m;
  
  return function() {
    s = (s * a) % m;
    return s / m;
  };
}

/**
 * Generate mock OHLC data with a specific seed for reproducibility
 */
function generateMockOHLCDataWithSeed(basePrice, count, timeframe, volatility, seed) {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  const prng = seedrandom(seed);
  
  // Adjust time increment based on timeframe
  const timeIncrement = getTimeIncrement(timeframe);

  // Create a pattern of candles with the seeded random generator
  for (let i = count; i > 0; i--) {
    const date = new Date(now.getTime() - (i * timeIncrement));
    
    // Generate a price change with some patterns based on the seed
    const patternFactor = Math.sin(i * 0.3 + seed % 10) * 0.3; // Create some cyclical patterns
    const randomFactor = prng() - 0.5;
    const change = (randomFactor + patternFactor) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (prng() * volatility * 0.5);
    const low = Math.min(open, close) - (prng() * volatility * 0.5);
    
    // Generate mock volume - higher on bigger price moves
    const priceMove = Math.abs(close - open);
    const baseVolume = basePrice * 1000; // Base volume proportional to price
    const volumeVariance = prng() * 0.7 + 0.3; // 0.3 to 1.0 multiplier
    const volume = baseVolume * (1 + priceMove / basePrice * 10) * volumeVariance;
    
    data.push({
      date: date.toISOString(),
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
}

/**
 * Calculate time increment based on timeframe
 */
function getTimeIncrement(timeframe) {
  switch(timeframe) {
    case '4h': return 4 * 60 * 60 * 1000;
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
    case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

/**
 * Handle test submission (POST requests)
 */
async function handleTestSubmission(req, res, assetSymbol) {
  const { session_id } = req.query;
  const { answers, chartData } = req.body;
  const userId = req.user.id;
  
  logger.log(`Test submission for session ${session_id}, user ${userId}`);
  logger.log(`Received ${answers?.length || 0} answers`);
  
  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers array is required' });
  }
  
  // Get the test session
  const testSessionKey = session_id + '_test';
  const testSession = sessions[testSessionKey];
  
  // Debug: Log all available sessions
  logger.log(`Available session keys: ${Object.keys(sessions)} (total: ${Object.keys(sessions).length})`);
  logger.log(`Looking for session key: ${testSessionKey}`);
  logger.log(`Sessions object keys and values:`, Object.keys(sessions).map(key => ({key, hasData: !!sessions[key]})));
  
  if (!testSession) {
    logger.error(`Test session not found for ${session_id}`);
    logger.error(`Available sessions: ${JSON.stringify(Object.keys(sessions))}`);
    return res.status(404).json({ 
      error: 'Test session not found. Please start a new test.',
      code: 'SESSION_NOT_FOUND',
      debug: {
        searchKey: testSessionKey,
        availableKeys: Object.keys(sessions)
      }
    });
  }
  
  logger.log(`Found test session with ${testSession.questions?.length || 0} questions`);
  
  // Prepare results with AI analysis
  const resultAnswersPromises = answers.map(async (answer) => {
    const question = testSession.questions.find(q => q.id === answer.test_id);
    if (!question) {
      logger.error(`Question ${answer.test_id} not found in test session`);
      return null;
    }
    
    const isCorrect = answer.prediction.toLowerCase() === question.correct_answer.toLowerCase();
    
    // Get AI analysis for this answer
    const aiAnalysis = await getAIAnalysis(
      question.ohlc_data || [],
      question.outcome_data || [],
      answer.prediction,
      answer.reasoning,
      question.correct_answer,
      isCorrect
    );
    
    return {
      test_id: answer.test_id,
      user_prediction: answer.prediction,
      user_reasoning: answer.reasoning,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      timeframe: question.timeframe,
      ohlc_data: question.ohlc_data || [],
      outcome_data: question.outcome_data || [],
      ai_analysis: aiAnalysis, // Add AI analysis
      // Enhanced metadata from frontend
      confidenceLevel: answer.confidenceLevel || 5,
      timeSpent: answer.timeSpent || 0,
      marketCondition: answer.marketCondition || 'unknown',
      volumeProfile: answer.volumeProfile || null,
      technicalFactors: answer.technicalFactors || [],
      setupImageUrl: answer.setupImageUrl || null,
      setupImagePath: answer.setupImagePath || null,
      submittedAt: answer.submittedAt ? new Date(answer.submittedAt) : new Date()
    };
  });
  
  // Wait for all AI analyses to complete
  const answersArray = (await Promise.all(resultAnswersPromises)).filter(Boolean);
  
  // Calculate score after processing all answers
  const score = answersArray.filter(answer => answer.is_correct).length;
  
  if (answersArray.length === 0) {
    return res.status(400).json({ error: 'No valid answers found' });
  }
  
  logger.log(`Calculated score: ${score}/${answersArray.length}`);
  
  // Store results in session for immediate retrieval
  const results = {
    asset_name: testSession.asset_name,
    asset_symbol: testSession.asset_symbol,
    session_id: session_id,
    score: score,
    total: answersArray.length,
    answers: answersArray,
    timestamp: Date.now()
  };
  
  sessions[session_id] = results;
  logger.log(`Stored results for session ${session_id}`);
  
  // Save to database using the enhanced save-results endpoint
  try {
    await connectDB();
    
    // Create the test result using our enhanced model
    const testDetails = answersArray.map(answer => ({
      question: answer.test_id,
      prediction: answer.user_prediction,
      correctAnswer: answer.correct_answer,
      isCorrect: answer.is_correct,
      reasoning: answer.user_reasoning || '',
      aiAnalysis: answer.ai_analysis, // Include AI analysis
      ohlcData: answer.ohlc_data || [],
      outcomeData: answer.outcome_data || [],
      analysisStatus: answer.ai_analysis ? 'completed' : 'pending',
      // Enhanced fields
      setupImageUrl: answer.setupImageUrl,
      setupImagePath: answer.setupImagePath,
      outcomeImageUrl: answer.outcomeImageUrl,
      outcomeImagePath: answer.outcomeImagePath,
      confidenceLevel: answer.confidenceLevel,
      timeSpent: answer.timeSpent,
      marketCondition: answer.marketCondition,
      volumeProfile: answer.volumeProfile,
      technicalFactors: answer.technicalFactors,
      submittedAt: answer.submittedAt
    }));
    
    const testResult = new TestResults({
      userId: userId,
      testType: 'bias-test',
      assetSymbol: assetSymbol,
      score: score,
      totalPoints: answersArray.length,
      status: testDetails.every(detail => detail.aiAnalysis) ? 'completed' : 'processing',
      details: {
        timeframe: testSession.selected_timeframe,
        sessionId: session_id,
        testDetails: testDetails
      },
      completedAt: new Date()
    });
    
    // If all analysis is complete, set analysisCompletedAt
    if (testDetails.every(detail => detail.aiAnalysis)) {
      testResult.analysisCompletedAt = new Date();
    }
    
    await testResult.save();
    logger.log(`Enhanced bias test result saved to database for session ${session_id}`);
    
    // Process analytics data asynchronously (only for bias tests)
    if (testResult.testType === 'bias-test') {
      try {
        logger.log(`Starting analytics processing for test result: ${testResult._id}`);
        const deviceInfo = {
          userAgent: req.headers['user-agent'] || '',
          screenResolution: req.headers['x-screen-resolution'] || '',
          isMobile: /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent'] || ''),
          timezone: req.headers['x-timezone'] || 'UTC',
          language: req.headers['accept-language']?.split(',')[0] || 'en'
        };
        
        logger.log(`Device info prepared for analytics:`, deviceInfo);
        logger.log(`Test result data for analytics:`, {
          testType: testResult.testType,
          assetSymbol: testResult.assetSymbol,
          score: testResult.score,
          totalPoints: testResult.totalPoints,
          testDetailsCount: testResult.details?.testDetails?.length || 0
        });
        
        await processBiasTestAnalytics(testResult, deviceInfo);
        logger.log(`Analytics processed successfully for bias test: ${testResult._id}`);
      } catch (analyticsError) {
        logger.error('Error processing bias test analytics:', analyticsError);
        logger.error('Analytics error stack:', analyticsError.stack);
        logger.error('Analytics error details:', {
          message: analyticsError.message,
          name: analyticsError.name,
          testResultId: testResult._id
        });
        // Don't fail the main request if analytics processing fails
      }
    }
    
  } catch (dbError) {
    logger.error('Error saving to database:', dbError);
    // Continue even if database save fails
  }
  
  return res.status(200).json({
    success: true,
    message: 'Test submitted successfully',
    session_id: session_id,
    score: score,
    total: answersArray.length
  });
}

// Handler function for API requests
async function handler(req, res) {
  const { assetSymbol } = req.query;
  const timeframe = req.query.timeframe || 'daily';
  
  // Handle POST requests (test submissions)
  if (req.method === 'POST') {
    return await handleTestSubmission(req, res, assetSymbol);
  }
  
  // Generate a new session ID if:
  // 1. No sessionId is provided (new test)
  // 2. A random parameter is included (force refresh)
  const forceNewSession = req.query.random !== undefined;
  const sessionId = forceNewSession ? uuidv4() : (req.query.session_id || uuidv4());
  
  logger.log(`Session ID: ${sessionId}, Force new session: ${forceNewSession}`);
  
  // Get the asset data
  const asset = assets.find(a => a.symbol === assetSymbol);
  
  if (!asset) {
    return res.status(404).json({ error: `Asset with symbol ${assetSymbol} not found` });
  }
  
  // NEW: Check if database results were explicitly requested
  if (req.query.source === 'db' && req.query.session_id) {
    try {
      // Connect to database
      await connectDB();
      
      // Find test results by session ID
      const dbResult = await TestResults.findOne({
        'details.sessionId': req.query.session_id,
        'testType': 'bias-test'
      });
      
      if (dbResult) {
        logger.log(`Found test results in database for session ${req.query.session_id}`);
        
        // Map test details to answers format
        const answers = dbResult.details.testDetails.map(detail => {
          // Try to get ohlc_data and outcome_data from memory if available
          const sessionData = sessions[req.query.session_id] || {};
          const sessionAnswer = sessionData.answers?.find(a => a.test_id === detail.question);
          
          return {
            test_id: detail.question,
            user_prediction: detail.prediction,
            correct_answer: detail.correctAnswer,
            is_correct: detail.isCorrect,
            user_reasoning: detail.reasoning || null,
            ai_analysis: detail.aiAnalysis || null,
            timeframe: dbResult.details.timeframe || 'daily',
            // Use chart data from session if available, otherwise set to empty arrays
            ohlc_data: detail.ohlcData || [],
            outcome_data: detail.outcomeData || []
          };
        });
        
        // Format the response to match what the client expects
        const formattedResponse = {
          asset_name: asset.name,
          asset_symbol: dbResult.assetSymbol,
          session_id: req.query.session_id,
          score: dbResult.score,
          total: dbResult.totalPoints,
          answers: answers,
          source: 'database'
        };
        
        return res.status(200).json(formattedResponse);
      }
    } catch (dbError) {
      console.error('Error fetching from database:', dbError);
      // Continue to regular process if database fetch fails
    }
  }
  
  // ENHANCED: Comprehensive check for existing results with improved logging
  if (!forceNewSession) {
    // First, check if we already have results for this session
    if (sessions[sessionId] && sessions[sessionId].answers) {
      logger.log(`Found existing results for session ${sessionId}, returning those`);
      return res.status(200).json(sessions[sessionId]);
    }
    
    // If requesting results with explicit session_id
    if (req.query.session_id) {
      if (sessions[req.query.session_id] && sessions[req.query.session_id].answers) {
        logger.log(`Returning existing processed results for ${req.query.session_id}`);
        return res.status(200).json(sessions[req.query.session_id]);
      }
      
      // If no processed results, check for test session
      const testSessionKey = req.query.session_id + '_test';
      if (sessions[testSessionKey]) {
        logger.log(`Found test session ${testSessionKey}, but no processed results yet`);
      }
    }
  }
  
  // Handle POST request for submitting test answers
  if (req.method === 'POST') {
    try {
      // Get the test data
      const testSessionKey = sessionId + '_test';
      const testSession = sessions[testSessionKey];
      
      if (!testSession) {
        console.error(`Test session not found for ${sessionId}`);
        return res.status(404).json({ error: 'Test session not found' });
      }
      
      // User is already verified by requireAuth middleware
      const userId = req.user.id;
      
      // CRITICAL FIX: Extract answers from the request body
      // Handle both structures: either direct array or {answers: [...]} object
      const { answers = [], chartData = {} } = req.body || {};
      
      // Handle both direct array and nested answers array
      const answersArray = Array.isArray(answers) ? answers : 
                          (answers.answers && Array.isArray(answers.answers) ? answers.answers : []);
      
      logger.log('Processing answers:', answersArray);
      logger.log('Test session data:', testSession.questions.map(q => ({ 
        id: q.id, 
        correct_answer: q.correct_answer 
      })));
      
      // Track score
      let score = 0;
      
      // Process answers with AI analysis
      const resultAnswersPromises = answersArray.map(async function(answer) {
        const question = testSession.questions.find(q => q.id === answer.test_id);
        
        if (!question) {
          console.error(`Question ${answer.test_id} not found in test session`);
          return {
            test_id: answer.test_id,
            user_prediction: answer.prediction,
            user_reasoning: answer.reasoning || null,
            ai_analysis: null,
            correct_answer: 'Unknown',
            is_correct: false,
            timeframe: timeframe,
            ohlc_data: [],
            outcome_data: []
          };
        }
        
        const isCorrect = question.correct_answer === answer.prediction;
        logger.log(`Question ${answer.test_id}: User=${answer.prediction}, Correct=${question.correct_answer}, Match=${isCorrect}`);
        
        if (isCorrect) {
          score++;
        }
        
        // Get AI analysis if reasoning is provided
        let aiAnalysis = null;
        if (answer.reasoning) {
          try {
            // IMPROVED: Use the chart data provided in the request or from the question
            // with better fallback mechanism
            const ohlcData = chartData && chartData[answer.test_id] 
              ? chartData[answer.test_id] 
              : question.ohlc_data;
              
            logger.log(`Getting AI analysis for answer ${answer.test_id}`);
            // Get AI analysis with all required parameters
            aiAnalysis = await getAIAnalysis(
              ohlcData,
              question.outcome_data,
              answer.prediction, 
              answer.reasoning,
              question.correct_answer,
              question.correct_answer === answer.prediction
            );
            logger.log(`AI analysis received for answer ${answer.test_id}: ${aiAnalysis ? 'success' : 'empty'}`);
          } catch (error) {
            console.error(`Error getting AI analysis for answer ${answer.test_id}:`, error);
          }
        }
        
        // Ensure we're keeping the chart data 
        return {
          test_id: answer.test_id,
          user_prediction: answer.prediction,
          user_reasoning: answer.reasoning || null,
          ai_analysis: aiAnalysis,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
          timeframe: question.timeframe,
          ohlc_data: question.ohlc_data || [],  // Always use session data
          outcome_data: question.outcome_data || [] // Always use session data
        };
      });
      
      // Wait for all analyses to complete
      const resultAnswers = await Promise.all(resultAnswersPromises);
      
      // Create result object
      const results = {
        asset_name: asset.name,
        asset_symbol: asset.symbol,
        session_id: sessionId,
        score,
        total: answersArray.length,
        answers: resultAnswers,
        timestamp: Date.now() // Add timestamp for session cleanup
      };
      
      logger.log(`Final score: ${score}/${answersArray.length}`);
      
      // Connect to database before saving the test result
      await connectDB();
      
      // Check if result already exists to avoid duplicates
      const existingResult = await TestResults.findOne({
        userId: userId,
        'details.sessionId': sessionId,
        testType: 'bias-test'
      });
      
      if (!existingResult) {
        // Create test details array from results
        const testDetails = resultAnswers.map(answer => ({
          question: answer.test_id,
          prediction: answer.user_prediction,
          correctAnswer: answer.correct_answer,
          isCorrect: answer.is_correct,
          reasoning: answer.user_reasoning || null,
          aiAnalysis: answer.ai_analysis || null,
          analysisStatus: answer.ai_analysis ? 'completed' : 'pending',
          // CRITICAL: Ensure these arrays are properly stored
          ohlcData: answer.ohlc_data || [],
          outcomeData: answer.outcome_data || []
        }));
        
        logger.log("CHART DATA DEBUG:");
        resultAnswers.forEach((answer, idx) => {
          logger.log(`Question ${answer.test_id} OHLC data: ${answer.ohlc_data?.length || 0} candles`);
          logger.log(`Question ${answer.test_id} Outcome data: ${answer.outcome_data?.length || 0} candles`);
        });
        
        // Create and save the test result
        
        const testResult = new TestResults({
          userId: userId,
          testType: 'bias-test',
          assetSymbol: asset.symbol,
          score: score,
          totalPoints: answersArray.length,
          status: testDetails.every(detail => detail.aiAnalysis) ? 'completed' : 'processing',
          details: {
            timeframe: timeframe,
            sessionId: sessionId,
            testDetails: testDetails
          },
          completedAt: new Date()
        });
        
        // If all analysis is complete, set analysisCompletedAt
        if (testDetails.every(detail => detail.aiAnalysis)) {
          testResult.analysisCompletedAt = new Date();
        }
        
        // CRITICAL: Check document size before saving
        const documentSize = JSON.stringify(testResult).length;
        logger.log(`Document size before saving: ${documentSize / 1024} KB`);
        
        if (documentSize > 15 * 1024 * 1024) {
          console.error(`Document too large (${documentSize / 1024 / 1024} MB), may exceed MongoDB 16MB limit`);
          // Reduce size if needed
          testDetails.forEach(detail => {
            if (detail.ohlcData && detail.ohlcData.length > 50) {
              detail.ohlcData = detail.ohlcData.slice(0, 50);
            }
            if (detail.outcomeData && detail.outcomeData.length > 50) {
              detail.outcomeData = detail.outcomeData.slice(0, 50);
            }
          });
        }
        
        // IMPORTANT: Log final data before saving
        logger.log("FINAL DATA BEFORE SAVE:");
        testResult.details.testDetails.forEach((detail, idx) => {
          logger.log(`Question ${detail.question} OHLC data: ${detail.ohlcData?.length || 0} candles`);
          logger.log(`Question ${detail.question} Outcome data: ${detail.outcomeData?.length || 0} candles`);
        });
        
        await testResult.save();
        logger.log(`Bias test result saved to database for user ${userId}, session ${sessionId}`);
      } else {
        logger.log(`Result already exists in database for user ${userId}, session ${sessionId}`);
      }
      
      // Store the results in memory as well
      sessions[sessionId] = results;
      logger.log(`Stored results for session ${sessionId}`);
      
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error processing test answers:', error);
      return res.status(500).json({ error: 'Failed to process test answers' });
    }
  }
  
  // CRITICAL: Do not generate a new test if we already have results for this session
  if (req.method === 'GET' && sessions[sessionId] && sessions[sessionId].answers) {
    logger.log(`Session ${sessionId} already has results, returning those instead of generating new test`);
    return res.status(200).json(sessions[sessionId]);
  }
  
  try {
    // Generate questions with market data
    const questionCount = 5;
    const SETUP_CANDLES = 25;
    const OUTCOME_CANDLES = 25; // Make this equal to SETUP_CANDLES for balanced charts
    
    // Log randomization parameters
    const randomSeed = Date.now();
    logger.log(`Generating new test with seed: ${randomSeed}`);
    
    const questions = [];
    
    if (assetSymbol === 'random') {
      // For random mix test, randomize both assets and timeframes
      const availableAssets = assets.filter(a => a.symbol !== 'random');
      const availableTimeframes = ['4h', 'daily', 'weekly', 'monthly'];
      
      for (let i = 0; i < questionCount; i++) {
        const questionAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
        const questionTimeframe = availableTimeframes[Math.floor(Math.random() * availableTimeframes.length)];
        logger.log(`Generating question ${i + 1} with ${questionAsset.name} (${questionAsset.symbol}) at ${questionTimeframe} timeframe`);
        
        // Fetch individual data segment for this specific asset and timeframe
        const questionDataSegments = await fetchSegmentedData(questionAsset, questionTimeframe, 1);
        
        if (questionDataSegments && questionDataSegments.length > 0) {
          const segment = questionDataSegments[0];
          
          // Split the segment into setup and outcome
          const setupData = segment.slice(0, SETUP_CANDLES);
          const outcomeData = segment.slice(SETUP_CANDLES, SETUP_CANDLES + OUTCOME_CANDLES);
          
          // Determine if the outcome was bullish or bearish
          const lastSetupCandle = setupData[setupData.length - 1];
          const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
          const correctAnswer = lastOutcomeCandle.close > lastSetupCandle.close ? 'Bullish' : 'Bearish';
          
          questions.push({
            id: i + 1,
            timeframe: questionTimeframe,
            asset_name: questionAsset.name,
            asset_symbol: questionAsset.symbol,
            date: lastSetupCandle.date,
            ohlc: {
              open: lastSetupCandle.open,
              high: lastSetupCandle.high,
              low: lastSetupCandle.low,
              close: lastSetupCandle.close,
              volume: lastSetupCandle.volume || 0
            },
            ohlc_data: setupData,
            correct_answer: correctAnswer,
            outcome_data: outcomeData
          });
        }
      }
    } else if (timeframe === 'random') {
      // For random timeframes, generate each question individually with different timeframes
      const availableTimeframes = ['4h', 'daily', 'weekly', 'monthly'];
      
      for (let i = 0; i < questionCount; i++) {
        const questionTimeframe = availableTimeframes[Math.floor(Math.random() * availableTimeframes.length)];
        logger.log(`Generating question ${i + 1} with ${questionTimeframe} timeframe`);
        
        // Fetch individual data segment for this specific timeframe
        const questionDataSegments = await fetchSegmentedData(asset, questionTimeframe, 1);
        
        if (questionDataSegments && questionDataSegments.length > 0) {
          const segment = questionDataSegments[0];
          
          // Split the segment into setup and outcome
          const setupData = segment.slice(0, SETUP_CANDLES);
          const outcomeData = segment.slice(SETUP_CANDLES, SETUP_CANDLES + OUTCOME_CANDLES);
          
          // Determine if the outcome was bullish or bearish
          const lastSetupCandle = setupData[setupData.length - 1];
          const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
          const correctAnswer = lastOutcomeCandle.close > lastSetupCandle.close ? 'Bullish' : 'Bearish';
          
          questions.push({
            id: i + 1,
            timeframe: questionTimeframe,
            asset_name: asset.name,
            asset_symbol: asset.symbol,
            date: lastSetupCandle.date,
            ohlc: {
              open: lastSetupCandle.open,
              high: lastSetupCandle.high,
              low: lastSetupCandle.low,
              close: lastSetupCandle.close,
              volume: lastSetupCandle.volume || 0
            },
            ohlc_data: setupData,
            correct_answer: correctAnswer,
            outcome_data: outcomeData
          });
        }
      }
    } else {
      // For fixed timeframes, use the original logic
      const dataSegments = await fetchSegmentedData(asset, timeframe, questionCount);
      
      for (let i = 0; i < Math.min(questionCount, dataSegments.length); i++) {
        const segment = dataSegments[i];
        
        // Split the segment into setup and outcome
        const setupData = segment.slice(0, SETUP_CANDLES);
        const outcomeData = segment.slice(SETUP_CANDLES, SETUP_CANDLES + OUTCOME_CANDLES);
        
        // Determine if the outcome was bullish or bearish
        const lastSetupCandle = setupData[setupData.length - 1];
        const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
        const correctAnswer = lastOutcomeCandle.close > lastSetupCandle.close ? 'Bullish' : 'Bearish';
        
        questions.push({
          id: i + 1,
          timeframe: timeframe,
          asset_name: asset.name,
          asset_symbol: asset.symbol,
          date: lastSetupCandle.date,
          ohlc: {
            open: lastSetupCandle.open,
            high: lastSetupCandle.high,
            low: lastSetupCandle.low,
            close: lastSetupCandle.close,
            volume: lastSetupCandle.volume || 0
          },
          ohlc_data: setupData,
          correct_answer: correctAnswer,
          outcome_data: outcomeData
        });
      }
    }
    
    // Create test session
    const testData = {
      asset_name: assetSymbol === 'random' ? 'Random Mix' : asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: assetSymbol === 'random' ? 'mixed' : timeframe,
      questions: questions,
      timestamp: Date.now() // Add timestamp for session cleanup
    };
    
    // Store test session for validation of answers later
    const testSessionKey = sessionId + '_test';
    sessions[testSessionKey] = testData;
    logger.log(`Stored test session with key: ${testSessionKey}`);
    logger.log(`Total sessions after storing: ${Object.keys(sessions).length}`);
    
    // Test session stored in memory - database backup removed to avoid validation issues
    
    // Send only necessary data to client (remove correct answers and outcome data)
    const clientTestData = {
      asset_name: assetSymbol === 'random' ? 'Random Mix' : asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: assetSymbol === 'random' ? 'mixed' : timeframe,
      questions: questions.map(q => ({
        id: q.id,
        timeframe: q.timeframe,
        asset_name: q.asset_name,
        asset_symbol: q.asset_symbol,
        date: q.date,
        ohlc: q.ohlc,
        ohlc_data: q.ohlc_data
      }))
    };
    
    logger.log(`Sending test with ${clientTestData.questions.length} questions to client`);
    res.status(200).json(clientTestData);
  } catch (error) {
    console.error('Error generating test:', error);
    
    // Return basic mock test data as fallback
    const randomSeed = Date.now();
    // Configure candle counts for mock data
    const SETUP_CANDLES = 25;
    const OUTCOME_CANDLES = 25; // Equal to setup for balanced charts
    
    const mockTestData = {
      asset_name: asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: timeframe,
      questions: Array.from({ length: 5 }, (_, i) => {
        const seed = randomSeed + i * 1000;
        const setupData = generateMockOHLCDataWithSeed(
          asset.basePrice * (0.9 + (Math.random() * 0.2)), 
          SETUP_CANDLES, 
          timeframe, 
          asset.basePrice * 0.05,
          seed
        );
        
        // Generate outcome data continuing from setup
        const lastSetupCandle = setupData[setupData.length - 1];
        const outcomeData = generateMockOHLCDataWithSeed(
          lastSetupCandle.close, 
          OUTCOME_CANDLES, 
          timeframe, 
          asset.basePrice * 0.05,
          seed + 500
        );
        
        // Adjust outcome data dates to be continuous from setup
        const lastSetupDate = new Date(lastSetupCandle.date);
        const timeIncrement = getTimeIncrement(timeframe);
        
        outcomeData.forEach((candle, j) => {
          const date = new Date(lastSetupDate.getTime() + ((j + 1) * timeIncrement));
          candle.date = date.toISOString();
        });
        
        const correctAnswer = outcomeData[outcomeData.length - 1].close > lastSetupCandle.close ? 'Bullish' : 'Bearish';
        
        return {
          id: i + 1,
          timeframe: timeframe,
          date: lastSetupCandle.date,
          ohlc: {
            open: lastSetupCandle.open,
            high: lastSetupCandle.high,
            low: lastSetupCandle.low,
            close: lastSetupCandle.close,
            volume: lastSetupCandle.volume || 0
          },
          ohlc_data: setupData,
          correct_answer: correctAnswer,
          outcome_data: outcomeData
        };
      }),
      timestamp: Date.now() // Add timestamp for session cleanup
    };
    
    // Store test session for validation of answers later
    const testSessionKey = sessionId + '_test';
    sessions[testSessionKey] = mockTestData;
    logger.log(`Stored mock test session with key: ${testSessionKey}`);
    logger.log(`Total sessions after storing mock: ${Object.keys(sessions).length}`);
    
    // Send only necessary data to client (remove correct answers)
    const clientTestData = {
      asset_name: asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: timeframe,
      questions: mockTestData.questions.map(q => ({
        id: q.id,
        timeframe: q.timeframe,
        date: q.date,
        ohlc: q.ohlc,
        ohlc_data: q.ohlc_data
      }))
    };
    
    logger.log(`Sending fallback test with ${clientTestData.questions.length} questions to client`);
    res.status(200).json(clientTestData);
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, handler),
  { methods: ['GET', 'POST'] }
);
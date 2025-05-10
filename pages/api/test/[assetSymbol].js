// pages/api/test/[assetSymbol].js
import { v4 as uuidv4 } from 'uuid';
import { fetchAssetOHLCData, generateMockOHLCData } from '../../../lib/data-service';

// Store sessions in memory (in a real app, this would be a database)
const sessions = {};

// Clean up old sessions to prevent memory leaks
const SESSION_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
setInterval(() => {
  const now = Date.now();
  Object.keys(sessions).forEach(key => {
    if (sessions[key].timestamp && (now - sessions[key].timestamp) > SESSION_EXPIRY) {
      delete sessions[key];
      console.log(`Cleaned up expired session: ${key}`);
    }
  });
}, 15 * 60 * 1000); // Check every 15 minutes

// Get AI analysis for a trading decision with correct parameter order
async function getAIAnalysis(chartData, outcomeData, prediction, reasoning, correctAnswer, wasCorrect) {
  try {
    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set, skipping AI analysis');
      return null;
    }
    
    // Call analyze-trading-gpt4o endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'}/api/analyze-trading-gpt4o`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chartData,
        outcomeData,
        prediction,
        reasoning,
        correctAnswer,
        wasCorrect
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI analysis failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.analysis;
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
    console.log(`Fetching ${totalCandles} candles for ${asset.symbol} at ${timeframe} timeframe, starting from ${randomHistoricalDate.toISOString()}`);
    
    // Use the random date as a seed for generating different data patterns
    const randomSeed = getRandomSeed();
    console.log(`Using random seed: ${randomSeed} for data generation`);
    
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
        console.log(`Not enough data for question ${i+1}, generating mock data`);
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
    
    data.push({
      date: date.toISOString(),
      open,
      high,
      low,
      close
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

// Handler function for API requests
export default async function handler(req, res) {
  const { assetSymbol } = req.query;
  const timeframe = req.query.timeframe || 'daily';
  
  // Generate a new session ID if:
  // 1. No sessionId is provided (new test)
  // 2. A random parameter is included (force refresh)
  const forceNewSession = req.query.random !== undefined;
  const sessionId = forceNewSession ? uuidv4() : (req.query.session_id || uuidv4());
  
  console.log(`Session ID: ${sessionId}, Force new session: ${forceNewSession}`);
  
  // Get the asset data
  const asset = assets.find(a => a.symbol === assetSymbol);
  
  if (!asset) {
    return res.status(404).json({ error: `Asset with symbol ${assetSymbol} not found` });
  }
  
  // ENHANCED: Comprehensive check for existing results with improved logging
  if (!forceNewSession) {
    // First, check if we already have results for this session
    if (sessions[sessionId] && sessions[sessionId].answers) {
      console.log(`Found existing results for session ${sessionId}, returning those`);
      return res.status(200).json(sessions[sessionId]);
    }
    
    // If requesting results with explicit session_id
    if (req.query.session_id) {
      if (sessions[req.query.session_id] && sessions[req.query.session_id].answers) {
        console.log(`Returning existing processed results for ${req.query.session_id}`);
        return res.status(200).json(sessions[req.query.session_id]);
      }
      
      // If no processed results, check for test session
      const testSessionKey = req.query.session_id + '_test';
      if (sessions[testSessionKey]) {
        console.log(`Found test session ${testSessionKey}, but no processed results yet`);
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
      
      // CRITICAL FIX: Extract answers from the request body
      // Handle both structures: either direct array or {answers: [...]} object
      const { answers = [], chartData = {} } = req.body || {};
      
      // Handle both direct array and nested answers array
      const answersArray = Array.isArray(answers) ? answers : 
                          (answers.answers && Array.isArray(answers.answers) ? answers.answers : []);
      
      console.log('Processing answers:', answersArray);
      console.log('Test session data:', testSession.questions.map(q => ({ 
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
        console.log(`Question ${answer.test_id}: User=${answer.prediction}, Correct=${question.correct_answer}, Match=${isCorrect}`);
        
        if (isCorrect) {
          score++;
        }
        
        // Get AI analysis if reasoning is provided
        let aiAnalysis = null;
        if (answer.reasoning) {
          try {
            // Use the chart data provided in the request or from the question
            const questionChartData = chartData && chartData[answer.test_id] 
              ? chartData[answer.test_id] 
              : question.ohlc_data;
              
            console.log(`Getting AI analysis for answer ${answer.test_id}`);
            // Get AI analysis with all required parameters
            aiAnalysis = await getAIAnalysis(
              questionChartData,
              question.outcome_data,
              answer.prediction, 
              answer.reasoning,
              question.correct_answer,
              question.correct_answer === answer.prediction
            );
            console.log(`AI analysis received for answer ${answer.test_id}: ${aiAnalysis ? 'success' : 'empty'}`);
          } catch (error) {
            console.error(`Error getting AI analysis for answer ${answer.test_id}:`, error);
          }
        }
        
        return {
          test_id: answer.test_id,
          user_prediction: answer.prediction,
          user_reasoning: answer.reasoning || null,
          ai_analysis: aiAnalysis,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
          timeframe: question.timeframe,
          ohlc_data: question.ohlc_data,
          outcome_data: question.outcome_data
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
      
      console.log(`Final score: ${score}/${answersArray.length}`);
      
      // Store the results
      sessions[sessionId] = results;
      console.log(`Stored results for session ${sessionId}`);
      
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error processing test answers:', error);
      return res.status(500).json({ error: 'Failed to process test answers' });
    }
  }
  
  // CRITICAL: Do not generate a new test if we already have results for this session
  if (req.method === 'GET' && sessions[sessionId] && sessions[sessionId].answers) {
    console.log(`Session ${sessionId} already has results, returning those instead of generating new test`);
    return res.status(200).json(sessions[sessionId]);
  }
  
  try {
    // Generate questions with market data
    const questionCount = 5;
    const SETUP_CANDLES = 25;
    const OUTCOME_CANDLES = 25; // Make this equal to SETUP_CANDLES for balanced charts
    
    // Log randomization parameters
    const randomSeed = Date.now();
    console.log(`Generating new test with seed: ${randomSeed}`);
    
    // Fetch segmented data for each question
    const dataSegments = await fetchSegmentedData(asset, timeframe, questionCount);
    
    // Create questions from the segments
    const questions = [];
    
    for (let i = 0; i < Math.min(questionCount, dataSegments.length); i++) {
      const segment = dataSegments[i];
      const questionTimeframe = timeframe === 'random' 
        ? ['4h', 'daily', 'weekly', 'monthly'][Math.floor(Math.random() * 4)]
        : timeframe;
      
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
        date: lastSetupCandle.date,
        ohlc: {
          open: lastSetupCandle.open,
          high: lastSetupCandle.high,
          low: lastSetupCandle.low,
          close: lastSetupCandle.close
        },
        ohlc_data: setupData,
        correct_answer: correctAnswer,
        outcome_data: outcomeData
      });
    }
    
    // Create test session
    const testData = {
      asset_name: asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: timeframe,
      questions: questions,
      timestamp: Date.now() // Add timestamp for session cleanup
    };
    
    // Store test session for validation of answers later
    const testSessionKey = sessionId + '_test';
    sessions[testSessionKey] = testData;
    console.log(`Stored test session with key: ${testSessionKey}`);
    
    // Send only necessary data to client (remove correct answers and outcome data)
    const clientTestData = {
      asset_name: asset.name,
      asset_symbol: asset.symbol,
      session_id: sessionId,
      selected_timeframe: timeframe,
      questions: questions.map(q => ({
        id: q.id,
        timeframe: q.timeframe,
        date: q.date,
        ohlc: q.ohlc,
        ohlc_data: q.ohlc_data
      }))
    };
    
    console.log(`Sending test with ${clientTestData.questions.length} questions to client`);
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
            close: lastSetupCandle.close
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
    
    console.log(`Sending fallback test with ${clientTestData.questions.length} questions to client`);
    res.status(200).json(clientTestData);
  }
}
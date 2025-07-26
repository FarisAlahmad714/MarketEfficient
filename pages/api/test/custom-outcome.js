// pages/api/test/custom-outcome.js
import { fetchAssetOHLCData } from '../../../lib/data-service';
import OpenAI from 'openai';

// Asset mappings (same as custom.js)
const assetMappings = {
  // Crypto
  'btc': { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto' },
  'eth': { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto' },
  'sol': { symbol: 'SOL/USD', name: 'Solana', type: 'crypto' },
  'bnb': { symbol: 'BNB/USD', name: 'Binance Coin', type: 'crypto' },
  
  // Stocks
  'nvda': { symbol: 'NVDA', name: 'NVIDIA', type: 'equity' },
  'aapl': { symbol: 'AAPL', name: 'Apple', type: 'equity' },
  'tsla': { symbol: 'TSLA', name: 'Tesla', type: 'equity' },
  'gld': { symbol: 'GLD', name: 'SPDR Gold Trust', type: 'equity' },
  
  // Commodities
  'xau': { symbol: 'XAU/USD', name: 'Gold', type: 'commodity' },
  'cl': { symbol: 'CL=F', name: 'Crude Oil', type: 'commodity' },
  'xag': { symbol: 'XAG/USD', name: 'Silver', type: 'commodity' },
  'ng': { symbol: 'NG=F', name: 'Natural Gas', type: 'commodity' }
};

// Timeframe configurations
const timeframeConfigs = {
  '4h': {
    interval: '4h',
    setupCandles: 120,
    outcomeCandles: 30,
    candleHours: 4
  },
  'daily': {
    interval: '1day',
    setupCandles: 90,
    outcomeCandles: 20,
    candleHours: 24
  },
  'weekly': {
    interval: '1week',
    setupCandles: 52,
    outcomeCandles: 16,
    candleHours: 168
  },
  'monthly': {
    interval: '1month',
    setupCandles: 36,
    outcomeCandles: 12,
    candleHours: 720
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, asset, timeframe, date, prediction, reasoning, confidence } = req.body;

  // Validate inputs
  if (!session_id || !asset || !timeframe || !date || !prediction) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      success: false 
    });
  }

  const assetInfo = assetMappings[asset.toLowerCase()];
  const timeframeConfig = timeframeConfigs[timeframe.toLowerCase()];

  if (!assetInfo || !timeframeConfig) {
    return res.status(400).json({ 
      error: 'Invalid asset or timeframe',
      success: false 
    });
  }

  try {
    // Parse the selected date
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Calculate full period needed
    const setupDays = Math.ceil((timeframeConfig.setupCandles * timeframeConfig.candleHours) / 24);
    const outcomeDays = Math.ceil((timeframeConfig.outcomeCandles * timeframeConfig.candleHours) / 24);
    const totalDays = setupDays + outcomeDays;

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - setupDays);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all data (setup + outcome)
    const totalCandles = timeframeConfig.setupCandles + timeframeConfig.outcomeCandles + 5; // Buffer
    
    // Create complete asset object for fetchAssetOHLCData (matching the format from bias test)
    const basePriceMap = {
      'btc': 60000,
      'eth': 3000,
      'sol': 100,
      'bnb': 500,
      'nvda': 800,
      'aapl': 175,
      'tsla': 250,
      'gld': 240,
      'xau': 2000,
      'cl': 75,
      'xag': 25,
      'ng': 3
    };
    
    // Use different apiId mapping based on asset type
    let apiId;
    if (assetInfo.type === 'crypto') {
      const cryptoApiMap = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'sol': 'solana',
        'bnb': 'binancecoin'
      };
      apiId = cryptoApiMap[asset.toLowerCase()];
    } else {
      // For stocks and commodities, use the symbol directly
      apiId = assetInfo.symbol;
    }
    
    const assetObj = {
      id: 1, // Dummy ID
      symbol: asset.toLowerCase(),
      name: assetInfo.name,
      apiId: apiId,
      type: assetInfo.type,
      basePrice: basePriceMap[asset.toLowerCase()] || 100
    };
    
    // Fetch data just like the working test endpoint does
    const allData = await fetchAssetOHLCData(
      assetObj,
      timeframeConfig.interval, // Use the interval format from config
      totalCandles, // Pass candles directly, not days
      startDate,
      session_id
    );

    console.log('Fetched data length:', allData?.length);
    console.log('Required data length:', timeframeConfig.setupCandles + timeframeConfig.outcomeCandles);
    
    // For stocks/commodities, adjust expectations due to market closures
    let requiredCandles = timeframeConfig.setupCandles + timeframeConfig.outcomeCandles;
    if (assetInfo.type === 'equity' || assetInfo.type === 'commodity') {
      // Stocks/commodities trade ~252 days/year, so reduce requirements proportionally
      requiredCandles = Math.floor(requiredCandles * 0.7); // 70% to account for weekends/holidays
    }
    
    if (!allData || allData.length < requiredCandles) {
      return res.status(500).json({
        error: 'Insufficient data for outcome period',
        success: false,
        details: {
          received: allData?.length || 0,
          required: requiredCandles,
          originalRequired: timeframeConfig.setupCandles + timeframeConfig.outcomeCandles,
          assetType: assetInfo.type
        }
      });
    }

    // Split into setup and outcome
    // For stocks/commodities, adjust the split based on available data
    let actualSetupCandles = timeframeConfig.setupCandles;
    let actualOutcomeCandles = timeframeConfig.outcomeCandles;
    
    if (assetInfo.type === 'equity' || assetInfo.type === 'commodity') {
      // If we have less data than expected, proportionally split it
      if (allData.length < timeframeConfig.setupCandles + timeframeConfig.outcomeCandles) {
        const ratio = timeframeConfig.setupCandles / (timeframeConfig.setupCandles + timeframeConfig.outcomeCandles);
        actualSetupCandles = Math.floor(allData.length * ratio);
        actualOutcomeCandles = allData.length - actualSetupCandles;
      }
    }
    
    const setupData = allData.slice(0, actualSetupCandles);
    const outcomeData = allData.slice(actualSetupCandles, actualSetupCandles + actualOutcomeCandles);

    // Transform outcome data to match expected chart format
    const transformedOutcomeData = outcomeData.map(candle => {
      const timestamp = new Date(candle.date).getTime() / 1000;
      return {
        time: timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume || 0
      };
    });

    // Calculate actual movement
    const setupClose = setupData[setupData.length - 1].close;
    const outcomeClose = outcomeData[outcomeData.length - 1].close;
    const actualMovement = ((outcomeClose - setupClose) / setupClose) * 100;

    // Determine if prediction was correct
    const actualDirection = actualMovement > 0 ? 'bullish' : 'bearish';
    const correct = prediction === actualDirection;

    // Generate AI analysis with timeframe context
    let aiAnalysis = await generateEnhancedAIAnalysis({
      asset: assetInfo.name,
      assetType: assetInfo.type,
      timeframe,
      timeframeConfig,
      prediction,
      actualDirection,
      actualMovement,
      setupData,
      outcomeData,
      volatility: calculateVolatility(outcomeData),
      trend: calculateTrend(outcomeData),
      reasoning,
      confidence,
      setupClose,
      outcomeClose
    });

    res.status(200).json({
      success: true,
      outcomeData: {
        setupClose: setupClose,
        outcomeClose: outcomeClose,
        actualMovement: actualMovement,
        actualDirection: actualDirection,
        correct: correct,
        outcomeCandles: transformedOutcomeData,
        aiAnalysis: aiAnalysis,
        stats: {
          highestPrice: Math.max(...outcomeData.map(c => c.high)),
          lowestPrice: Math.min(...outcomeData.map(c => c.low)),
          volatility: calculateVolatility(outcomeData),
          trend: calculateTrend(outcomeData)
        }
      }
    });

  } catch (error) {
    console.error('Error in custom outcome API:', error);
    res.status(500).json({
      error: 'Internal server error',
      success: false,
      details: error.message
    });
  }
}

function calculateVolatility(candles) {
  const returns = [];
  for (let i = 1; i < candles.length; i++) {
    const dailyReturn = (candles[i].close - candles[i-1].close) / candles[i-1].close;
    returns.push(dailyReturn);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100; // Return as percentage
}

function calculateTrend(candles) {
  // Simple linear regression to determine trend
  const n = candles.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  candles.forEach((candle, i) => {
    sumX += i;
    sumY += candle.close;
    sumXY += i * candle.close;
    sumX2 += i * i;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope > 0.01) return 'uptrend';
  if (slope < -0.01) return 'downtrend';
  return 'sideways';
}

async function generateEnhancedAIAnalysis(params) {
  const {
    asset, assetType, timeframe, timeframeConfig, prediction, actualDirection,
    actualMovement, setupData, outcomeData, volatility, trend, reasoning,
    confidence, setupClose, outcomeClose
  } = params;

  try {
    // Check if we have OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return generateSimpleAnalysis(params);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Get first and last outcome candles for detailed analysis
    const firstOutcomeCandle = outcomeData[0];
    const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
    
    // Calculate timeframe-specific metrics
    const candleCount = outcomeData.length;
    const timeframeHours = timeframeConfig.candleHours;
    const totalOutcomeHours = candleCount * timeframeHours;
    const totalOutcomeDays = totalOutcomeHours / 24;

    // Trading context based on timeframe
    const timeframeContext = {
      '4h': 'short-term/scalping (4-hour candles for quick intraday moves)',
      'daily': 'swing trading (daily candles for multi-day positions)',
      'weekly': 'position trading (weekly candles for longer-term trends)',
      'monthly': 'investment/long-term (monthly candles for major trends)'
    };

    const prompt = `You are a professional trading analyst providing expert feedback on a trader's prediction for a CUSTOM DATE TEST.

ASSET DETAILS:
- Asset: ${asset} (${assetType})
- Timeframe: ${timeframe.toUpperCase()} - ${timeframeContext[timeframe]}
- Setup Period: ${timeframeConfig.setupCandles} candles (${Math.ceil(timeframeConfig.setupCandles * timeframeHours / 24)} days)
- Outcome Period: ${candleCount} candles (${totalOutcomeDays.toFixed(1)} days / ${totalOutcomeHours} hours)

TRADER'S ANALYSIS:
- Prediction: ${prediction.toUpperCase()}
- Reasoning: "${reasoning || 'No reasoning provided'}"
- Confidence: ${confidence}%
- Result: ${prediction === actualDirection ? 'CORRECT' : 'INCORRECT'}

PRICE ACTION SUMMARY:
- Setup Close: $${setupClose.toFixed(2)}
- First Outcome Candle: Open $${firstOutcomeCandle.open.toFixed(2)} (${((firstOutcomeCandle.open - setupClose) / setupClose * 100).toFixed(2)}% gap)
- Last Outcome Close: $${outcomeClose.toFixed(2)}
- Total Movement: ${actualMovement.toFixed(2)}% ${actualDirection}
- Highest Price: $${Math.max(...outcomeData.map(c => c.high)).toFixed(2)}
- Lowest Price: $${Math.min(...outcomeData.map(c => c.low)).toFixed(2)}
- Volatility: ${volatility.toFixed(2)}%
- Overall Trend: ${trend}

Please provide a comprehensive analysis with these sections:

<h3>📊 What Actually Happened</h3>
<p>Provide a candle-by-candle narrative of the outcome period. Describe:
- How the market opened after setup (gap up/down/flat)
- The progression through each ${timeframe} candle
- Key turning points or momentum shifts
- How the ${candleCount} candles unfolded over ${totalOutcomeDays.toFixed(1)} days</p>

<h3>🎯 Trading Opportunity Analysis</h3>
<p>Based on the ${timeframe} timeframe, explain:
- What entry opportunities existed
- Where logical stops would have been placed
- Potential profit targets based on the timeframe
- Whether this was a scalp, swing, or position trade opportunity</p>

<h3>✅ Your Analysis Review</h3>
<p>Evaluate the trader's reasoning: "${reasoning || 'No reasoning provided'}"
- What they identified correctly
- What signals they may have missed
- How their ${confidence}% confidence aligned with the setup quality</p>

<h3>🎓 Timeframe-Specific Lessons</h3>
<p>Key takeaways for trading the ${timeframe} timeframe:
- What to watch for in ${timeframe} setups
- Risk management for this timeframe
- Realistic expectations for ${timeframe} moves</p>

Keep the analysis specific to the timeframe chosen and educational about that trading style.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional trading analyst providing expert timeframe-specific feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Fallback to simple analysis
    return generateSimpleAnalysis(params);
  }
}

function generateSimpleAnalysis(params) {
  const { asset, prediction, actualDirection, actualMovement, volatility, trend } = params;
  const correct = prediction === actualDirection;
  const movementStrength = Math.abs(actualMovement) > 5 ? 'strong' : Math.abs(actualMovement) > 2 ? 'moderate' : 'weak';
  
  let analysis = `The ${asset} market showed a ${movementStrength} ${actualDirection} movement of ${actualMovement.toFixed(2)}% during the outcome period. `;
  
  if (correct) {
    analysis += `Your ${prediction} prediction was correct. `;
  } else {
    analysis += `Your ${prediction} prediction was incorrect - the market moved in the opposite direction. `;
  }
  
  analysis += `The outcome period exhibited ${volatility > 5 ? 'high' : volatility > 2 ? 'moderate' : 'low'} volatility (${volatility.toFixed(2)}%) `;
  analysis += `with an overall ${trend} pattern. `;
  
  if (!correct) {
    analysis += `This highlights the importance of considering multiple factors and market conditions when making predictions.`;
  } else {
    analysis += `Well done on reading the market signals correctly!`;
  }
  
  return analysis;
}
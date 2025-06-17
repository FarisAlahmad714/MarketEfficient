// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';
import logger from '../../lib/logger';
import { filterContent } from '../../lib/contentFilter';

// Technical Analysis Pattern Recognition
const CANDLESTICK_PATTERNS = {
  DOJI: (o, h, l, c) => Math.abs(c - o) / (h - l) < 0.1,
  HAMMER: (o, h, l, c) => {
    const body = Math.abs(c - o);
    const lowerWick = Math.min(o, c) - l;
    const upperWick = h - Math.max(o, c);
    return lowerWick > body * 2 && upperWick < body * 0.5;
  },
  SHOOTING_STAR: (o, h, l, c) => {
    const body = Math.abs(c - o);
    const upperWick = h - Math.max(o, c);
    const lowerWick = Math.min(o, c) - l;
    return upperWick > body * 2 && lowerWick < body * 0.5;
  },
  ENGULFING_BULLISH: (prev, curr) => 
    prev.close < prev.open && curr.close > curr.open && 
    curr.open < prev.close && curr.close > prev.open,
  ENGULFING_BEARISH: (prev, curr) => 
    prev.close > prev.open && curr.close < curr.open && 
    curr.open > prev.close && curr.close < prev.open,
  MARUBOZU_BULLISH: (o, h, l, c) => 
    c > o && Math.abs(h - c) < (c - o) * 0.1 && Math.abs(o - l) < (c - o) * 0.1,
  MARUBOZU_BEARISH: (o, h, l, c) => 
    c < o && Math.abs(h - o) < (o - c) * 0.1 && Math.abs(c - l) < (o - c) * 0.1,
};

// Enhanced date formatting with market session context
function formatMarketDate(isoDateString) {
  if (!isoDateString) return "unknown time";
  try {
    const date = new Date(isoDateString);
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    return isoDateString;
  }
}

// Identify candlestick patterns in the chart
function identifyCandlePatterns(candles) {
  const patterns = [];
  
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const { open, high, low, close, date } = candle;
    
    // Single candle patterns
    if (CANDLESTICK_PATTERNS.DOJI(open, high, low, close)) {
      patterns.push({ type: 'DOJI', date, index: i, significance: 'Indecision/potential reversal' });
    }
    if (CANDLESTICK_PATTERNS.HAMMER(open, high, low, close)) {
      patterns.push({ type: 'HAMMER', date, index: i, significance: 'Bullish reversal signal' });
    }
    if (CANDLESTICK_PATTERNS.SHOOTING_STAR(open, high, low, close)) {
      patterns.push({ type: 'SHOOTING_STAR', date, index: i, significance: 'Bearish reversal signal' });
    }
    if (CANDLESTICK_PATTERNS.MARUBOZU_BULLISH(open, high, low, close)) {
      patterns.push({ type: 'BULLISH_MARUBOZU', date, index: i, significance: 'Strong bullish momentum' });
    }
    if (CANDLESTICK_PATTERNS.MARUBOZU_BEARISH(open, high, low, close)) {
      patterns.push({ type: 'BEARISH_MARUBOZU', date, index: i, significance: 'Strong bearish momentum' });
    }
    
    // Multi-candle patterns
    if (i > 0) {
      const prevCandle = candles[i - 1];
      if (CANDLESTICK_PATTERNS.ENGULFING_BULLISH(prevCandle, candle)) {
        patterns.push({ type: 'BULLISH_ENGULFING', date, index: i, significance: 'Strong bullish reversal' });
      }
      if (CANDLESTICK_PATTERNS.ENGULFING_BEARISH(prevCandle, candle)) {
        patterns.push({ type: 'BEARISH_ENGULFING', date, index: i, significance: 'Strong bearish reversal' });
      }
    }
  }
  
  return patterns;
}

// Analyze support and resistance levels
function identifyKeyLevels(candles) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  // Find swing highs and lows
  const swingHighs = [];
  const swingLows = [];
  
  for (let i = 1; i < candles.length - 1; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i+1]) {
      swingHighs.push({ price: highs[i], date: candles[i].date, index: i });
    }
    if (lows[i] < lows[i-1] && lows[i] < lows[i+1]) {
      swingLows.push({ price: lows[i], date: candles[i].date, index: i });
    }
  }
  
  // Identify potential support/resistance from multiple touches
  const priceFrequency = {};
  closes.forEach(price => {
    const rounded = Math.round(price * 100) / 100;
    priceFrequency[rounded] = (priceFrequency[rounded] || 0) + 1;
  });
  
  const significantLevels = Object.entries(priceFrequency)
    .filter(([_, freq]) => freq >= 2)
    .map(([price, freq]) => ({ price: parseFloat(price), touches: freq }))
    .sort((a, b) => b.touches - a.touches);
  
  return { swingHighs, swingLows, significantLevels };
}

// Calculate advanced price statistics
function calculateAdvancedStats(candles) {
  if (!candles || candles.length === 0) return null;
  
  const prices = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume || 0);
  
  // Calculate moving averages
  const sma = (arr, period) => {
    if (arr.length < period) return null;
    const sum = arr.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };
  
  // Price momentum
  const momentum = prices.length > 1 ? 
    ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
  
  // Volatility (standard deviation)
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);
  const volatilityPercent = (volatility / mean) * 100;
  
  // Trend strength (ADX-like calculation)
  let upMoves = 0;
  let downMoves = 0;
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i-1];
    if (change > 0) upMoves += change;
    else downMoves += Math.abs(change);
  }
  const trendStrength = upMoves > downMoves ? 
    (upMoves / (upMoves + downMoves)) * 100 : 
    -(downMoves / (upMoves + downMoves)) * 100;
  
  // Recent momentum (last 3 candles vs previous 3)
  const recentCandles = candles.slice(-3);
  const previousCandles = candles.slice(-6, -3);
  const recentAvg = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
  const previousAvg = previousCandles.length > 0 ? 
    previousCandles.reduce((sum, c) => sum + c.close, 0) / previousCandles.length : recentAvg;
  const recentMomentum = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  return {
    momentum,
    volatilityPercent,
    trendStrength,
    recentMomentum,
    sma5: sma(prices, 5),
    sma20: sma(prices, 20),
    currentPrice: prices[prices.length - 1],
    priceRange: Math.max(...prices) - Math.min(...prices),
    averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length
  };
}

// Analyze the specific context for the ticker (AAPL in this case)
function analyzeTickerContext(ticker, date, chartData) {
  // This would ideally fetch real market events, but for now we'll analyze the chart context
  const patterns = identifyCandlePatterns(chartData);
  const keyLevels = identifyKeyLevels(chartData);
  const stats = calculateAdvancedStats(chartData);
  
  // Build context based on technical analysis
  const context = {
    patterns: patterns.slice(-3), // Last 3 patterns
    nearestResistance: keyLevels.swingHighs[0]?.price,
    nearestSupport: keyLevels.swingLows[0]?.price,
    trendDirection: stats.trendStrength > 20 ? 'strongly bullish' : 
                   stats.trendStrength > 0 ? 'moderately bullish' :
                   stats.trendStrength > -20 ? 'moderately bearish' : 'strongly bearish',
    volatilityLevel: stats.volatilityPercent > 3 ? 'high' : 
                    stats.volatilityPercent > 1.5 ? 'moderate' : 'low',
    momentum: stats.recentMomentum > 1 ? 'accelerating' : 
              stats.recentMomentum < -1 ? 'decelerating' : 'stable'
  };
  
  return context;
}

// Generate specific market insights based on the actual data
function generateMarketInsights(setupData, outcomeData, stats, patterns, keyLevels) {
  const insights = [];
  
  // Pattern-based insights
  const recentPatterns = patterns.slice(-3);
  if (recentPatterns.length > 0) {
    recentPatterns.forEach(pattern => {
      insights.push({
        type: 'pattern',
        description: `${pattern.type} pattern on ${formatMarketDate(pattern.date)}`,
        significance: pattern.significance
      });
    });
  }
  
  // Price action insights
  const lastCandle = setupData[setupData.length - 1];
  const pricePosition = ((lastCandle.close - stats.currentPrice) / stats.currentPrice) * 100;
  
  if (Math.abs(lastCandle.close - keyLevels.swingHighs[0]?.price) < stats.priceRange * 0.02) {
    insights.push({
      type: 'resistance',
      description: `Price testing resistance at ${keyLevels.swingHighs[0].price.toFixed(2)}`,
      significance: 'Potential reversal zone'
    });
  }
  
  if (Math.abs(lastCandle.close - keyLevels.swingLows[0]?.price) < stats.priceRange * 0.02) {
    insights.push({
      type: 'support',
      description: `Price testing support at ${keyLevels.swingLows[0].price.toFixed(2)}`,
      significance: 'Potential bounce zone'
    });
  }
  
  // Momentum insights
  if (stats.recentMomentum > 2) {
    insights.push({
      type: 'momentum',
      description: 'Strong bullish momentum in recent sessions',
      significance: 'Trend continuation likely'
    });
  } else if (stats.recentMomentum < -2) {
    insights.push({
      type: 'momentum',
      description: 'Strong bearish momentum in recent sessions',
      significance: 'Downtrend continuation likely'
    });
  }
  
  return insights;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chartData, outcomeData, chartImage, prediction, reasoning, correctAnswer, wasCorrect } = req.body;

    // Validate inputs
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      return res.status(400).json({ error: 'Valid chart data is required' });
    }

    // Content filtering for reasoning
    if (reasoning) {
      const contentCheck = filterContent(reasoning, { strictMode: false });
      if (!contentCheck.isValid) {
        logger.log(`Content filter blocked reasoning: ${contentCheck.code} - ${contentCheck.reason}`);
        return res.status(400).json({ 
          error: 'Content validation failed',
          message: contentCheck.reason,
          code: contentCheck.code
        });
      }
    }

    // Perform comprehensive technical analysis
    const patterns = identifyCandlePatterns(chartData);
    const keyLevels = identifyKeyLevels(chartData);
    const setupStats = calculateAdvancedStats(chartData);
    const marketInsights = generateMarketInsights(chartData, outcomeData, setupStats, patterns, keyLevels);
    
    // Analyze the outcome if available
    const outcomeStats = outcomeData ? calculateAdvancedStats(outcomeData) : null;
    const outcomePatterns = outcomeData ? identifyCandlePatterns(outcomeData) : [];
    
    // Get specific candle information
    const lastSetupCandle = chartData[chartData.length - 1];
    const firstOutcomeCandle = outcomeData?.[0];
    const setupDate = formatMarketDate(lastSetupCandle.date);
    const outcomeDate = firstOutcomeCandle ? formatMarketDate(firstOutcomeCandle.date) : "the next session";
    
    // Calculate specific price movements
    const setupCandleChange = ((lastSetupCandle.close - lastSetupCandle.open) / lastSetupCandle.open * 100).toFixed(2);
    const outcomeCandleChange = firstOutcomeCandle ? 
      ((firstOutcomeCandle.close - firstOutcomeCandle.open) / firstOutcomeCandle.open * 100).toFixed(2) : 0;
    
    // Build a detailed technical context
    const technicalContext = {
      lastCandleType: lastSetupCandle.close > lastSetupCandle.open ? 'bullish' : 'bearish',
      lastCandleStrength: Math.abs(setupCandleChange),
      patterns: patterns.map(p => `${p.type} on ${formatMarketDate(p.date)}`).join(', '),
      keyResistance: keyLevels.swingHighs[0]?.price.toFixed(2) || 'None identified',
      keySupport: keyLevels.swingLows[0]?.price.toFixed(2) || 'None identified',
      trendStrength: setupStats.trendStrength.toFixed(1),
      volatility: setupStats.volatilityPercent.toFixed(2),
      momentum: setupStats.recentMomentum.toFixed(2)
    };

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the enhanced prompt
    const systemPrompt = `You are an elite trading coach and technical analyst. Your job is to provide EXTREMELY SPECIFIC, data-driven analysis of each trade. 

CRITICAL REQUIREMENTS:
1. NEVER use generic phrases like "recent candles" or "the last X candles"
2. ALWAYS reference specific prices, dates, and exact patterns
3. ALWAYS quote exact numbers from the data provided
4. NEVER give generic trading advice - everything must be specific to THIS exact chart
5. When the user provides minimal reasoning (like just a ticker), analyze what they SHOULD have seen in the chart
6. Your analysis must be surgical in precision, referencing exact price levels and specific candlestick patterns

TECHNICAL DATA PROVIDED:
- Last Setup Candle (${setupDate}): O: $${lastSetupCandle.open}, H: $${lastSetupCandle.high}, L: $${lastSetupCandle.low}, C: $${lastSetupCandle.close}
- Last Candle Movement: ${setupCandleChange}% (${technicalContext.lastCandleType})
- Identified Patterns: ${technicalContext.patterns || 'None in recent price action'}
- Key Resistance: $${technicalContext.keyResistance}
- Key Support: $${technicalContext.keySupport}
- Trend Strength: ${technicalContext.trendStrength}% ${setupStats.trendStrength > 0 ? 'bullish' : 'bearish'}
- Volatility: ${technicalContext.volatility}%
- Recent Momentum: ${technicalContext.momentum}%

OUTCOME DATA:
- First Outcome Candle (${outcomeDate}): ${firstOutcomeCandle ? `O: $${firstOutcomeCandle.open}, H: $${firstOutcomeCandle.high}, L: $${firstOutcomeCandle.low}, C: $${firstOutcomeCandle.close}` : 'Not provided'}
- Outcome Movement: ${outcomeCandleChange}%
- Prediction: ${prediction.toUpperCase()} | Actual: ${correctAnswer.toUpperCase()} | Result: ${wasCorrect ? 'CORRECT' : 'INCORRECT'}

USER'S REASONING: "${reasoning}"

Provide your analysis using this EXACT format:`;

    const userPrompt = `<h3>📊 Surgical Chart Breakdown</h3>
<p>Start with: "At ${setupDate}, ${reasoning === 'aapl' || reasoning.length < 10 ? 'AAPL' : 'the chart'} closed at $${lastSetupCandle.close} after ${technicalContext.lastCandleType} movement of ${setupCandleChange}%..."

Then provide SPECIFIC analysis:
- Exact price action: "The session opened at $${lastSetupCandle.open} and ${lastSetupCandle.high > lastSetupCandle.open ? `rallied to $${lastSetupCandle.high}` : `immediately sold off`}..."
- Key technical levels: "Price was ${lastSetupCandle.close > technicalContext.keyResistance ? 'above' : 'below'} the key resistance at $${technicalContext.keyResistance}..."
- Specific patterns: ${patterns.length > 0 ? `"The ${patterns[patterns.length-1].type} pattern formed at...` : '"No classic reversal patterns were present, however...'}
</p>

<h3>📈 What Actually Happened</h3>
<p>Provide a detailed narrative of the market's actual response following the setup:

"After the setup candle closed at $${lastSetupCandle.close} on ${setupDate}, the market ${correctAnswer === 'bullish' ? 'responded bullishly' : 'declined bearishly'}. ${firstOutcomeCandle ? `The next session opened at $${firstOutcomeCandle.open} (${((firstOutcomeCandle.open - lastSetupCandle.close) / lastSetupCandle.close * 100).toFixed(2)}% ${firstOutcomeCandle.open > lastSetupCandle.close ? 'gap up' : firstOutcomeCandle.open < lastSetupCandle.close ? 'gap down' : 'flat'}) and ${firstOutcomeCandle.close > firstOutcomeCandle.open ? `rallied to close at $${firstOutcomeCandle.close}` : `declined to close at $${firstOutcomeCandle.close}`}, creating a ${outcomeCandleChange}% ${correctAnswer} move.` : `moved ${correctAnswer} as anticipated.`}"

Then analyze the WHY behind what happened:
- Market dynamics: "This ${correctAnswer} move was driven by..."
- Technical validation: "${setupStats.trendStrength > 0 ? 'The existing bullish momentum' : 'The bearish pressure'} was ${wasCorrect ? 'confirmed' : 'challenged'} by..."
- Pattern completion: ${patterns.length > 0 ? `"The ${patterns[patterns.length-1].type} pattern ${correctAnswer === 'bullish' ? 'played out as expected' : 'failed to deliver'} because..."` : '"Without clear pattern signals, the move was primarily driven by..."'}
- Support/Resistance interaction: "Price ${firstOutcomeCandle ? (firstOutcomeCandle.close > technicalContext.keyResistance ? 'broke above resistance' : firstOutcomeCandle.close < technicalContext.keySupport ? 'broke below support' : 'respected key levels') : 'interacted with key levels'} at..."
</p>

<h3>🎯 Reasoning Deep Dive</h3>
<p>${reasoning.length < 10 ? 
`Your reasoning of "${reasoning}" suggests you were relying on ${reasoning.toLowerCase() === 'aapl' ? 'fundamental bias toward Apple rather than the technical setup. Here\'s what the chart actually showed:' : 'instinct rather than analysis. The technical picture revealed:'}`
: 
`You stated: "${reasoning}" - Let me connect this to the specific price action:`}

- At $${lastSetupCandle.close}, the price was ${((lastSetupCandle.close - keyLevels.swingLows[0]?.price) / keyLevels.swingLows[0]?.price * 100).toFixed(1)}% above the nearest support
- The ${technicalContext.lastCandleType} close with ${setupCandleChange}% movement indicated ${Math.abs(setupCandleChange) > 1 ? 'strong' : 'weak'} ${technicalContext.lastCandleType} pressure
- Volume context: [Analyze if volume data available]
${marketInsights.map(insight => `- ${insight.description}: ${insight.significance}`).join('\n')}
</p>

<h3>✅ What You Got Right</h3>
<ul>
${wasCorrect ? 
`<li><strong>Directional Accuracy:</strong> Your ${prediction} call aligned with the ${outcomeCandleChange}% ${correctAnswer} move from $${firstOutcomeCandle?.open || lastSetupCandle.close} to $${firstOutcomeCandle?.close || 'outcome'}</li>
<li><strong>Market Structure Read:</strong> ${setupStats.trendStrength > 0 && prediction === 'bullish' ? `You correctly identified the ${setupStats.trendStrength.toFixed(1)}% bullish trend strength` : 'Your instincts about market direction were validated'}</li>` 
: 
`<li><strong>Risk Awareness:</strong> Even though incorrect, attempting to predict after a ${setupCandleChange}% move shows active market engagement</li>
<li><strong>Market Participation:</strong> You took a stance rather than sitting on the sidelines</li>`}
<li><strong>Technical Level Awareness:</strong> ${Math.abs(lastSetupCandle.close - keyLevels.significantLevels[0]?.price) < 1 ? `Price at $${lastSetupCandle.close} was near the significant level of $${keyLevels.significantLevels[0].price}` : 'You engaged with a clear trending market'}</li>
</ul>

<h3>🔍 Critical Technical Blindspots</h3>
<ul>
<li><strong>Candlestick Signal Missed:</strong> The ${technicalContext.lastCandleType} candle at $${lastSetupCandle.close} with ${((lastSetupCandle.high - lastSetupCandle.low) / lastSetupCandle.open * 100).toFixed(2)}% range showed ${lastSetupCandle.close > lastSetupCandle.open ? 
  lastSetupCandle.close < (lastSetupCandle.open + (lastSetupCandle.high - lastSetupCandle.open) * 0.3) ? 'rejection at highs' : 'strong bullish conviction' :
  lastSetupCandle.close > (lastSetupCandle.open - (lastSetupCandle.open - lastSetupCandle.low) * 0.3) ? 'rejection at lows' : 'strong bearish conviction'}</li>
<li><strong>Momentum Divergence:</strong> With ${technicalContext.momentum}% recent momentum, the market was ${Math.abs(technicalContext.momentum) > 2 ? 'clearly' : 'subtly'} ${technicalContext.momentum > 0 ? 'accelerating' : 'decelerating'}</li>
<li><strong>Price Structure:</strong> ${lastSetupCandle.close > setupStats.sma5 ? `Price at $${lastSetupCandle.close} was ${((lastSetupCandle.close - setupStats.sma5) / setupStats.sma5 * 100).toFixed(1)}% above` : `Price at $${lastSetupCandle.close} was ${((setupStats.sma5 - lastSetupCandle.close) / setupStats.sma5 * 100).toFixed(1)}% below`} the 5-period average of $${setupStats.sma5?.toFixed(2) || 'N/A'}</li>
</ul>

<h3>📚 Precision Trading Lessons</h3>
<ul>
<li><strong>Entry Precision:</strong> For this exact setup, optimal entry would have been at $${correctAnswer === 'bullish' ? (lastSetupCandle.low * 1.001).toFixed(2) : (lastSetupCandle.high * 0.999).toFixed(2)} with stops at $${correctAnswer === 'bullish' ? (lastSetupCandle.low * 0.995).toFixed(2) : (lastSetupCandle.high * 1.005).toFixed(2)}</li>
<li><strong>Pattern Recognition:</strong> ${patterns.length > 0 ? `The ${patterns[patterns.length-1].type} at ${formatMarketDate(patterns[patterns.length-1].date)} was a textbook ${patterns[patterns.length-1].significance} signal` : `No classic patterns, but the ${setupStats.volatilityPercent.toFixed(2)}% volatility suggested ${setupStats.volatilityPercent > 2 ? 'high risk conditions' : 'stable conditions'}`}</li>
<li><strong>Risk:Reward:</strong> With support at $${keyLevels.swingLows[0]?.price.toFixed(2) || 'undefined'} and resistance at $${keyLevels.swingHighs[0]?.price.toFixed(2) || 'undefined'}, the R:R was ${keyLevels.swingHighs[0] && keyLevels.swingLows[0] ? ((keyLevels.swingHighs[0].price - lastSetupCandle.close) / (lastSetupCandle.close - keyLevels.swingLows[0].price)).toFixed(1) + ':1' : 'unclear'}</li>
</ul>

<h3>🧠 Psychological Edge Development</h3>
<ul>
<li><strong>Reasoning Pattern:</strong> ${reasoning.length < 10 ? `Your minimal reasoning "${reasoning}" suggests impulse trading. The chart showed ${marketInsights.length} clear technical signals you could have articulated` : `Your reasoning focused on ${reasoning.includes('bull') || reasoning.includes('bear') ? 'directional bias' : 'subjective interpretation'} rather than the objective $${lastSetupCandle.close} price structure`}</li>
<li><strong>Confirmation Bias:</strong> ${wasCorrect ? 'Success here might reinforce pattern-less trading. Document WHY this worked technically' : `The ${correctAnswer} move to $${firstOutcomeCandle?.close || 'outcome'} contradicted your ${prediction} bias - use this as a learning checkpoint`}</li>
<li><strong>Process Development:</strong> Create a checklist: ☐ Key levels identified ☐ Pattern confirmed ☐ Momentum aligned ☐ Risk defined at $${(lastSetupCandle.close * 0.02).toFixed(2)} per share</li>
</ul>

<h3>🎯 The $${lastSetupCandle.close} Lesson</h3>
<p><strong>Remember this specific setup:</strong> On ${setupDate}, with price at $${lastSetupCandle.close} after a ${setupCandleChange}% ${technicalContext.lastCandleType} candle, the market was telling you ${correctAnswer === 'bullish' ? 
  `buyers were ${setupCandleChange > 0 ? 'in control' : 'accumulating'} despite ${patterns.length > 0 ? `the ${patterns[patterns.length-1].type} pattern` : 'the price action'}` : 
  `sellers were ${setupCandleChange < 0 ? 'dominating' : 'distributing'} as evidenced by ${patterns.length > 0 ? `the ${patterns[patterns.length-1].type} pattern` : 'the rejection from highs'}`}. 
  
The ${outcomeCandleChange}% ${correctAnswer} move to $${firstOutcomeCandle?.close || 'the outcome price'} validated ${wasCorrect ? 'your read' : 'the opposite thesis'}. 

<em>Specific takeaway: When you see a ${Math.abs(setupCandleChange)}% ${technicalContext.lastCandleType} candle at ${technicalContext.volatility}% volatility with ${technicalContext.momentum > 0 ? 'positive' : 'negative'} momentum, the probability favors ${correctAnswer} continuation ${Math.abs(outcomeCandleChange)}% of the time in similar setups.</em></p>`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // Add image if available
    if (chartImage) {
      messages[1] = {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: chartImage, detail: "high" } }
        ]
      };
    }

    logger.log(`Generating precise analysis for ${prediction} prediction on ${setupDate}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.3,
      max_tokens: 2500,
    });

    const analysis = completion.choices[0].message.content;
    
    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Error in trading analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze trading decision', 
      message: error.message 
    });
  }
}
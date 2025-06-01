// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';
import logger from '../../lib/Logger'; // Adjust path to your logger utility

// Helper function to format dates - ENHANCED VERSION
function formatReadableDate(isoDateString) {
  if (!isoDateString) return "an unspecified time";
  try {
    const date = new Date(isoDateString);
    // Format as: "January 5, 2024 at 3:30 PM"
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  } catch (e) {
    console.error("Error formatting date:", isoDateString, e);
    return isoDateString; // Fallback to original if formatting fails
  }
}

// Helper function to get time-based greeting for dates
function getTimeContext(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const hour = date.getHours();
    if (hour >= 0 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  } catch (e) {
    return "";
  }
}

// Helper function to calculate price movement statistics
function calculatePriceStats(candles) {
  if (!candles || candles.length === 0) return null;
  
  const opens = candles.map(c => c.open);
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const firstOpen = opens[0];
  const lastClose = closes[closes.length - 1];
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  
  const priceChange = ((lastClose - firstOpen) / firstOpen) * 100;
  const volatility = ((highestHigh - lowestLow) / firstOpen) * 100;
  
  // Count bullish vs bearish candles
  const bullishCandles = candles.filter(c => c.close > c.open).length;
  const bearishCandles = candles.length - bullishCandles;
  
  // Identify potential patterns
  const lastThreeCandles = candles.slice(-3);
  const isUptrend = lastThreeCandles.every((c, i) => 
    i === 0 || c.close > lastThreeCandles[i-1].close
  );
  const isDowntrend = lastThreeCandles.every((c, i) => 
    i === 0 || c.close < lastThreeCandles[i-1].close
  );
  
  return {
    priceChange,
    volatility,
    bullishCandles,
    bearishCandles,
    trend: isUptrend ? 'uptrend' : (isDowntrend ? 'downtrend' : 'sideways'),
    highestHigh,
    lowestLow
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chartData, outcomeData, chartImage, prediction, reasoning, correctAnswer, wasCorrect } = req.body;

    // Validate inputs
    if (!chartData) return res.status(400).json({ error: 'Chart data is required' });
    if (!prediction) return res.status(400).json({ error: 'Prediction is required' });
    if (!reasoning) return res.status(400).json({ error: 'Reasoning is required' });
    if (!correctAnswer) return res.status(400).json({ error: 'Correct answer is required' });
    
    logger.log(`Processing analysis for ${prediction.toUpperCase()} prediction (Correct: ${correctAnswer.toUpperCase()}, wasCorrect: ${wasCorrect})`);

    // Get the most recent candle data for explicit reference
    const lastCandle = chartData[chartData.length - 1];
    const isBullish = lastCandle.close > lastCandle.open;
    const candleType = isBullish ? "BULLISH" : "BEARISH";
    
    // Get the outcome candle data if available
    const nextCandle = outcomeData && outcomeData.length > 0 ? outcomeData[0] : null;
    const nextCandleType = nextCandle ? (nextCandle.close > nextCandle.open ? "BULLISH" : "BEARISH") : correctAnswer.toUpperCase();
    
    // Extract and format dates from the candles
    const lastCandleDate = formatReadableDate(lastCandle.date);
    const nextCandleDate = nextCandle && nextCandle.date ? formatReadableDate(nextCandle.date) : "the following session";
    
    // Calculate price statistics for better analysis
    const setupStats = calculatePriceStats(chartData);
    const outcomeStats = outcomeData ? calculatePriceStats(outcomeData) : null;
    
    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o with ENHANCED prompt
    const messages = [
      {
        role: "system",
        content: `You are a professional trading analyst providing expert feedback on a trader's market prediction. Your analysis must be highly specific to the provided chart data (setup and outcome) and the trader's reasoning.

CRITICAL DATA VERIFICATION:
1. Trader's Prediction for the candle following ${lastCandleDate}: ${prediction.toUpperCase()}
2. Actual Outcome on ${nextCandleDate}: ${correctAnswer.toUpperCase()}
3. Trader's Prediction Was: ${wasCorrect ? "CORRECT" : "INCORRECT"}
4. The last candle on the setup chart (${lastCandleDate}) was: ${candleType}
${outcomeData && outcomeData.length > 0 ? `5. The outcome chart shows the price action immediately following the setup chart. The first candle of the outcome chart (${nextCandleDate}) was: ${nextCandleType}` : ''}

SETUP CHART STATISTICS:
- Overall price change: ${setupStats.priceChange.toFixed(2)}%
- Volatility range: ${setupStats.volatility.toFixed(2)}%
- Bullish candles: ${setupStats.bullishCandles} out of ${chartData.length}
- Bearish candles: ${setupStats.bearishCandles} out of ${chartData.length}
- Trend direction: ${setupStats.trend}

${outcomeStats ? `OUTCOME CHART STATISTICS:
- Price movement from setup: ${outcomeStats.priceChange.toFixed(2)}%
- Outcome volatility: ${outcomeStats.volatility.toFixed(2)}%
- Outcome trend: ${outcomeStats.trend}` : ''}

ANALYSIS REQUIREMENTS:
1. Your analysis must be thorough, specific, and tailored to THIS EXACT chart setup and outcome.
2. NEVER use generic statements like "the last 10 candles" - instead, reference specific patterns, dates, and price movements.
3. Quote the trader's reasoning directly and analyze how it relates to what actually happened.
4. Be specific about chart patterns (e.g., "The hammer candle on ${lastCandleDate}" or "The descending triangle pattern from [date] to [date]").
5. Explain the EXACT scenario: what signals were present, what happened, and why.
6. Use professional trading terminology but explain it clearly.
7. ALL sections below MUST be included with substantial, specific content.

FORMAT YOUR ANALYSIS WITH THE FOLLOWING SECTIONS:

<h3>📊 Detailed Market Scenario Analysis</h3>
<p>Provide a comprehensive breakdown of what happened in this specific trading scenario. Start with: "In this ${setupStats.trend} market scenario ending on ${lastCandleDate}, the setup chart revealed..." Then describe:
- The specific market structure and key levels visible in the setup
- Exact candlestick patterns or formations (with dates)
- What signals or clues were present that indicated the ${correctAnswer.toUpperCase()} outcome
- How the outcome unfolded starting from ${nextCandleDate}
- The specific price action that confirmed or contradicted the setup signals
Avoid generic statements - be precise about THIS chart.</p>

<h3>🎯 Analysis of Your Trading Reasoning</h3>
<p>Begin with: "You stated: '${reasoning}'" Then provide a detailed examination connecting their exact words to specific chart elements. Explain:
- Which aspects of their analysis were accurate or flawed
- How their interpretation compared to the actual market behavior
- Why their prediction was ${wasCorrect ? "correct" : "incorrect"} based on the specific chart evidence
- What they saw vs. what the chart actually showed</p>

<h3>✅ Strengths in Your Analysis</h3>
<ul>
<li><strong>[Specific Strength 1]:</strong> Quote their exact words that showed good analysis. Example: "When you noted '[quote]', you correctly identified the [specific pattern] forming on [date]..."</li>
<li><strong>[Specific Strength 2]:</strong> Another strength with direct quote and connection to a specific chart element or pattern visible in the data.</li>
<li><strong>[Specific Strength 3]:</strong> ${wasCorrect ? "Your correct prediction shows you recognized..." : "Even though your prediction was incorrect, you showed good instincts when..."}</li>
</ul>

<h3>🔍 Critical Blind Spots & Missed Signals</h3>
<ul>
<li><strong>[Specific Blind Spot 1]:</strong> "The ${candleType} candle on ${lastCandleDate} formed a [specific pattern name] which typically signals..." Explain what was missed.</li>
<li><strong>[Specific Blind Spot 2]:</strong> Reference a specific technical signal or pattern from the setup chart they overlooked. Be precise about dates and formations.</li>
<li><strong>[Specific Blind Spot 3]:</strong> ${!wasCorrect ? "The key signal you missed was..." : "For even better accuracy next time, consider..."}</li>
</ul>

// <h3>📚 Actionable Educational Tips for This Pattern</h3>
// <ul>
// <li><strong>Pattern Recognition:</strong> "In this ${setupStats.trend} scenario with ${setupStats.bullishCandles} bullish and ${setupStats.bearishCandles} bearish candles, using [specific indicator] would have highlighted..." Provide exact technical guidance.</li>
// <li><strong>Entry Timing:</strong> "For this specific setup ending on ${lastCandleDate}, the optimal entry would have been..." Explain with reference to the actual chart.</li>
// <li><strong>Risk Management:</strong> "Given the ${setupStats.volatility.toFixed(2)}% volatility in the setup, position sizing should..." Provide specific guidance based on THIS chart's characteristics.</li>
// </ul>

<h3>🧠 Trading Psychology Insights</h3>
<ul>
<li><strong>Cognitive Bias Identified:</strong> Quote specific phrases from their reasoning that reveal bias. Example: "Your statement '[quote]' suggests [specific bias type] because..."</li>
<li><strong>Emotional Indicators:</strong> Analyze their language for overconfidence, fear, or other emotions. "The way you described '[quote]' indicates..."</li>
<li><strong>Mental Framework:</strong> "For ${setupStats.trend} markets like this one, develop a checklist: 1) Check for [specific pattern], 2) Confirm with [indicator], 3) Set stops at [level based on this chart]..."</li>
</ul>

<h3>🎓 Key Takeaway</h3>
<p>Summarize the most important lesson from THIS SPECIFIC trade. Example: "The critical lesson from this ${lastCandleDate} setup is that ${candleType} candles following a ${setupStats.trend} often signal... In this case, the ${correctAnswer.toUpperCase()} outcome was telegraphed by..." Make it memorable and specific to this exact scenario.</p>

IMPORTANT RULES:
- NEVER use vague language like "recent candles" or "the last X candles" - be specific with dates and patterns
- ALWAYS quote the trader's exact words when analyzing their reasoning
- NEVER provide generic trading advice - everything must relate to THIS specific chart
- BE CRITICAL but constructive, focusing on education
- Each section must have substantial, specific content - no placeholders
- Use emojis in section headers for visual appeal
- Ensure your entire response is well-structured HTML using the specified headings (<h3>, <ul>, <li>, <p>)`
      }
    ];

    // Generate a text summary of the chart data for context
    const chartSummary = prepareEnhancedChartSummary(chartData, setupStats);
    
    // Add immediate next candle summary if available  
    let nextCandleAnalysis = "";
    if (nextCandle && outcomeStats) {
      nextCandleAnalysis = prepareEnhancedOutcomeAnalysis(chartData, outcomeData, setupStats, outcomeStats);
    }
    
    // If we have a chart image, include it for visual analysis (GPT-4o can process images)
    if (chartImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `I need your detailed analysis of my trading decision.

KEY FACTS:
- Chart: You can see the actual price chart in the attached image
- My Prediction: I predicted the next candle would be ${prediction.toUpperCase()}
- My Reasoning: "${reasoning}"
- Actual Outcome: The next candle was ${correctAnswer.toUpperCase()}
- Result: My prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}

Setup Chart Summary: ${chartSummary}
${nextCandleAnalysis}

Please provide a comprehensive analysis following ALL the required sections in the format specified.`
          },
          {
            type: "image_url",
            image_url: {
              url: chartImage,
              detail: "high"
            }
          }
        ]
      });
    } else {
      // If no image, just use the text summary
      messages.push({
        role: "user",
        content: `I need your detailed analysis of my trading decision.

KEY FACTS:
- My Prediction: I predicted the next candle would be ${prediction.toUpperCase()}
- My Reasoning: "${reasoning}"
- Actual Outcome: The next candle was ${correctAnswer.toUpperCase()}
- Result: My prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}

Setup Chart Summary: ${chartSummary}
${nextCandleAnalysis}

Please provide a comprehensive analysis following ALL the required sections in the format specified. Be specific to this exact chart scenario and avoid generic statements.`
      });
    }

    // Call OpenAI GPT-4o with increased token limit for comprehensive analysis
    logger.log("Calling OpenAI API for enhanced analysis");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.3,
      max_tokens: 2000, // Increased for more comprehensive analysis
    });

    const analysis = completion.choices[0].message.content;
    logger.log(`Analysis completed successfully: ${analysis.substring(0, 50)}...`);

    return res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing trading decision:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze trading decision', 
      message: error.message 
    });
  }
}

// Enhanced helper function to prepare chart data summary
function prepareEnhancedChartSummary(chartData, stats) {
  try {
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return "Invalid chart data provided";
    }

    const firstCandle = chartData[0];
    const lastCandle = chartData[chartData.length - 1];
    const middleCandle = chartData[Math.floor(chartData.length / 2)];
    
    // Format dates properly
    const firstDate = formatReadableDate(firstCandle.date);
    const lastDate = formatReadableDate(lastCandle.date);
    const middleDate = formatReadableDate(middleCandle.date);
    
    // Identify key patterns and levels
    const resistanceLevel = stats.highestHigh.toFixed(2);
    const supportLevel = stats.lowestLow.toFixed(2);
    
    // Analyze momentum
    const firstHalfBullish = chartData.slice(0, Math.floor(chartData.length / 2))
      .filter(c => c.close > c.open).length;
    const secondHalfBullish = chartData.slice(Math.floor(chartData.length / 2))
      .filter(c => c.close > c.open).length;
    const momentumShift = secondHalfBullish > firstHalfBullish ? "increasing bullish" : 
                         secondHalfBullish < firstHalfBullish ? "increasing bearish" : "stable";
    
    return `The setup chart spans from ${firstDate} to ${lastDate}, showing a ${stats.trend} market structure. 
    Key resistance was established at ${resistanceLevel} and support at ${supportLevel}. 
    The price action showed ${momentumShift} momentum, with ${stats.bullishCandles} bullish and ${stats.bearishCandles} bearish candles. 
    The overall price movement was ${stats.priceChange > 0 ? 'positive' : 'negative'} ${Math.abs(stats.priceChange).toFixed(2)}% with ${stats.volatility.toFixed(2)}% volatility range.
    The final candle on ${lastDate} closed as a ${lastCandle.close > lastCandle.open ? 'bullish' : 'bearish'} candle.`;
  } catch (error) {
    console.error('Error preparing enhanced chart summary:', error);
    return "Error analyzing chart data";
  }
}

// Enhanced function to analyze the outcome
function prepareEnhancedOutcomeAnalysis(chartData, outcomeData, setupStats, outcomeStats) {
  try {
    if (!outcomeData || outcomeData.length === 0) return "";
    
    const lastSetupCandle = chartData[chartData.length - 1];
    const firstOutcomeCandle = outcomeData[0];
    const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
    
    // Format dates
    const outcomeStartDate = formatReadableDate(firstOutcomeCandle.date);
    const outcomeEndDate = formatReadableDate(lastOutcomeCandle.date);
    
    // Calculate continuation or reversal
    const gapPercentage = ((firstOutcomeCandle.open - lastSetupCandle.close) / lastSetupCandle.close * 100).toFixed(2);
    const hadGap = Math.abs(gapPercentage) > 0.5;
    
    // Analyze if the outcome confirmed or rejected the setup trend
    const trendContinued = (setupStats.trend === 'uptrend' && outcomeStats.priceChange > 0) ||
                          (setupStats.trend === 'downtrend' && outcomeStats.priceChange < 0);
    
    return `

Outcome Analysis: The market opened on ${outcomeStartDate} ${hadGap ? `with a ${Math.abs(gapPercentage)}% ${gapPercentage > 0 ? 'gap up' : 'gap down'}` : 'near the previous close'}. 
The outcome period from ${outcomeStartDate} to ${outcomeEndDate} showed a ${outcomeStats.trend} pattern with ${outcomeStats.priceChange > 0 ? 'positive' : 'negative'} ${Math.abs(outcomeStats.priceChange).toFixed(2)}% movement.
This ${trendContinued ? 'continued' : 'reversed'} the ${setupStats.trend} trend from the setup chart. 
The first outcome candle was ${firstOutcomeCandle.close > firstOutcomeCandle.open ? 'bullish' : 'bearish'}, ${trendContinued ? 'confirming' : 'contradicting'} the setup's momentum.`;
  } catch (error) {
    console.error('Error preparing enhanced outcome analysis:', error);
    return "";
  }
}
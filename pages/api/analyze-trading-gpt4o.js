// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chartData, outcomeData, chartImage, prediction, reasoning } = req.body;

    // Validate inputs
    if (!chartData) return res.status(400).json({ error: 'Chart data is required' });
    if (!prediction) return res.status(400).json({ error: 'Prediction is required' });
    if (!reasoning) return res.status(400).json({ error: 'Reasoning is required' });
    
    // Check if we have outcome data (at least the next candle)
    const hasNextCandle = outcomeData && Array.isArray(outcomeData) && outcomeData.length > 0;
    const nextCandle = hasNextCandle ? outcomeData[0] : null;

    console.log(`Processing analysis for ${prediction.toUpperCase()} prediction`);

    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o with UPDATED instructions to focus on next candle
    const messages = [
      {
        role: "system",
        content: `You are a professional trading coach and educator specializing in technical analysis and trading psychology. Your goal is to provide specific, personalized feedback on a trader's decision-making process.

IMPORTANT: This is a next-candle prediction exercise. The trader was shown a chart (setup data) and asked to predict ONLY whether the NEXT CANDLE would be Bullish or Bearish. Your analysis should focus specifically on their decision for the immediate next candle, not broader trends or long-term predictions.

Your analysis should be detailed, specific to the chart patterns visible, and focus on the factors that would influence the immediate next candle's direction. Avoid generic statements.

Format your response using proper HTML markup as follows:

<h3>Analysis of Reasoning</h3>
<p>Provide a detailed examination of the trader's thought process for predicting the next candle, referencing specific chart patterns, indicators, or price action visible in the setup chart. Focus specifically on signals that would indicate the direction of the NEXT candle.</p>

<h3>Strengths</h3>
<ul>
<li>Identify 2-3 specific strengths in their next-candle prediction analysis</li>
<li>Be precise about what they noticed correctly in the setup that would influence the next candle</li>
<li>Reference specific technical elements that supported their prediction</li>
</ul>

<h3>Potential Blind Spots</h3>
<ul>
<li>Point out 2-3 specific technical elements they may have overlooked that influenced the next candle</li>
<li>Identify any cognitive biases evident in their reasoning</li>
<li>Suggest what contrary signals might have existed for the next candle direction</li>
</ul>

<h3>Educational Tips</h3>
<ul>
<li>Recommend 2-3 specific technical analysis concepts that would improve their next-candle prediction</li>
<li>Suggest specific indicators or patterns that would be relevant to this prediction</li>
<li>Provide actionable advice for similar next-candle predictions in the future</li>
</ul>

<h3>Psychology Notes</h3>
<ul>
<li>Offer 2-3 insights about trading psychology relevant to next-candle prediction decisions</li>
<li>Identify emotional factors that might influence similar predictions</li>
<li>Suggest mental frameworks for more objective single-candle analysis</li>
</ul>

Your analysis must be specific to the chart provided, referencing visible patterns and price action as they relate to predicting the NEXT candle only. Avoid generic advice.`
      }
    ];

    // Generate a text summary of the chart data for context, focusing on recent data
    const chartSummary = prepareChartSummary(chartData);
    
    // Add immediate next candle summary if available
    let nextCandleAnalysis = "";
    if (nextCandle) {
      nextCandleAnalysis = prepareNextCandleAnalysis(chartData, nextCandle);
    }
    
    // If we have a chart image, include it for visual analysis (GPT-4o can process images)
    if (chartImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `I'm analyzing this price chart and predicted the immediate NEXT candle would be ${prediction.toUpperCase()}.

My reasoning: "${reasoning}"

${nextCandleAnalysis ? "Here's what actually happened in the next candle: " + nextCandleAnalysis : ""}

Please analyze my decision-making process focusing specifically on predicting the direction of the NEXT candle only (not long-term trends). Provide educational feedback that will help me improve my technical analysis skills for immediate next-candle predictions.`
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
        content: `I'm analyzing a price chart and predicted the immediate NEXT candle would be ${prediction.toUpperCase()}.

My reasoning: "${reasoning}"

Chart summary: ${chartSummary}

${nextCandleAnalysis ? "Here's what actually happened in the next candle: " + nextCandleAnalysis : ""}

Please analyze my decision-making process focusing specifically on predicting the direction of the NEXT candle only (not long-term trends). Provide educational feedback that will help me improve my technical analysis skills for immediate next-candle predictions.`
      });
    }

    // Call OpenAI GPT-4o
    console.log("Calling OpenAI API for analysis");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Specifying GPT-4o model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0].message.content;
    console.log(`Analysis completed successfully: ${analysis.substring(0, 50)}...`);

    return res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing trading decision:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze trading decision', 
      message: error.message 
    });
  }
}

// Modified to focus on the most recent candles that would influence next-candle prediction
function prepareChartSummary(chartData) {
  try {
    // Check if we received proper chart data
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return "Invalid chart data provided";
    }

    // Get the last 5-10 candles as these are most relevant for next-candle prediction
    const recentCandles = chartData.slice(-10);
    const lastCandle = chartData[chartData.length - 1];
    
    // Analyze the last candle in detail (most important for next-candle prediction)
    const lastCandleAnalysis = analyzeCandle(lastCandle);
    
    // Count recent bullish vs bearish candles (momentum indication)
    const recentBullishCount = recentCandles.filter(c => c.close > c.open).length;
    const recentBearishCount = recentCandles.filter(c => c.close <= c.open).length;
    
    // Detect pattern in most recent 3 candles
    const last3Candles = chartData.slice(-3);
    const last3Pattern = detectCandlePattern(last3Candles);
    
    // Check if price is near recent high or low (potential reversal points)
    const recentHigh = Math.max(...recentCandles.map(c => c.high));
    const recentLow = Math.min(...recentCandles.map(c => c.low));
    const nearHigh = lastCandle.close > (recentHigh * 0.98);
    const nearLow = lastCandle.close < (recentLow * 1.02);
    
    // Create a textual summary focused on factors that would influence the next candle
    return `
      The most recent candle is ${lastCandleAnalysis.type} with ${lastCandleAnalysis.description}.
      The last 3 candles show ${last3Pattern}.
      Out of the last 10 candles, ${recentBullishCount} were bullish and ${recentBearishCount} were bearish.
      The current price ${nearHigh ? 'is near the recent high' : (nearLow ? 'is near the recent low' : 'is in the middle range')}.
      The closing price of the last visible candle is ${lastCandle.close.toFixed(2)}.
    `;
  } catch (error) {
    console.error('Error preparing chart summary:', error);
    return "Error analyzing chart data";
  }
}

// New function to analyze the immediate next candle
function prepareNextCandleAnalysis(chartData, nextCandle) {
  try {
    if (!chartData || !chartData.length || !nextCandle) {
      return "";
    }
    
    const lastSetupCandle = chartData[chartData.length - 1];
    
    // Calculate change from last candle to next candle
    const openChange = ((nextCandle.open - lastSetupCandle.close) / lastSetupCandle.close) * 100;
    const closeChange = ((nextCandle.close - nextCandle.open) / nextCandle.open) * 100;
    const overallChange = ((nextCandle.close - lastSetupCandle.close) / lastSetupCandle.close) * 100;
    
    // Determine if the next candle was bullish or bearish
    const candleType = nextCandle.close > nextCandle.open ? "bullish" : "bearish";
    
    // Analyze the next candle's characteristics
    const nextCandleAnalysis = analyzeCandle(nextCandle);
    
    // Create summary of the next candle
    return `
      The next candle opened ${openChange > 0 ? 'up' : 'down'} ${Math.abs(openChange).toFixed(2)}% from the previous close.
      It was a ${candleType} candle, closing ${Math.abs(closeChange).toFixed(2)}% ${closeChange > 0 ? 'higher' : 'lower'} than its open.
      Overall from the previous close to this candle's close, the price moved ${overallChange > 0 ? 'up' : 'down'} ${Math.abs(overallChange).toFixed(2)}%.
      This candle had ${nextCandleAnalysis.description}.
    `;
  } catch (error) {
    console.error('Error preparing next candle analysis:', error);
    return "";
  }
}

// Detailed candle analysis helper
function analyzeCandle(candle) {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  const upperWick = candle.close > candle.open 
      ? (candle.high - candle.close) 
      : (candle.high - candle.open);
  const lowerWick = candle.close > candle.open 
      ? (candle.open - candle.low) 
      : (candle.close - candle.low);
  
  const type = candle.close > candle.open ? "bullish" : "bearish";
  let description = "";
  
  // Body size relative to range
  const bodySizeRatio = bodySize / totalRange;
  
  if (bodySizeRatio < 0.1) {
    description = "a doji pattern indicating indecision";
  } else if (bodySizeRatio > 0.8) {
    description = `a strong ${type} body with minimal wicks, suggesting strong directional pressure`;
  } else if (upperWick > 2 * bodySize && lowerWick < 0.5 * bodySize) {
    description = type === "bullish" 
        ? "a shooting star pattern, potentially bearish despite the bullish close" 
        : "a bearish candle with long upper wick, suggesting selling pressure at higher prices";
  } else if (lowerWick > 2 * bodySize && upperWick < 0.5 * bodySize) {
    description = type === "bearish" 
        ? "a hammer pattern, potentially bullish despite the bearish close" 
        : "a bullish candle with long lower wick, suggesting buying pressure at lower prices";
  } else if (upperWick > bodySize && lowerWick > bodySize) {
    description = "long wicks on both sides, indicating volatility and potential indecision";
  } else {
    description = `a moderate ${type} body with balanced wicks`;
  }
  
  return { type, description };
}

// Detect patterns in candle sequences
function detectCandlePattern(candles) {
  if (candles.length < 3) return "insufficient data for pattern detection";
  
  const c1 = candles[0];
  const c2 = candles[1];
  const c3 = candles[2];
  
  const c1Type = c1.close > c1.open ? "bullish" : "bearish";
  const c2Type = c2.close > c2.open ? "bullish" : "bearish";
  const c3Type = c3.close > c3.open ? "bullish" : "bearish";
  
  // Check for three white soldiers or three black crows
  if (c1Type === "bullish" && c2Type === "bullish" && c3Type === "bullish") {
    if (c1.close < c2.close && c2.close < c3.close) {
      return "three bullish candles in sequence with higher highs, suggesting strong upward momentum";
    }
    return "three bullish candles in sequence, suggesting upward pressure";
  }
  
  if (c1Type === "bearish" && c2Type === "bearish" && c3Type === "bearish") {
    if (c1.close > c2.close && c2.close > c3.close) {
      return "three bearish candles in sequence with lower lows, suggesting strong downward momentum";
    }
    return "three bearish candles in sequence, suggesting downward pressure";
  }
  
  // Check for evening star or morning star
  if (c1Type === "bullish" && c2Type !== c1Type && c3Type === "bearish" && c2.body < c1.body * 0.5 && c2.body < c3.body * 0.5) {
    return "possible evening star pattern, a bearish reversal signal";
  }
  
  if (c1Type === "bearish" && c2Type !== c1Type && c3Type === "bullish" && c2.body < c1.body * 0.5 && c2.body < c3.body * 0.5) {
    return "possible morning star pattern, a bullish reversal signal";
  }
  
  // Check for engulfing patterns
  if (c2Type !== c3Type) {
    if (c2Type === "bullish" && c3Type === "bearish" && c3.open > c2.close && c3.close < c2.open) {
      return "bearish engulfing pattern, a potential reversal signal";
    }
    
    if (c2Type === "bearish" && c3Type === "bullish" && c3.open < c2.close && c3.close > c2.open) {
      return "bullish engulfing pattern, a potential reversal signal";
    }
  }
  
  // If no specific pattern is detected
  return `mixed candle types (${c1Type}, ${c2Type}, ${c3Type}) without a clear pattern`;
}
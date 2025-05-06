// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chartData, outcomeData, chartImage, prediction, reasoning } = req.body;

    if (!chartData || !prediction || !reasoning) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          chartData: !chartData ? 'Missing chart data' : 'Provided',
          prediction: !prediction ? 'Missing prediction' : 'Provided',
          reasoning: !reasoning ? 'Missing reasoning' : 'Provided'
        }
      });
    }

    console.log(`Processing analysis for ${prediction.toUpperCase()} prediction`);

    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o
    const messages = [
      {
        role: "system",
        content: `You are a professional trading coach and educator specializing in technical analysis and trading psychology. Your goal is to provide specific, personalized feedback on a trader's decision-making process.

Your analysis should be detailed, specific to the chart patterns visible, and avoid generic statements. Focus on educational feedback rather than predictions.

Format your response using proper HTML markup as follows:

<h3>Analysis of Reasoning</h3>
<p>Provide a detailed examination of the trader's thought process, referencing specific chart patterns, indicators, or price action visible in the chart. Mention specific candlestick patterns, trend lines, or support/resistance levels you can see.</p>

<h3>Strengths</h3>
<ul>
<li>Identify 3-4 specific strengths in their analysis</li>
<li>Be precise about what they noticed correctly</li>
<li>Reference specific chart elements they interpreted well</li>
</ul>

<h3>Potential Blind Spots</h3>
<ul>
<li>Point out 3-4 specific technical elements they may have overlooked</li>
<li>Identify any cognitive biases evident in their reasoning</li>
<li>Suggest what contrary signals might exist in the chart</li>
</ul>

<h3>Educational Tips</h3>
<ul>
<li>Recommend 2-3 specific technical analysis concepts that would improve their analysis</li>
<li>Suggest specific indicators or patterns that would be relevant to this chart</li>
<li>Provide actionable advice they can apply to similar setups</li>
</ul>

<h3>Psychology Notes</h3>
<ul>
<li>Offer 2-3 insights about trading psychology relevant to their decision</li>
<li>Identify emotional factors that might influence similar decisions</li>
<li>Suggest mental frameworks for more objective analysis</li>
</ul>

Your analysis must be specific to the chart provided, referencing visible patterns and price action. Avoid generic advice that could apply to any chart.`
      }
    ];

    // Generate a text summary of the chart data for context
    const chartSummary = prepareChartSummary(chartData);
    
    // Add outcome data summary if available
    let outcomeAnalysis = "";
    if (outcomeData && Array.isArray(outcomeData) && outcomeData.length > 0) {
      outcomeAnalysis = prepareOutcomeAnalysis(chartData, outcomeData);
    }
    
    // If we have a chart image, include it for visual analysis (GPT-4o can process images)
    if (chartImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `I'm analyzing this price chart and predicted the market would go ${prediction.toUpperCase()}.

My reasoning: "${reasoning}"

${outcomeAnalysis ? "Here's what actually happened after my prediction: " + outcomeAnalysis : ""}

Please analyze my decision-making process in detail, referencing specific chart patterns, indicators, or price action visible in the chart. Provide educational feedback that will help me improve my technical analysis skills.`
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
        content: `I'm analyzing a price chart and predicted the market would go ${prediction.toUpperCase()}.

My reasoning: "${reasoning}"

Chart summary: ${chartSummary}

${outcomeAnalysis ? "Here's what actually happened after my prediction: " + outcomeAnalysis : ""}

Please analyze my decision-making process in detail, referencing specific patterns in the data. Provide educational feedback that will help me improve my technical analysis skills.`
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

// Enhanced helper function to prepare chart data summary with more specific details
function prepareChartSummary(chartData) {
  try {
    // Check if we received proper chart data
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return "Invalid chart data provided";
    }

    // Get starting and ending price
    const startPrice = chartData[0].close;
    const endPrice = chartData[chartData.length - 1].close;
    const priceChange = ((endPrice - startPrice) / startPrice) * 100;
    
    // Identify trend
    const trend = priceChange >= 0 ? "upward" : "downward";
    
    // Calculate some basic statistics
    const highPrices = chartData.map(candle => candle.high);
    const lowPrices = chartData.map(candle => candle.low);
    const maxPrice = Math.max(...highPrices);
    const minPrice = Math.min(...lowPrices);
    
    // Detect some basic patterns
    const volatility = calculateVolatility(chartData);
    const lastFewCandles = chartData.slice(-5);
    const recentTrend = identifyRecentTrend(lastFewCandles);

    // Identify potential support and resistance levels
    const potentialLevels = identifyKeyLevels(chartData);
    
    // Create a condensed representation of recent price action
    const recentCandlePatterns = lastFewCandles.map(candle => 
      describeCandle(candle)
    ).join(', ');
    
    // Create a textual summary
    return `
      The chart shows ${chartData.length} candles with an ${trend} overall trend of ${Math.abs(priceChange).toFixed(2)}%.
      The price ranged from ${minPrice.toFixed(2)} (low) to ${maxPrice.toFixed(2)} (high).
      Market volatility appears ${volatility}.
      The most recent trend direction shows ${recentTrend}.
      Potential support/resistance levels: ${potentialLevels}.
      The last 5 candles are: ${recentCandlePatterns}.
      The most recent closing price was ${endPrice.toFixed(2)}.
    `;
  } catch (error) {
    console.error('Error preparing chart summary:', error);
    return "Error analyzing chart data";
  }
}

// NEW: Prepare outcome analysis to compare with prediction
function prepareOutcomeAnalysis(setupData, outcomeData) {
  try {
    if (!Array.isArray(setupData) || !setupData.length || !Array.isArray(outcomeData) || !outcomeData.length) {
      return "";
    }
    
    const lastSetupCandle = setupData[setupData.length - 1];
    const lastOutcomeCandle = outcomeData[outcomeData.length - 1];
    
    // Calculate overall change from prediction to final outcome
    const overallChange = ((lastOutcomeCandle.close - lastSetupCandle.close) / lastSetupCandle.close) * 100;
    const direction = overallChange >= 0 ? "bullish" : "bearish";
    
    // Calculate maximum excursion in both directions
    let maxUp = 0;
    let maxDown = 0;
    
    outcomeData.forEach(candle => {
      const changeFromPrediction = ((candle.high - lastSetupCandle.close) / lastSetupCandle.close) * 100;
      if (changeFromPrediction > maxUp) maxUp = changeFromPrediction;
      
      const downChange = ((candle.low - lastSetupCandle.close) / lastSetupCandle.close) * 100;
      if (downChange < maxDown) maxDown = downChange;
    });
    
    // Count bullish vs bearish candles
    const bullishCandles = outcomeData.filter(candle => candle.close > candle.open).length;
    const bearishCandles = outcomeData.filter(candle => candle.close <= candle.open).length;
    
    // Create summary of what happened
    return `
      After your prediction, the market went ${direction} with a ${Math.abs(overallChange).toFixed(2)}% ${overallChange >= 0 ? 'increase' : 'decrease'} from your prediction point to the end of the outcome period.
      Maximum upward excursion: +${maxUp.toFixed(2)}%. Maximum downward excursion: ${maxDown.toFixed(2)}%.
      The outcome period had ${bullishCandles} bullish candles and ${bearishCandles} bearish candles.
      The outcome aligns with a ${direction} prediction.
    `;
  } catch (error) {
    console.error('Error preparing outcome analysis:', error);
    return "";
  }
}

// Calculate approximate volatility
function calculateVolatility(chartData) {
  try {
    const closePrices = chartData.map(candle => candle.close);
    let sumChanges = 0;
    
    for (let i = 1; i < closePrices.length; i++) {
      const percentChange = Math.abs((closePrices[i] - closePrices[i-1]) / closePrices[i-1]) * 100;
      sumChanges += percentChange;
    }
    
    const avgChange = sumChanges / (closePrices.length - 1);
    
    if (avgChange < 0.5) return "very low";
    if (avgChange < 1) return "low";
    if (avgChange < 2) return "moderate";
    if (avgChange < 3) return "high";
    return "very high";
  } catch (error) {
    return "undetermined";
  }
}

// Identify recent trend direction
function identifyRecentTrend(recentCandles) {
  if (recentCandles.length < 3) return "insufficient data";
  
  const first = recentCandles[0].close;
  const last = recentCandles[recentCandles.length - 1].close;
  
  if (last > first * 1.03) return "strongly bullish";
  if (last > first) return "slightly bullish";
  if (last < first * 0.97) return "strongly bearish";
  if (last < first) return "slightly bearish";
  return "sideways/neutral";
}

// NEW: Describe individual candles more meaningfully
function describeCandle(candle) {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  const upperWick = candle.close > candle.open ? (candle.high - candle.close) : (candle.high - candle.open);
  const lowerWick = candle.close > candle.open ? (candle.open - candle.low) : (candle.close - candle.low);
  
  let type = candle.close > candle.open ? "bullish" : "bearish";
  
  // Detect special patterns
  if (bodySize < 0.1 * totalRange) {
    return "doji (indecision)";
  }
  
  if (type === "bullish" && upperWick > 2 * bodySize && lowerWick < 0.5 * bodySize) {
    return "shooting star (potential reversal)";
  }
  
  if (type === "bearish" && lowerWick > 2 * bodySize && upperWick < 0.5 * bodySize) {
    return "hammer (potential support)";
  }
  
  if (bodySize > 0.7 * totalRange) {
    return `strong ${type} (momentum)`;
  }
  
  return type;
}

// NEW: Identify potential support and resistance levels
function identifyKeyLevels(chartData) {
  try {
    // Simple implementation - identify price levels where reversals happened
    const pricePoints = [];
    
    for (let i = 1; i < chartData.length - 1; i++) {
      const prev = chartData[i-1];
      const curr = chartData[i];
      const next = chartData[i+1];
      
      // Potential resistance (price rejected higher)
      if (curr.high > prev.high && curr.high > next.high) {
        pricePoints.push({price: curr.high.toFixed(2), type: 'resistance'});
      }
      
      // Potential support (price rejected lower)
      if (curr.low < prev.low && curr.low < next.low) {
        pricePoints.push({price: curr.low.toFixed(2), type: 'support'});
      }
    }
    
    // Take at most 3 key levels to avoid clutter
    const keyLevels = pricePoints.slice(0, 3);
    if (keyLevels.length === 0) return "none clearly identified";
    
    return keyLevels.map(level => `${level.price} (${level.type})`).join(', ');
  } catch (error) {
    return "could not identify";
  }
}
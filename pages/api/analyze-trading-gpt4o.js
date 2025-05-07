// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';

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
    
    console.log(`Processing analysis for ${prediction.toUpperCase()} prediction (Correct: ${correctAnswer.toUpperCase()})`);

    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o with clear instructions about correctness
    const messages = [
      {
        role: "system",
        content: `You are a professional trading coach and educator specializing in technical analysis and trading psychology. Your goal is to provide specific, personalized feedback on a trader's decision-making process.

IMPORTANT: This is a next-candle prediction exercise. The trader was shown a chart (setup data) and asked to predict ONLY whether the NEXT CANDLE would be Bullish or Bearish. The trader predicted ${prediction.toUpperCase()} and the correct answer was ${correctAnswer.toUpperCase()}. The trader's prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}.

Your analysis should focus specifically on why their prediction was ${wasCorrect ? "correct or what they saw correctly" : "incorrect or what they might have missed"}. Be detailed and specific to the chart patterns visible that would influence the immediate next candle's direction. Avoid generic statements.

Format your response using proper HTML markup as follows:

<h3>Analysis of Reasoning</h3>
<p>Provide a detailed examination of the trader's thought process for predicting the next candle, referencing specific chart patterns or signals visible in the setup chart. Explain why their prediction was ${wasCorrect ? "correct" : "incorrect"} based on these signals.</p>

<h3>Strengths</h3>
<ul>
<li>Identify 2-3 specific strengths in their analysis, even if their prediction was incorrect</li>
<li>Be precise about what they noticed correctly in the setup that influenced the next candle</li>
<li>Reference specific technical elements they identified correctly</li>
</ul>

<h3>Potential Blind Spots</h3>
<ul>
<li>Point out 2-3 specific technical elements they may have overlooked that influenced the next candle</li>
<li>Identify any cognitive biases evident in their reasoning</li>
<li>Suggest what signals they missed that pointed to the ${correctAnswer.toUpperCase()} outcome</li>
</ul>

<h3>Educational Tips</h3>
<ul>
<li>Recommend 2-3 specific technical analysis concepts that would improve their next-candle prediction</li>
<li>Suggest specific indicators or patterns that would be relevant to this prediction</li>
<li>Provide actionable advice for similar next-candle predictions in the future</li>
</ul>

<h3>Psychology Notes</h3>
<ul>
<li>Offer 2-3 insights about trading psychology relevant to this prediction</li>
<li>Identify emotional factors that might have influenced their decision</li>
<li>Suggest mental frameworks for more objective single-candle analysis</li>
</ul>

Your analysis must be specific to the chart provided, referencing visible patterns and price action as they relate to predicting the NEXT candle only. Be clear about whether their prediction was correct or incorrect throughout your analysis.`
      }
    ];

    // Generate a text summary of the chart data for context
    const chartSummary = prepareChartSummary(chartData);
    
    // Add immediate next candle summary if available
    let nextCandleAnalysis = "";
    if (outcomeData && outcomeData.length > 0) {
      const nextCandle = outcomeData[0];
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

The correct prediction was ${correctAnswer.toUpperCase()}, so my prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}.

Please analyze my decision-making process focusing specifically on predicting the direction of the NEXT candle only. Explain why my prediction was ${wasCorrect ? "correct" : "incorrect"} and what I could improve for next time.`
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

The correct prediction was ${correctAnswer.toUpperCase()}, so my prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}.

Please analyze my decision-making process focusing specifically on predicting the direction of the NEXT candle only. Explain why my prediction was ${wasCorrect ? "correct" : "incorrect"} and what I could improve for next time.`
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

// Helper function to prepare chart data summary
function prepareChartSummary(chartData) {
  try {
    // Check if we received proper chart data
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return "Invalid chart data provided";
    }

    // Get the last 5-10 candles as these are most relevant for next-candle prediction
    const recentCandles = chartData.slice(-10);
    const lastCandle = chartData[chartData.length - 1];
    
    // Analyze the last candle in detail
    const bodySize = Math.abs(lastCandle.close - lastCandle.open);
    const totalRange = lastCandle.high - lastCandle.low;
    const upperWick = lastCandle.close > lastCandle.open 
        ? (lastCandle.high - lastCandle.close) 
        : (lastCandle.high - lastCandle.open);
    const lowerWick = lastCandle.close > lastCandle.open 
        ? (lastCandle.open - lastCandle.low) 
        : (lastCandle.close - lastCandle.low);
    
    const lastCandleType = lastCandle.close > lastCandle.open ? "bullish" : "bearish";
    let lastCandleDesc = "";
    
    if (bodySize < 0.1 * totalRange) {
      lastCandleDesc = "a doji indicating indecision";
    } else if (upperWick > 2 * bodySize && lowerWick < 0.5 * bodySize) {
      lastCandleDesc = "a long upper wick suggesting selling pressure at higher prices";
    } else if (lowerWick > 2 * bodySize && upperWick < 0.5 * bodySize) {
      lastCandleDesc = "a long lower wick suggesting buying pressure at lower prices";
    } else if (bodySize > 0.7 * totalRange) {
      lastCandleDesc = `a strong ${lastCandleType} body with minimal wicks`;
    } else {
      lastCandleDesc = `a moderate ${lastCandleType} body with balanced wicks`;
    }
    
    // Count recent bullish vs bearish candles
    const recentBullishCount = recentCandles.filter(c => c.close > c.open).length;
    const recentBearishCount = recentCandles.filter(c => c.close <= c.open).length;
    
    // Create a textual summary
    return `
      The most recent candle is ${lastCandleType} with ${lastCandleDesc}.
      Out of the last 10 candles, ${recentBullishCount} were bullish and ${recentBearishCount} were bearish.
      The closing price of the last visible candle is ${lastCandle.close.toFixed(2)}.
    `;
  } catch (error) {
    console.error('Error preparing chart summary:', error);
    return "Error analyzing chart data";
  }
}

// Function to analyze the immediate next candle
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
    const overallDirection = nextCandle.close > lastSetupCandle.close ? "bullish" : "bearish";
    
    // Create summary of the next candle
    return `
      The next candle opened ${openChange > 0 ? 'up' : 'down'} ${Math.abs(openChange).toFixed(2)}% from the previous close.
      It was a ${candleType} candle (${candleType === 'bullish' ? 'close > open' : 'close < open'}), moving ${Math.abs(closeChange).toFixed(2)}% ${closeChange > 0 ? 'up' : 'down'} from its open price.
      Overall from the previous close to this candle's close, the price moved ${overallChange > 0 ? 'up' : 'down'} ${Math.abs(overallChange).toFixed(2)}%.
      This makes the outcome ${overallDirection.toUpperCase()} relative to the previous candle.
    `;
  } catch (error) {
    console.error('Error preparing next candle analysis:', error);
    return "";
  }
}
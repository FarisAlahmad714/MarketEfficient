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
    
    console.log(`Processing analysis for ${prediction.toUpperCase()} prediction (Correct: ${correctAnswer.toUpperCase()}, wasCorrect: ${wasCorrect})`);

    // Get the most recent candle data for explicit reference
    const lastCandle = chartData[chartData.length - 1];
    const isBullish = lastCandle.close > lastCandle.open;
    const candleType = isBullish ? "BULLISH" : "BEARISH";
    
    // Get the outcome candle data if available
    const nextCandle = outcomeData && outcomeData.length > 0 ? outcomeData[0] : null;
    const nextCandleType = nextCandle ? (nextCandle.close > nextCandle.open ? "BULLISH" : "BEARISH") : correctAnswer;
    
    // Extract dates from the candles if available, otherwise use placeholders
    const lastCandleDate = lastCandle.date || "the latest trading session";
    const nextCandleDate = nextCandle && nextCandle.date ? nextCandle.date : "the following session";
    
    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o with explicit date-based referencing
    const messages = [
      {
        role: "system",
        content: `You are a professional trading analyst providing expert feedback on a trader's market prediction. You will analyze the trader's reasoning and chart analysis with specific attention to detail.

CRITICAL DATA VERIFICATION:
1. The trader predicted the next candle would be: ${prediction.toUpperCase()}
2. The actual outcome was: ${correctAnswer.toUpperCase()} 
3. The trader's prediction was: ${wasCorrect ? "CORRECT" : "INCORRECT"}
4. Latest complete candle on ${lastCandleDate} was: ${candleType}

ANALYSIS REQUIREMENTS:
1. Your analysis must be thorough, specific, and tailored to this precise chart and reasoning.
2. You must examine the trader's exact words and the specific chart patterns visible.
3. Even when the prediction was correct, you must critically evaluate the reasoning process.
4. Reference specific dates and chart formations rather than raw numerical data.
5. Don't focus extensively on the specific price numbers but rather on the patterns, trends, and formations visible on the chart.

FORMAT YOUR ANALYSIS WITH THE FOLLOWING SECTIONS:

<h3>Analysis of Reasoning</h3>
<p>Provide a detailed examination of the trader's thought process for predicting the next candle, referencing specific chart patterns or signals visible in the setup chart. Explain why their prediction was ${wasCorrect ? "correct" : "incorrect"} based on these signals. Quote parts of their reasoning and connect to specific chart elements.</p>

<h3>Strengths</h3>
<ul>
<li>Identify 2-3 specific strengths in their analysis by DIRECTLY QUOTING sections of their reasoning</li>
<li>For each strength, explicitly connect it to visible chart patterns by referencing specific candle formations or trend movements</li>
<li>Even if they were correct, differentiate between sound analysis and lucky guessing based on their reasoning</li>
</ul>

<h3>Potential Blind Spots</h3>
<ul>
<li>Point out 2-3 specific technical elements they overlooked by referencing specific dates or patterns</li>
<li>DIRECTLY QUOTE any contradictions or logical fallacies in their reasoning</li>
<li>Even if their prediction was correct, identify specifically what critical indicators they missed that could have made the prediction more reliable</li>
</ul>

<h3>Educational Tips</h3>
<ul>
<li>For THIS SPECIFIC chart scenario (not generic advice), recommend 2-3 technical analysis tools that would improve prediction accuracy</li>
<li>Suggest indicator settings or analysis techniques that would have revealed the true ${correctAnswer.toUpperCase()} bias in this exact chart</li>
<li>Provide a step-by-step process tailored to this specific chart pattern they should follow next time</li>
</ul>

<h3>Psychology Notes</h3>
<ul>
<li>Identify specific cognitive biases evident in THIS trader's reasoning, quoting their words as evidence</li>
<li>Analyze emotional language or overconfidence/underconfidence markers in their reasoning</li>
<li>Suggest a precise mental checklist for this type of chart pattern that would help overcome the specific psychological traps they fell into</li>
</ul>

IMPORTANT RULES:
- NEVER contradict that the prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}
- ALWAYS refer to chart elements by their dates or relative positions (e.g., "the bullish candle on ${lastCandleDate}")
- ALWAYS quote the trader's exact words when analyzing their reasoning
- NEVER provide generic trading advice without tying it to specific elements in this chart
- BE CRITICAL of vague reasoning even when the prediction was correct`
      }
    ];

    // Generate a text summary of the chart data for context
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
            text: `I need your detailed analysis of my trading decision.

KEY FACTS:
- Chart: You can see the actual price chart in the attached image
- My Prediction: I predicted the next candle would be ${prediction.toUpperCase()}
- My Reasoning: "${reasoning}"
- Actual Outcome: The next candle was ${correctAnswer.toUpperCase()}
- Result: My prediction was ${wasCorrect ? "CORRECT" : "INCORRECT"}

Last Candle Date: ${lastCandleDate}
Last Candle Type: ${candleType}

${nextCandle ? `Next Candle Date: ${nextCandleDate}
Next Candle Type: ${nextCandleType}` : ''}

Please analyze my decision-making process in detail, focusing specifically on what I got right or wrong based on the chart patterns and my reasoning. Be specific to what's visible in the chart and quote my reasoning directly.`
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

Chart Summary: ${chartSummary}

Last Candle Date: ${lastCandleDate}
Last Candle Type: ${candleType}

${nextCandle ? `Next Candle Date: ${nextCandleDate}
Next Candle Type: ${nextCandleType}` : ''}

Please analyze my decision-making process in detail, focusing specifically on what I got right or wrong based on the chart patterns and my reasoning. Be specific and reference candle patterns and dates rather than focusing on exact price levels.`
      });
    }

    // Call OpenAI GPT-4o
    console.log("Calling OpenAI API for analysis");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Specifying GPT-4o model
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistency and accuracy
      max_tokens: 1500,
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

    // Get the last 10 candles as these are most relevant for next-candle prediction
    const recentCandles = chartData.slice(-10);
    const lastCandle = chartData[chartData.length - 1];
    
    // Calculate bullish/bearish count
    const bullishCount = recentCandles.filter(c => c.close > c.open).length;
    const bearishCount = recentCandles.length - bullishCount;
    
    // Determine trend direction
    const trendType = bullishCount > bearishCount ? "bullish" : "bearish";
    
    // Identify candle patterns (simplified for this example)
    const lastCandleType = lastCandle.close > lastCandle.open ? "bullish" : "bearish";
    
    // Get last candle date if available
    const lastCandleDate = lastCandle.date || "the most recent session";
    
    // Create a more descriptive, less numerical summary
    return `
      The most recent candle on ${lastCandleDate} formed a ${lastCandleType} pattern.
      Out of the last 10 candles, ${bullishCount} showed bullish movement and ${bearishCount} showed bearish movement.
      The overall trend over these recent sessions appears to be ${trendType}.
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
    
    // Determine candle types
    const nextCandleType = nextCandle.close > nextCandle.open ? "bullish" : "bearish";
    const lastCandleType = lastSetupCandle.close > lastSetupCandle.open ? "bullish" : "bearish";
    
    // Get dates if available
    const lastCandleDate = lastSetupCandle.date || "the previous session";
    const nextCandleDate = nextCandle.date || "the following session";
    
    // Create a more descriptive, less numerical summary
    return `
      The next candle on ${nextCandleDate} formed a ${nextCandleType} pattern, 
      following the ${lastCandleType} candle from ${lastCandleDate}.
      Overall, the price movement between these two sessions showed a ${nextCandleType} bias.
    `;
  } catch (error) {
    console.error('Error preparing next candle analysis:', error);
    return "";
  }
}
// pages/api/analyze-trading-gpt4o.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chartData, chartImage, prediction, reasoning } = req.body;

    if (!chartData || !prediction || !reasoning) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize OpenAI client with GPT-4o
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare messages for GPT-4o
    const messages = [
      {
        role: "system",
        content: `You are a professional trading coach and educator. You help traders improve their analysis, decision-making, and psychology. Focus on educational feedback, not specific investment advice or predictions.

Your goal is to analyze a trader's decision-making process, highlight strengths, identify potential blind spots, and suggest resources for improvement. Be supportive but honest. Provide educational value.

Format your response in these sections:
1. Analysis of Reasoning: Examine the trader's thought process
2. Strengths: Note positive aspects of their analysis
3. Potential Blind Spots: Point out what might have been missed
4. Educational Tips: Suggest concepts, patterns, or resources to study
5. Psychology Notes: Comment on trading psychology aspects (if applicable)
        
Always maintain a constructive and educational tone. Do not predict whether the market will actually go up or down.`
      }
    ];

    // Generate a text summary of the chart data for context
    const chartSummary = prepareChartSummary(chartData);
    
    // If we have a chart image, include it for visual analysis (GPT-4o can process images)
    if (chartImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `I'm analyzing this price chart and predicted the market would go ${prediction.toUpperCase()}.

My reasoning: "${reasoning}"

Please analyze my decision-making process and provide educational feedback.`
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

Chart data summary: ${chartSummary}

Please analyze my decision-making process and provide educational feedback.`
      });
    }

    // Call OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Specifying GPT-4o model
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const analysis = completion.choices[0].message.content;

    return res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing trading decision:', error);
    return res.status(500).json({ error: 'Failed to analyze trading decision', message: error.message });
  }
}

// Helper function to prepare chart data for the AI
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
    
    // Create a condensed representation of recent price action
    const recentCandlePatterns = lastFewCandles.map(candle => 
      candle.close > candle.open ? "bullish" : "bearish"
    ).join(', ');
    
    // Create a textual summary
    return `
      The chart shows ${chartData.length} candles with a ${trend} overall trend of ${Math.abs(priceChange).toFixed(2)}%.
      The price ranged from ${minPrice.toFixed(2)} to ${maxPrice.toFixed(2)}.
      Market volatility appears ${volatility}.
      The most recent trend direction shows ${recentTrend}.
      The last few candles are: ${recentCandlePatterns}.
      The last closing price was ${endPrice.toFixed(2)}.
    `;
  } catch (error) {
    console.error('Error preparing chart summary:', error);
    return "Error analyzing chart data";
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
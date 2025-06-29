// lib/xai-news-service.js
import logger from './logger';

/**
 * XAI News Service for fetching relevant market news and tweets
 * Integrates with X/Twitter API through XAI to provide contextual news for trading charts
 */

class XAINewsService {
  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get asset-specific search terms for news filtering
   */
  getAssetSearchTerms(assetSymbol, assetName) {
    const searchTerms = {
      // Crypto assets
      'btc': ['Bitcoin', 'BTC', '$BTC', 'cryptocurrency', 'crypto'],
      'eth': ['Ethereum', 'ETH', '$ETH', 'ethereum price', 'ETH price'],
      'sol': ['Solana', 'SOL', '$SOL', 'solana price', 'SOL price'],
      'bnb': ['Binance', 'BNB', '$BNB', 'binance coin', 'BNB price'],
      
      // Equity assets
      'nvda': ['NVIDIA', 'NVDA', '$NVDA', 'nvidia stock', 'GPU', 'AI chips'],
      'aapl': ['Apple', 'AAPL', '$AAPL', 'iPhone', 'apple stock', 'Tim Cook'],
      'tsla': ['Tesla', 'TSLA', '$TSLA', 'Elon Musk', 'tesla stock', 'electric vehicle'],
      'gld': ['Gold', 'GLD', '$GLD', 'gold price', 'precious metals'],
      
      // Commodities
      'xau': ['Gold', 'XAU', 'XAUUSD', 'gold price', 'precious metals', 'bullion'],
      'crude': ['Oil', 'Crude', 'WTI', 'oil price', 'petroleum', 'energy'],
      'silver': ['Silver', 'XAG', 'XAGUSD', 'silver price', 'precious metals'],
      'gas': ['Natural Gas', 'NG', 'gas price', 'energy', 'heating'],
      
      // Default fallback
      'default': [assetName, assetSymbol.toUpperCase(), `$${assetSymbol.toUpperCase()}`]
    };

    return searchTerms[assetSymbol.toLowerCase()] || searchTerms.default;
  }

  /**
   * Generate cache key for news requests
   */
  getCacheKey(assetSymbol, startDate, endDate) {
    return `news_${assetSymbol}_${startDate}_${endDate}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Fetch news data from XAI API for a specific time period
   */
  async fetchNewsForTimeframe(assetSymbol, assetName, startDate, endDate) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(assetSymbol, startDate, endDate);
      const cachedData = this.cache.get(cacheKey);
      
      if (this.isCacheValid(cachedData)) {
        logger.log(`Returning cached news data for ${assetSymbol}`);
        return cachedData.data;
      }

      if (!this.apiKey) {
        logger.log('XAI API key not configured, skipping news fetch');
        return [];
      }

      const searchTerms = this.getAssetSearchTerms(assetSymbol, assetName);
      const query = searchTerms.join(' OR ');
      
      logger.log(`Fetching news for ${assetName} (${assetSymbol})`);

      // Use XAI's chat completion to search for relevant news/tweets
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'system',
              content: `You are Grok, with access to real-time X (Twitter) data and financial news. I need you to search for and return actual tweets, news articles, and market events about specific assets during given time periods.

CRITICAL INSTRUCTIONS: 
- Use your real-time access to X/Twitter to find actual tweets
- Include major news events from reliable financial sources
- Focus on price-moving events, announcements, earnings, regulatory news
- Return ONLY valid JSON array format
- For URLs, provide real URLs if available, otherwise null

Required JSON structure:
[
  {
    "date": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "headline": "Actual headline or tweet content (max 100 chars)",
    "content": "Full content or tweet text (max 300 chars)",
    "sentiment": "positive|negative|neutral",
    "impact": "high|medium|low",
    "source": "Twitter handle (with @) or news source name",
    "url": "real URL if available or null",
    "tweet_id": "tweet ID if this is a tweet",
    "username": "username if this is a tweet (without @)"
  }
]

Return empty array [] if no relevant events found.`
            },
            {
              role: 'user',
              content: `Search for real tweets and news about ${assetName} (Symbol: ${assetSymbol}) between ${startDate} and ${endDate}.

Search for:
- Tweets from influential accounts about ${query}
- Major news headlines about ${assetName}
- Price movements announcements
- Regulatory news or company announcements
- Market sentiment shifts

Time range: ${startDate} to ${endDate}
Asset: ${assetName} (${assetSymbol})

Return actual events that occurred during this timeframe as valid JSON array.`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`XAI API error: ${response.status} ${response.statusText}`);
        throw new Error(`XAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      let newsData = [];
      try {
        const content = data.choices[0]?.message?.content;
        
        if (content) {
          // Try direct JSON parse first
          try {
            newsData = JSON.parse(content);
          } catch (directParseError) {
            // Try extracting JSON from markdown or text
            const jsonMatches = [
              content.match(/```json\s*(\[[\s\S]*?\])\s*```/),
              content.match(/```\s*(\[[\s\S]*?\])\s*```/),
              content.match(/(\[[\s\S]*\])/),
            ];
            
            for (const match of jsonMatches) {
              if (match && match[1]) {
                try {
                  newsData = JSON.parse(match[1]);
                  break;
                } catch (extractError) {
                  continue;
                }
              }
            }
          }
          
          if (!Array.isArray(newsData)) {
            newsData = [];
          }
        }
      } catch (parseError) {
        logger.error('Error parsing news data:', parseError);
        newsData = [];
      }

      // Filter and validate news data
      const validatedNews = this.validateAndFilterNews(newsData, startDate, endDate);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: validatedNews,
        timestamp: Date.now()
      });

      logger.log(`Fetched ${validatedNews.length} news items for ${assetSymbol}`);
      return validatedNews;

    } catch (error) {
      logger.error(`Error fetching news for ${assetSymbol}:`, error);
      return []; // Return empty array on error to not break the chart
    }
  }

  /**
   * Validate URLs to filter out fake/generated ones
   */
  validateUrl(url) {
    if (!url || url === 'null' || url === null) {
      return null;
    }

    // Common patterns for fake/generated URLs that should be filtered out
    const fakeUrlPatterns = [
      /example\.com/i,
      /placeholder/i,
      /fake/i,
      /generated/i,
      /sample/i,
      /mock/i,
      /test/i,
      /dummy/i,
      /^https?:\/\/url/i, // URLs like "http://url" 
      /^https?:\/\/link/i, // URLs like "http://link"
      /^https?:\/\/www\.url/i,
      /^https?:\/\/www\.link/i
    ];

    // Check if URL matches fake patterns
    const isFakeUrl = fakeUrlPatterns.some(pattern => pattern.test(url));
    if (isFakeUrl) {
      return null;
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }
      return url;
    } catch (e) {
      return null;
    }
  }

  /**
   * Validate and filter news data
   */
  validateAndFilterNews(newsData, startDate, endDate) {
    if (!Array.isArray(newsData)) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return newsData
      .filter(item => {
        // Basic validation
        if (!item.date || !item.headline) {
          return false;
        }

        // Date range validation
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      })
      .map(item => {
        let finalUrl = this.validateUrl(item.url);
        
        // If no valid URL but we have tweet ID and username, construct the URL
        if (!finalUrl && item.tweet_id && item.username) {
          const cleanUsername = item.username.replace('@', '');
          finalUrl = `https://x.com/${cleanUsername}/status/${item.tweet_id}`;
        }
        
        return {
          date: item.date,
          headline: item.headline.substring(0, 100), // Limit headline length
          content: item.content ? item.content.substring(0, 300) : '', // Limit content length
          sentiment: item.sentiment || 'neutral',
          impact: item.impact || 'medium',
          source: item.source || 'X',
          url: finalUrl,
          tweet_id: item.tweet_id || null,
          username: item.username || null
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
  }

  /**
   * Map news items to chart timestamps for annotation positioning
   */
  mapNewsToChartData(newsItems, ohlcData) {
    if (!newsItems.length || !ohlcData.length) {
      return [];
    }

    const annotations = [];
    
    newsItems.forEach(newsItem => {
      const newsDate = new Date(newsItem.date);
      
      // Find the closest candle to this news item
      let closestCandle = null;
      let minTimeDiff = Infinity;
      
      ohlcData.forEach(candle => {
        const candleDate = new Date(candle.date);
        const timeDiff = Math.abs(candleDate.getTime() - newsDate.getTime());
        
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestCandle = candle;
        }
      });

      if (closestCandle) {
        annotations.push({
          date: closestCandle.date,
          price: closestCandle.high + (closestCandle.high * 0.02), // Position slightly above the candle
          news: newsItem,
          type: 'news-marker'
        });
      }
    });

    return annotations;
  }

  /**
   * Get news annotations for bias test chart data
   */
  async getNewsAnnotations(assetSymbol, assetName, ohlcData) {
    try {
      if (!ohlcData || ohlcData.length === 0) {
        return [];
      }

      // Get date range from chart data
      const dates = ohlcData.map(candle => new Date(candle.date)).sort((a, b) => a - b);
      const startDate = dates[0].toISOString();
      const endDate = dates[dates.length - 1].toISOString();

      // Fetch news for this timeframe
      const newsItems = await this.fetchNewsForTimeframe(assetSymbol, assetName, startDate, endDate);
      
      // Map news to chart annotations
      const annotations = this.mapNewsToChartData(newsItems, ohlcData);
      
      logger.log(`Generated ${annotations.length} news annotations for ${assetSymbol}`);
      return annotations;

    } catch (error) {
      logger.error(`Error generating news annotations for ${assetSymbol}:`, error);
      return [];
    }
  }

  /**
   * Test different approaches to get real URLs from Grok
   */
  async testUrlApproaches() {
    try {
      logger.log('Testing different URL approaches with Grok...');
      
      // Approach 1: Ask Grok about its capabilities
      const capabilityTest = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'user',
              content: 'Do you have access to real-time X (Twitter) data and can you provide actual URLs to specific tweets? Please be honest about your capabilities.'
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      const capabilityData = await capabilityTest.json();
      logger.log('Grok capabilities response:', capabilityData.choices[0]?.message?.content);

      // Approach 2: Try asking for a specific recent tweet format
      const urlTest = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'user',
              content: `Find a recent tweet about Bitcoin from the last 7 days. If you can access real X data, return the actual tweet URL in this format: {"tweet_url": "https://x.com/username/status/1234567890", "content": "actual tweet content", "author": "@username", "date": "2024-01-01T12:00:00Z"}. If you cannot access real URLs, please say "NO_REAL_URLS_AVAILABLE"`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      const urlData = await urlTest.json();
      logger.log('URL test response:', urlData.choices[0]?.message?.content);

      return {
        capability: capabilityData.choices[0]?.message?.content,
        urlTest: urlData.choices[0]?.message?.content
      };

    } catch (error) {
      logger.error('URL approach test error:', error);
      return { error: error.message };
    }
  }

  /**
   * Test the XAI API connection and response
   */
  async testConnection() {
    try {
      logger.log('Testing XAI API connection...');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [
            {
              role: 'user',
              content: 'Return a simple JSON array with one test news item about Bitcoin. Format: [{"date":"2024-01-01T12:00:00Z","headline":"Test","content":"Test content","sentiment":"neutral","impact":"low","source":"Test","url":null}]'
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`XAI API test failed: ${response.status} ${response.statusText} - ${errorText}`);
        return { success: false, error: `${response.status}: ${errorText}` };
      }

      const data = await response.json();
      logger.log('XAI API test response:', JSON.stringify(data, null, 2));
      
      return { success: true, data };
    } catch (error) {
      logger.error('XAI API test error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
    logger.log('XAI news cache cleared');
  }
}

// Export singleton instance
const xaiNewsService = new XAINewsService();
export default xaiNewsService;
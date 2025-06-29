// pages/api/test-xai.js
import xaiNewsService from '../../lib/xai-news-service';
import logger from '../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.log('Deep investigation of XAI API URL capabilities...');
    
    // Test 1: Basic connection
    const testResult = await xaiNewsService.testConnection();
    
    if (!testResult.success) {
      return res.status(500).json({
        error: 'XAI API test failed',
        details: testResult.error
      });
    }

    // Test 2: Deep URL capability investigation
    logger.log('Testing URL approaches...');
    const urlApproaches = await xaiNewsService.testUrlApproaches();

    // Test 3: News fetching with detailed logging
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    
    logger.log('Testing news fetch for Bitcoin with full response logging...');
    const newsTest = await xaiNewsService.fetchNewsForTimeframe('btc', 'Bitcoin', startDate, endDate);
    
    return res.status(200).json({
      success: true,
      investigation: {
        connectionTest: testResult,
        urlCapabilities: urlApproaches,
        newsTest: {
          itemCount: newsTest.length,
          items: newsTest, // Return ALL items for deep investigation
          timeRange: { startDate, endDate }
        }
      },
      analysis: {
        urlsFound: newsTest.filter(item => item.url).length,
        workingUrls: newsTest.filter(item => item.url && item.url.startsWith('http')).length,
        sources: [...new Set(newsTest.map(item => item.source))],
        urlPatterns: newsTest.map(item => item.url).filter(Boolean)
      }
    });

  } catch (error) {
    logger.error('Test endpoint error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
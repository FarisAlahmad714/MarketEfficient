// pages/api/og-image.js
const { HTMLImageGenerator } = require('../../lib/htmlImageGenerator');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let generator;
  
  try {
    const { 
      type = 'test_result',
      title = 'Test Result',
      description = 'MarketEfficient Test Result',
      score = '80',
      percentage = '80',
      testType = 'Bias Test',
      asset,
      username,
      platform = 'twitter',
      completedAt = new Date().toISOString()
    } = req.query;

    // Create test result data that matches your TestResultsCards component
    const testData = {
      type: testType,
      percentage: parseInt(percentage),
      score: parseInt(score),
      totalPoints: Math.round(parseInt(score) * 100 / parseInt(percentage)),
      testType,
      asset,
      completedAt,
      subType: req.query.subType
    };

    generator = new HTMLImageGenerator();
    const imageBuffer = await generator.generateTestResultCard(platform, testData, false);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.setHeader('Content-Length', imageBuffer.length);

    return res.send(imageBuffer);

  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Fallback: return your logo instead of failing
    try {
      const fs = require('fs');
      const path = require('path');
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.webp');
      const logoBuffer = fs.readFileSync(logoPath);
      
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(logoBuffer);
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }
  } finally {
    // Clean up browser resources
    if (generator) {
      try {
        await generator.close();
      } catch (cleanupError) {
        console.error('Error closing generator:', cleanupError);
      }
    }
  }
}
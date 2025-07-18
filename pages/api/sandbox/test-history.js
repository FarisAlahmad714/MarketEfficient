// Test endpoint to debug history API
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxTrade from '../../../models/SandboxTrade';
import SandboxTransaction from '../../../models/SandboxTransaction';

async function testHistoryHandler(req, res) {
  try {
    await connectDB();
    
    const userId = req.user.id;
    console.log('Test History API - User ID:', userId);
    
    // Test 1: Can we count documents?
    try {
      const tradeCount = await SandboxTrade.countDocuments({ userId, status: 'closed' });
      console.log('Trade count successful:', tradeCount);
    } catch (e) {
      console.error('Trade count failed:', e);
      return res.status(500).json({ error: 'Trade count failed', details: e.toString() });
    }
    
    // Test 2: Can we fetch a single trade?
    try {
      const singleTrade = await SandboxTrade.findOne({ userId, status: 'closed' }).lean();
      console.log('Single trade fetch successful:', singleTrade ? 'Found' : 'Not found');
    } catch (e) {
      console.error('Single trade fetch failed:', e);
      return res.status(500).json({ error: 'Single trade fetch failed', details: e.toString() });
    }
    
    // Test 3: Can we fetch limited trades?
    try {
      const trades = await SandboxTrade.find({ userId, status: 'closed' })
        .limit(5)
        .lean();
      console.log('Limited trades fetch successful:', trades.length);
    } catch (e) {
      console.error('Limited trades fetch failed:', e);
      return res.status(500).json({ error: 'Limited trades fetch failed', details: e.toString() });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'All tests passed',
      userId 
    });
    
  } catch (error) {
    console.error('Test History API error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      details: error.toString()
    });
  }
}

export default createApiHandler({
  handler: composeMiddleware(requireAuth, testHistoryHandler),
  allowedMethods: ['GET']
});
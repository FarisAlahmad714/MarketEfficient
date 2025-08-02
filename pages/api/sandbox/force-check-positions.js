// pages/api/sandbox/force-check-positions.js
// API endpoint to force an immediate check of all positions

import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import { verifyToken } from '../../../middleware/auth';

// Import CommonJS modules
const stopLossMonitor = require('../../../lib/sandbox-stop-loss-monitor');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Verify user is authenticated
    const userId = await verifyToken(req);
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    await connectDB();

    // Check if monitor is running
    const status = stopLossMonitor.getStatus();
    if (!status.isRunning) {
      // Start the monitor if it's not running
      console.log('[Force Check] Monitor not running, starting it...');
      await stopLossMonitor.start();
      
      // Wait a moment for it to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Force an immediate check
    console.log('[Force Check] Triggering immediate position check...');
    const startTime = Date.now();
    
    try {
      await stopLossMonitor.checkAllOpenTrades();
      const duration = Date.now() - startTime;
      
      return res.status(200).json({
        success: true,
        message: 'Position check completed successfully',
        duration: `${duration}ms`,
        monitorStatus: stopLossMonitor.getStatus()
      });
    } catch (checkError) {
      console.error('[Force Check] Error during position check:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Position check failed',
        details: checkError.message
      });
    }

  } catch (error) {
    console.error('[Force Check API] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to force check positions',
      details: error.message
    });
  }
}
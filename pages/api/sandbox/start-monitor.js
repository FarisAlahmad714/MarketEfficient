// API endpoint to start the stop loss monitor
import jwt from 'jsonwebtoken';
import stopLossMonitor from '../../../lib/sandbox-stop-loss-monitor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if monitor is already running
    const currentStatus = stopLossMonitor.getStatus();
    if (currentStatus.isRunning) {
      return res.status(200).json({ 
        success: true, 
        message: 'Monitor already running',
        status: currentStatus
      });
    }
    
    // Start the monitor
    console.log('[API] Starting stop loss monitor...');
    await stopLossMonitor.start();
    
    // Get updated status
    const newStatus = stopLossMonitor.getStatus();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Monitor started successfully',
      status: newStatus
    });
    
  } catch (error) {
    console.error('Error in start-monitor:', error);
    return res.status(500).json({ 
      error: 'Failed to start monitor', 
      details: error.message 
    });
  }
}
// API endpoint to force check positions for SL/TP
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
    
    // Force check all positions
    console.log('[API] Force checking positions for SL/TP...');
    await stopLossMonitor.checkAllOpenTrades();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Position check completed',
      monitorStatus: stopLossMonitor.getStatus()
    });
    
  } catch (error) {
    console.error('Error in force-check-positions:', error);
    return res.status(500).json({ 
      error: 'Failed to check positions', 
      details: error.message 
    });
  }
}
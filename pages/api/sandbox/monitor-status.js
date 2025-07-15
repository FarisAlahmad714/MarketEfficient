// API endpoint to check stop loss monitor status
import jwt from 'jsonwebtoken';
import stopLossMonitor from '../../../lib/sandbox-stop-loss-monitor';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    
    // Get monitor status
    const status = stopLossMonitor.getStatus();
    
    return res.status(200).json(status);
    
  } catch (error) {
    console.error('Error in monitor-status:', error);
    return res.status(500).json({ 
      error: 'Failed to get monitor status', 
      details: error.message 
    });
  }
}
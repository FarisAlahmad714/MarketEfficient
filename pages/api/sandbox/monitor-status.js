// API endpoint to check stop loss monitor status
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import SandboxTrade from '../../../models/SandboxTrade';

// Import CommonJS modules
const stopLossMonitor = require('../../../lib/sandbox-stop-loss-monitor');
const { marketDataWS } = require('../../../lib/websocket-server');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    await connectDB();
    
    // Get monitor status
    const monitorStatus = stopLossMonitor.getStatus();
    
    // Get WebSocket status
    const wsStatus = {
      connectedClients: marketDataWS.getConnectedClientsCount(),
      currentPrices: Object.keys(marketDataWS.getCurrentPrices()).length,
      isInitialized: marketDataWS.isInitialized
    };
    
    // Get open trades that should be monitored
    const openTradesWithConditions = await SandboxTrade.countDocuments({
      status: 'open',
      $or: [
        { 'stopLoss.price': { $exists: true, $ne: null } },
        { 'takeProfit.price': { $exists: true, $ne: null } },
        { 'leverage': { $gt: 1 } }
      ]
    });
    
    // Get user's open trades with SL/TP
    const userOpenTrades = await SandboxTrade.find({
      userId,
      status: 'open',
      $or: [
        { 'stopLoss.price': { $exists: true, $ne: null } },
        { 'takeProfit.price': { $exists: true, $ne: null } },
        { 'leverage': { $gt: 1 } }
      ]
    }).select('symbol side leverage entryPrice stopLoss takeProfit');
    
    // Get current prices for user's symbols
    const userSymbols = [...new Set(userOpenTrades.map(t => t.symbol))];
    const currentPrices = marketDataWS.getCurrentPrices();
    
    return res.status(200).json({
      stopLossMonitor: {
        ...monitorStatus,
        lastCheckTimeAgo: monitorStatus.lastCheckTime ? 
          `${Math.round((Date.now() - new Date(monitorStatus.lastCheckTime).getTime()) / 1000)}s ago` : 
          'Never'
      },
      webSocket: wsStatus,
      trades: {
        totalMonitored: openTradesWithConditions,
        userTradesCount: userOpenTrades.length,
        userTrades: userOpenTrades.map(trade => ({
          symbol: trade.symbol,
          side: trade.side,
          leverage: trade.leverage,
          entryPrice: trade.entryPrice,
          stopLoss: trade.stopLoss?.price,
          takeProfit: trade.takeProfit?.price,
          currentPrice: currentPrices[trade.symbol]?.value || 'N/A'
        }))
      },
      serverTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in monitor-status:', error);
    return res.status(500).json({ 
      error: 'Failed to get monitor status', 
      details: error.message 
    });
  }
}
// pages/api/sandbox/admin-reset.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
import User from '../../../models/User';

async function adminResetHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;

  try {
    // Check if user is admin
    const user = await User.findById(userId);
    console.log('Admin reset check - User:', user?.email, 'isAdmin:', user?.isAdmin);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Admin privileges required' 
      });
    }

    // Get user's sandbox portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId });
    
    if (!portfolio) {
      return res.status(404).json({ 
        error: 'Portfolio not found',
        message: 'No sandbox portfolio found for user' 
      });
    }

    // Close all open trades first
    const openTrades = await SandboxTrade.find({ userId, status: 'open' });
    
    for (const trade of openTrades) {
      trade.status = 'cancelled';
      trade.closeReason = 'admin_reset';
      trade.exitTime = new Date();
      await trade.save();
    }

    // Reset portfolio to initial state
    portfolio.balance = 10000; // Reset to 10k SENSES
    portfolio.totalReturn = 0;
    portfolio.maxDrawdown = 0;
    portfolio.totalTrades = 0;
    portfolio.winningTrades = 0;
    portfolio.losingTrades = 0;
    portfolio.averageWin = 0;
    portfolio.averageLoss = 0;
    portfolio.winRate = 0;
    portfolio.profitFactor = 1;
    portfolio.sharpeRatio = 0;
    portfolio.maxConsecutiveLosses = 0;
    portfolio.currentStreak = 0;
    portfolio.lastResetDate = new Date();
    portfolio.isAdmin = true; // Mark as admin for unlimited trading
    
    await portfolio.save();

    res.status(200).json({
      success: true,
      message: 'Portfolio reset to 10,000 SENSES successfully',
      portfolio: {
        balance: portfolio.balance,
        totalReturn: portfolio.totalReturn,
        isAdmin: portfolio.isAdmin,
        resetDate: portfolio.lastResetDate
      }
    });

  } catch (error) {
    console.error('Error resetting admin portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to reset portfolio',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, adminResetHandler),
  { methods: ['POST'] }
);
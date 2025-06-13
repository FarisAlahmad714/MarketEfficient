// pages/api/sandbox/portfolio.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
import { getPriceSimulator } from '../../../lib/priceSimulation';

async function portfolioHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  
  try {
    // Check if user is admin first
    const User = require('../../../models/User');
    const user = await User.findById(userId);
    const isAdmin = user?.isAdmin || false;
    
    // Get or create sandbox portfolio
    let portfolio = await SandboxPortfolio.findOne({ userId });
    
    if (!portfolio) {
      if (isAdmin) {
        // Auto-create and unlock for admins
        portfolio = new SandboxPortfolio({ 
          userId,
          unlocked: true,
          unlockedAt: new Date()
        });
        await portfolio.save();
      } else {
        return res.status(404).json({ 
          error: 'Sandbox not unlocked',
          message: 'Complete required tests to unlock sandbox trading' 
        });
      }
    }
    
    // Auto-unlock for admins
    if (isAdmin && !portfolio.unlocked) {
      portfolio.unlocked = true;
      portfolio.unlockedAt = new Date();
      await portfolio.save();
    }
    
    // Check if portfolio is unlocked
    if (!portfolio.unlocked) {
      return res.status(403).json({ 
        error: 'Sandbox not unlocked',
        message: 'Complete required tests to unlock sandbox trading' 
      });
    }
    
    // Check if monthly reset is due
    if (portfolio.isResetDue()) {
      // Close all open trades before reset
      await SandboxTrade.updateMany(
        { userId, status: 'open' },
        { 
          status: 'closed',
          closeReason: 'monthly_reset',
          exitTime: new Date(),
          realizedPnL: 0 // Reset trades don't affect P&L
        }
      );
      
      // Perform reset
      portfolio.performMonthlyReset();
      await portfolio.save();
    }
    
    // Get open positions
    const openTrades = await SandboxTrade.find({ 
      userId, 
      status: 'open' 
    }).sort({ entryTime: -1 });
    
    // Get recent closed trades
    const recentTrades = await SandboxTrade.find({ 
      userId, 
      status: 'closed' 
    })
    .sort({ exitTime: -1 })
    .limit(10)
    .select('symbol side entryPrice exitPrice realizedPnL leverage entryTime exitTime duration pnlPercentage');
    
    // Calculate total unrealized P&L from open positions with real-time prices
    const priceSimulator = getPriceSimulator();
    let totalUnrealizedPnL = 0;
    
    // Update each open trade with current market price
    for (const trade of openTrades) {
      const currentPrice = priceSimulator.getPrice(trade.symbol);
      
      // Calculate P&L based on position side
      let pnl = 0;
      if (trade.side === 'long') {
        pnl = (currentPrice - trade.entryPrice) * trade.quantity;
      } else { // short
        pnl = (trade.entryPrice - currentPrice) * trade.quantity;
      }
      
      // Update trade object with current data
      trade.currentPrice = currentPrice;
      trade.unrealizedPnL = pnl;
      trade.pnlPercentage = (pnl / (trade.entryPrice * trade.quantity)) * 100;
      
      totalUnrealizedPnL += pnl;
      
      // Save updated trade data
      await SandboxTrade.findByIdAndUpdate(trade._id, {
        currentPrice: currentPrice,
        unrealizedPnL: pnl,
        pnlPercentage: trade.pnlPercentage
      });
    }
    
    // Calculate current portfolio value
    const currentValue = portfolio.balance + totalUnrealizedPnL;
    
    // Update portfolio metrics
    portfolio.updatePerformanceMetrics();
    await portfolio.save();
    
    // Get trading statistics
    const tradingStats = await SandboxTrade.getUserTradingStats(userId);
    
    const response = {
      // Portfolio Overview
      balance: portfolio.balance,
      currentValue: currentValue,
      totalPnL: currentValue - portfolio.initialBalance,
      totalPnLPercentage: ((currentValue - portfolio.initialBalance) / portfolio.initialBalance) * 100,
      
      // Performance Metrics
      performance: {
        totalReturn: portfolio.totalReturn,
        highWaterMark: portfolio.highWaterMark,
        maxDrawdown: portfolio.maxDrawdown,
        sharpeRatio: portfolio.sharpeRatio,
        winRate: portfolio.winRate,
        profitFactor: portfolio.profitFactor
      },
      
      // Trading Statistics
      trading: {
        totalTrades: portfolio.totalTrades,
        winningTrades: portfolio.winningTrades,
        losingTrades: portfolio.losingTrades,
        averageWin: portfolio.averageWin,
        averageLoss: portfolio.averageLoss,
        lastTradeAt: portfolio.lastTradeAt
      },
      
      // Open Positions
      openPositions: openTrades.map(trade => ({
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        leverage: trade.leverage,
        entryPrice: trade.entryPrice,
        currentPrice: trade.currentPrice,
        unrealizedPnL: trade.unrealizedPnL,
        pnlPercentage: trade.pnlPercentage,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        entryTime: trade.entryTime,
        marginUsed: trade.marginUsed,
        confidenceLevel: trade.preTradeAnalysis.confidenceLevel,
        entryReason: trade.preTradeAnalysis.entryReason.substring(0, 100) + '...'
      })),
      
      // Recent Trades
      recentTrades: recentTrades.map(trade => ({
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        realizedPnL: trade.realizedPnL,
        pnlPercentage: trade.pnlPercentage,
        leverage: trade.leverage,
        duration: trade.duration,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime
      })),
      
      // Risk Management
      riskLimits: {
        maxPositionSize: portfolio.maxPositionSize,
        maxLeverage: portfolio.maxLeverage,
        dailyLossLimit: portfolio.dailyLossLimit,
        availableMargin: portfolio.balance - openTrades.reduce((sum, trade) => sum + trade.marginUsed, 0)
      },
      
      // Reset Information
      reset: {
        nextResetDate: portfolio.monthlyResetDate,
        resetCount: portfolio.resetCount,
        daysUntilReset: Math.ceil((portfolio.monthlyResetDate - new Date()) / (1000 * 60 * 60 * 24))
      },
      
      // Educational Progress
      unlockProgress: {
        biasTests: portfolio.unlockProgress.biasTests,
        chartExams: portfolio.unlockProgress.chartExams
      }
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching sandbox portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, portfolioHandler),
  { methods: ['GET'] }
);
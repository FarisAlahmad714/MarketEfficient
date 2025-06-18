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
    
    // Get pending orders
    const pendingOrders = await SandboxTrade.find({ 
      userId, 
      status: 'pending' 
    }).sort({ entryTime: -1 });
    
    // Get recent closed trades
    const recentTrades = await SandboxTrade.find({ 
      userId, 
      status: 'closed' 
    })
    .sort({ exitTime: -1 })
    .limit(20)
    .select('symbol side entryPrice exitPrice realizedPnL leverage entryTime exitTime duration pnlPercentage marginUsed quantity');
    
    // Calculate total unrealized P&L from open positions with real-time prices
    const priceSimulator = getPriceSimulator();
    let totalUnrealizedPnL = 0;
    
    // Update each open trade with current market price
    for (const trade of openTrades) {
      // Use the same real market price function as close-trade
      let currentPrice = await getCurrentMarketPrice(trade.symbol);
      
      // Fallback to price simulator if real price fails
      if (!currentPrice) {
        currentPrice = priceSimulator.getPrice(trade.symbol);
      }
      
      // Calculate P&L using standardized calculation
      const { calculateUnrealizedPnL, calculatePnLPercentage } = require('../../../lib/pnl-calculator');
      let pnl = 0;
      try {
        pnl = calculateUnrealizedPnL({
          side: trade.side,
          entryPrice: trade.entryPrice,
          currentPrice: currentPrice,
          quantity: trade.quantity,
          leverage: trade.leverage,
          totalFees: trade.fees?.total || 0
        });
      } catch (error) {
        console.error('Error calculating P&L for trade:', trade._id, error);
        pnl = 0;
      }
      
      // Update trade object with current data
      trade.currentPrice = Math.round(currentPrice * 100) / 100;
      trade.unrealizedPnL = pnl;
      trade.pnlPercentage = calculatePnLPercentage(pnl, trade.marginUsed);
      
      totalUnrealizedPnL += pnl;
      
      // Save updated trade data
      await SandboxTrade.findByIdAndUpdate(trade._id, {
        currentPrice: trade.currentPrice,
        unrealizedPnL: trade.unrealizedPnL
      });
    }
    
    // Calculate current portfolio value
    const currentValue = Math.round((portfolio.balance + totalUnrealizedPnL) * 100) / 100;
    
    // Update high water mark if current value is higher
    if (currentValue > portfolio.highWaterMark) {
      portfolio.highWaterMark = currentValue;
    }
    
    // Update portfolio metrics
    portfolio.updatePerformanceMetrics();
    await portfolio.save();
    
    // Get trading statistics
    const tradingStats = await SandboxTrade.getUserTradingStats(userId);
    
    const response = {
      // Portfolio Overview - currentValue is the main balance users should see
      balance: Math.round(portfolio.balance * 100) / 100, // Base balance (without unrealized P&L)
      currentValue: currentValue, // Main balance to display (includes unrealized P&L)
      totalPnL: Math.round((currentValue - portfolio.initialBalance) * 100) / 100,
      totalPnLPercentage: Math.round(((currentValue - portfolio.initialBalance) / portfolio.initialBalance) * 100 * 100) / 100,
      
      // Performance Metrics - Use real-time calculated stats
      performance: {
        totalReturn: Math.round(((currentValue - portfolio.initialBalance) / portfolio.initialBalance) * 100 * 100) / 100,
        highWaterMark: Math.max(portfolio.highWaterMark, currentValue),
        maxDrawdown: portfolio.maxDrawdown,
        sharpeRatio: portfolio.sharpeRatio,
        winRate: tradingStats.winRate,
        profitFactor: tradingStats.profitFactor,
        bestReturn: tradingStats.bestReturn
      },
      
      // Trading Statistics - Use real-time calculated stats
      trading: {
        totalTrades: tradingStats.totalTrades,
        winningTrades: tradingStats.winningTrades,
        losingTrades: tradingStats.losingTrades,
        averageWin: tradingStats.averageWin,
        averageLoss: tradingStats.averageLoss,
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
      
      // Pending Orders
      pendingOrders: pendingOrders.map(order => ({
        id: order._id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        leverage: order.leverage,
        limitPrice: order.limitPrice,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        orderTime: order.entryTime,
        marginReserved: order.marginUsed,
        confidenceLevel: order.preTradeAnalysis.confidenceLevel,
        entryReason: order.preTradeAnalysis.entryReason.substring(0, 100) + '...'
      })),
      
      // Recent Trades
      recentTrades: recentTrades.map(trade => ({
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        realizedPnL: trade.realizedPnL,
        pnlPercentage: trade.pnlPercentage,
        leverage: trade.leverage,
        marginUsed: trade.marginUsed,
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
      },
      
      // Admin Status
      isAdmin: isAdmin
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

// Helper function to get real market prices (same as close-trade.js)
async function getCurrentMarketPrice(symbol) {
  try {
    const TWELVEDATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '08f0aa1220414f6ba782aaae2cd515e3';
    
    if (!TWELVEDATA_API_KEY) {
      throw new Error('Twelvedata API key not configured');
    }
    
    // Convert symbol to API format (BTC -> BTC/USD)
    const { getAPISymbol } = require('../../../lib/sandbox-constants');
    const apiSymbol = getAPISymbol(symbol);
    const url = `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVEDATA_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.price && !isNaN(parseFloat(data.price))) {
      return parseFloat(data.price);
    }
    
    return null;
    
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, portfolioHandler),
  { methods: ['GET'] }
);
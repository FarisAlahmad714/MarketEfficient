// pages/api/sandbox/portfolio.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
const { getPriceSimulator } = require('../../../lib/priceSimulation');

async function portfolioHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  
  // Get pagination parameters from query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
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
    
    // Check if quarterly top-up is due and apply automatically (ONLY for unlocked sandbox)
    if (portfolio.unlocked && portfolio.isTopUpDue()) {
      await portfolio.performQuarterlyTopUp();
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
    
    // Get recent closed trades with pagination
    const totalTrades = await SandboxTrade.countDocuments({ 
      userId, 
      status: 'closed' 
    });
    
    const recentTrades = await SandboxTrade.find({ 
      userId, 
      status: 'closed' 
    })
    .sort({ exitTime: -1 })
    .skip(skip)
    .limit(limit)
    .select('symbol side entryPrice exitPrice realizedPnL leverage entryTime exitTime duration pnlPercentage marginUsed quantity fees preTradeAnalysis closeReason');
    
    // Get transaction history with pagination
    const SandboxTransaction = require('../../../models/SandboxTransaction');
    const totalTransactions = await SandboxTransaction.countDocuments({ userId });
    
    const transactions = await SandboxTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
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
    
    // Calculate total deposits to exclude from performance calculations
    const totalDeposits = transactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate returns based on trading performance only (excluding deposits)
    const tradingBaseAmount = portfolio.initialBalance; // Original 10,000 SENSES
    const tradingCurrentValue = currentValue - totalDeposits; // Current value minus deposits
    const tradingPnL = tradingCurrentValue - tradingBaseAmount; // P&L from trading only
    const tradingPnLPercentage = tradingBaseAmount > 0 ? (tradingPnL / tradingBaseAmount) * 100 : 0;
    
    const response = {
      // Portfolio Overview - currentValue is the main balance users should see
      balance: Math.round(portfolio.balance * 100) / 100, // Base balance (without unrealized P&L)
      currentValue: currentValue, // Main balance to display (includes unrealized P&L)
      totalPnL: Math.round(tradingPnL * 100) / 100, // Trading P&L only (excluding deposits)
      totalPnLPercentage: Math.round(tradingPnLPercentage * 100) / 100, // Trading performance only
      totalDeposits: totalDeposits, // Track total deposits separately
      
      // Performance Metrics - Use trading-only performance (excluding deposits)
      performance: {
        totalReturn: Math.round(tradingPnLPercentage * 100) / 100, // Trading performance only
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
        exitTime: trade.exitTime,
        preTradeAnalysis: trade.preTradeAnalysis,
        entryReason: trade.preTradeAnalysis?.entryReason || null,
        closeReason: trade.closeReason || null
      })),
      
      // Transaction History
      transactions: transactions.map(tx => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
        metadata: tx.metadata,
        formattedAmount: tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`,
        category: tx.type === 'deposit' ? 'Deposit' : 
                  tx.type === 'withdrawal' ? 'Withdrawal' :
                  tx.type === 'trade_profit' || tx.type === 'trade_loss' ? 'Trading' :
                  tx.type === 'fee' ? 'Fee' : 'Other'
      })),
      
      // Risk Management
      riskLimits: {
        maxPositionSize: portfolio.maxPositionSize,
        // maxLeverage removed - now using asset-specific leverage from sandbox-constants.js
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
      isAdmin: isAdmin,
      
      // Pagination info
      pagination: {
        page: page,
        limit: limit,
        totalTrades: totalTrades,
        totalTransactions: totalTransactions,
        totalItems: totalTrades + totalTransactions,
        totalPages: Math.ceil((totalTrades + totalTransactions) / limit),
        hasMore: (totalTrades + totalTransactions) > (page * limit)
      }
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch portfolio',
      message: error.message 
    });
  }
}

// Helper function to get real market prices (same as close-trade.js)
async function getCurrentMarketPrice(symbol) {
  try {
    const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
    
    if (!TWELVE_DATA_API_KEY) {
      throw new Error('Twelvedata API key not configured');
    }
    
    // Convert symbol to API format (BTC -> BTC/USD)
    const { getAPISymbol } = require('../../../lib/sandbox-constants-data');
    const apiSymbol = getAPISymbol(symbol);
    const url = `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`;
    
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
    return null;
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, portfolioHandler),
  { methods: ['GET'] }
);
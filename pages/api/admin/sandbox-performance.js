// pages/api/admin/sandbox-performance.js
import { requireAuth, requireAdmin } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
import User from '../../../models/User';

async function sandboxPerformanceHandler(req, res) {
  await connectDB();
  
  try {
    // Fetch all sandbox portfolios with user information
    const portfolios = await SandboxPortfolio.find({})
      .populate('userId', 'name email username createdAt')
      .sort({ balance: -1 })
      .lean();

    // Get trading statistics for each user
    const performanceData = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          // Get trading stats for this user
          const tradingStats = await SandboxTrade.getUserTradingStats(portfolio.userId._id);
          
          // Get recent trades count
          const recentTrades = await SandboxTrade.countDocuments({
            userId: portfolio.userId._id,
            entryTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          });

          // Calculate performance metrics
          const totalQuarterlyDeposits = portfolio.topUpCount * 10000;
          const adjustedCurrentValue = portfolio.balance - totalQuarterlyDeposits;
          const realTradingReturn = ((adjustedCurrentValue - portfolio.initialBalance) / portfolio.initialBalance) * 100;

          return {
            userId: portfolio.userId._id,
            userInfo: {
              name: portfolio.userId.name,
              email: portfolio.userId.email,
              username: portfolio.userId.username,
              joinedDate: portfolio.userId.createdAt
            },
            portfolio: {
              unlocked: portfolio.unlocked,
              unlockedAt: portfolio.unlockedAt,
              balance: portfolio.balance,
              initialBalance: portfolio.initialBalance,
              currentValue: portfolio.balance, // Real current value with positions would be calculated separately
              totalQuarterlyDeposits,
              adjustedBalance: adjustedCurrentValue,
              realTradingReturn,
              topUpCount: portfolio.topUpCount,
              lastTopUpDate: portfolio.lastTopUpDate,
              nextTopUpDate: portfolio.nextTopUpDate,
              highWaterMark: portfolio.highWaterMark,
              maxDrawdown: portfolio.maxDrawdown
            },
            trading: {
              totalTrades: tradingStats.totalTrades,
              winningTrades: tradingStats.winningTrades,
              losingTrades: tradingStats.losingTrades,
              winRate: tradingStats.winRate,
              averageWin: tradingStats.averageWin,
              averageLoss: tradingStats.averageLoss,
              profitFactor: tradingStats.profitFactor,
              bestReturn: tradingStats.bestReturn,
              recentTradesCount: recentTrades,
              lastTradeAt: portfolio.lastTradeAt
            },
            risk: {
              maxPositionSize: portfolio.maxPositionSize,
              dailyLossLimit: portfolio.dailyLossLimit
            },
            education: {
              biasTests: portfolio.unlockProgress.biasTests,
              chartExams: portfolio.unlockProgress.chartExams,
              unlockEligible: portfolio.unlockProgress.biasTests.completed >= portfolio.unlockProgress.biasTests.required &&
                             portfolio.unlockProgress.chartExams.completed >= portfolio.unlockProgress.chartExams.required
            }
          };
        } catch (error) {
          return {
            userId: portfolio.userId._id,
            userInfo: {
              name: portfolio.userId.name,
              email: portfolio.userId.email,
              username: portfolio.userId.username,
              joinedDate: portfolio.userId.createdAt
            },
            portfolio: {
              unlocked: portfolio.unlocked,
              balance: portfolio.balance,
              initialBalance: portfolio.initialBalance,
              error: 'Failed to load trading stats'
            },
            trading: { totalTrades: 0, winRate: 0, error: true },
            risk: {},
            education: {}
          };
        }
      })
    );

    // Get all trades for advanced analytics
    const allTrades = await SandboxTrade.find({})
      .populate('userId', 'name')
      .lean();

    // Asset Trading Frequency Analytics
    const assetFrequency = {};
    allTrades.forEach(trade => {
      const asset = trade.symbol;
      if (!assetFrequency[asset]) {
        assetFrequency[asset] = {
          symbol: asset,
          totalTrades: 0,
          uniqueTraders: new Set(),
          totalVolume: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        };
      }
      assetFrequency[asset].totalTrades++;
      assetFrequency[asset].uniqueTraders.add(trade.userId._id.toString());
      assetFrequency[asset].totalVolume += trade.positionSize || 0;
      
      if (trade.exitPrice && trade.entryPrice) {
        const isWin = trade.direction === 'long' 
          ? trade.exitPrice > trade.entryPrice 
          : trade.exitPrice < trade.entryPrice;
        if (isWin) assetFrequency[asset].wins++;
        else assetFrequency[asset].losses++;
      }
    });

    // Convert Set to count and calculate win rates
    const topTradedAssets = Object.values(assetFrequency)
      .map(asset => ({
        ...asset,
        uniqueTraders: asset.uniqueTraders.size,
        winRate: asset.wins + asset.losses > 0 
          ? (asset.wins / (asset.wins + asset.losses)) * 100 
          : 0
      }))
      .sort((a, b) => b.totalTrades - a.totalTrades)
      .slice(0, 10);

    // Trading Mistakes Analysis
    const tradingMistakes = {
      overleveraging: 0,
      noStopLoss: 0,
      quickExits: 0,
      largePositionSizes: 0,
      totalMistakes: 0
    };

    allTrades.forEach(trade => {
      let hasMistake = false;
      
      // Check for overleveraging (position size > 20% of balance)
      if (trade.positionSize && trade.accountBalance && 
          trade.positionSize > trade.accountBalance * 0.2) {
        tradingMistakes.overleveraging++;
        hasMistake = true;
      }
      
      // Check for no stop loss
      if (!trade.stopLoss) {
        tradingMistakes.noStopLoss++;
        hasMistake = true;
      }
      
      // Check for quick exits (less than 5 minutes)
      if (trade.exitTime && trade.entryTime && 
          (new Date(trade.exitTime) - new Date(trade.entryTime)) < 5 * 60 * 1000) {
        tradingMistakes.quickExits++;
        hasMistake = true;
      }
      
      // Check for large position sizes relative to account
      if (trade.leverage && trade.leverage > 10) {
        tradingMistakes.largePositionSizes++;
        hasMistake = true;
      }
      
      if (hasMistake) tradingMistakes.totalMistakes++;
    });

    // Time to Profitability Analysis
    const profitabilityTimeline = [];
    const userProfitability = {};
    
    // Group trades by user and calculate cumulative P&L over time
    portfolios.forEach(portfolio => {
      const userId = portfolio.userId._id.toString();
      const userTrades = allTrades
        .filter(t => t.userId._id.toString() === userId)
        .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
      
      let cumulativePnL = 0;
      let firstProfitableDate = null;
      let timeToProfit = null;
      
      userTrades.forEach(trade => {
        if (trade.realizedPnL) {
          cumulativePnL += trade.realizedPnL;
          if (cumulativePnL > 0 && !firstProfitableDate) {
            firstProfitableDate = trade.exitTime || trade.entryTime;
            timeToProfit = firstProfitableDate 
              ? (new Date(firstProfitableDate) - new Date(portfolio.userId.createdAt)) / (1000 * 60 * 60 * 24)
              : null;
          }
        }
      });
      
      if (userTrades.length > 0) {
        userProfitability[userId] = {
          isProfitable: cumulativePnL > 0,
          timeToProfit: timeToProfit, // in days
          totalPnL: cumulativePnL,
          tradeCount: userTrades.length
        };
      }
    });

    // Calculate average time to profitability
    const profitableUsers = Object.values(userProfitability)
      .filter(u => u.isProfitable && u.timeToProfit !== null);
    
    const avgTimeToProfit = profitableUsers.length > 0
      ? profitableUsers.reduce((sum, u) => sum + u.timeToProfit, 0) / profitableUsers.length
      : null;

    // Calculate summary statistics
    const summary = {
      totalUsers: performanceData.length,
      unlockedUsers: performanceData.filter(p => p.portfolio.unlocked).length,
      activeTraders: performanceData.filter(p => p.trading.totalTrades > 0).length,
      totalBalance: performanceData.reduce((sum, p) => sum + p.portfolio.balance, 0),
      totalQuarterlyDeposits: performanceData.reduce((sum, p) => sum + (p.portfolio.totalQuarterlyDeposits || 0), 0),
      totalRealPnL: performanceData.reduce((sum, p) => sum + (p.portfolio.adjustedBalance - p.portfolio.initialBalance), 0),
      averageReturn: performanceData.length > 0 
        ? performanceData.reduce((sum, p) => sum + (p.portfolio.realTradingReturn || 0), 0) / performanceData.length 
        : 0,
      totalTrades: performanceData.reduce((sum, p) => sum + p.trading.totalTrades, 0),
      averageWinRate: performanceData.length > 0 
        ? performanceData.reduce((sum, p) => sum + p.trading.winRate, 0) / performanceData.length 
        : 0
    };

    // Add new analytics data
    const analytics = {
      topTradedAssets,
      tradingMistakes,
      profitability: {
        profitableUsersCount: profitableUsers.length,
        totalActiveUsers: Object.keys(userProfitability).length,
        profitabilityRate: Object.keys(userProfitability).length > 0 
          ? (profitableUsers.length / Object.keys(userProfitability).length) * 100 
          : 0,
        averageTimeToProfit: avgTimeToProfit,
        userBreakdown: {
          profitable: profitableUsers.length,
          unprofitable: Object.values(userProfitability).filter(u => !u.isProfitable).length,
          noTrades: portfolios.length - Object.keys(userProfitability).length
        }
      }
    };

    res.status(200).json({
      success: true,
      summary,
      analytics,
      performanceData: performanceData.sort((a, b) => b.portfolio.realTradingReturn - a.portfolio.realTradingReturn)
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch sandbox performance data',
      message: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, requireAdmin, sandboxPerformanceHandler),
  { methods: ['GET'] }
);
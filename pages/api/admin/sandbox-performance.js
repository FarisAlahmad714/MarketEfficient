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

    res.status(200).json({
      success: true,
      summary,
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
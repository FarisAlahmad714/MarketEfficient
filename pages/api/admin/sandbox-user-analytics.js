// pages/api/admin/sandbox-user-analytics.js
import { requireAuth, requireAdmin } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
import User from '../../../models/User';

async function sandboxUserAnalyticsHandler(req, res) {
  await connectDB();
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user info
    const user = await User.findById(userId).select('name email username').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId }).lean();
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get all trades for this user
    const trades = await SandboxTrade.find({ userId })
      .sort({ entryTime: -1 })
      .lean();

    // Asset Trading Frequency for this user
    const assetFrequency = {};
    trades.forEach(trade => {
      const asset = trade.symbol;
      if (!assetFrequency[asset]) {
        assetFrequency[asset] = {
          symbol: asset,
          totalTrades: 0,
          totalVolume: 0,
          totalPnL: 0,
          winRate: 0,
          wins: 0,
          losses: 0,
          avgHoldingTime: 0,
          holdingTimes: []
        };
      }
      assetFrequency[asset].totalTrades++;
      assetFrequency[asset].totalVolume += trade.positionSize || 0;
      assetFrequency[asset].totalPnL += trade.realizedPnL || 0;
      
      if (trade.exitPrice && trade.entryPrice) {
        const isWin = trade.direction === 'long' 
          ? trade.exitPrice > trade.entryPrice 
          : trade.exitPrice < trade.entryPrice;
        if (isWin) assetFrequency[asset].wins++;
        else assetFrequency[asset].losses++;
        
        // Calculate holding time
        if (trade.exitTime && trade.entryTime) {
          const holdingTime = (new Date(trade.exitTime) - new Date(trade.entryTime)) / (1000 * 60); // in minutes
          assetFrequency[asset].holdingTimes.push(holdingTime);
        }
      }
    });

    // Calculate win rates and average holding times
    const favoriteAssets = Object.values(assetFrequency)
      .map(asset => ({
        ...asset,
        winRate: asset.wins + asset.losses > 0 
          ? (asset.wins / (asset.wins + asset.losses)) * 100 
          : 0,
        avgHoldingTime: asset.holdingTimes.length > 0
          ? asset.holdingTimes.reduce((a, b) => a + b, 0) / asset.holdingTimes.length
          : 0,
        holdingTimes: undefined // Remove raw data
      }))
      .sort((a, b) => b.totalTrades - a.totalTrades);

    // Trading Mistakes Analysis for this user
    const tradingMistakes = {
      overleveraging: [],
      noStopLoss: [],
      quickExits: [],
      highLeverage: [],
      totalMistakes: 0
    };

    trades.forEach(trade => {
      const mistakes = [];
      
      // Check for overleveraging (position size > 20% of balance)
      if (trade.positionSize && trade.accountBalance && 
          trade.positionSize > trade.accountBalance * 0.2) {
        mistakes.push('overleveraging');
        tradingMistakes.overleveraging.push({
          symbol: trade.symbol,
          date: trade.entryTime,
          positionSize: trade.positionSize,
          accountBalance: trade.accountBalance,
          percentage: (trade.positionSize / trade.accountBalance * 100).toFixed(1)
        });
      }
      
      // Check for no stop loss
      if (!trade.stopLoss) {
        mistakes.push('noStopLoss');
        tradingMistakes.noStopLoss.push({
          symbol: trade.symbol,
          date: trade.entryTime,
          pnl: trade.realizedPnL
        });
      }
      
      // Check for quick exits (less than 5 minutes)
      if (trade.exitTime && trade.entryTime && 
          (new Date(trade.exitTime) - new Date(trade.entryTime)) < 5 * 60 * 1000) {
        mistakes.push('quickExit');
        tradingMistakes.quickExits.push({
          symbol: trade.symbol,
          date: trade.entryTime,
          holdingTime: (new Date(trade.exitTime) - new Date(trade.entryTime)) / 1000, // seconds
          pnl: trade.realizedPnL
        });
      }
      
      // Check for high leverage
      if (trade.leverage && trade.leverage > 10) {
        mistakes.push('highLeverage');
        tradingMistakes.highLeverage.push({
          symbol: trade.symbol,
          date: trade.entryTime,
          leverage: trade.leverage,
          pnl: trade.realizedPnL
        });
      }
      
      if (mistakes.length > 0) {
        tradingMistakes.totalMistakes++;
      }
    });

    // Time to Profitability Analysis
    let cumulativePnL = 0;
    let firstProfitableDate = null;
    let timeToProfit = null;
    const profitabilityJourney = [];
    
    // Sort trades by entry time for chronological analysis
    const chronologicalTrades = [...trades].sort((a, b) => 
      new Date(a.entryTime) - new Date(b.entryTime)
    );
    
    chronologicalTrades.forEach(trade => {
      if (trade.realizedPnL) {
        cumulativePnL += trade.realizedPnL;
        profitabilityJourney.push({
          date: trade.exitTime || trade.entryTime,
          cumulativePnL,
          tradeSymbol: trade.symbol,
          tradePnL: trade.realizedPnL
        });
        
        if (cumulativePnL > 0 && !firstProfitableDate) {
          firstProfitableDate = trade.exitTime || trade.entryTime;
          timeToProfit = firstProfitableDate 
            ? (new Date(firstProfitableDate) - new Date(user.createdAt || portfolio.createdAt)) / (1000 * 60 * 60 * 24)
            : null;
        }
      }
    });

    // Trading patterns
    const tradingPatterns = {
      averageTradeSize: trades.length > 0 
        ? trades.reduce((sum, t) => sum + (t.positionSize || 0), 0) / trades.length 
        : 0,
      favoriteTimeOfDay: analyzeTradingTimes(trades),
      winStreaks: calculateStreaks(trades, 'win'),
      lossStreaks: calculateStreaks(trades, 'loss'),
      bestPerformingAsset: favoriteAssets[0] || null,
      worstPerformingAsset: [...favoriteAssets].sort((a, b) => a.totalPnL - b.totalPnL)[0] || null
    };

    res.status(200).json({
      success: true,
      user: {
        ...user,
        portfolio: {
          balance: portfolio.balance,
          unlocked: portfolio.unlocked,
          initialBalance: portfolio.initialBalance,
          realTradingReturn: ((portfolio.balance - portfolio.initialBalance) / portfolio.initialBalance) * 100
        }
      },
      analytics: {
        favoriteAssets,
        tradingMistakes,
        profitability: {
          isProfitable: cumulativePnL > 0,
          timeToProfit,
          totalPnL: cumulativePnL,
          profitabilityJourney: profitabilityJourney.slice(-20) // Last 20 points for chart
        },
        tradingPatterns,
        summary: {
          totalTrades: trades.length,
          totalVolume: trades.reduce((sum, t) => sum + (t.positionSize || 0), 0),
          winRate: trades.length > 0 ? (trades.filter(t => t.realizedPnL > 0).length / trades.length * 100) : 0,
          avgWin: trades.filter(t => t.realizedPnL > 0).reduce((sum, t) => sum + t.realizedPnL, 0) / Math.max(1, trades.filter(t => t.realizedPnL > 0).length),
          avgLoss: Math.abs(trades.filter(t => t.realizedPnL < 0).reduce((sum, t) => sum + t.realizedPnL, 0) / Math.max(1, trades.filter(t => t.realizedPnL < 0).length))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      message: error.message 
    });
  }
}

// Helper function to analyze trading times
function analyzeTradingTimes(trades) {
  const hourCounts = {};
  trades.forEach(trade => {
    const hour = new Date(trade.entryTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const favoriteHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return favoriteHour ? {
    hour: parseInt(favoriteHour[0]),
    count: favoriteHour[1],
    timeString: `${favoriteHour[0]}:00 - ${(parseInt(favoriteHour[0]) + 1) % 24}:00`
  } : null;
}

// Helper function to calculate win/loss streaks
function calculateStreaks(trades, type) {
  let maxStreak = 0;
  let currentStreak = 0;
  
  trades.forEach(trade => {
    if (trade.realizedPnL) {
      const isWin = trade.realizedPnL > 0;
      if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
  });
  
  return maxStreak;
}

export default createApiHandler(
  composeMiddleware(requireAuth, requireAdmin, sandboxUserAnalyticsHandler),
  { methods: ['GET'] }
);
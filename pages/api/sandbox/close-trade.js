// pages/api/sandbox/close-trade.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

async function closeTradeHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { tradeId, closeType = 'manual' } = req.body;

  try {
    // Validate required fields
    if (!tradeId) {
      return res.status(400).json({ 
        error: 'Missing trade ID',
        message: 'Trade ID is required to close position' 
      });
    }

    // Find the trade
    const trade = await SandboxTrade.findOne({ 
      _id: tradeId, 
      userId, 
      status: 'open' 
    });

    if (!trade) {
      return res.status(404).json({ 
        error: 'Trade not found',
        message: 'Trade not found or already closed' 
      });
    }

    // Get user's portfolio
    const portfolio = await SandboxPortfolio.findOne({ 
      _id: trade.portfolioId,
      userId 
    });

    if (!portfolio) {
      return res.status(404).json({ 
        error: 'Portfolio not found',
        message: 'Associated portfolio not found' 
      });
    }

    // Get current market price
    const currentPrice = await getCurrentMarketPrice(trade.symbol);
    if (!currentPrice) {
      return res.status(500).json({ 
        error: 'Price unavailable',
        message: 'Unable to get current market price' 
      });
    }

    // Calculate exit price with slippage for market orders
    let exitPrice = currentPrice;
    if (closeType === 'manual') {
      // Add realistic slippage for manual closes (0.01%)
      const slippage = trade.side === 'long' ? 0.9999 : 1.0001;
      exitPrice = currentPrice * slippage;
    } else if (closeType === 'stop_loss' && trade.stopLoss?.price) {
      exitPrice = trade.stopLoss.price;
    } else if (closeType === 'take_profit' && trade.takeProfit?.price) {
      exitPrice = trade.takeProfit.price;
    }

    // Calculate exit fee (0.1% for market orders, 0.05% for limit orders)
    const exitFeeRate = 0.001; // 0.1% for closing
    const positionValue = exitPrice * trade.quantity;
    const exitFee = positionValue * exitFeeRate;

    // Calculate realized P&L
    const priceDiff = trade.side === 'long'
      ? exitPrice - trade.entryPrice
      : trade.entryPrice - exitPrice;
    
    const grossPnL = priceDiff * trade.quantity * trade.leverage;
    const realizedPnL = grossPnL - trade.fees.total - exitFee;

    // Close the trade
    trade.closeTrade(exitPrice, closeType);
    trade.fees.exit = exitFee;
    trade.fees.total += exitFee;
    trade.realizedPnL = realizedPnL;

    await trade.save();

    // Update portfolio
    // Add back the margin that was used
    portfolio.balance += trade.marginUsed;
    
    // Add/subtract the realized P&L
    portfolio.balance += realizedPnL;
    
    // Update trading statistics
    if (realizedPnL > 0) {
      portfolio.winningTrades += 1;
      // Update average win
      const totalWins = portfolio.winningTrades;
      const currentTotalWinAmount = portfolio.averageWin * (totalWins - 1);
      portfolio.averageWin = (currentTotalWinAmount + realizedPnL) / totalWins;
    } else {
      portfolio.losingTrades += 1;
      // Update average loss
      const totalLosses = portfolio.losingTrades;
      const currentTotalLossAmount = Math.abs(portfolio.averageLoss) * (totalLosses - 1);
      portfolio.averageLoss = -((currentTotalLossAmount + Math.abs(realizedPnL)) / totalLosses);
    }

    // Update performance metrics
    portfolio.updatePerformanceMetrics();
    
    await portfolio.save();

    // Check for risk management triggers
    const riskAlerts = checkRiskAlerts(portfolio, trade, realizedPnL);

    // Prepare response
    const response = {
      success: true,
      trade: {
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        leverage: trade.leverage,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        realizedPnL: trade.realizedPnL,
        fees: trade.fees,
        status: trade.status,
        closeReason: trade.closeReason,
        duration: trade.duration,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime
      },
      portfolio: {
        balance: portfolio.balance,
        totalReturn: portfolio.totalReturn,
        winRate: portfolio.winRate,
        totalTrades: portfolio.totalTrades,
        winningTrades: portfolio.winningTrades,
        losingTrades: portfolio.losingTrades
      },
      riskAlerts
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error closing sandbox trade:', error);
    res.status(500).json({ 
      error: 'Failed to close trade',
      message: error.message 
    });
  }
}

async function getCurrentMarketPrice(symbol) {
  try {
    const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
    
    if (!TWELVEDATA_API_KEY) {
      throw new Error('Twelvedata API key not configured');
    }
    
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVEDATA_API_KEY}`;
    
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

function checkRiskAlerts(portfolio, trade, realizedPnL) {
  const alerts = [];
  
  // Check for consecutive losses
  if (realizedPnL < 0) {
    // Count recent consecutive losses
    const recentLosses = countConsecutiveLosses(portfolio);
    if (recentLosses >= 3) {
      alerts.push({
        type: 'consecutive_losses',
        severity: 'warning',
        message: `${recentLosses} consecutive losses detected. Consider taking a break or reviewing your strategy.`,
        suggestion: 'Review your recent trades and consider paper trading before risking more capital.'
      });
    }
  }
  
  // Check for large loss
  const lossPercentage = Math.abs(realizedPnL) / portfolio.balance * 100;
  if (realizedPnL < 0 && lossPercentage > 2) {
    alerts.push({
      type: 'large_loss',
      severity: 'high',
      message: `Large loss detected: ${lossPercentage.toFixed(1)}% of portfolio`,
      suggestion: 'Consider reducing position sizes and reviewing risk management rules.'
    });
  }
  
  // Check portfolio drawdown
  if (portfolio.maxDrawdown > 10) {
    alerts.push({
      type: 'high_drawdown',
      severity: 'high',
      message: `Portfolio drawdown: ${portfolio.maxDrawdown.toFixed(1)}%`,
      suggestion: 'Consider reducing risk or taking a break to preserve capital.'
    });
  }
  
  // Check win rate if enough trades
  if (portfolio.totalTrades >= 10 && portfolio.winRate < 30) {
    alerts.push({
      type: 'low_win_rate',
      severity: 'warning',
      message: `Low win rate: ${portfolio.winRate.toFixed(1)}%`,
      suggestion: 'Review your entry criteria and consider additional education.'
    });
  }
  
  return alerts;
}

function countConsecutiveLosses(portfolio) {
  // This is a simplified version - in a real implementation,
  // you'd query the recent trades to count consecutive losses
  return portfolio.losingTrades > portfolio.winningTrades ? 
    Math.min(portfolio.losingTrades, 5) : 0;
}

export default createApiHandler(
  composeMiddleware(requireAuth, closeTradeHandler),
  { methods: ['POST'] }
);
// pages/api/sandbox/close-trade.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

async function closeTradeHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const { tradeId, closeType = 'manual', partialPercentage = null } = req.body;

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

    // Handle partial close
    const isPartialClose = partialPercentage && partialPercentage > 0 && partialPercentage < 100;
    const closeQuantity = isPartialClose ? trade.quantity * (partialPercentage / 100) : trade.quantity;
    const originalQuantity = trade.quantity; // Store original quantity before modification
    
    // Calculate exit fee (0.1% for market orders, 0.05% for limit orders)
    const exitFeeRate = 0.001; // 0.1% for closing
    const positionValue = exitPrice * closeQuantity;
    const exitFee = positionValue * exitFeeRate;

    // Calculate realized P&L using standardized calculation
    const { calculatePartialClosePnL } = require('../../../lib/pnl-calculator');
    let realizedPnL = 0;
    let feesPaid = 0;
    
    try {
      const result = calculatePartialClosePnL({
        side: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: exitPrice,
        totalQuantity: originalQuantity,
        closeQuantity: closeQuantity,
        totalFees: trade.fees.total,
        exitFee: exitFee
      });
      realizedPnL = result.realizedPnL;
      feesPaid = result.feesPaid;
    } catch (error) {
      console.error('Error calculating partial close P&L:', error);
      // Fallback to basic calculation
      const priceDiff = trade.side === 'long'
        ? exitPrice - trade.entryPrice
        : trade.entryPrice - exitPrice;
      const grossPnL = priceDiff * closeQuantity;
      realizedPnL = grossPnL - (trade.fees.total * (closeQuantity / originalQuantity)) - exitFee;
      feesPaid = (trade.fees.total * (closeQuantity / originalQuantity)) + exitFee;
    }

    if (isPartialClose) {
      // Create a new trade record for the closed portion
      const SandboxTrade = require('../../../models/SandboxTrade');
      const closedPortion = new SandboxTrade({
        ...trade.toObject(),
        _id: undefined,
        quantity: closeQuantity,
        marginUsed: (trade.marginUsed * closeQuantity) / originalQuantity,
        exitPrice: exitPrice,
        exitTime: new Date(),
        status: 'closed',
        closeReason: closeType,
        realizedPnL: realizedPnL,
        fees: {
          entry: trade.fees.entry * (closeQuantity / originalQuantity),
          exit: exitFee,
          total: (trade.fees.total * (closeQuantity / originalQuantity)) + exitFee
        }
      });
      
      await closedPortion.save();
      
      // Update the original trade to reduce quantity and fees
      trade.quantity = trade.quantity - closeQuantity;
      trade.fees.total = trade.fees.total * (trade.quantity / originalQuantity);
      trade.marginUsed = trade.marginUsed * (trade.quantity / originalQuantity);
      
      await trade.save();
      
    } else {
      // Full close
      trade.closeTrade(exitPrice, closeType);
      trade.fees.exit = exitFee;
      trade.fees.total += exitFee;
      trade.realizedPnL = realizedPnL;
      
      await trade.save();
    }

    // Update portfolio - ONLY add/subtract the realized P&L
    // Note: Margin is virtual and should not be added back to balance
    // The balance already represents available funds, margin is just reserved
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
      isPartialClose,
      closeQuantity,
      trade: {
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        leverage: trade.leverage,
        entryPrice: trade.entryPrice,
        exitPrice: isPartialClose ? null : trade.exitPrice,
        realizedPnL: isPartialClose ? null : trade.realizedPnL,
        fees: trade.fees,
        status: trade.status,
        closeReason: isPartialClose ? null : trade.closeReason,
        duration: isPartialClose ? null : trade.duration,
        entryTime: trade.entryTime,
        exitTime: isPartialClose ? null : trade.exitTime
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
    // Try real API first with correct env var name
    const TWELVEDATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '08f0aa1220414f6ba782aaae2cd515e3';
    
    if (TWELVEDATA_API_KEY) {
      try {
        // Convert symbol to API format (BTC -> BTC/USD)
        const { getAPISymbol } = require('../../../lib/sandbox-constants');
        const apiSymbol = getAPISymbol(symbol);
        const url = `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVEDATA_API_KEY}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.price && !isNaN(parseFloat(data.price))) {
            return parseFloat(data.price);
          }
        }
      } catch (apiError) {
        console.log(`Real API failed for ${symbol}, using fallback:`, apiError.message);
      }
    }
    
    // CRITICAL: For closing trades, we MUST allow fallback
    // Users cannot be trapped in positions due to API failures
    console.log(`Using simulated price for closing ${symbol} position`);
    const { getPriceSimulator } = require('../../../lib/priceSimulation');
    const priceSimulator = getPriceSimulator();
    const simulatedPrice = priceSimulator.getPrice(symbol);
    
    if (simulatedPrice && simulatedPrice > 0) {
      return simulatedPrice;
    }
    
    throw new Error(`Unable to get any price for ${symbol}`);
    
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    
    // Last resort: Return a reasonable fallback price to allow position closing
    // This prevents users from being trapped in positions
    const fallbackPrices = {
      'BTC': 65000,
      'ETH': 3500,
      'SOL': 150,
      'ADA': 0.45,
      'LINK': 15,
      'AAPL': 220,
      'GOOGL': 170,
      'TSLA': 250,
      'AMZN': 180,
      'MSFT': 420,
      'SPY': 550,
      'QQQ': 460
    };
    
    console.log(`Using emergency fallback price for ${symbol}`);
    return fallbackPrices[symbol] || 100; // Default fallback
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
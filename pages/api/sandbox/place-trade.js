// pages/api/sandbox/place-trade.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';

async function placeTradeHandler(req, res) {
  await connectDB();
  
  const userId = req.user.id;
  const {
    symbol,
    side,
    type,
    quantity,
    leverage = 1,
    limitPrice,
    stopLoss,
    takeProfit,
    preTradeAnalysis
  } = req.body;

  try {
    // Get user's sandbox portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    
    if (!portfolio) {
      return res.status(403).json({ 
        error: 'Sandbox not unlocked',
        message: 'Complete required tests to unlock sandbox trading' 
      });
    }

    // Check if monthly reset is due
    if (portfolio.isResetDue()) {
      return res.status(400).json({ 
        error: 'Monthly reset required',
        message: 'Your portfolio needs to be reset for the new month' 
      });
    }

    // Validate required fields
    if (!symbol || !side || !type || !quantity || !preTradeAnalysis) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Symbol, side, type, quantity, and pre-trade analysis are required' 
      });
    }

    // Validate pre-trade analysis
    const analysisErrors = validatePreTradeAnalysis(preTradeAnalysis);
    if (analysisErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid pre-trade analysis',
        message: analysisErrors.join('. ')
      });
    }

    // Get current market price
    const currentPrice = await getCurrentMarketPrice(symbol);
    if (!currentPrice) {
      return res.status(400).json({ 
        error: 'Invalid symbol',
        message: 'Unable to get current price for symbol' 
      });
    }

    // Determine execution price
    let executionPrice = currentPrice;
    if (type === 'limit') {
      if (!limitPrice || limitPrice <= 0) {
        return res.status(400).json({ 
          error: 'Invalid limit price',
          message: 'Limit price must be greater than 0' 
        });
      }
      executionPrice = limitPrice;
    }

    // Calculate position value and margin
    const positionValue = executionPrice * quantity;
    const marginRequired = positionValue / leverage;

    // Validate position size limits
    const maxPositionSize = portfolio.balance * portfolio.maxPositionSize;
    if (positionValue > maxPositionSize) {
      return res.status(400).json({ 
        error: 'Position size too large',
        message: `Position size exceeds limit (${(portfolio.maxPositionSize * 100).toFixed(0)}% of portfolio)` 
      });
    }

    // Validate leverage
    if (leverage > portfolio.maxLeverage) {
      return res.status(400).json({ 
        error: 'Leverage too high',
        message: `Maximum leverage is ${portfolio.maxLeverage}x` 
      });
    }

    // Check available margin
    const openTrades = await SandboxTrade.find({ userId, status: 'open' });
    const usedMargin = openTrades.reduce((sum, trade) => sum + trade.marginUsed, 0);
    const availableMargin = portfolio.balance - usedMargin;

    if (marginRequired > availableMargin) {
      return res.status(400).json({ 
        error: 'Insufficient margin',
        message: `Available margin: ${availableMargin.toFixed(2)} SENSE$, Required: ${marginRequired.toFixed(2)} SENSE$` 
      });
    }

    // Simulate trading fees (0.1% for market orders, 0.05% for limit orders)
    const feeRate = type === 'market' ? 0.001 : 0.0005;
    const entryFee = positionValue * feeRate;

    // Create trade object
    const tradeData = {
      userId,
      portfolioId: portfolio._id,
      symbol: symbol.toUpperCase(),
      assetType: getAssetType(symbol),
      side,
      type,
      quantity,
      leverage,
      entryPrice: executionPrice,
      currentPrice: currentPrice,
      limitPrice: type === 'limit' ? limitPrice : null,
      positionValue,
      marginUsed: marginRequired,
      fees: {
        entry: entryFee,
        exit: 0,
        total: entryFee
      },
      preTradeAnalysis,
      entryTime: new Date()
    };

    // Add stop loss and take profit if provided
    if (stopLoss && stopLoss > 0) {
      tradeData.stopLoss = { price: stopLoss };
    }
    
    if (takeProfit && takeProfit > 0) {
      tradeData.takeProfit = { price: takeProfit };
    }

    // For market orders, execute immediately
    if (type === 'market') {
      // Add slippage simulation (0.01% for realistic execution)
      const slippage = side === 'long' ? 1.0001 : 0.9999;
      tradeData.entryPrice = currentPrice * slippage;
      tradeData.positionValue = tradeData.entryPrice * quantity;
      tradeData.marginUsed = tradeData.positionValue / leverage;
      
      // Recalculate fees with actual execution price
      tradeData.fees.entry = tradeData.positionValue * feeRate;
      tradeData.fees.total = tradeData.fees.entry;
      
      // Calculate initial unrealized P&L (should be close to zero after fees)
      const priceDiff = side === 'long' 
        ? currentPrice - tradeData.entryPrice
        : tradeData.entryPrice - currentPrice;
      tradeData.unrealizedPnL = (priceDiff * quantity * leverage) - tradeData.fees.total;
    }

    // Create the trade
    const trade = new SandboxTrade(tradeData);
    await trade.save();

    // Update portfolio statistics
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    
    // Update balance (subtract fees)
    portfolio.balance -= entryFee;
    
    await portfolio.save();

    // Prepare response
    const response = {
      success: true,
      trade: {
        id: trade._id,
        symbol: trade.symbol,
        side: trade.side,
        type: trade.type,
        quantity: trade.quantity,
        leverage: trade.leverage,
        entryPrice: trade.entryPrice,
        positionValue: trade.positionValue,
        marginUsed: trade.marginUsed,
        fees: trade.fees,
        status: trade.status,
        entryTime: trade.entryTime,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        unrealizedPnL: trade.unrealizedPnL
      },
      portfolio: {
        balance: portfolio.balance,
        availableMargin: portfolio.balance - usedMargin - marginRequired
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error placing sandbox trade:', error);
    res.status(500).json({ 
      error: 'Failed to place trade',
      message: error.message 
    });
  }
}

function validatePreTradeAnalysis(analysis) {
  const errors = [];
  
  if (!analysis.entryReason || analysis.entryReason.length < 10) {
    errors.push('Entry reason must be at least 10 characters');
  }
  
  if (!analysis.technicalAnalysis || analysis.technicalAnalysis.length < 10) {
    errors.push('Technical analysis must be at least 10 characters');
  }
  
  if (!analysis.riskManagement || analysis.riskManagement.length < 10) {
    errors.push('Risk management plan must be at least 10 characters');
  }
  
  if (!analysis.biasCheck || analysis.biasCheck.length < 10) {
    errors.push('Bias check must be at least 10 characters');
  }
  
  if (!analysis.confidenceLevel || analysis.confidenceLevel < 1 || analysis.confidenceLevel > 10) {
    errors.push('Confidence level must be between 1 and 10');
  }
  
  if (!analysis.expectedHoldTime || !['minutes', 'hours', 'days', 'weeks'].includes(analysis.expectedHoldTime)) {
    errors.push('Expected hold time must be specified');
  }
  
  if (!analysis.emotionalState || !['calm', 'excited', 'fearful', 'confident', 'uncertain'].includes(analysis.emotionalState)) {
    errors.push('Emotional state must be specified');
  }
  
  return errors;
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

function getAssetType(symbol) {
  const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD'];
  return cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
}

export default createApiHandler(
  composeMiddleware(requireAuth, placeTradeHandler),
  { methods: ['POST'] }
);
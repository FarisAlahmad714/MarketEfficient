// pages/api/sandbox/place-trade.js
import { requireAuth } from '../../../middleware/auth';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import { withCsrfProtect } from '../../../middleware/csrf';
import connectDB from '../../../lib/database';
import SandboxPortfolio from '../../../models/SandboxPortfolio';
import SandboxTrade from '../../../models/SandboxTrade';
import { getPriceSimulator } from '../../../lib/priceSimulation';
import { validateTradeRequest } from '../../../lib/trading-validation';
import { validateAndDetectBias } from '../../../lib/sandbox-bias-detection.js';
import { 
  TradingError, 
  logTradingError, 
  handleDatabaseError, 
  formatErrorResponse 
} from '../../../lib/trading-error-handler';
import { adminSecurityValidator } from '../../../lib/admin-security';

async function placeTradeHandler(req, res) {
  console.log('[PLACE-TRADE] Starting trade placement...');
  const startTime = Date.now();
  
  await connectDB();
  console.log('[PLACE-TRADE] DB connected in', Date.now() - startTime, 'ms');
  
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
    // Comprehensive input validation
    const validation = validateTradeRequest({
      symbol,
      side,
      type,
      quantity,
      leverage,
      limitPrice,
      stopLoss,
      takeProfit
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      });
    }

    // Use validated data
    const validatedData = validation.data;

    // Get user's sandbox portfolio
    const portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    
    if (!portfolio) {
      return res.status(403).json({ 
        error: 'Sandbox not unlocked',
        message: 'Complete required tests to unlock sandbox trading' 
      });
    }

    // Check if quarterly top-up is due and apply it automatically (sandbox already validated as unlocked)
    if (portfolio.isTopUpDue()) {
      console.log(`Quarterly top-up due for user ${userId}, adding 10,000 SENSES`);
      await portfolio.performQuarterlyTopUp();
      await portfolio.save();
      console.log(`Top-up completed. New balance: ${portfolio.balance} SENSES`);
    }

    // Pre-trade analysis validation
    console.log('[PLACE-TRADE] Checking pre-trade analysis at', Date.now() - startTime, 'ms');
    if (!preTradeAnalysis || !preTradeAnalysis.entryReason) {
      return res.status(400).json({ 
        error: 'Missing pre-trade analysis',
        message: 'Entry reason is required for educational purposes' 
      });
    }

    console.log('[PLACE-TRADE] Running bias detection at', Date.now() - startTime, 'ms');
    const biasAnalysis = validateAndDetectBias(preTradeAnalysis);
    console.log('[PLACE-TRADE] Bias detection completed at', Date.now() - startTime, 'ms');
    
    if (!biasAnalysis.isValid) {
      return res.status(400).json({ 
        error: 'Analysis validation failed',
        message: biasAnalysis.errors ? biasAnalysis.errors.join('. ') : 'Severe trading biases detected.',
        biasDetection: biasAnalysis.biasDetection,
        blockers: biasAnalysis.blockers,
        code: biasAnalysis.code
      });
    }

    // Get current market price
    let currentPrice;
    try {
      console.log('[PLACE-TRADE] Fetching market price at', Date.now() - startTime, 'ms');
      currentPrice = await getCurrentMarketPrice(validatedData.symbol);
      console.log('[PLACE-TRADE] Market price fetched at', Date.now() - startTime, 'ms');
      if (!currentPrice) {
        throw new Error(`No price data available for ${validatedData.symbol}`);
      }
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: 'Real-time price unavailable',
        message: `Cannot execute trade for ${validatedData.symbol}. Real market data is required for trading.`
      });
    }

    // Final validation with current price and portfolio balance
    const finalValidation = validateTradeRequest({
      symbol: validatedData.symbol,
      side: validatedData.side,
      type: validatedData.type,
      quantity: validatedData.quantity,
      leverage: validatedData.leverage,
      limitPrice: validatedData.limitPrice,
      stopLoss: validatedData.stopLoss,
      takeProfit: validatedData.takeProfit,
      currentPrice: currentPrice,
      portfolioBalance: portfolio.balance
    });

    if (!finalValidation.isValid) {
      await logTradingError(
        new TradingError(
          `Final validation failed: ${finalValidation.errors.map(e => e.message).join(', ')}`,
          'FINAL_VALIDATION_FAILED',
          'medium',
          { validationErrors: finalValidation.errors }
        ),
        userId,
        'place_trade_final_validation'
      );

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: finalValidation.errors
      });
    }

    // Determine execution price
    let executionPrice = currentPrice;
    if (validatedData.type === 'limit') {
      executionPrice = validatedData.limitPrice;
    }

    // Calculate position value and margin using validated data
    const basePositionValue = executionPrice * validatedData.quantity;
    const positionValue = basePositionValue * validatedData.leverage; // Total exposure with leverage
    const marginRequired = basePositionValue; // Actual money required from balance

    // Check if user is admin
    let isAdmin = false;
    try {
      const User = require('../../../models/User');
      const user = await User.findById(userId);
      isAdmin = user?.isAdmin || false;
    } catch (error) {
      // Continue with regular user limits if admin check fails
      console.error('Admin check failed:', error);
    }
    
    // Apply enhanced security checks for admins, regular limits for users
    if (isAdmin) {
      // Comprehensive admin security validation
      const adminValidation = await adminSecurityValidator.validateAdminTrade(userId, {
        symbol: validatedData.symbol,
        side: validatedData.side,
        quantity: validatedData.quantity,
        leverage: validatedData.leverage,
        positionValue,
        portfolioBalance: portfolio.balance
      }, req.body.adminJustification);

      if (!adminValidation.allowed) {
        await logTradingError(
          new TradingError(
            `Admin trade blocked by security validation: ${adminValidation.warnings.join(', ')}`,
            'ADMIN_TRADE_BLOCKED',
            'critical',
            { adminValidation, positionValue, portfolioBalance: portfolio.balance }
          ),
          userId,
          'admin_trade_security_block'
        );

        return res.status(403).json({
          success: false,
          error: 'Admin trade blocked by security controls',
          details: adminValidation.warnings,
          requiresApproval: adminValidation.requiresApproval
        });
      }

      if (adminValidation.warnings.length > 0) {
        await logTradingError(
          new TradingError(
            `Admin trade with security warnings: ${adminValidation.warnings.join(', ')}`,
            'ADMIN_TRADE_WARNING',
            'high',
            { adminValidation, positionValue, portfolioBalance: portfolio.balance }
          ),
          userId,
          'admin_trade_security_warning'
        );
      }
    } else {
      // Regular user limits
      const maxPositionSize = portfolio.balance * (portfolio.maxPositionSize || 0.25);
      if (positionValue > maxPositionSize) {
        const error = new TradingError(
          `Position size too large: ${positionValue.toFixed(2)} SENSES exceeds limit of ${maxPositionSize.toFixed(2)} SENSES`,
          'POSITION_SIZE_EXCEEDED',
          'medium',
          { positionValue, maxPositionSize, balancePercent: (portfolio.maxPositionSize || 0.25) * 100 }
        );
        await logTradingError(error, userId, 'place_trade_position_limit');
        
        return res.status(400).json({ 
          error: 'Position size too large',
          message: `Position size exceeds limit (${((portfolio.maxPositionSize || 0.25) * 100).toFixed(0)}% of portfolio)` 
        });
      }
    }

    // Validate asset-specific leverage
    const { getMaxLeverage } = require('../../../lib/sandbox-constants-data');
    const maxLeverageForAsset = getMaxLeverage(validatedData.symbol);
    
    if (validatedData.leverage > maxLeverageForAsset) {
      const error = new TradingError(
        `Leverage too high: ${validatedData.leverage}x exceeds maximum ${maxLeverageForAsset}x for ${validatedData.symbol}`,
        'LEVERAGE_EXCEEDED',
        'medium',
        { requestedLeverage: validatedData.leverage, maxLeverage: maxLeverageForAsset, symbol: validatedData.symbol }
      );
      await logTradingError(error, userId, 'place_trade_leverage');
      
      return res.status(400).json({ 
        error: 'Leverage too high',
        message: `Maximum leverage for ${validatedData.symbol} is ${maxLeverageForAsset}x` 
      });
    }

    // Check available margin with error handling
    let openTrades, usedMargin, availableMargin;
    try {
      openTrades = await SandboxTrade.find({ userId, status: 'open' });
      usedMargin = openTrades.reduce((sum, trade) => sum + trade.marginUsed, 0);
      availableMargin = portfolio.balance - usedMargin;
    } catch (error) {
      await handleDatabaseError('fetch_open_trades', error, userId, {
        operation: 'place_trade_margin_check'
      });
      return res.status(500).json(formatErrorResponse(error));
    }

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
      biasAnalysisResults: {
        qualityScore: biasAnalysis.biasDetection.qualityScore,
        technicalFactors: biasAnalysis.biasDetection.technicalFactors,
        detectedBiases: biasAnalysis.warnings || [],
        tradingRelevance: biasAnalysis.biasDetection.tradingRelevance
      },
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
      const basePositionValue = tradeData.entryPrice * quantity;
      tradeData.positionValue = basePositionValue * leverage; // Leveraged exposure
      tradeData.marginUsed = basePositionValue; // Actual margin from balance
      tradeData.status = 'open';
      
      // Recalculate fees with actual execution price
      tradeData.fees.entry = tradeData.positionValue * feeRate;
      tradeData.fees.total = tradeData.fees.entry;
      
      // Calculate initial unrealized P&L using standardized calculation
      const { calculateUnrealizedPnL } = require('../../../lib/pnl-calculator');
      try {
        tradeData.unrealizedPnL = calculateUnrealizedPnL({
          side: side,
          entryPrice: tradeData.entryPrice,
          currentPrice: currentPrice,
          quantity: quantity,
          leverage: leverage,
          totalFees: tradeData.fees.total
        });
      } catch (error) {
        console.error('Error calculating initial unrealized P&L:', error);
        tradeData.unrealizedPnL = 0;
      }
    } else if (type === 'limit') {
      // For limit orders, create as pending
      tradeData.status = 'pending';
      tradeData.entryPrice = limitPrice;
      const basePositionValue = tradeData.entryPrice * quantity;
      tradeData.positionValue = basePositionValue * leverage; // Leveraged exposure
      tradeData.marginUsed = basePositionValue; // Actual margin from balance
      tradeData.unrealizedPnL = 0; // No P&L until filled
    }

    // Create the trade
    console.log('[PLACE-TRADE] Creating trade record at', Date.now() - startTime, 'ms');
    const trade = new SandboxTrade(tradeData);
    await trade.save();
    console.log('[PLACE-TRADE] Trade saved at', Date.now() - startTime, 'ms');

    // Update portfolio statistics
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    
    // Update balance (subtract fees)
    portfolio.balance -= entryFee;
    
    console.log('[PLACE-TRADE] Updating portfolio at', Date.now() - startTime, 'ms');
    await portfolio.save();
    console.log('[PLACE-TRADE] Portfolio updated at', Date.now() - startTime, 'ms');

    // Note: Badge checking removed from hot path for performance
    // TODO: Move badge checking to background job or separate endpoint

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
      },
      biasAnalysis: {
        qualityScore: biasAnalysis.biasDetection.qualityScore,
        warnings: biasAnalysis.warnings || [],
        tradingRelevance: biasAnalysis.biasDetection.tradingRelevance,
        technicalFactorsUsed: biasAnalysis.biasDetection.technicalFactors.length
      }
    };

    console.log('[PLACE-TRADE] Trade completed successfully in', Date.now() - startTime, 'ms');
    res.status(200).json(response);

  } catch (error) {
    console.error('[PLACE-TRADE] Error placing sandbox trade after', Date.now() - startTime, 'ms:', error);
    res.status(500).json({ 
      error: 'Failed to place trade',
      message: error.message 
    });
  }
}


async function getCurrentMarketPrice(symbol) {
  try {
    const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
    
    if (!TWELVE_DATA_API_KEY) {
      console.log(`Using simulated price for trade: ${symbol}`);
      const priceSimulator = getPriceSimulator();
      return priceSimulator.getPrice(symbol);
    }
    
    // Convert symbol to API format (BTC -> BTC/USD)
    const { getAPISymbol } = require('../../../lib/sandbox-constants-data');
    const apiSymbol = getAPISymbol(symbol);
    const url = `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`;
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`API failed, using simulated price for trade: ${symbol}`);
      const priceSimulator = getPriceSimulator();
      return priceSimulator.getPrice(symbol);
    }
    
    const data = await response.json();
    
    if (data.price && !isNaN(parseFloat(data.price))) {
      return parseFloat(data.price);
    }
    
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`Price fetch timeout for ${symbol}, using simulated data`);
    } else {
      console.log(`Error fetching price for ${symbol}, using simulated data:`, error.message);
    }
    const priceSimulator = getPriceSimulator();
    return priceSimulator.getPrice(symbol);
  }
}

// getMockPrice function removed - now using price simulator

function getAssetType(symbol) {
  const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD'];
  return cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
}

const handler = createApiHandler(
  composeMiddleware(requireAuth, withCsrfProtect, placeTradeHandler),
  { methods: ['POST'] }
);

// Add logging wrapper
export default async (req, res) => {
  console.log('🚀 PLACE-TRADE API CALLED at', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request body preview:', JSON.stringify(req.body || {}).substring(0, 100) + '...');
  
  try {
    console.log('🔄 Calling handler...');
    const result = await handler(req, res);
    console.log('✅ Handler completed');
    return result;
  } catch (error) {
    console.error('❌ Handler error:', error);
    throw error;
  }
};
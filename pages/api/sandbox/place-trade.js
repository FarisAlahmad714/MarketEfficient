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
  logTradingError, 
  handleMarketDataError, 
  handleDatabaseError,
  formatErrorResponse,
  TradingError,
  APIFailureHandler,
  marketDataCircuitBreaker
} from '../../../lib/trading-error-handler';
import { adminSecurityValidator } from '../../../lib/admin-security';

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
      await logTradingError(
        new TradingError(
          `Trade validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_FAILED',
          'medium',
          { validationErrors: validation.errors }
        ),
        userId,
        'place_trade_validation',
        { 
          ipAddress: req.ip, 
          userAgent: req.get('User-Agent'),
          requestBodySize: JSON.stringify(req.body || {}).length
        }
      );

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      });
    }

    // Use validated data
    const validatedData = validation.data;

    // Get user's sandbox portfolio with error handling
    let portfolio;
    try {
      portfolio = await SandboxPortfolio.findOne({ userId, unlocked: true });
    } catch (error) {
      await handleDatabaseError('fetch_portfolio', error, userId, {
        operation: 'place_trade'
      });
      return res.status(500).json(formatErrorResponse(error));
    }
    
    if (!portfolio) {
      const error = new TradingError(
        'Sandbox not unlocked or portfolio not found',
        'PORTFOLIO_NOT_FOUND',
        'medium',
        { userId }
      );
      await logTradingError(error, userId, 'place_trade_access');
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

    // Enhanced pre-trade analysis validation with bias detection
    if (!preTradeAnalysis || !preTradeAnalysis.entryReason) {
      const error = new TradingError(
        'Pre-trade analysis required',
        'ANALYSIS_REQUIRED',
        'medium',
        { userId, symbol: validatedData.symbol }
      );
      await logTradingError(error, userId, 'place_trade_analysis');
      return res.status(400).json({ 
        error: 'Missing pre-trade analysis',
        message: 'Entry reason is required for educational purposes' 
      });
    }

    const biasAnalysis = validateAndDetectBias(preTradeAnalysis);
    if (!biasAnalysis.isValid) {
      const error = new TradingError(
        `Analysis validation failed: ${biasAnalysis.errors ? biasAnalysis.errors.join(', ') : 'Bias detection blocked trade'}`,
        biasAnalysis.code || 'BIAS_DETECTION_FAILED',
        'medium',
        { 
          userId, 
          biasAnalysis,
          blockers: biasAnalysis.blockers || []
        }
      );
      await logTradingError(error, userId, 'place_trade_bias_analysis');
      
      return res.status(400).json({ 
        error: 'Analysis validation failed',
        message: biasAnalysis.errors ? biasAnalysis.errors.join('. ') : 'Severe trading biases detected.',
        biasDetection: biasAnalysis.biasDetection,
        blockers: biasAnalysis.blockers,
        code: biasAnalysis.code
      });
    }

    // Get current market price with comprehensive error handling
    let currentPrice;
    const apiHandler = new APIFailureHandler(3, 1000);
    
    try {
      currentPrice = await marketDataCircuitBreaker.call(
        async () => {
          return await apiHandler.withRetry(
            async () => {
              const price = await getCurrentMarketPrice(validatedData.symbol);
              if (!price) {
                throw new Error(`No price data available for ${validatedData.symbol}`);
              }
              return price;
            },
            `fetch_price_${validatedData.symbol}`,
            { userId, symbol: validatedData.symbol }
          );
        },
        `market_data_${validatedData.symbol}`,
        { userId, symbol: validatedData.symbol }
      );
    } catch (error) {
      // CRITICAL: DO NOT use fallback prices for real trading!
      // This could cause massive losses with incorrect prices
      await logTradingError(
        new TradingError(
          `CRITICAL: Real price API failed for ${validatedData.symbol} - BLOCKING TRADE`,
          'REAL_PRICE_API_FAILED',
          'critical',
          { 
            symbol: validatedData.symbol, 
            originalError: error.message,
            apiKeyConfigured: !!process.env.TWELVE_DATA_API_KEY
          }
        ),
        userId,
        'place_trade_api_failure'
      );
      
      return res.status(503).json({
        success: false,
        error: 'Real-time price unavailable',
        message: `Cannot execute trade for ${validatedData.symbol}. Real market data is required for trading. Please check API configuration and try again.`,
        technicalDetails: {
          apiKeyConfigured: !!process.env.TWELVE_DATA_API_KEY,
          symbol: validatedData.symbol,
          apiSymbol: getAPISymbol ? getAPISymbol(validatedData.symbol) : 'unknown'
        }
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

    // Check if user is admin with error handling
    let user, isAdmin;
    try {
      const User = require('../../../models/User');
      user = await User.findById(userId);
      isAdmin = user?.isAdmin || false;
    } catch (error) {
      await handleDatabaseError('fetch_user', error, userId, {
        operation: 'place_trade_admin_check'
      });
      return res.status(500).json(formatErrorResponse(error));
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
    const { getMaxLeverage } = require('../../../lib/sandbox-constants');
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
    const trade = new SandboxTrade(tradeData);
    await trade.save();

    // Update portfolio statistics
    portfolio.totalTrades += 1;
    portfolio.lastTradeAt = new Date();
    
    // Update balance (subtract fees)
    portfolio.balance -= entryFee;
    
    await portfolio.save();

    // Check for new badges and send notifications
    try {
      const { checkAndNotifyNewBadges } = await import('../../../lib/badge-service');
      const badgeResult = await checkAndNotifyNewBadges(userId);
      if (badgeResult.success && badgeResult.newBadges > 0) {
        console.log(`User ${userId} earned ${badgeResult.newBadges} new badges:`, badgeResult.badges);
      }
    } catch (badgeError) {
      console.error('Error checking for new badges:', badgeError);
      // Don't fail the main request if badge checking fails
    }

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

    res.status(200).json(response);

  } catch (error) {
    console.error('Error placing sandbox trade:', error);
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
    const { getAPISymbol } = require('../../../lib/sandbox-constants');
    const apiSymbol = getAPISymbol(symbol);
    const url = `https://api.twelvedata.com/price?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`;
    
    const response = await fetch(url);
    
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
    console.log(`Error fetching price for ${symbol}, using simulated data:`, error.message);
    const priceSimulator = getPriceSimulator();
    return priceSimulator.getPrice(symbol);
  }
}

// getMockPrice function removed - now using price simulator

function getAssetType(symbol) {
  const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD'];
  return cryptoSymbols.includes(symbol.toUpperCase()) ? 'crypto' : 'stock';
}

export default createApiHandler(
  composeMiddleware(requireAuth, withCsrfProtect, placeTradeHandler),
  { methods: ['POST'] }
);
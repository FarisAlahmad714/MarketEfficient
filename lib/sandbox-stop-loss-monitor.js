// lib/sandbox-stop-loss-monitor.js
// Automated Stop Loss and Take Profit Monitoring System for Sandbox Trading

const connectDB = require('./database');
const SandboxTrade = require('../models/SandboxTrade');
const SandboxPortfolio = require('../models/SandboxPortfolio');
const { getPriceSimulator } = require('./priceSimulation');

// Lazy load Notification model to avoid ES6 module issues
let Notification = null;
async function getNotificationModel() {
  if (!Notification) {
    const module = await import('../models/Notification.js');
    Notification = module.default;
  }
  return Notification;
}

class SandboxStopLossMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 5000; // Check every 5 seconds
    this.lastCheckTime = null;
  }

  async start() {
    if (this.isRunning) {
      console.log('[Stop Loss Monitor] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Stop Loss Monitor] Starting monitor with check interval:', this.checkInterval, 'ms');
    
    // Start the monitoring loop - don't await to avoid blocking
    setImmediate(() => {
      this.monitorLoop().catch(error => {
        console.error('[Stop Loss Monitor] Monitor loop error:', error);
        this.isRunning = false;
      });
    });
    
    // Do an immediate check on start after a short delay
    setTimeout(() => {
      console.log('[Stop Loss Monitor] Running initial check...');
      this.checkAllOpenTrades().catch(error => {
        console.error('[Stop Loss Monitor] Initial check error:', error);
      });
    }, 1000);
  }

  async stop() {
    this.isRunning = false;
  }

  async monitorLoop() {
    console.log('[Stop Loss Monitor] Monitor loop started');
    while (this.isRunning) {
      try {
        console.log(`[Stop Loss Monitor] Running check at ${new Date().toISOString()}`);
        await this.checkAllOpenTrades();
        this.lastCheckTime = new Date();
        
        // Wait for the next check interval
        console.log(`[Stop Loss Monitor] Next check in ${this.checkInterval/1000} seconds`);
        await this.sleep(this.checkInterval);
      } catch (error) {
        console.error('[Stop Loss Monitor] Error in monitor loop:', error);
        // Wait before retrying to avoid rapid error loops
        await this.sleep(5000);
      }
    }
    console.log('[Stop Loss Monitor] Monitor loop stopped');
  }

  async checkAllOpenTrades() {
    try {
      // Connecting to database...
      await connectDB();
      // Database connected
      
      // Get all open trades with stop loss or take profit set
      const openTrades = await SandboxTrade.find({
        status: 'open',
        $or: [
          { 'stopLoss.price': { $exists: true, $ne: null } },
          { 'takeProfit.price': { $exists: true, $ne: null } },
          { 'leverage': { $gt: 1 } } // Monitor leveraged positions for liquidation
        ]
      }).populate('userId');

      // Checking open trades

      if (openTrades.length === 0) {
        console.log('[Stop Loss Monitor] No open trades with SL/TP/leverage');
        return;
      }

      console.log(`[Stop Loss Monitor] Found ${openTrades.length} open trades to monitor`);

      // Get current market prices for all unique symbols
      const symbols = [...new Set(openTrades.map(trade => trade.symbol))];
      console.log(`[Stop Loss Monitor] Getting prices for symbols: ${symbols.join(', ')}`);
      const currentPrices = await this.getCurrentPrices(symbols);

      // Check each trade
      const executedTrades = [];
      for (const trade of openTrades) {
        const currentPrice = currentPrices[trade.symbol];
        // Checking position prices
        
        if (!currentPrice) {
          console.log(`[Stop Loss Monitor] No price found for ${trade.symbol}`);
          continue;
        }
        
        console.log(`[Stop Loss Monitor] Checking ${trade.symbol} ${trade.side} ${trade.leverage}x - Current: ${currentPrice}, Entry: ${trade.entryPrice}, SL: ${trade.stopLoss?.price}, TP: ${trade.takeProfit?.price}`);

        const shouldExecute = this.shouldExecuteTrade(trade, currentPrice);
        if (shouldExecute) {
          console.log(`[Stop Loss Monitor] Should execute ${trade.symbol} trade - Reason: ${shouldExecute.reason}`);
          try {
            await this.executeAutomaticClose(trade, shouldExecute.triggerPrice || currentPrice, shouldExecute.reason);
            executedTrades.push({
              symbol: trade.symbol,
              side: trade.side,
              reason: shouldExecute.reason,
              price: currentPrice
            });
            console.log(`[Stop Loss Monitor] Successfully closed ${trade.symbol} position`);
          } catch (error) {
            console.error(`[Stop Loss Monitor] Error executing close for ${trade.symbol}:`, error);
          }
        }
      }

      if (executedTrades.length > 0) {
      }

    } catch (error) {
      throw error;
    }
  }

  shouldExecuteTrade(trade, currentPrice) {
    // Check stop loss
    if (trade.stopLoss?.price) {
      const stopLossTriggered = trade.side === 'long' 
        ? currentPrice <= trade.stopLoss.price
        : currentPrice >= trade.stopLoss.price;
      
      if (stopLossTriggered) {
        return { reason: 'stop_loss', triggerPrice: trade.stopLoss.price };
      }
    }

    // Check take profit
    if (trade.takeProfit?.price) {
      const takeProfitTriggered = trade.side === 'long'
        ? currentPrice >= trade.takeProfit.price
        : currentPrice <= trade.takeProfit.price;
      
      if (takeProfitTriggered) {
        return { reason: 'take_profit', triggerPrice: trade.takeProfit.price };
      }
    }

    // Check liquidation (90% loss of margin for leveraged positions)
    if (trade.leverage > 1) {
      const liquidationPrice = this.calculateLiquidationPrice(trade);
      if (liquidationPrice) {
        const liquidationTriggered = trade.side === 'long'
          ? currentPrice <= liquidationPrice
          : currentPrice >= liquidationPrice;
        
        if (liquidationTriggered) {
          return { reason: 'liquidation', triggerPrice: liquidationPrice };
        }
      }
    }

    return null;
  }

  calculateLiquidationPrice(trade) {
    if (!trade || trade.leverage <= 1) return null;
    
    // Liquidation at 90% loss of margin
    const liquidationThreshold = 0.9;
    const priceMovementRatio = liquidationThreshold / trade.leverage;
    
    if (trade.side === 'long') {
      return trade.entryPrice * (1 - priceMovementRatio);
    } else {
      return trade.entryPrice * (1 + priceMovementRatio);
    }
  }

  async executeAutomaticClose(trade, currentPrice, reason) {
    try {
      // Calculate P&L using the same logic as manual close
      const { calculateUnrealizedPnL } = require('./pnl-calculator');
      
      const realizedPnL = calculateUnrealizedPnL({
        side: trade.side,
        entryPrice: trade.entryPrice,
        currentPrice: currentPrice,
        quantity: trade.quantity,
        leverage: trade.leverage,
        totalFees: trade.fees.total
      });

      // Calculate exit fee (0.1% for market orders)
      const exitFeeRate = 0.001;
      const exitFee = (currentPrice * trade.quantity * trade.leverage) * exitFeeRate;
      const finalPnL = realizedPnL - exitFee;

      // Update the trade ONLY if it's still open (atomic operation)
      const updatedTrade = await SandboxTrade.findOneAndUpdate(
        {
          _id: trade._id,
          status: 'open' // Critical: Only update if still open
        },
        {
          $set: {
            status: 'closed',
            exitPrice: currentPrice,
            exitTime: new Date(),
            realizedPnL: finalPnL,
            'fees.exit': exitFee,
            'fees.total': trade.fees.entry + exitFee,
            closeReason: reason,
            isAutomaticClose: true
          }
        },
        { new: true }
      );

      if (!updatedTrade) {
        // Trade was already closed by another process
        console.log(`[Stop Loss Monitor] Trade ${trade._id} already closed, skipping`);
        return null;
      }

      // Update portfolio balance
      const portfolio = await SandboxPortfolio.findOne({ userId: trade.userId });
      if (portfolio) {
        // ONLY add the realized P&L to balance
        // Note: Margin is virtual and should not be added back
        // The finalPnL already includes all fees
        portfolio.balance += finalPnL;
        
        // Update trade statistics
        if (finalPnL > 0) {
          portfolio.winningTrades = (portfolio.winningTrades || 0) + 1;
          // Update average win
          const totalWins = portfolio.winningTrades;
          const currentTotalWinAmount = portfolio.averageWin * (totalWins - 1);
          portfolio.averageWin = (currentTotalWinAmount + finalPnL) / totalWins;
        } else {
          portfolio.losingTrades = (portfolio.losingTrades || 0) + 1;
          // Update average loss
          const totalLosses = portfolio.losingTrades;
          const currentTotalLossAmount = Math.abs(portfolio.averageLoss) * (totalLosses - 1);
          portfolio.averageLoss = -((currentTotalLossAmount + Math.abs(finalPnL)) / totalLosses);
        }
        
        // Update performance metrics
        portfolio.updatePerformanceMetrics();
        
        await portfolio.save();
      }

      // Create notification for the user
      try {
        const NotificationModel = await getNotificationModel();
        
        const notificationData = {
          recipient: trade.userId,
          type: `trade_${reason}`,
          priority: reason === 'liquidation' ? 'urgent' : 'high',
          actionUrl: '/dashboard?tab=history',
          metadata: {
            tradeId: trade._id,
            symbol: trade.symbol,
            side: trade.side,
            entryPrice: trade.entryPrice,
            exitPrice: currentPrice,
            pnl: finalPnL,
            pnlPercentage: ((finalPnL / trade.marginUsed) * 100).toFixed(2),
            leverage: trade.leverage
          }
        };
        
        // Set notification title and message based on reason
        switch (reason) {
          case 'stop_loss':
            notificationData.title = `Stop Loss Triggered - ${trade.symbol}`;
            notificationData.message = `Your ${trade.side} position on ${trade.symbol} hit stop loss at ${currentPrice.toFixed(2)} SENSES. P&L: ${finalPnL > 0 ? '+' : ''}${finalPnL.toFixed(2)} SENSES`;
            break;
          case 'take_profit':
            notificationData.title = `Take Profit Reached! - ${trade.symbol}`;
            notificationData.message = `Your ${trade.side} position on ${trade.symbol} hit take profit at ${currentPrice.toFixed(2)} SENSES. Profit: +${finalPnL.toFixed(2)} SENSES`;
            break;
          case 'liquidation':
            notificationData.title = `⚠️ Position Liquidated - ${trade.symbol}`;
            notificationData.message = `Your ${trade.leverage}x ${trade.side} position on ${trade.symbol} was liquidated at ${currentPrice.toFixed(2)} SENSES. Loss: ${finalPnL.toFixed(2)} SENSES`;
            break;
        }
        
        await NotificationModel.createNotification(notificationData);
        console.log(`[Stop Loss Monitor] Notification sent for ${reason} on ${trade.symbol}`);
        
        // Send email notification if user has email notifications enabled
        try {
          const populatedUser = trade.userId;
          if (populatedUser && populatedUser.notifications?.email !== false && populatedUser.isVerified) {
            const { sendTradingEventEmail } = require('./email-service');
            
            const tradeEmailData = {
              symbol: trade.symbol,
              side: trade.side,
              entryPrice: trade.entryPrice,
              exitPrice: currentPrice,
              pnl: finalPnL,
              pnlPercentage: ((finalPnL / trade.marginUsed) * 100).toFixed(2),
              leverage: trade.leverage
            };
            
            await sendTradingEventEmail(populatedUser, tradeEmailData, reason);
            console.log(`[Stop Loss Monitor] Email sent for ${reason} on ${trade.symbol}`);
          }
        } catch (emailError) {
          console.error('[Stop Loss Monitor] Failed to send email:', emailError);
          // Don't throw - email failure shouldn't break the trade execution
        }
      } catch (notificationError) {
        console.error('[Stop Loss Monitor] Failed to create notification:', notificationError);
        // Don't throw - notification failure shouldn't break the trade execution
      }
      
      return updatedTrade;

    } catch (error) {
      throw error;
    }
  }

  async getCurrentPrices(symbols) {
    console.log(`[Stop Loss Monitor] Fetching current prices for ${symbols.length} symbols`);
    const prices = {};
    
    try {
      const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
      
      if (!TWELVE_DATA_API_KEY) {
        console.warn('[Stop Loss Monitor] ⚠️ TWELVE_DATA_API_KEY not configured - Using SIMULATED prices (NOT REAL MARKET DATA)');
        const priceSimulator = getPriceSimulator();
        for (const symbol of symbols) {
          prices[symbol] = priceSimulator.getPrice(symbol);
        }
        return prices;
      }

      // Convert symbols to API format and fetch prices
      const { getAPISymbol } = require('./sandbox-constants-data');
      
      // Process symbols in batches to respect API limits
      const batchSize = 8;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const apiSymbols = batch.map(getAPISymbol);
        const symbolString = apiSymbols.join(',');
        
        try {
          const url = `https://api.twelvedata.com/price?symbol=${symbolString}&apikey=${TWELVE_DATA_API_KEY}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            // Fallback to simulated prices for this batch
            const priceSimulator = getPriceSimulator();
            for (const symbol of batch) {
              prices[symbol] = priceSimulator.getPrice(symbol);
            }
            continue;
          }
          
          const data = await response.json();
          
          if (batch.length === 1) {
            // Single symbol response
            const symbol = batch[0];
            if (data.price && !isNaN(parseFloat(data.price))) {
              prices[symbol] = parseFloat(data.price);
              console.log(`[Stop Loss Monitor] Got price for ${symbol}: ${prices[symbol]}`);
            }
          } else {
            // Multiple symbols response
            // TwelveData returns data keyed by the API symbols (e.g., 'BTC/USD')
            Object.keys(data).forEach((apiSymbol) => {
              // Find the original symbol (e.g., 'BTC') from the API symbol
              const originalSymbol = batch.find(sym => getAPISymbol(sym) === apiSymbol);
              
              if (originalSymbol && data[apiSymbol]?.price && !isNaN(parseFloat(data[apiSymbol].price))) {
                prices[originalSymbol] = parseFloat(data[apiSymbol].price);
              }
            });
          }
          
          // Rate limiting
          if (i + batchSize < symbols.length) {
            await this.sleep(200);
          }
          
        } catch (error) {
          // Fallback to simulated prices
          const priceSimulator = getPriceSimulator();
          for (const symbol of batch) {
            prices[symbol] = priceSimulator.getPrice(symbol);
          }
        }
      }
      
    } catch (error) {
      // Fallback to simulated prices for all symbols
      const priceSimulator = getPriceSimulator();
      for (const symbol of symbols) {
        prices[symbol] = priceSimulator.getPrice(symbol);
      }
    }
    
    return prices;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      checkInterval: this.checkInterval
    };
  }
}

// Create singleton instance
const stopLossMonitor = new SandboxStopLossMonitor();

module.exports = stopLossMonitor;
module.exports.SandboxStopLossMonitor = SandboxStopLossMonitor;
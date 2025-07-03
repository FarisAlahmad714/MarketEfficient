const mongoose = require('mongoose');

const SandboxTradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SandboxPortfolio',
    required: true
  },
  
  // Trade Basic Information
  symbol: {
    type: String,
    required: true,
    uppercase: true // BTCUSD, AAPL, etc.
  },
  
  assetType: {
    type: String,
    enum: ['crypto', 'stock'],
    required: true
  },
  
  side: {
    type: String,
    enum: ['long', 'short'],
    required: true
  },
  
  type: {
    type: String,
    enum: ['market', 'limit', 'stop'],
    default: 'market'
  },
  
  // Position Details
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  
  leverage: {
    type: Number,
    default: 1,
    min: 1,
    max: 3 // Max 3x leverage for safety
  },
  
  // Price Information
  entryPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  exitPrice: {
    type: Number,
    default: null
  },
  
  currentPrice: {
    type: Number,
    default: null
  },
  
  limitPrice: {
    type: Number,
    default: null // For limit orders
  },
  
  stopPrice: {
    type: Number,
    default: null // For stop orders
  },
  
  // Risk Management
  stopLoss: {
    price: { type: Number, default: null },
    percentage: { type: Number, default: null }
  },
  
  takeProfit: {
    price: { type: Number, default: null },
    percentage: { type: Number, default: null }
  },
  
  // Financial Data
  positionValue: {
    type: Number,
    required: true // Entry price * quantity * leverage (total exposure)
  },
  
  marginUsed: {
    type: Number,
    required: true // Entry price * quantity (actual margin from balance)
  },
  
  unrealizedPnL: {
    type: Number,
    default: 0
  },
  
  realizedPnL: {
    type: Number,
    default: null // Set when trade is closed
  },
  
  fees: {
    entry: { type: Number, default: 0 },
    exit: { type: Number, default: 0 },
    funding: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Trade Status
  status: {
    type: String,
    enum: ['pending', 'open', 'closed', 'cancelled'],
    default: 'open'
  },
  
  closeReason: {
    type: String,
    enum: ['manual', 'partial', 'stop_loss', 'take_profit', 'liquidation', 'cancelled'],
    default: null
  },
  
  // Educational Integration - MANDATORY PRE-TRADE ANALYSIS
  preTradeAnalysis: {
    entryReason: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500
    },
    
    technicalAnalysis: {
      type: String,
      required: false,
      minlength: 10,
      maxlength: 500
    },
    
    riskManagement: {
      type: String,
      required: false,
      minlength: 10,
      maxlength: 500
    },
    
    biasCheck: {
      type: String,
      required: false,
      minlength: 10,
      maxlength: 500
    },
    
    confidenceLevel: {
      type: Number,
      required: false,
      min: 1,
      max: 10
    },
    
    expectedHoldTime: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks'],
      required: false
    },
    
    emotionalState: {
      type: String,
      enum: ['calm', 'excited', 'fearful', 'confident', 'uncertain'],
      required: false
    }
  },
  
  // Learning Connection
  relatedBiasTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResults',
    default: null
  },
  
  relatedChartExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResults',
    default: null
  },
  
  patternIdentified: {
    type: String,
    default: null // "ascending_triangle", "support_bounce", etc.
  },
  
  // Post-Trade Analysis (Optional)
  postTradeAnalysis: {
    whatWorked: { type: String, default: null },
    whatDidntWork: { type: String, default: null },
    lessonsLearned: { type: String, default: null },
    emotionDuringTrade: { type: String, default: null },
    wouldDoAgain: { type: Boolean, default: null }
  },
  
  // Timing
  entryTime: {
    type: Date,
    default: Date.now
  },
  
  exitTime: {
    type: Date,
    default: null
  },
  
  holdingPeriod: {
    type: Number, // Duration in milliseconds
    default: null
  },
  
  lastFundingTime: {
    type: Date,
    default: null // Track when funding fees were last applied
  },
  
  // Market Data Context
  marketContext: {
    trend: { type: String, enum: ['bullish', 'bearish', 'sideways'], default: null },
    volatility: { type: String, enum: ['low', 'medium', 'high'], default: null },
    timeframe: { type: String, default: '1h' }
  },
  
  // Bias Analysis Results
  biasAnalysisResults: {
    qualityScore: { type: Number, default: null },
    technicalFactors: [{ type: String }],
    detectedBiases: [{ 
      type: { type: String },
      severity: { type: String },
      message: { type: String },
      suggestion: { type: String }
    }],
    tradingRelevance: { type: Number, default: null }
  },
  
  // Automatic execution flag
  isAutomaticClose: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for trade duration in human readable format
SandboxTradeSchema.virtual('duration').get(function() {
  if (!this.exitTime) return 'Open';
  
  const duration = this.exitTime - this.entryTime;
  const minutes = Math.floor(duration / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
});

// Virtual for profit/loss percentage
SandboxTradeSchema.virtual('pnlPercentage').get(function() {
  if (this.status === 'open') {
    if (!this.currentPrice) return 0;
    // Use standardized P&L calculation
    const { calculateUnrealizedPnL, calculatePnLPercentage } = require('../lib/pnl-calculator');
    try {
      const pnl = calculateUnrealizedPnL({
        side: this.side,
        entryPrice: this.entryPrice,
        currentPrice: this.currentPrice,
        quantity: this.quantity,
        leverage: this.leverage,
        totalFees: this.fees.total
      });
      return calculatePnLPercentage(pnl, this.marginUsed);
    } catch (error) {
      return 0;
    }
  } else {
    if (!this.exitPrice) return 0;
    // Use standardized P&L calculation for closed positions
    const { calculateRealizedPnL, calculatePnLPercentage } = require('../lib/pnl-calculator');
    try {
      const pnl = calculateRealizedPnL({
        side: this.side,
        entryPrice: this.entryPrice,
        exitPrice: this.exitPrice,
        quantity: this.quantity,
        leverage: this.leverage,
        totalFees: this.fees.total
      });
      return calculatePnLPercentage(pnl, this.marginUsed);
    } catch (error) {
      return 0;
    }
  }
});

// Virtual for risk-reward ratio
SandboxTradeSchema.virtual('riskRewardRatio').get(function() {
  if (!this.stopLoss.price || !this.takeProfit.price) return null;
  
  const risk = Math.abs(this.entryPrice - this.stopLoss.price);
  const reward = Math.abs(this.takeProfit.price - this.entryPrice);
  
  return risk > 0 ? (reward / risk).toFixed(2) : null;
});

// Method to update unrealized P&L
SandboxTradeSchema.methods.updateUnrealizedPnL = function(currentPrice) {
  if (this.status !== 'open') return;
  
  this.currentPrice = currentPrice;
  
  // Use standardized P&L calculation
  const { calculateUnrealizedPnL } = require('../lib/pnl-calculator');
  try {
    this.unrealizedPnL = calculateUnrealizedPnL({
      side: this.side,
      entryPrice: this.entryPrice,
      currentPrice: currentPrice,
      quantity: this.quantity,
      leverage: this.leverage,
      totalFees: this.fees.total
    });
  } catch (error) {
    console.error('Error calculating unrealized P&L:', error);
    this.unrealizedPnL = 0;
  }
};

// Method to close trade
SandboxTradeSchema.methods.closeTrade = function(exitPrice, reason = 'manual') {
  this.exitPrice = exitPrice;
  this.exitTime = new Date();
  this.status = 'closed';
  this.closeReason = reason;
  this.holdingPeriod = this.exitTime - this.entryTime;
  
  // Calculate realized P&L
  const priceDiff = this.side === 'long'
    ? exitPrice - this.entryPrice
    : this.entryPrice - exitPrice;
  
  // P&L = price difference * quantity * leverage - fees
  this.realizedPnL = (priceDiff * this.quantity * this.leverage) - this.fees.total;
  this.unrealizedPnL = 0; // Clear unrealized P&L
};

// Method to check if stop loss is hit
SandboxTradeSchema.methods.checkStopLoss = function(currentPrice) {
  if (!this.stopLoss.price || this.status !== 'open') return false;
  
  if (this.side === 'long') {
    return currentPrice <= this.stopLoss.price;
  } else {
    return currentPrice >= this.stopLoss.price;
  }
};

// Method to check if take profit is hit
SandboxTradeSchema.methods.checkTakeProfit = function(currentPrice) {
  if (!this.takeProfit.price || this.status !== 'open') return false;
  
  if (this.side === 'long') {
    return currentPrice >= this.takeProfit.price;
  } else {
    return currentPrice <= this.takeProfit.price;
  }
};

// Method to calculate liquidation price
SandboxTradeSchema.methods.getLiquidationPrice = function() {
  if (this.status !== 'open' || this.leverage === 1) return null;
  
  // Liquidation at 90% loss of margin
  const liquidationThreshold = 0.9;
  const priceMovementRatio = liquidationThreshold / this.leverage;
  
  if (this.side === 'long') {
    // Long position loses money when price goes down
    return this.entryPrice * (1 - priceMovementRatio);
  } else {
    // Short position loses money when price goes up
    return this.entryPrice * (1 + priceMovementRatio);
  }
};

// Method to check if trade should be liquidated (extreme loss)
SandboxTradeSchema.methods.checkLiquidation = function(currentPrice) {
  if (this.status !== 'open' || this.leverage === 1) return false;
  
  // Liquidation at 90% loss of margin (safety buffer)
  const liquidationThreshold = 0.9;
  const priceDiff = this.side === 'long'
    ? this.entryPrice - currentPrice
    : currentPrice - this.entryPrice;
  
  const lossPercentage = (priceDiff / this.entryPrice) * this.leverage;
  return lossPercentage >= liquidationThreshold;
};

// Static method to get user's trading statistics
SandboxTradeSchema.statics.getUserTradingStats = async function(userId) {
  const trades = await this.find({ userId, status: 'closed' });
  
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      totalPnL: 0
    };
  }
  
  const winningTrades = trades.filter(trade => trade.realizedPnL > 0);
  const losingTrades = trades.filter(trade => trade.realizedPnL < 0);
  
  const totalPnL = trades.reduce((sum, trade) => sum + trade.realizedPnL, 0);
  const averageWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0) / winningTrades.length 
    : 0;
  const averageLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0) / losingTrades.length)
    : 0;
  
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  // Find best single trade return percentage
  const validReturns = trades
    .filter(trade => trade.marginUsed && trade.marginUsed > 0 && trade.realizedPnL !== null && trade.realizedPnL !== undefined)
    .map(trade => {
      const returnPercent = (trade.realizedPnL / trade.marginUsed) * 100;
      // Cap extreme returns to prevent calculation errors
      return Math.min(Math.max(returnPercent, -100), 100);
    })
    .filter(ret => !isNaN(ret) && isFinite(ret));
  
  const bestReturn = validReturns.length > 0 ? Math.max(...validReturns) : 0;
  
  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / trades.length) * 100,
    averageWin,
    averageLoss,
    profitFactor,
    totalPnL,
    bestReturn
  };
};

// Indexes for efficient queries
SandboxTradeSchema.index({ userId: 1 });
SandboxTradeSchema.index({ portfolioId: 1 });
SandboxTradeSchema.index({ status: 1 });
SandboxTradeSchema.index({ symbol: 1 });
SandboxTradeSchema.index({ entryTime: -1 });
SandboxTradeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.models.SandboxTrade || mongoose.model('SandboxTrade', SandboxTradeSchema);
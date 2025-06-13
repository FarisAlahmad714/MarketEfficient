const mongoose = require('mongoose');

const SandboxPortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Core Portfolio Data
  balance: {
    type: Number,
    default: 10000, // Starting with 10,000 SENSES
    min: 0
  },
  
  initialBalance: {
    type: Number,
    default: 10000,
    immutable: true
  },
  
  // Unlock Status
  unlocked: {
    type: Boolean,
    default: false
  },
  
  unlockedAt: {
    type: Date,
    default: null
  },
  
  // Reset System
  monthlyResetDate: {
    type: Date,
    default: function() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
    }
  },
  
  resetCount: {
    type: Number,
    default: 0
  },
  
  // Performance Metrics
  totalReturn: {
    type: Number,
    default: 0 // Percentage return
  },
  
  totalReturnDollar: {
    type: Number,
    default: 0 // Dollar amount gained/lost
  },
  
  highWaterMark: {
    type: Number,
    default: 10000 // Highest portfolio value achieved
  },
  
  maxDrawdown: {
    type: Number,
    default: 0 // Maximum drawdown percentage
  },
  
  // Trading Statistics
  totalTrades: {
    type: Number,
    default: 0
  },
  
  winningTrades: {
    type: Number,
    default: 0
  },
  
  losingTrades: {
    type: Number,
    default: 0
  },
  
  winRate: {
    type: Number,
    default: 0 // Percentage
  },
  
  averageWin: {
    type: Number,
    default: 0
  },
  
  averageLoss: {
    type: Number,
    default: 0
  },
  
  profitFactor: {
    type: Number,
    default: 0 // Gross profit / Gross loss
  },
  
  sharpeRatio: {
    type: Number,
    default: 0
  },
  
  // Learning Integration
  unlockProgress: {
    biasTests: {
      completed: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      required: { type: Number, default: 2 }
    },
    chartExams: {
      completed: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      required: { type: Number, default: 2 }
    }
  },
  
  // Risk Management
  maxPositionSize: {
    type: Number,
    default: 0.25 // 25% of portfolio per trade max
  },
  
  maxLeverage: {
    type: Number,
    default: 3 // 3x maximum leverage
  },
  
  dailyLossLimit: {
    type: Number,
    default: 0.05 // 5% daily loss limit
  },
  
  // Tracking
  lastTradeAt: {
    type: Date,
    default: null
  },
  
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  totalTradingDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current portfolio value including open positions
SandboxPortfolioSchema.virtual('currentValue').get(function() {
  // Will be calculated with open positions
  return this.balance;
});

// Virtual for total P&L
SandboxPortfolioSchema.virtual('totalPnL').get(function() {
  return this.currentValue - this.initialBalance;
});

// Virtual for total P&L percentage
SandboxPortfolioSchema.virtual('totalPnLPercentage').get(function() {
  return ((this.currentValue - this.initialBalance) / this.initialBalance) * 100;
});

// Virtual for unlock eligibility check
SandboxPortfolioSchema.virtual('unlockEligible').get(function() {
  const biasComplete = this.unlockProgress.biasTests.completed >= this.unlockProgress.biasTests.required;
  const chartComplete = this.unlockProgress.chartExams.completed >= this.unlockProgress.chartExams.required;
  return biasComplete && chartComplete;
});

// Virtual for unlock progress percentage
SandboxPortfolioSchema.virtual('unlockProgressPercentage').get(function() {
  const totalRequired = this.unlockProgress.biasTests.required + this.unlockProgress.chartExams.required;
  const totalCompleted = this.unlockProgress.biasTests.completed + this.unlockProgress.chartExams.completed;
  return Math.min((totalCompleted / totalRequired) * 100, 100);
});

// Method to update performance metrics
SandboxPortfolioSchema.methods.updatePerformanceMetrics = function() {
  // Calculate win rate
  if (this.totalTrades > 0) {
    this.winRate = (this.winningTrades / this.totalTrades) * 100;
  }
  
  // Calculate profit factor
  const grossProfit = this.winningTrades * this.averageWin;
  const grossLoss = Math.abs(this.losingTrades * this.averageLoss);
  if (grossLoss > 0) {
    this.profitFactor = grossProfit / grossLoss;
  }
  
  // Update total return
  this.totalReturn = this.totalPnLPercentage;
  this.totalReturnDollar = this.totalPnL;
  
  // Update high water mark
  if (this.currentValue > this.highWaterMark) {
    this.highWaterMark = this.currentValue;
  }
  
  // Calculate drawdown
  if (this.highWaterMark > 0) {
    const currentDrawdown = ((this.highWaterMark - this.currentValue) / this.highWaterMark) * 100;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }
  }
};

// Method to check if monthly reset is due
SandboxPortfolioSchema.methods.isResetDue = function() {
  return new Date() >= this.monthlyResetDate;
};

// Method to perform monthly reset
SandboxPortfolioSchema.methods.performMonthlyReset = function() {
  this.balance = this.initialBalance;
  this.totalTrades = 0;
  this.winningTrades = 0;
  this.losingTrades = 0;
  this.winRate = 0;
  this.averageWin = 0;
  this.averageLoss = 0;
  this.profitFactor = 0;
  this.sharpeRatio = 0;
  this.totalReturn = 0;
  this.totalReturnDollar = 0;
  this.highWaterMark = this.initialBalance;
  this.maxDrawdown = 0;
  this.lastTradeAt = null;
  this.resetCount += 1;
  
  // Set next reset date
  const now = new Date();
  this.monthlyResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

// Method to update unlock progress
SandboxPortfolioSchema.methods.updateUnlockProgress = async function() {
  const TestResults = mongoose.model('TestResults');
  
  // Get user's test results
  const biasTests = await TestResults.find({
    userId: this.userId,
    testType: { $in: ['bias-test', 'anchoring', 'confirmation', 'availability', 'overconfidence'] }
  });
  
  const chartExams = await TestResults.find({
    userId: this.userId,
    testType: { $in: ['chart-exam', 'swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'] }
  });
  
  // Update bias test progress
  this.unlockProgress.biasTests.completed = biasTests.length;
  if (biasTests.length > 0) {
    const totalScore = biasTests.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0);
    this.unlockProgress.biasTests.averageScore = totalScore / biasTests.length;
  }
  
  // Update chart exam progress
  this.unlockProgress.chartExams.completed = chartExams.length;
  if (chartExams.length > 0) {
    const totalScore = chartExams.reduce((sum, test) => sum + (test.score / test.totalPoints) * 100, 0);
    this.unlockProgress.chartExams.averageScore = totalScore / chartExams.length;
  }
  
  // Check if should be unlocked
  if (this.unlockEligible && !this.unlocked) {
    this.unlocked = true;
    this.unlockedAt = new Date();
  }
};

// Index for efficient queries
SandboxPortfolioSchema.index({ userId: 1 });
SandboxPortfolioSchema.index({ unlocked: 1 });
SandboxPortfolioSchema.index({ monthlyResetDate: 1 });

module.exports = mongoose.models.SandboxPortfolio || mongoose.model('SandboxPortfolio', SandboxPortfolioSchema);
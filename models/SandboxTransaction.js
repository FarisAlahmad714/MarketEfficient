const mongoose = require('mongoose');

const SandboxTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Transaction Details
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'trade_profit', 'trade_loss', 'fee', 'adjustment'],
    index: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  // Balance Tracking
  balanceBefore: {
    type: Number,
    required: true
  },
  
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Reference Data
  relatedTradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SandboxTrade',
    default: null
  },
  
  // Additional Context
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount display
SandboxTransactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.type === 'deposit' || this.type === 'trade_profit' ? '+' : '-';
  return `${sign}${Math.abs(this.amount).toLocaleString()} SENSES`;
});

// Virtual for transaction category
SandboxTransactionSchema.virtual('category').get(function() {
  switch (this.type) {
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
      return 'Withdrawal';
    case 'trade_profit':
    case 'trade_loss':
      return 'Trading';
    case 'fee':
      return 'Fee';
    case 'adjustment':
      return 'Adjustment';
    default:
      return 'Other';
  }
});

// Static method to get user's transaction history
SandboxTransactionSchema.statics.getUserTransactions = async function(userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    type = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { userId };
  
  if (type) {
    query.type = type;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const transactions = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('relatedTradeId', 'symbol side entryPrice exitPrice')
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get transaction summary
SandboxTransactionSchema.statics.getTransactionSummary = async function(userId, period = 'all') {
  let dateFilter = {};
  
  if (period === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: startOfMonth } };
  } else if (period === 'quarter') {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    dateFilter = { createdAt: { $gte: quarterStart } };
  }
  
  const summary = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), ...dateFilter } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return summary.reduce((acc, item) => {
    acc[item._id] = {
      total: item.totalAmount,
      count: item.count
    };
    return acc;
  }, {});
};

// Indexes for performance
SandboxTransactionSchema.index({ userId: 1, createdAt: -1 });
SandboxTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
SandboxTransactionSchema.index({ status: 1 });

module.exports = mongoose.models.SandboxTransaction || mongoose.model('SandboxTransaction', SandboxTransactionSchema);
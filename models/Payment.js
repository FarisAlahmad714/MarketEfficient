import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false
  },
  stripePaymentIntentId: {
    type: String,
    required: false
  },
  stripeChargeId: {
    type: String,
    required: false
  },
  stripeInvoiceId: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: true // Amount in cents
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'promo_code', 'admin_override'],
    required: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true
  },
  promoCodeUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: false
  },
  originalAmount: {
    type: Number,
    required: false // Original amount before any discounts
  },
  discountAmount: {
    type: Number,
    default: 0 // Amount discounted
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    customerEmail: String,
    customerName: String,
    customerCountry: String,
    paymentMethodType: String, // card, bank_transfer, etc.
    last4: String, // Last 4 digits of card
    brand: String, // visa, mastercard, etc.
    adminNotes: String
  },
  refunds: [{
    stripeRefundId: String,
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  failureReason: {
    type: String,
    required: false
  },
  processedAt: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance and queries
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ stripeChargeId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ processedAt: -1 });

// Update timestamp on save
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual to get net amount after refunds
PaymentSchema.virtual('netAmount').get(function() {
  const totalRefunded = this.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  return this.amount - totalRefunded;
});

// Virtual to check if payment is refundable
PaymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'succeeded' && this.netAmount > 0;
});

// Method to add refund
PaymentSchema.methods.addRefund = function(refundData) {
  this.refunds.push({
    ...refundData,
    refundedAt: new Date()
  });
  
  // Update status based on refund amount
  const totalRefunded = this.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  if (totalRefunded >= this.amount) {
    this.status = 'refunded';
  } else if (totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = async function(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      $lte: endDate || new Date()
    }
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalDiscounts: { $sum: '$discountAmount' },
        avgPaymentAmount: { $avg: '$amount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalDiscounts: 0,
    avgPaymentAmount: 0
  };
};

// Static method to get revenue by plan
PaymentSchema.statics.getRevenueByPlan = async function(startDate, endDate) {
  const matchStage = {
    status: 'succeeded',
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);
};

// Static method to get promo code usage stats
PaymentSchema.statics.getPromoCodeStats = async function() {
  return this.aggregate([
    { $match: { promoCodeUsed: { $exists: true } } },
    {
      $lookup: {
        from: 'promocodes',
        localField: 'promoCodeUsed',
        foreignField: '_id',
        as: 'promoCode'
      }
    },
    { $unwind: '$promoCode' },
    {
      $group: {
        _id: '$promoCode.code',
        usageCount: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' },
        totalRevenue: { $sum: '$amount' }
      }
    },
    { $sort: { usageCount: -1 } }
  ]);
};

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 
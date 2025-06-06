import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: false
  },
  stripeSubscriptionId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing', 'admin_access'],
    default: 'inactive'
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual', 'admin'],
    required: true
  },
  amount: {
    type: Number,
    required: true // Amount paid in cents (2900 for $29, 24900 for $249)
  },
  currency: {
    type: String,
    default: 'usd'
  },
  currentPeriodStart: {
    type: Date,
    required: false
  },
  currentPeriodEnd: {
    type: Date,
    required: false
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  promoCodeUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: false
  },
  discountAmount: {
    type: Number,
    default: 0 // Amount discounted in cents
  },
  originalAmount: {
    type: Number,
    required: false // Original amount before discount
  },
  trialEnd: {
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

// Index for performance (userId already has unique index)
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });

// Update timestamp on save
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual to check if subscription is active
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'trialing' || this.status === 'admin_access';
});

// Method to check if subscription has expired
SubscriptionSchema.methods.isExpired = function() {
  if (this.status === 'admin_access') return false;
  if (!this.currentPeriodEnd) return true;
  return new Date() > this.currentPeriodEnd;
};

// Method to get days remaining
SubscriptionSchema.methods.getDaysRemaining = function() {
  if (this.status === 'admin_access') return Infinity;
  if (!this.currentPeriodEnd) return 0;
  
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Static method to find active subscription by user ID
SubscriptionSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({ 
    userId, 
    status: { $in: ['active', 'trialing', 'admin_access'] }
  });
};

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema); 
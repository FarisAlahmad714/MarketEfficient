// models/PendingRegistration.js
const mongoose = require('mongoose');
const loggerr = require('../lib/logger'); // Adjust path to your logger utility

const PendingRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  promoCode: {
    type: String,
    required: false
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  stripeSessionId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'checkout_started', 'payment_completed', 'expired'],
    default: 'pending'
  },
  checkoutStartedAt: {
    type: Date,
    required: false
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // 2 hours instead of 24
  }
});

PendingRegistrationSchema.index({ email: 1 });
PendingRegistrationSchema.index({ stripeSessionId: 1 });
PendingRegistrationSchema.index({ status: 1 });
PendingRegistrationSchema.index({ createdAt: 1 });

PendingRegistrationSchema.methods.canRetry = function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.createdAt < thirtyMinutesAgo || this.status === 'expired';
};

PendingRegistrationSchema.methods.updateActivity = function(status = null) {
  this.lastActivityAt = new Date();
  if (status) {
    this.status = status;
  }
  return this.save();
};

PendingRegistrationSchema.methods.startCheckout = function(stripeSessionId) {
  this.status = 'checkout_started';
  this.stripeSessionId = stripeSessionId;
  this.checkoutStartedAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

PendingRegistrationSchema.statics.cleanupExpired = async function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const result = await this.deleteMany({
    $or: [
      { 
        status: 'checkout_started',
        checkoutStartedAt: { $lt: thirtyMinutesAgo }
      },
      {
        status: 'pending',
        createdAt: { $lt: thirtyMinutesAgo }
      }
    ]
  });
  
  loggerr.log(`Cleaned up ${result.deletedCount} expired pending registrations`);
  return result;
};

module.exports = mongoose.models.PendingRegistration || mongoose.model('PendingRegistration', PendingRegistrationSchema);
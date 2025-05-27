const mongoose = require('mongoose');

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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours if not completed
  }
});

// Index for quick lookups
PendingRegistrationSchema.index({ email: 1 });
PendingRegistrationSchema.index({ stripeSessionId: 1 });

module.exports = mongoose.models.PendingRegistration || mongoose.model('PendingRegistration', PendingRegistrationSchema); 
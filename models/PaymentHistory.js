// models/PaymentHistory.js
import mongoose from 'mongoose';

const PaymentHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentIntentId: String,
  stripeInvoiceId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    required: true
  },
  description: String,
  paymentMethod: String,
  metadata: {
    subscriptionId: String,
    plan: String,
    promoCode: String
  }
}, {
  timestamps: true
});

export default mongoose.models.PaymentHistory || mongoose.model('PaymentHistory', PaymentHistorySchema);
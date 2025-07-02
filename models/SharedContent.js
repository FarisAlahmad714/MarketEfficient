// models/SharedContent.js
import mongoose from 'mongoose';

const sharedContentSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['achievement', 'badge', 'test_result', 'trading_highlight', 'profile']
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Expires in 1 year
  }
});

// Index for automatic cleanup of expired documents
sharedContentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SharedContent || mongoose.model('SharedContent', sharedContentSchema);
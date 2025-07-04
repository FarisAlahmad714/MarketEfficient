const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['shared_content', 'comment'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Ensure one like per user per target
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Performance indexes
likeSchema.index({ shareId: 1, targetType: 1, targetId: 1 });
likeSchema.index({ userId: 1, createdAt: -1 });
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.models.Like || mongoose.model('Like', likeSchema);
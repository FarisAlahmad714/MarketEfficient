const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String
    }
  }],
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isReply: {
    type: Boolean,
    default: false
  },
  likesCount: {
    type: Number,
    default: 0
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for performance
commentSchema.index({ shareId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
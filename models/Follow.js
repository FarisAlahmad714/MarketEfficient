// models/Follow.js
import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique follow relationships and optimize queries
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for efficient follower/following count queries
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

// Prevent users from following themselves
followSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    const error = new Error('Users cannot follow themselves');
    return next(error);
  }
  next();
});

export default mongoose.models.Follow || mongoose.model('Follow', followSchema);
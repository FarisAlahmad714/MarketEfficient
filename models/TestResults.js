// models/TestResult.js
import mongoose from 'mongoose';

const TestResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    enum: ['bias-test', 'chart-exam'],
    required: true
  },
  subType: {
    type: String,
    enum: ['swing-analysis', 'fibonacci-retracement', 'fair-value-gaps', null],
    default: null
  },
  assetSymbol: {
    type: String,
    default: null
  },
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
TestResultSchema.index({ userId: 1, completedAt: -1 });
TestResultSchema.index({ userId: 1, testType: 1, completedAt: -1 });

export default mongoose.models.TestResult || mongoose.model('TestResult', TestResultSchema);
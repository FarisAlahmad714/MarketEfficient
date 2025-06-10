import mongoose from 'mongoose';

const chartExamAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Exam details
  examType: {
    type: String,
    required: true,
    enum: ['swing', 'fibonacci', 'fvg'],
    index: true
  },
  chartCount: {
    type: Number,
    required: true
  },
  part: {
    type: Number,
    default: 1
  },
  
  // Timing data
  sessionStartTime: {
    type: Date,
    required: true
  },
  sessionEndTime: {
    type: Date,
    required: true
  },
  totalTimeSpent: {
    type: Number, // seconds
    required: true
  },
  timeLimit: {
    type: Number, // seconds
    required: true
  },
  timePressureRatio: {
    type: Number, // timeSpent / timeLimit
    required: true
  },
  
  // Focus and engagement
  focusEvents: [{
    type: {
      type: String,
      enum: ['lost_focus', 'gained_focus', 'warning_shown', 'timeout_reset']
    },
    timestamp: Date,
    duration: Number // for lost_focus events
  }],
  totalFocusLostTime: {
    type: Number,
    default: 0
  },
  focusLossCount: {
    type: Number,
    default: 0
  },
  
  // Interaction data
  attempts: {
    type: Number,
    required: true
  },
  submissions: [{
    timestamp: Date,
    score: Number,
    totalPoints: Number,
    accuracy: Number, // score/totalPoints
    drawingsCount: Number,
    timeSpentOnAttempt: Number,
    mistakes: [String] // array of mistake types
  }],
  
  // Performance metrics
  finalScore: {
    type: Number,
    required: true
  },
  finalAccuracy: {
    type: Number,
    required: true
  },
  improvementRate: {
    type: Number // (lastScore - firstScore) / attempts
  },
  
  // Pattern analysis
  commonMistakes: [{
    type: String,
    count: Number,
    examples: [String]
  }],
  strongAreas: [String],
  weakAreas: [String],
  
  // Chart-specific data
  chartMetadata: {
    symbol: String,
    timeframe: String,
    priceRange: Number,
    volatility: Number,
    trendDirection: String
  },
  
  // Drawing analysis (for pattern recognition)
  drawingPatterns: [{
    patternType: String, // 'swing_high', 'swing_low', 'fibonacci_level', 'fvg_bullish', etc.
    userAccuracy: Number,
    expectedCoordinate: {
      x: Number,
      y: Number,
      time: Number,
      price: Number
    },
    userCoordinate: {
      x: Number,
      y: Number,
      time: Number,
      price: Number
    },
    deviation: {
      timeDeviation: Number,
      priceDeviation: Number,
      percentageDeviation: Number
    }
  }],
  
  // Learning progression indicators
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  consistencyScore: Number, // how consistent performance is across attempts
  learningVelocity: Number, // how quickly user improves
  
  // Device and context
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    isMobile: Boolean
  },
  
  // Engagement metrics
  engagementScore: Number, // composite score based on focus, attempts, time spent
  frustrationType: String, // 'time_pressure', 'pattern_recognition', 'precision', null
  
  // Monetizable insights flags
  needsPersonalizedTraining: Boolean,
  recommendedTrainingModules: [String],
  potentialPremiumFeatures: [String],
  
  // Timestamps
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

// Indexes for efficient queries
chartExamAnalyticsSchema.index({ userId: 1, createdAt: -1 });
chartExamAnalyticsSchema.index({ examType: 1, skillLevel: 1 });
chartExamAnalyticsSchema.index({ userId: 1, examType: 1, chartCount: 1 });

// Pre-save middleware to update timestamps and calculate derived metrics
chartExamAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate time pressure ratio
  if (this.totalTimeSpent && this.timeLimit) {
    this.timePressureRatio = this.totalTimeSpent / this.timeLimit;
  }
  
  // Calculate final accuracy
  if (this.submissions && this.submissions.length > 0) {
    const lastSubmission = this.submissions[this.submissions.length - 1];
    this.finalAccuracy = lastSubmission.totalPoints > 0 ? 
      lastSubmission.score / lastSubmission.totalPoints : 0;
  }
  
  // Calculate improvement rate
  if (this.submissions && this.submissions.length > 1) {
    const firstScore = this.submissions[0].accuracy || 0;
    const lastScore = this.submissions[this.submissions.length - 1].accuracy || 0;
    this.improvementRate = (lastScore - firstScore) / this.submissions.length;
  }
  
  // Calculate consistency score (inverse of standard deviation of accuracies)
  if (this.submissions && this.submissions.length > 2) {
    const accuracies = this.submissions.map(s => s.accuracy || 0);
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);
    this.consistencyScore = Math.max(0, 1 - stdDev); // Higher = more consistent
  }
  
  // Calculate engagement score
  const focusPenalty = Math.min(this.focusLossCount * 0.1, 0.5); // Max 50% penalty
  const timePressureBonus = this.timePressureRatio < 0.8 ? 0.2 : 0; // Bonus for efficient completion
  const attemptEfficiency = this.attempts > 0 ? Math.min(this.finalAccuracy / this.attempts, 1) : 0;
  
  this.engagementScore = Math.max(0, Math.min(1, 
    this.finalAccuracy + attemptEfficiency + timePressureBonus - focusPenalty
  ));
  
  next();
});

// Static methods for analytics queries
chartExamAnalyticsSchema.statics.getUserProgression = function(userId, examType = null) {
  const query = { userId };
  if (examType) query.examType = examType;
  
  return this.find(query)
    .sort({ createdAt: 1 })
    .select('examType chartCount finalAccuracy engagementScore createdAt commonMistakes');
};

chartExamAnalyticsSchema.statics.getAggregatedInsights = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$examType',
        avgAccuracy: { $avg: '$finalAccuracy' },
        avgEngagement: { $avg: '$engagementScore' },
        totalAttempts: { $sum: '$attempts' },
        avgTimeSpent: { $avg: '$totalTimeSpent' },
        consistencyScore: { $avg: '$consistencyScore' },
        commonMistakes: { $push: '$commonMistakes' },
        strongAreas: { $push: '$strongAreas' },
        weakAreas: { $push: '$weakAreas' }
      }
    }
  ]);
};

chartExamAnalyticsSchema.statics.getMarketableInsights = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $addToSet: '$userId' },
        avgAccuracyByExamType: {
          $push: {
            examType: '$examType',
            accuracy: '$finalAccuracy',
            timeSpent: '$totalTimeSpent'
          }
        },
        commonMistakePatterns: { $push: '$commonMistakes' },
        learningCurveData: {
          $push: {
            attempts: '$attempts',
            improvementRate: '$improvementRate',
            consistencyScore: '$consistencyScore'
          }
        }
      }
    }
  ]);
};

const ChartExamAnalytics = mongoose.models.ChartExamAnalytics || 
  mongoose.model('ChartExamAnalytics', chartExamAnalyticsSchema);

export default ChartExamAnalytics;
import mongoose from 'mongoose';

const BiasTestAnalyticsSchema = new mongoose.Schema({
  // Core Session Info
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  testType: {
    type: String,
    required: true,
    enum: ['crypto', 'forex', 'stocks']
  },
  assetSymbol: {
    type: String,
    required: true
  },
  
  // Session Timing
  sessionStartTime: {
    type: Date,
    required: true,
    index: true
  },
  sessionEndTime: {
    type: Date,
    required: true
  },
  totalSessionTime: {
    type: Number, // seconds
    required: true
  },
  
  // Performance Metrics
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  finalAccuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  totalQuestions: {
    type: Number,
    required: true,
    default: 5
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  
  // Question-Level Analytics
  questionAnalytics: [{
    questionNumber: {
      type: Number,
      required: true
    },
    timeSpent: {
      type: Number, // seconds
      required: true
    },
    prediction: {
      type: String,
      enum: ['bullish', 'bearish'],
      required: true
    },
    correctAnswer: {
      type: String,
      enum: ['bullish', 'bearish'],
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    confidenceLevel: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    confidenceAccuracy: {
      type: Number, // How well-calibrated confidence was (0-1)
      required: true
    },
    reasoning: {
      type: String,
      required: true
    },
    reasoningLength: {
      type: Number, // Character count
      required: true
    },
    technicalFactors: [{
      type: String
    }],
    technicalComplexity: {
      type: Number, // 1-5 scale based on technical factors
      required: true
    },
    marketCondition: {
      type: String,
      enum: ['trending', 'sideways', 'volatile'],
      required: true
    },
    volumeProfile: {
      avgVolume: Number,
      volumeTrend: String,
      volumeSpikes: Number
    },
    submittedAt: {
      type: Date,
      required: true
    }
  }],
  
  // Progression Metrics
  progressionMetrics: {
    // Confidence Calibration
    overconfidenceScore: {
      type: Number, // Difference between confidence and actual accuracy
      required: true
    },
    confidenceConsistency: {
      type: Number, // Variance in confidence levels (0-1)
      required: true
    },
    
    // Technical Analysis Skills
    technicalAnalysisScore: {
      type: Number, // Based on technical complexity and accuracy
      required: true
    },
    averageTechnicalComplexity: {
      type: Number,
      required: true
    },
    
    // Market Condition Recognition
    marketConditionAccuracy: {
      trending: Number,
      sideways: Number,
      volatile: Number
    },
    
    // Time Management
    averageTimePerQuestion: {
      type: Number,
      required: true
    },
    timeConsistency: {
      type: Number, // Variance in time spent (0-1)
      required: true
    },
    
    // Learning Patterns
    improvementTrend: {
      type: Number, // Performance change from first to last question
      required: true
    },
    consistencyScore: {
      type: Number, // Performance consistency across questions
      required: true
    }
  },
  
  // Behavioral Analytics
  behaviorMetrics: {
    sessionEngagement: {
      type: Number, // 0-1 score based on time spent and interaction depth
      required: true
    },
    reasoningQuality: {
      type: Number, // 0-1 score based on reasoning analysis
      required: true
    },
    explorationDepth: {
      type: Number, // How much user explored features (volume toggle, etc.)
      required: true
    },
    riskTolerance: {
      type: Number, // Inferred from predictions and confidence
      required: true
    }
  },
  
  // Comparative Analytics
  comparativeMetrics: {
    assetSpecialization: {
      type: Number, // Performance relative to other assets
      required: true
    },
    marketConditionStrength: {
      type: String, // Which market condition user performs best in
      enum: ['trending', 'sideways', 'volatile', 'balanced']
    },
    timeframePreference: {
      type: String, // Which timeframe user selected
      required: true
    },
    biasPattern: {
      type: String, // Detected bias pattern
      enum: ['bullish_bias', 'bearish_bias', 'overconfident', 'underconfident', 'balanced']
    }
  },
  
  // Monetization Metrics
  monetizationFlags: {
    premiumCandidate: {
      type: Boolean,
      default: false
    },
    churnRisk: {
      type: Number, // 0-1 churn probability
      required: true
    },
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    learningVelocity: {
      type: Number, // Rate of improvement
      required: true
    },
    featureUtilization: {
      type: Number, // Percentage of features used
      required: true
    }
  },
  
  // Device & Context
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    isMobile: {
      type: Boolean,
      default: false
    },
    timezone: String,
    language: String
  },
  
  // Test Environment
  testEnvironment: {
    timeOfDay: String,
    dayOfWeek: String,
    isWeekend: Boolean,
    marketHours: Boolean
  },
  
  // Research Value
  researchValue: {
    dataQuality: {
      type: Number, // 0-1 score for research value
      required: true
    },
    uniqueInsights: {
      type: Number, // Number of unique insights generated
      required: true
    },
    marketableInsights: [{
      type: String // Insights that could be valuable to sell
    }]
  }
}, {
  timestamps: true,
  collection: 'bias_test_analytics'
});

// Indexes for efficient queries
BiasTestAnalyticsSchema.index({ userId: 1, sessionStartTime: -1 });
BiasTestAnalyticsSchema.index({ testType: 1, sessionStartTime: -1 });
BiasTestAnalyticsSchema.index({ assetSymbol: 1, sessionStartTime: -1 });
BiasTestAnalyticsSchema.index({ 'monetizationFlags.premiumCandidate': 1 });
BiasTestAnalyticsSchema.index({ 'monetizationFlags.churnRisk': 1 });

// Pre-save middleware to calculate derived metrics
BiasTestAnalyticsSchema.pre('save', function(next) {
  try {
    // Calculate overconfidence score
    const confidenceAccuracyDiff = this.questionAnalytics.map(q => 
      (q.confidenceLevel / 10) - (q.isCorrect ? 1 : 0)
    );
    this.progressionMetrics.overconfidenceScore = 
      confidenceAccuracyDiff.reduce((sum, diff) => sum + diff, 0) / confidenceAccuracyDiff.length;
    
    // Calculate confidence consistency (variance)
    const confidenceLevels = this.questionAnalytics.map(q => q.confidenceLevel);
    const avgConfidence = confidenceLevels.reduce((sum, c) => sum + c, 0) / confidenceLevels.length;
    const confidenceVariance = confidenceLevels.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidenceLevels.length;
    this.progressionMetrics.confidenceConsistency = 1 - (confidenceVariance / 25); // Normalize to 0-1
    
    // Calculate technical analysis score
    const technicalScores = this.questionAnalytics.map(q => 
      q.isCorrect ? q.technicalComplexity : 0
    );
    this.progressionMetrics.technicalAnalysisScore = 
      technicalScores.reduce((sum, score) => sum + score, 0) / (this.questionAnalytics.length * 5);
    
    // Calculate improvement trend
    const firstHalfAccuracy = this.questionAnalytics.slice(0, 2).filter(q => q.isCorrect).length / 2;
    const secondHalfAccuracy = this.questionAnalytics.slice(3, 5).filter(q => q.isCorrect).length / 2;
    this.progressionMetrics.improvementTrend = secondHalfAccuracy - firstHalfAccuracy;
    
    // Calculate behavioral metrics
    const totalTime = this.questionAnalytics.reduce((sum, q) => sum + q.timeSpent, 0);
    const avgReasoningLength = this.questionAnalytics.reduce((sum, q) => sum + q.reasoningLength, 0) / this.questionAnalytics.length;
    this.behaviorMetrics.sessionEngagement = Math.min(1, (totalTime / 600) * 0.5 + (avgReasoningLength / 200) * 0.5);
    
    // Calculate monetization flags
    this.monetizationFlags.churnRisk = this.finalAccuracy < 0.4 ? 0.8 : 
                                       this.finalAccuracy < 0.6 ? 0.5 : 0.2;
    
    this.monetizationFlags.premiumCandidate = 
      this.finalAccuracy > 0.7 && 
      this.behaviorMetrics.sessionEngagement > 0.6 &&
      this.progressionMetrics.technicalAnalysisScore > 0.6;
    
    // Calculate research value
    this.researchValue.dataQuality = 
      (this.behaviorMetrics.reasoningQuality * 0.4) + 
      (this.behaviorMetrics.sessionEngagement * 0.3) + 
      (this.progressionMetrics.technicalAnalysisScore * 0.3);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods for analytics queries
BiasTestAnalyticsSchema.statics.getUserProgression = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    { $match: { userId, sessionStartTime: { $gte: startDate } } },
    { $sort: { sessionStartTime: 1 } },
    {
      $group: {
        _id: null,
        sessions: { $push: '$$ROOT' },
        avgAccuracy: { $avg: '$finalAccuracy' },
        avgConfidence: { $avg: '$progressionMetrics.overconfidenceScore' },
        avgTechnicalScore: { $avg: '$progressionMetrics.technicalAnalysisScore' },
        improvementTrend: { $last: '$progressionMetrics.improvementTrend' }
      }
    }
  ]);
};

BiasTestAnalyticsSchema.statics.getMarketInsights = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    { $match: { sessionStartTime: { $gte: startDate } } },
    {
      $group: {
        _id: '$assetSymbol',
        totalSessions: { $sum: 1 },
        avgAccuracy: { $avg: '$finalAccuracy' },
        avgConfidence: { $avg: '$progressionMetrics.overconfidenceScore' },
        difficultyScore: { $avg: { $subtract: [1, '$finalAccuracy'] } }
      }
    },
    { $sort: { totalSessions: -1 } }
  ]);
};

const BiasTestAnalytics = mongoose.models.BiasTestAnalytics || mongoose.model('BiasTestAnalytics', BiasTestAnalyticsSchema);

export default BiasTestAnalytics;
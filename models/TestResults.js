const mongoose = require('mongoose');

const TestResultsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    required: true,
    // REMOVED 'bias-test-data' - no longer allowed
    enum: ['bias-test', 'chart-exam', 'swing-analysis', 'fibonacci-retracement', 'fair-value-gaps']
  },
  subType: {
    type: String,
    required: false
  },
  assetSymbol: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  details: {
    timeframe: String,
    sessionId: String,
    testDetails: [{
      question: Number,
      prediction: String,
      correctAnswer: String,
      isCorrect: Boolean,
      reasoning: String,
      aiAnalysis: String,
      // Added fields to store chart data per question
      ohlcData: Array,  // For setup charts
      outcomeData: Array, // For outcome charts
      analysisStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      // Enhanced fields for comprehensive sentiment data collection
      setupImageUrl: String,      // Signed URL for setup chart (temporary)
      setupImagePath: String,     // GCS path for setup chart (permanent)
      outcomeImageUrl: String,    // Signed URL for outcome chart (temporary)
      outcomeImagePath: String,   // GCS path for outcome chart (permanent)
      confidenceLevel: Number,    // 1-10 scale for prediction confidence
      timeSpent: Number,         // Seconds spent on this question
      marketCondition: String,   // trending/sideways/volatile
      volumeProfile: {           // Volume analysis data
        avgVolume: Number,
        volumeTrend: String,     // increasing/decreasing/stable
        volumeSpikes: Number     // Count of significant volume spikes
      },
      technicalFactors: [String], // Array of technical indicators mentioned in reasoning
      submittedAt: {             // When this specific question was answered
        type: Date,
        default: Date.now
      }
    }]
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  analysisCompletedAt: {
    type: Date
  }
});

// Add index on sessionId for faster queries
TestResultsSchema.index({ 'details.sessionId': 1 });

// Add index on userId for dashboard queries
TestResultsSchema.index({ userId: 1, completedAt: -1 });

// Add a method to update AI analysis
TestResultsSchema.methods.updateAnalysis = async function(answers) {
  if (!answers || !Array.isArray(answers)) return;
  
  // Update each answer's AI analysis
  if (this.details && this.details.testDetails) {
    answers.forEach(answer => {
      const testDetail = this.details.testDetails.find(td => td.question === answer.test_id);
      if (testDetail && answer.ai_analysis) {
        testDetail.aiAnalysis = answer.ai_analysis;
        testDetail.analysisStatus = 'completed';
      }
    });
  }
  
  this.status = 'completed';
  this.analysisCompletedAt = new Date();
  return this.save();
};

module.exports = mongoose.models.TestResults || mongoose.model('TestResults', TestResultsSchema);
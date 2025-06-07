import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  // User info (optional - can be anonymous)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: false
  },
  userName: {
    type: String,
    required: false
  },
  
  // Feedback details
  type: {
    type: String,
    enum: ['bug_report', 'feature_request', 'general_feedback', 'ui_ux', 'performance', 'other'],
    required: true,
    default: 'general_feedback'
  },
  
  subject: {
    type: String,
    required: true,
    maxLength: 200
  },
  
  message: {
    type: String,
    required: true,
    maxLength: 2000
  },
  
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  
  // Browser/device info for debugging
  browserInfo: {
    userAgent: String,
    url: String,
    timestamp: Date
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    maxLength: 1000,
    default: ''
  },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  resolvedAt: {
    type: Date,
    required: false
  }
  
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1 });

// Virtual for user type
feedbackSchema.virtual('isAnonymous').get(function() {
  return !this.userId;
});

// Pre-save middleware to auto-populate user info for authenticated feedback
feedbackSchema.pre('save', function(next) {
  if (this.userId && !this.isModified('userEmail') && !this.isModified('userName')) {
    // Will be populated by the API when user info is available
  }
  next();
});

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

export default Feedback;
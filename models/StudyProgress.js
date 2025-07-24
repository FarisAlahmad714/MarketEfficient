import mongoose from 'mongoose';

const StudyProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  topicProgress: {
    type: Map,
    of: {
      completedLessons: [{
        type: String
      }],
      completedAt: Date,
      quizScores: {
        type: Map,
        of: Number
      },
      lastAccessedAt: Date,
      totalTimeSpent: {
        type: Number,
        default: 0
      }
    },
    default: new Map()
  },
  totalTopicsCompleted: {
    type: Number,
    default: 0
  },
  totalLessonsCompleted: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastStudyDate: Date
}, {
  timestamps: true
});

// Method to check if a topic is completed
StudyProgressSchema.methods.isTopicCompleted = function(topicName) {
  const progress = this.topicProgress.get(topicName);
  return progress && progress.completedAt != null;
};

// Method to get completion percentage for a topic
StudyProgressSchema.methods.getTopicCompletionPercentage = function(topicName, totalLessons) {
  const progress = this.topicProgress.get(topicName);
  if (!progress) return 0;
  return (progress.completedLessons.length / totalLessons) * 100;
};

// Static method to get or create progress for a user
StudyProgressSchema.statics.findOrCreateByUserId = async function(userId) {
  let progress = await this.findOne({ userId });
  if (!progress) {
    progress = await this.create({ userId });
  }
  return progress;
};

export default mongoose.models.StudyProgress || mongoose.model('StudyProgress', StudyProgressSchema);
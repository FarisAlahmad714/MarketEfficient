// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Who receives this notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Who triggered this notification (can be null for system notifications)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Type of notification
  type: {
    type: String,
    required: true,
    enum: [
      'follow',
      'unfollow', 
      'content_shared',
      'achievement_unlocked',
      'test_milestone',
      'leaderboard_position',
      'weekly_summary',
      'system_announcement',
      'profile_mention',
      'content_like',
      'content_comment',
      'comment',
      'like',
      'mention',
      'reply',
      'trade_stop_loss',
      'trade_take_profit',
      'trade_liquidation'
    ]
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // Notification message/body
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Additional data specific to notification type
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // URL to navigate to when notification is clicked
  actionUrl: {
    type: String,
    required: false
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // When notification was read
  readAt: {
    type: Date,
    required: false
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Whether notification should be shown in UI or just logged
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Expiration date (for temporary notifications)
  expiresAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { 
      isRead: true, 
      readAt: new Date() 
    },
    { new: true }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    isVisible: true
  });
};

// Static method to clean up old read notifications
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
  return await this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

// Force model recreation to ensure latest schema is used
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model('Notification', notificationSchema);
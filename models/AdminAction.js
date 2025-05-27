const mongoose = require('mongoose');

const AdminActionSchema = new mongoose.Schema({
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'user_created',
      'user_updated',
      'user_deleted',
      'user_subscription_modified',
      'user_access_granted',
      'user_access_revoked',
      'promo_code_created',
      'promo_code_updated',
      'promo_code_deactivated',
      'promo_codes_generated',
      'payment_refunded',
      'subscription_cancelled',
      'subscription_extended',
      'admin_override_applied',
      'bulk_action_performed',
      'system_settings_changed',
      'email_sent',
      'data_exported'
    ],
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'subscription', 'payment', 'promo_code', 'system', 'bulk'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Some actions might not have a specific target
  },
  targetIdentifier: {
    type: String,
    required: false // Email, username, or other identifier for easier tracking
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  details: {
    // Flexible object to store action-specific details
    previousValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    affectedCount: Number, // For bulk actions
    reason: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['user_management', 'financial', 'security', 'system', 'content'],
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance and querying
AdminActionSchema.index({ adminUserId: 1 });
AdminActionSchema.index({ action: 1 });
AdminActionSchema.index({ targetType: 1, targetId: 1 });
AdminActionSchema.index({ createdAt: -1 });
AdminActionSchema.index({ severity: 1 });
AdminActionSchema.index({ category: 1 });
AdminActionSchema.index({ success: 1 });

// Compound indexes for common queries
AdminActionSchema.index({ adminUserId: 1, createdAt: -1 });
AdminActionSchema.index({ targetType: 1, createdAt: -1 });
AdminActionSchema.index({ category: 1, severity: 1 });

// Static method to log admin action
AdminActionSchema.statics.logAction = async function(actionData) {
  try {
    const action = new this(actionData);
    await action.save();
    return action;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

// Static method to get admin activity summary
AdminActionSchema.statics.getActivitySummary = async function(adminUserId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const summary = await this.aggregate([
    {
      $match: {
        adminUserId: new mongoose.Types.ObjectId(adminUserId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action'
        },
        count: { $sum: 1 },
        lastPerformed: { $max: '$createdAt' },
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            lastPerformed: '$lastPerformed',
            successRate: '$successRate'
          }
        },
        totalActions: { $sum: '$count' }
      }
    },
    { $sort: { totalActions: -1 } }
  ]);
  
  return summary;
};

// Static method to get recent critical actions
AdminActionSchema.statics.getCriticalActions = async function(hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    severity: { $in: ['high', 'critical'] },
    createdAt: { $gte: startDate }
  })
  .populate('adminUserId', 'name email')
  .sort({ createdAt: -1 })
  .limit(50);
};

// Static method to get actions by target
AdminActionSchema.statics.getActionsByTarget = async function(targetType, targetId, limit = 20) {
  return this.find({
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId)
  })
  .populate('adminUserId', 'name email')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get admin performance metrics
AdminActionSchema.statics.getAdminMetrics = async function(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  const metrics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$adminUserId',
        totalActions: { $sum: 1 },
        successfulActions: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        criticalActions: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        categories: { $addToSet: '$category' },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'admin'
      }
    },
    { $unwind: '$admin' },
    {
      $project: {
        adminName: '$admin.name',
        adminEmail: '$admin.email',
        totalActions: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successfulActions', '$totalActions'] },
            100
          ]
        },
        criticalActions: 1,
        categoriesCount: { $size: '$categories' },
        lastActivity: 1
      }
    },
    { $sort: { totalActions: -1 } }
  ]);
  
  return metrics;
};

// Method to format action for display
AdminActionSchema.methods.getDisplayText = function() {
  const actionTexts = {
    'user_created': 'Created user account',
    'user_updated': 'Updated user information',
    'user_deleted': 'Deleted user account',
    'user_subscription_modified': 'Modified user subscription',
    'user_access_granted': 'Granted user access',
    'user_access_revoked': 'Revoked user access',
    'promo_code_created': 'Created promo code',
    'promo_code_updated': 'Updated promo code',
    'promo_code_deactivated': 'Deactivated promo code',
    'payment_refunded': 'Processed payment refund',
    'subscription_cancelled': 'Cancelled subscription',
    'subscription_extended': 'Extended subscription',
    'admin_override_applied': 'Applied admin override',
    'bulk_action_performed': 'Performed bulk action',
    'system_settings_changed': 'Changed system settings',
    'email_sent': 'Sent email',
    'data_exported': 'Exported data'
  };
  
  return actionTexts[this.action] || this.action;
};

module.exports = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema); 
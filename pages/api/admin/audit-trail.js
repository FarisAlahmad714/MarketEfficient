// pages/api/admin/audit-trail.js - Admin Audit Trail API
import { requireAdmin } from '../../../middleware/auth';
import AdminAction from '../../../models/AdminAction';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        const { 
          page = 1, 
          limit = 20, 
          category, 
          severity, 
          targetType,
          adminUserId,
          startDate,
          endDate,
          action
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (category) filter.category = category;
        if (severity) filter.severity = severity;
        if (targetType) filter.targetType = targetType;
        if (adminUserId) filter.adminUserId = adminUserId;
        if (action) filter.action = action;
        
        if (startDate || endDate) {
          filter.createdAt = {};
          if (startDate) filter.createdAt.$gte = new Date(startDate);
          if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get total count for pagination
        const totalCount = await AdminAction.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        // Fetch audit trail data
        const auditTrail = await AdminAction.find(filter)
          .populate('adminUserId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean();

        // Get summary statistics
        const summaryStats = await AdminAction.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalActions: { $sum: 1 },
              successfulActions: { $sum: { $cond: ['$success', 1, 0] } },
              failedActions: { $sum: { $cond: ['$success', 0, 1] } },
              categoriesBreakdown: {
                $push: {
                  category: '$category',
                  severity: '$severity',
                  success: '$success'
                }
              }
            }
          }
        ]);

        // Get category breakdown
        const categoryBreakdown = await AdminAction.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              successRate: { $avg: { $cond: ['$success', 1, 0] } },
              lastActivity: { $max: '$createdAt' }
            }
          },
          { $sort: { count: -1 } }
        ]);

        // Get top admins by activity
        const topAdmins = await AdminAction.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$adminUserId',
              actionCount: { $sum: 1 },
              lastActivity: { $max: '$createdAt' },
              successRate: { $avg: { $cond: ['$success', 1, 0] } }
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
              name: '$admin.name',
              email: '$admin.email',
              actionCount: 1,
              lastActivity: 1,
              successRate: { $multiply: ['$successRate', 100] }
            }
          },
          { $sort: { actionCount: -1 } },
          { $limit: 10 }
        ]);

        // Recent critical actions
        const recentCriticalActions = await AdminAction.find({
          ...filter,
          severity: { $in: ['high', 'critical'] },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
          .populate('adminUserId', 'name email')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        res.status(200).json({
          auditTrail: auditTrail.map(action => ({
            ...action,
            displayText: getActionDisplayText(action.action),
            timeAgo: getTimeAgo(action.createdAt)
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          },
          summary: {
            total: summaryStats[0]?.totalActions || 0,
            successful: summaryStats[0]?.successfulActions || 0,
            failed: summaryStats[0]?.failedActions || 0,
            successRate: summaryStats[0]?.totalActions > 0 
              ? ((summaryStats[0]?.successfulActions || 0) / summaryStats[0].totalActions * 100).toFixed(1)
              : '0'
          },
          categoryBreakdown: categoryBreakdown.map(cat => ({
            category: cat._id,
            count: cat.count,
            successRate: (cat.successRate * 100).toFixed(1),
            lastActivity: cat.lastActivity
          })),
          topAdmins,
          recentCriticalActions: recentCriticalActions.map(action => ({
            ...action,
            displayText: getActionDisplayText(action.action),
            timeAgo: getTimeAgo(action.createdAt)
          }))
        });

      } catch (error) {
        console.error('Audit trail API error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch audit trail',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}

function getActionDisplayText(action) {
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
    'promo_codes_generated': 'Generated promo codes',
    'payment_refunded': 'Processed payment refund',
    'subscription_cancelled': 'Cancelled subscription',
    'subscription_extended': 'Extended subscription',
    'admin_override_applied': 'Applied admin override',
    'bulk_action_performed': 'Performed bulk action',
    'system_settings_changed': 'Changed system settings',
    'email_sent': 'Sent email',
    'data_exported': 'Exported data'
  };
  
  return actionTexts[action] || action;
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
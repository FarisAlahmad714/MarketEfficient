// pages/api/admin/email-management.js - Email Management API
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
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

        // Get user statistics
        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const activeSubscribers = await Subscription.countDocuments({ 
          status: { $in: ['active', 'trialing'] }
        });

        // Get recent email activity from admin actions
        const recentEmails = await AdminAction.find({
          action: 'email_sent',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .populate('adminUserId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        // Get user breakdown by subscription status
        const userBreakdown = await User.aggregate([
          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'userId',
              as: 'subscription'
            }
          },
          {
            $addFields: {
              subscriptionStatus: {
                $cond: {
                  if: { $gt: [{ $size: '$subscription' }, 0] },
                  then: { $arrayElemAt: ['$subscription.status', 0] },
                  else: 'free'
                }
              }
            }
          },
          {
            $group: {
              _id: '$subscriptionStatus',
              count: { $sum: 1 },
              verifiedCount: {
                $sum: { $cond: ['$isVerified', 1, 0] }
              }
            }
          }
        ]);

        // Get inactive users count
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const inactiveUsers = await User.countDocuments({
          lastLoginAt: { $lt: thirtyDaysAgo },
          isVerified: true
        });

        res.status(200).json({
          stats: {
            totalUsers,
            verifiedUsers,
            activeSubscribers,
            inactiveUsers,
            unverifiedUsers: totalUsers - verifiedUsers
          },
          userBreakdown: userBreakdown.map(group => ({
            status: group._id || 'free',
            total: group.count,
            verified: group.verifiedCount
          })),
          recentEmails: recentEmails.map(email => ({
            sentAt: email.createdAt,
            type: email.details?.emailType || 'bulk',
            recipientCount: email.details?.recipientCount || 1,
            status: email.success ? 'sent' : 'failed',
            subject: email.details?.subject || 'N/A',
            sentBy: email.adminUserId?.name || 'System'
          }))
        });

      } catch (error) {
        console.error('Email management API error:', error);
        res.status(500).json({ 
          error: 'Failed to fetch email management data',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}
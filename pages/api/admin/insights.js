// pages/api/admin/insights.js - Real Security Monitoring Implementation
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import TestResults from '../../../models/TestResults';
import Subscription from '../../../models/Subscription';
import PaymentHistory from '../../../models/PaymentHistory';
import connectDB from '../../../lib/database';
import { startOfMonth, subMonths } from 'date-fns';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        // 1. INACTIVE USERS - Real calculation
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Find users who haven't logged in recently
        const inactiveUsers = await User.countDocuments({
          isVerified: true,
          $or: [
            { lastLogin: { $lt: thirtyDaysAgo } },
            { lastLogin: null }
          ]
        });

        // 2. REVENUE METRICS - From actual subscriptions
        const currentMonth = startOfMonth(new Date());
        const previousMonth = subMonths(currentMonth, 1);
        
        // Current month revenue
        const currentMonthSubs = await Subscription.aggregate([
          { 
            $match: { 
              createdAt: { $gte: currentMonth },
              amount: { $gt: 0 },
              status: { $in: ['active', 'trialing'] }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Previous month revenue
        const previousMonthSubs = await Subscription.aggregate([
          { 
            $match: { 
              createdAt: { $gte: previousMonth, $lt: currentMonth },
              amount: { $gt: 0 }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const currentTotal = (currentMonthSubs[0]?.total || 0) / 100; // cents to dollars
        const previousTotal = (previousMonthSubs[0]?.total || 0) / 100;
        const revenueChange = previousTotal > 0 
          ? ((currentTotal - previousTotal) / previousTotal) * 100 
          : 0;

        // 3. MOST ACTIVE ASSET - From actual test results
        const assetActivity = await TestResults.aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: '$assetSymbol',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]);

        const topAsset = assetActivity[0];

        // 4. ADDITIONAL USEFUL METRICS
        const totalUsers = await User.countDocuments({ isVerified: true });
        const activeSubscriptions = await Subscription.countDocuments({ 
          status: { $in: ['active', 'trialing'] } 
        });
        const recentSignups = await User.countDocuments({
          createdAt: { $gte: thirtyDaysAgo }
        });

        // 5. SECURITY METRICS
        const lockedAccounts = await User.countDocuments({
          lockUntil: { $gt: new Date() }
        });
        
        const failedLogins = await User.aggregate([
          {
            $match: {
              loginAttempts: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalAttempts: { $sum: '$loginAttempts' }
            }
          }
        ]);

        res.status(200).json({
          // User metrics
          totalUsers,
          inactiveUsers,
          recentSignups,
          activeSubscriptions,
          
          // Revenue metrics
          currentMonthRevenue: currentTotal.toFixed(2),
          previousMonthRevenue: previousTotal.toFixed(2),
          revenueChange: revenueChange.toFixed(2),
          
          // Activity metrics
          topAsset: topAsset?._id || 'None',
          topAssetTests: topAsset?.count || 0,
          
          // Security metrics
          lockedAccounts,
          failedLoginAttempts: failedLogins[0]?.totalAttempts || 0,

          // Timestamp
          lastUpdated: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch insights' });
      } finally {
        resolve();
      }
    });
  });
}
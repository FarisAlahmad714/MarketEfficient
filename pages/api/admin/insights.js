import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import Payment from '../../../models/Payment';
import TestResults from '../../../models/TestResults';
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

        // Inactive Users: Users with no activity in the last 30 days
        const inactiveCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const inactiveUsers = await User.countDocuments({
          lastLogin: { $lt: inactiveCutoff }, // Assuming User model has lastLogin
          isVerified: true
        });

        // Revenue Change: Compare current vs. previous month
        const currentMonth = startOfMonth(new Date());
        const previousMonth = subMonths(currentMonth, 1);
        const currentMonthRevenue = await Payment.aggregate([
          { $match: { createdAt: { $gte: currentMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const previousMonthRevenue = await Payment.aggregate([
          { $match: { createdAt: { $gte: previousMonth, $lt: currentMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const currentTotal = currentMonthRevenue[0]?.total || 0;
        const previousTotal = previousMonthRevenue[0]?.total || 0;
        const revenueChange = previousTotal
          ? ((currentTotal - previousTotal) / previousTotal) * 100
          : 0;

        // Top Engagement Region: Region with highest average tests per user
        const engagementByRegion = await User.aggregate([
          {
            $lookup: {
              from: 'testresults',
              localField: '_id',
              foreignField: 'userId',
              as: 'tests'
            }
          },
          {
            $group: {
              _id: '$location', // Assuming User model has location
              avgTests: { $avg: { $size: '$tests' } }
            }
          },
          { $sort: { avgTests: -1 } },
          { $limit: 1 }
        ]);

        const topRegion = engagementByRegion[0]?._id || 'N/A';
        const topRegionEngagement = engagementByRegion[0]?.avgTests || 0;

        res.status(200).json({
          inactiveUsers,
          revenueChange: revenueChange.toFixed(2),
          topRegion,
          topRegionEngagement: topRegionEngagement.toFixed(1)
        });
      } catch (error) {
        console.error('Insights fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
      } finally {
        resolve();
      }
    });
  });
}
import connectDB from '../../../../lib/database';
import BiasTestAnalytics from '../../../../models/BiasTestAnalytics';
import { requireAdmin } from '../../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

    // Aggregate timezone data from bias test analytics
    const timezoneAggregation = await BiasTestAnalytics.aggregate([
      {
        $match: {
          timezone: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$timezone',
          userCount: { $addToSet: '$userId' },
          totalTests: { $sum: 1 },
          avgScore: { $avg: '$score' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          timezone: '$_id',
          userCount: { $size: '$userCount' },
          totalTests: 1,
          avgTestsPerUser: { $divide: ['$totalTests', { $size: '$userCount' }] },
          avgScore: { $round: ['$avgScore', 2] },
          lastActivity: 1
        }
      },
      {
        $sort: { userCount: -1 }
      }
    ]);

    // Find the top timezone
    const topTimezone = timezoneAggregation.length > 0 ? {
      name: timezoneAggregation[0].timezone,
      userCount: timezoneAggregation[0].userCount,
      avgTestsPerUser: Math.round(timezoneAggregation[0].avgTestsPerUser * 10) / 10,
      totalTests: timezoneAggregation[0].totalTests
    } : {
      name: 'UTC',
      userCount: 0,
      avgTestsPerUser: 0,
      totalTests: 0
    };

    // Process timezone stats for display
    const timezoneStats = timezoneAggregation.map(tz => ({
      timezone: tz.timezone,
      userCount: tz.userCount,
      totalTests: tz.totalTests,
      avgTestsPerUser: Math.round(tz.avgTestsPerUser * 10) / 10,
      avgScore: tz.avgScore,
      lastActivity: tz.lastActivity
    }));

    // Calculate engagement insights
    const totalUsers = timezoneStats.reduce((sum, tz) => sum + tz.userCount, 0);
    const totalTests = timezoneStats.reduce((sum, tz) => sum + tz.totalTests, 0);
    const overallAvgTestsPerUser = totalUsers > 0 ? Math.round((totalTests / totalUsers) * 10) / 10 : 0;

    // Get top 5 timezones by user count
    const topTimezones = timezoneStats.slice(0, 5);

    res.status(200).json({
      topTimezone,
      timezoneStats: topTimezones,
      insights: {
        totalUsers,
        totalTests,
        overallAvgTestsPerUser,
        uniqueTimezones: timezoneStats.length
      }
    });

      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timezone analysis data' });
      } finally {
        resolve();
      }
    });
  });
}
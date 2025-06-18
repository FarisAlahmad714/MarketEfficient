import connectDB from '../../../../lib/database';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find inactive users
    const inactiveUsers = await User.find({
      $or: [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } }
      ]
    }).select('name email lastLogin createdAt subscription').lean();

    // Calculate days inactive for each user
    const usersWithInactivity = inactiveUsers.map(user => {
      const lastActivity = user.lastLogin || user.createdAt;
      const daysInactive = Math.floor((new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24));
      
      return {
        ...user,
        daysInactive,
        lastLogin: lastActivity
      };
    });

    // Sort by days inactive (most inactive first)
    usersWithInactivity.sort((a, b) => b.daysInactive - a.daysInactive);

    // Calculate summary statistics
    const totalInactive = usersWithInactivity.length;
    const avgDaysInactive = totalInactive > 0 
      ? Math.round(usersWithInactivity.reduce((sum, user) => sum + user.daysInactive, 0) / totalInactive)
      : 0;
    const withSubscriptions = usersWithInactivity.filter(user => 
      user.subscription && user.subscription.status === 'active'
    ).length;

    // Analytics breakdowns
    const inactivityBreakdown = [
      { 
        range: '30-60 days', 
        count: usersWithInactivity.filter(u => u.daysInactive >= 30 && u.daysInactive <= 60).length 
      },
      { 
        range: '61-90 days', 
        count: usersWithInactivity.filter(u => u.daysInactive >= 61 && u.daysInactive <= 90).length 
      },
      { 
        range: '91-180 days', 
        count: usersWithInactivity.filter(u => u.daysInactive >= 91 && u.daysInactive <= 180).length 
      },
      { 
        range: '180+ days', 
        count: usersWithInactivity.filter(u => u.daysInactive > 180).length 
      }
    ];

    const subscriptionBreakdown = [
      { 
        status: 'Active', 
        count: usersWithInactivity.filter(u => u.subscription?.status === 'active').length 
      },
      { 
        status: 'Expired', 
        count: usersWithInactivity.filter(u => u.subscription?.status === 'expired').length 
      },
      { 
        status: 'Cancelled', 
        count: usersWithInactivity.filter(u => u.subscription?.status === 'cancelled').length 
      },
      { 
        status: 'No Subscription', 
        count: usersWithInactivity.filter(u => !u.subscription).length 
      }
    ];

    res.status(200).json({
      inactiveUsers: usersWithInactivity,
      summary: {
        totalInactive,
        avgDaysInactive,
        withSubscriptions
      },
      analytics: {
        inactivityBreakdown,
        subscriptionBreakdown
      }
    });

      } catch (error) {
        console.error('Inactive users recommendation error:', error);
        res.status(500).json({ error: 'Failed to fetch inactive users data' });
      } finally {
        resolve();
      }
    });
  });
}
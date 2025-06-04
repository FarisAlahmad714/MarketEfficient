// pages/api/admin/security-monitoring.js
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        // Get time ranges
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // 1. Failed login attempts
        const failedLoginStats = await User.aggregate([
          {
            $match: {
              loginAttempts: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              totalAttempts: { $sum: '$loginAttempts' },
              maxAttempts: { $max: '$loginAttempts' }
            }
          }
        ]);

        // 2. Currently locked accounts
        const lockedAccounts = await User.find(
          { lockUntil: { $gt: now } },
          'email lockUntil loginAttempts lastLogin'
        ).sort({ lockUntil: -1 });

        // 3. Recent login activity
        const recentLogins = await User.find(
          { lastLogin: { $gte: oneDayAgo } },
          'email lastLogin isAdmin'
        ).sort({ lastLogin: -1 }).limit(20);

        // 4. Users who haven't logged in recently (potential security risk)
        const dormantAccounts = await User.countDocuments({
          lastLogin: { $lt: oneWeekAgo },
          isVerified: true
        });

        // 5. Admin activity
        const adminActivity = await User.find(
          { isAdmin: true },
          'email lastLogin loginAttempts'
        ).sort({ lastLogin: -1 });

        // 6. Unverified accounts (potential spam)
        const unverifiedAccounts = await User.countDocuments({
          isVerified: false,
          createdAt: { $lt: oneDayAgo }
        });

        // 7. Security summary
        const summary = {
          totalFailedAttempts: failedLoginStats[0]?.totalAttempts || 0,
          usersWithFailedAttempts: failedLoginStats[0]?.totalUsers || 0,
          currentlyLockedAccounts: lockedAccounts.length,
          recentLoginCount: recentLogins.length,
          dormantAccounts,
          unverifiedOldAccounts: unverifiedAccounts,
          adminCount: adminActivity.length
        };

        res.status(200).json({
          summary,
          lockedAccounts: lockedAccounts.map(acc => ({
            email: acc.email,
            lockUntil: acc.lockUntil,
            attempts: acc.loginAttempts,
            lastLogin: acc.lastLogin
          })),
          recentLogins: recentLogins.slice(0, 10).map(user => ({
            email: user.email,
            lastLogin: user.lastLogin,
            isAdmin: user.isAdmin
          })),
          adminActivity: adminActivity.map(admin => ({
            email: admin.email,
            lastLogin: admin.lastLogin,
            failedAttempts: admin.loginAttempts
          })),
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Security monitoring error:', error);
        res.status(500).json({ error: 'Failed to fetch security data' });
      } finally {
        resolve();
      }
    });
  });
}
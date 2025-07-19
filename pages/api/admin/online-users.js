// pages/api/admin/online-users.js - Get currently online users
import { requireAdmin } from '../../../middleware/auth';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import { trackUserActivity } from '../../../middleware/activityTracker';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    trackUserActivity(req, res, () => {
      requireAdmin(req, res, async () => {
      try {
        await connectDB();

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get users active in the last 24 hours (check both lastActiveAt and lastLogin)
        const activeUsers = await User.find({
          $and: [
            { isVerified: true },
            {
              $or: [
                { lastActiveAt: { $gte: twentyFourHoursAgo } },
                { lastLogin: { $gte: twentyFourHoursAgo } }
              ]
            }
          ]
        })
        .select('name email lastActiveAt lastLogin profileImageUrl isAdmin')
        .sort({ lastActiveAt: -1, lastLogin: -1 })
        .lean()
        .limit(100);

        // Categorize users by activity level
        const onlineUsers = activeUsers.map(user => {
          // Use lastActiveAt if available, otherwise fall back to lastLogin
          const activityTime = user.lastActiveAt || user.lastLogin;
          const lastActive = new Date(activityTime);
          const millisAgo = now - lastActive;
          const minutesAgo = Math.floor(millisAgo / 1000 / 60);
          const hoursAgo = Math.floor(minutesAgo / 60);
          
          let status;
          let statusDisplay;
          
          if (minutesAgo < 5) {
            status = 'active_now';
            statusDisplay = minutesAgo < 1 ? 'Active now' : `${minutesAgo}m ago`;
          } else if (minutesAgo < 60) {
            status = 'active';
            statusDisplay = `${minutesAgo}m ago`;
          } else if (hoursAgo < 24) {
            status = 'recently_active';
            statusDisplay = hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
          } else {
            status = 'inactive';
            statusDisplay = 'Over 24h ago';
          }

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            isAdmin: user.isAdmin,
            lastActiveAt: activityTime,
            minutesAgo,
            hoursAgo,
            status,
            statusDisplay,
            isUsingLastLogin: !user.lastActiveAt // Flag to show if we're using fallback data
          };
        });
        
        // Sort by most recent activity (considering both fields)
        onlineUsers.sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));

        // Get total counts (check both fields)
        const totalOnline = await User.countDocuments({
          $and: [
            { isVerified: true },
            {
              $or: [
                { lastActiveAt: { $gte: fiveMinutesAgo } },
                { lastLogin: { $gte: fiveMinutesAgo } }
              ]
            }
          ]
        });

        const totalActiveLastHour = await User.countDocuments({
          $and: [
            { isVerified: true },
            {
              $or: [
                { lastActiveAt: { $gte: oneHourAgo } },
                { lastLogin: { $gte: oneHourAgo } }
              ]
            }
          ]
        });

        const totalActiveToday = await User.countDocuments({
          $and: [
            { isVerified: true },
            {
              $or: [
                { lastActiveAt: { $gte: twentyFourHoursAgo } },
                { lastLogin: { $gte: twentyFourHoursAgo } }
              ]
            }
          ]
        });

        res.status(200).json({
          success: true,
          onlineUsers,
          stats: {
            totalOnline,
            totalActiveLastHour,
            totalActiveToday,
            timestamp: now
          }
        });

        resolve();
      } catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json({ error: 'Failed to fetch online users' });
        resolve();
      }
      });
    });
  });
}
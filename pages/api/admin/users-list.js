// pages/api/admin/users-list.js - Get users list for recipient selection
import { requireAdmin } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import User from '../../../models/User';

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
          limit = 50, 
          search = '', 
          filter = 'all' 
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = {};

        // Search filter
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }

        // User type filter
        switch (filter) {
          case 'verified':
            query.isVerified = true;
            break;
          case 'unverified':
            query.isVerified = false;
            break;
          case 'admin':
            query.isAdmin = true;
            break;
          case 'subscribers':
            // We'll handle this with a separate aggregation
            break;
          case 'free':
            // We'll handle this with a separate aggregation
            break;
          case 'inactive':
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            query.lastLoginAt = { $lt: thirtyDaysAgo };
            break;
          case 'all':
          default:
            // No additional filter
            break;
        }

        // Get users
        const users = await User.find(query, {
          _id: 1,
          name: 1,
          email: 1,
          isVerified: 1,
          isAdmin: 1,
          createdAt: 1,
          lastLoginAt: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

        // Get total count
        const totalUsers = await User.countDocuments(query);

        // Format users for frontend
        const formattedUsers = users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          status: user.isAdmin ? 'admin' : (user.isVerified ? 'verified' : 'unverified')
        }));

        res.status(200).json({
          message: 'Users retrieved successfully',
          users: formattedUsers,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalUsers / limitNum),
            totalUsers,
            hasNext: pageNum < Math.ceil(totalUsers / limitNum),
            hasPrev: pageNum > 1
          }
        });

      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to retrieve users',
          message: error.message 
        });
      } finally {
        resolve();
      }
    });
  });
}
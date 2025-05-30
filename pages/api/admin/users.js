// pages/api/admin/users.js
import { createApiHandler } from '../../../lib/api-handler';
import { requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import User from '../../../models/User';
import TestResults from '../../../models/TestResults';
import Subscription from '../../../models/Subscription';

async function usersHandler(req, res) {
  // User is already authenticated and verified as admin via middleware

  // GET method - fetch users with pagination and subscription details
  if (req.method === 'GET') {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search parameter
    const search = req.query.search || '';
    const searchRegex = new RegExp(search, 'i');

    // Build query
    const query = search
      ? { $or: [{ name: searchRegex }, { email: searchRegex }] }
      : {};

    // Get users with pagination
    let users = await User.find(query)
      .select('-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Always fetch subscription details (no longer conditional)
    users = await Promise.all(
      users.map(async (user) => {
        const subscription = await Subscription.findOne({ userId: user._id }).populate(
          'promoCodeUsed',
          'code description discountAmount'
        );
        return {
          ...user.toObject(),
          subscription: subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                amount: subscription.amount,
                promoCodeUsed: subscription.promoCodeUsed,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
              }
            : null,
        };
      })
    );

    // Get total users count for pagination
    const total = await User.countDocuments(query);

    return res.status(200).json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  }
  // DELETE method - delete a user
  else if (req.method === 'DELETE') {
    const { userId } = req.query;

    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'USER_ID_REQUIRED',
      });
    }

    // Find the user to check if they exist and get their status
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Safety check: Don't allow deleting admin users
    if (userToDelete.isAdmin) {
      return res.status(403).json({
        error: 'Cannot delete admin users',
        code: 'CANNOT_DELETE_ADMIN',
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Cascading deletion for related data
    await TestResults.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully',
    });
  } else {
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['GET', 'DELETE'],
    });
  }
}

// Export with admin authentication required
export default createApiHandler(composeMiddleware(requireAdmin, usersHandler), {
  methods: ['GET', 'DELETE'],
});
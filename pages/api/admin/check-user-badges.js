// pages/api/admin/check-user-badges.js
// Admin endpoint to manually check and award badges for a specific user

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth, requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import User from '../../../models/User';
import TestResults from '../../../models/TestResults';
import { checkAndNotifyNewBadges } from '../../../lib/badge-service';
import logger from '../../../lib/logger';

async function checkUserBadgesHandler(req, res) {
  const { userId, userEmail } = req.body;

  if (!userId && !userEmail) {
    return res.status(400).json({
      success: false,
      error: 'Either userId or userEmail is required'
    });
  }

  try {
    // Find the user
    let user;
    if (userId) {
      user = await User.findById(userId).select('username email earnedBadges notifications lastBadgeCheck');
    } else {
      user = await User.findOne({ email: userEmail }).select('username email earnedBadges notifications lastBadgeCheck');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's test results
    const testResults = await TestResults.find({
      userId: user._id,
      status: { $in: ['completed', 'processing'] },
      score: { $exists: true },
      totalPoints: { $exists: true }
    }).select('testType subType score totalPoints status completedAt');

    // Check current notification settings
    const notificationIssues = [];
    if (!user.notifications?.email) notificationIssues.push('email notifications disabled');
    if (!user.notifications?.badges) notificationIssues.push('badge notifications disabled');

    // Fix notification settings if needed
    if (notificationIssues.length > 0) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'notifications.email': true,
          'notifications.badges': true,
          'notifications.metrics': true,
          'notifications.reminders': true
        }
      });
      logger.log(`Fixed notification settings for user: ${user.username || user.email}`);
    }

    // Run badge check
    const badgeResult = await checkAndNotifyNewBadges(user._id);

    // Get updated user data
    const updatedUser = await User.findById(user._id).select('earnedBadges lastBadgeCheck');

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        previousBadges: user.earnedBadges || [],
        currentBadges: updatedUser.earnedBadges || [],
        lastBadgeCheck: updatedUser.lastBadgeCheck
      },
      testResults: {
        total: testResults.length,
        breakdown: testResults.reduce((acc, test) => {
          const key = test.testType;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
      },
      notificationIssues: notificationIssues,
      badgeResult: {
        success: badgeResult.success,
        newBadges: badgeResult.newBadges || 0,
        badges: badgeResult.badges || [],
        reason: badgeResult.reason,
        error: badgeResult.error
      }
    });

  } catch (error) {
    logger.error('Error checking user badges:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check user badges',
      message: error.message
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, requireAdmin, checkUserBadgesHandler),
  { methods: ['POST'] }
);
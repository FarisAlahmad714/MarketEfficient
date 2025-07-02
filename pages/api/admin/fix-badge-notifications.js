// pages/api/admin/fix-badge-notifications.js
// Admin endpoint to fix notification settings and retroactively award badges

import { createApiHandler } from '../../../lib/api-handler';
import { requireAuth, requireAdmin } from '../../../middleware/auth';
import { composeMiddleware } from '../../../lib/api-handler';
import User from '../../../models/User';
import { checkAndNotifyNewBadges } from '../../../lib/badge-service';
import logger from '../../../lib/logger';

async function fixBadgeNotificationsHandler(req, res) {
  try {
    logger.log('Starting badge notification fix process...');
    
    // Find all users with notification issues
    const usersWithIssues = await User.find({
      $or: [
        { 'notifications.email': { $ne: true } },
        { 'notifications.badges': { $ne: true } },
        { 'notifications.email': { $exists: false } },
        { 'notifications.badges': { $exists: false } }
      ]
    }).select('username email notifications earnedBadges');

    logger.log(`Found ${usersWithIssues.length} users with notification issues`);

    const results = {
      usersFixed: 0,
      badgesAwarded: 0,
      errors: []
    };

    // Fix each user's notification settings and check for badges
    for (const user of usersWithIssues) {
      try {
        // Update notification settings to ensure both email and badges are enabled
        const updateResult = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              'notifications.email': true,
              'notifications.badges': true,
              'notifications.metrics': true,
              'notifications.reminders': true
            }
          },
          { new: true }
        );

        if (updateResult) {
          results.usersFixed++;
          logger.log(`Fixed notifications for user: ${user.username || user.email}`);

          // Run badge check for this user
          const badgeResult = await checkAndNotifyNewBadges(user._id);
          
          if (badgeResult.success && badgeResult.newBadges > 0) {
            results.badgesAwarded += badgeResult.newBadges;
            logger.log(`Awarded ${badgeResult.newBadges} badges to ${user.username || user.email}: ${badgeResult.badges?.map(b => b.title).join(', ')}`);
          }
        }
      } catch (error) {
        logger.error(`Error fixing user ${user.username || user.email}:`, error);
        results.errors.push({
          userId: user._id,
          username: user.username,
          email: user.email,
          error: error.message
        });
      }
    }

    // Also run badge check for all users to catch any missed badges
    const allUsers = await User.find({}).select('_id username email earnedBadges');
    let additionalBadges = 0;

    for (const user of allUsers) {
      try {
        const badgeResult = await checkAndNotifyNewBadges(user._id);
        if (badgeResult.success && badgeResult.newBadges > 0) {
          additionalBadges += badgeResult.newBadges;
          logger.log(`Additional badges for ${user.username || user.email}: ${badgeResult.newBadges}`);
        }
      } catch (error) {
        logger.error(`Error checking badges for ${user.username || user.email}:`, error);
      }
    }

    results.additionalBadgesAwarded = additionalBadges;
    
    logger.log(`Badge fix complete: ${results.usersFixed} users fixed, ${results.badgesAwarded + additionalBadges} total badges awarded`);

    return res.status(200).json({
      success: true,
      message: 'Badge notification fix completed',
      results: {
        usersWithIssues: usersWithIssues.length,
        usersFixed: results.usersFixed,
        badgesAwarded: results.badgesAwarded,
        additionalBadgesAwarded: additionalBadges,
        totalBadgesAwarded: results.badgesAwarded + additionalBadges,
        errors: results.errors
      }
    });

  } catch (error) {
    logger.error('Error in badge notification fix:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fix badge notifications',
      message: error.message
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, requireAdmin, fixBadgeNotificationsHandler),
  { methods: ['POST'] }
);
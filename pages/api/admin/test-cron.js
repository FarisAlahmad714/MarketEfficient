import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { sendMetricsEmail, sendInactiveUserReminder } from '../../../lib/email-service';
import { getUserMetrics, getInactiveUsers } from '../../../lib/user-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply authentication middleware (admin only)
  return new Promise((resolve) => {
    authenticate({ adminOnly: true })(req, res, async () => {
      try {
        await connectDB();
        
        const { type, userId, dryRun = false } = req.body;
        
        switch (type) {
          case 'weekly-metrics':
            return await testWeeklyMetrics(req, res, userId, dryRun);
          case 'monthly-metrics':
            return await testMonthlyMetrics(req, res, userId, dryRun);
          case 'inactive-reminders':
            return await testInactiveReminders(req, res, dryRun);
          case 'subscription-sync':
            return await testSubscriptionSync(req, res, dryRun);
          default:
            return res.status(400).json({ error: 'Invalid test type' });
        }
      } catch (error) {
        console.error('Test cron error:', error);
        return res.status(500).json({ error: 'Test failed' });
      } finally {
        resolve();
      }
    });
  });
}
async function testSubscriptionSync(req, res) {
  try {
    const Subscription = require('../../../models/Subscription');
    const User = require('../../../models/User');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const subscriptions = await Subscription.find({
      stripeSubscriptionId: { $exists: true, $ne: null },
      status: { $in: ['active', 'trialing', 'past_due'] }
    }).limit(10); // Limit for testing
    
    const results = [];
    let updated = 0;
    
    for (const subscription of subscriptions) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        
        if (stripeSubscription.status !== subscription.status) {
          const oldStatus = subscription.status;
          
          subscription.status = stripeSubscription.status;
          subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          await subscription.save();
          
          const user = await User.findById(subscription.userId);
          if (user) {
            await user.updateSubscriptionStatus(stripeSubscription.status, subscription.plan);
          }
          
          updated++;
          results.push({
            subscriptionId: subscription._id,
            email: user?.email,
            oldStatus,
            newStatus: stripeSubscription.status
          });
        }
      } catch (error) {
        results.push({
          subscriptionId: subscription._id,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'Subscription sync test completed',
      checked: subscriptions.length,
      updated,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function testWeeklyMetrics(req, res, userId, dryRun = false) {
  try {
    let users;
    
    if (userId) {
      // Test for specific user
      users = await User.find({ _id: userId, isVerified: true });
    } else {
      // Test for all verified users (limit to 5 for testing)
      users = await User.find({ 
        isVerified: true,
        'notifications.email': { $ne: false }
      }).limit(5);
    }
    
    const results = [];
    let processedCount = 0;
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'weekly');
        
        if (metrics.testsTaken > 0) {
          if (!dryRun) {
            await sendMetricsEmail(user, metrics, 'weekly');
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          results.push({
            email: user.email,
            status: dryRun ? 'would_send' : 'sent',
            metrics
          });
        } else {
          results.push({
            email: user.email,
            status: 'skipped',
            reason: 'No tests taken this week',
            metrics
          });
        }
        processedCount++;
      } catch (error) {
        console.error(`Error processing weekly metrics for ${user.email}:`, error);
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: `Weekly metrics test completed${dryRun ? ' (dry run)' : ''}`,
      totalUsers: users.length,
      processed: processedCount,
      dryRun,
      results
    });
  } catch (error) {
    console.error('Weekly metrics test error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function testMonthlyMetrics(req, res, userId, dryRun = false) {
  try {
    let users;
    
    if (userId) {
      users = await User.find({ _id: userId, isVerified: true });
    } else {
      users = await User.find({ 
        isVerified: true,
        'notifications.email': { $ne: false }
      }).limit(5);
    }
    
    const results = [];
    let processedCount = 0;
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'monthly');
        
        if (metrics.testsTaken > 0) {
          if (!dryRun) {
            await sendMetricsEmail(user, metrics, 'monthly');
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          results.push({
            email: user.email,
            status: dryRun ? 'would_send' : 'sent',
            metrics
          });
        } else {
          results.push({
            email: user.email,
            status: 'skipped',
            reason: 'No tests taken this month',
            metrics
          });
        }
        processedCount++;
      } catch (error) {
        console.error(`Error processing monthly metrics for ${user.email}:`, error);
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: `Monthly metrics test completed${dryRun ? ' (dry run)' : ''}`,
      totalUsers: users.length,
      processed: processedCount,
      dryRun,
      results
    });
  } catch (error) {
    console.error('Monthly metrics test error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function testInactiveReminders(req, res, dryRun = false) {
  try {
    console.log('Starting inactive reminders test...');
    const inactiveUsers = await getInactiveUsers(30);
    console.log(`Found ${inactiveUsers.length} inactive users`);
    
    // Filter users who have email notifications enabled and limit for testing
    const eligibleUsers = inactiveUsers
      .filter(user => {
        const hasEmailEnabled = user.notifications?.email !== false;
        console.log(`User ${user.email}: email enabled = ${hasEmailEnabled}`);
        return hasEmailEnabled;
      })
      .slice(0, 5); // Limit to 5 for testing
    
    console.log(`${eligibleUsers.length} users are eligible for inactive reminders`);
    
    const results = [];
    let processedCount = 0;
    
    for (const user of eligibleUsers) {
      try {
        console.log(`Processing user ${user.email} for inactive reminder...`);
        if (!dryRun) {
          console.log(`Sending inactive reminder email to ${user.email}...`);
          const emailResult = await sendInactiveUserReminder(user);
          console.log(`Email result for ${user.email}:`, emailResult);
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        results.push({
          email: user.email,
          status: dryRun ? 'would_send' : 'sent',
          lastLoginAt: user.lastLoginAt
        });
        processedCount++;
        console.log(`Successfully processed ${user.email}`);
      } catch (error) {
        console.error(`Error sending inactive reminder to ${user.email}:`, error);
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: `Inactive user reminders test completed${dryRun ? ' (dry run)' : ''}`,
      totalInactive: inactiveUsers.length,
      eligible: eligibleUsers.length,
      processed: processedCount,
      dryRun,
      results
    });
  } catch (error) {
    console.error('Inactive reminders test error:', error);
    return res.status(500).json({ error: error.message });
  }
} 
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
        
        const { type, userId } = req.body;
        
        switch (type) {
          case 'weekly-metrics':
            return await testWeeklyMetrics(req, res, userId);
          case 'monthly-metrics':
            return await testMonthlyMetrics(req, res, userId);
          case 'inactive-reminders':
            return await testInactiveReminders(req, res);
            case 'subscription-sync':
            return await testSubscriptionSync(req, res);
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

async function testWeeklyMetrics(req, res, userId) {
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
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'weekly');
        
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'weekly');
          results.push({
            email: user.email,
            status: 'sent',
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
      } catch (error) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'Weekly metrics test completed',
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function testMonthlyMetrics(req, res, userId) {
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
    
    for (const user of users) {
      try {
        const metrics = await getUserMetrics(user._id, 'monthly');
        
        if (metrics.testsTaken > 0) {
          await sendMetricsEmail(user, metrics, 'monthly');
          results.push({
            email: user.email,
            status: 'sent',
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
      } catch (error) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'Monthly metrics test completed',
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function testInactiveReminders(req, res) {
  try {
    const inactiveUsers = await getInactiveUsers(30);
    
    // Filter users who have email notifications enabled and limit for testing
    const eligibleUsers = inactiveUsers
      .filter(user => user.notifications?.email !== false)
      .slice(0, 5); // Limit to 5 for testing
    
    const results = [];
    
    for (const user of eligibleUsers) {
      try {
        await sendInactiveUserReminder(user);
        results.push({
          email: user.email,
          status: 'sent'
        });
      } catch (error) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'Inactive user reminders test completed',
      totalInactive: inactiveUsers.length,
      eligible: eligibleUsers.length,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
} 
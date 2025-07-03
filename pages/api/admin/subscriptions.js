import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import Payment from '../../../models/Payment';
import AdminAction from '../../../models/AdminAction';
import { grantAdminAccess, cancelSubscriptionAtPeriodEnd, getSubscriptionAnalytics } from '../../../lib/subscriptionUtils';
import { cancelSubscription as cancelStripeSubscription } from '../../../lib/stripe';
import connectDB from '../../../lib/database';
import { createApiHandler, composeMiddleware } from '../../../lib/api-handler';
import { requireAdmin } from '../../../middleware/auth';

async function subscriptionsHandler(req, res) {
  // User is already authenticated and verified as admin via middleware
  await connectDB();

  try {
    // Get admin user for logging purposes
    const admin = req.user;

    switch (req.method) {
      case 'GET':
        return await getSubscriptions(req, res);
      case 'POST':
        return await createSubscription(req, res, admin);
      case 'PUT':
        return await updateSubscription(req, res, admin);
      case 'DELETE':
        return await cancelSubscription(req, res, admin);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Subscriptions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubscriptions(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = 'all',
      plan = 'all',
      analytics = false 
    } = req.query;

    // If analytics requested, return analytics data
    if (analytics === 'true') {
      const analyticsData = await getSubscriptionAnalytics();
      return res.status(200).json(analyticsData);
    }
    
    const query = {};
    
    // Search filter (by user email or name) with regex injection protection
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      const escapedSearch = escapeRegex(search);
      const users = await User.find({
        $or: [
          { email: { $regex: escapedSearch, $options: 'i' } },
          { name: { $regex: escapedSearch, $options: 'i' } }
        ]
      }).select('_id');
      
      query.userId = { $in: users.map(u => u._id) };
    }
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Plan filter
    if (plan !== 'all') {
      query.plan = plan;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subscriptions = await Subscription.find(query)
      .populate('userId', 'name email createdAt registrationPromoCode')
      .populate('promoCodeUsed', 'code description discountAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get payment history for each subscription
    const subscriptionsWithPayments = await Promise.all(
      subscriptions.map(async (subscription) => {
        const payments = await Payment.find({ 
          userId: subscription.userId._id 
        })
        .sort({ createdAt: -1 })
        .limit(5);

        return {
          ...subscription.toObject(),
          recentPayments: payments,
          daysRemaining: subscription.getDaysRemaining(),
          isExpired: subscription.isExpired()
        };
      })
    );

    res.status(200).json({
      subscriptions: subscriptionsWithPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}

async function createSubscription(req, res, admin) {
  try {
    const { userId, action, reason } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'User ID and action are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let result;

    switch (action) {
      case 'grant_admin_access':
        result = await grantAdminAccess(userId, admin._id, reason);
        break;

      case 'grant_free_access':
        // Grant free access for a specific period
        const { duration = 30 } = req.body; // Default 30 days
        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + parseInt(duration));

        result = await createOrUpdateSubscription(userId, {
          status: 'active',
          plan: 'monthly',
          amount: 0,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          discountAmount: 2900, // Full discount
          originalAmount: 2900
        });

        // Log admin action
        await AdminAction.logAction({
          adminUserId: admin._id,
          action: 'user_access_granted',
          targetType: 'user',
          targetId: userId,
          targetIdentifier: user.email,
          description: `Granted ${duration} days free access to user ${user.email}`,
          details: {
            reason,
            duration: parseInt(duration),
            periodEnd
          },
          category: 'user_management',
          severity: 'medium'
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({
      message: 'Subscription action completed successfully',
      subscription: result
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

async function updateSubscription(req, res, admin) {
  try {
    const { id } = req.query;
    const { action, reason, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await Subscription.findById(id).populate('userId', 'name email');
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let result;

    if (action) {
      switch (action) {
        case 'extend_subscription':
          const { days = 30 } = req.body;
          const newEndDate = new Date(subscription.currentPeriodEnd || new Date());
          newEndDate.setDate(newEndDate.getDate() + parseInt(days));
          
          subscription.currentPeriodEnd = newEndDate;
          if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
            subscription.status = 'active';
          }
          
          result = await subscription.save();

          // Log admin action
          await AdminAction.logAction({
            adminUserId: admin._id,
            action: 'subscription_extended',
            targetType: 'subscription',
            targetId: subscription._id,
            targetIdentifier: subscription.userId.email,
            description: `Extended subscription by ${days} days for user ${subscription.userId.email}`,
            details: {
              reason,
              daysExtended: parseInt(days),
              newEndDate
            },
            category: 'financial',
            severity: 'medium'
          });
          break;

        case 'change_plan':
          const { newPlan } = req.body;
          if (!['monthly', 'annual'].includes(newPlan)) {
            return res.status(400).json({ error: 'Invalid plan' });
          }

          const previousPlan = subscription.plan;
          subscription.plan = newPlan;
          subscription.amount = newPlan === 'monthly' ? 2900 : 24900;
          
          result = await subscription.save();

          // Update user subscription tier
          const user = await User.findById(subscription.userId);
          if (user) {
            await user.updateSubscriptionStatus(subscription.status, newPlan);
          }

          // Log admin action
          await AdminAction.logAction({
            adminUserId: admin._id,
            action: 'user_subscription_modified',
            targetType: 'subscription',
            targetId: subscription._id,
            targetIdentifier: subscription.userId.email,
            description: `Changed subscription plan from ${previousPlan} to ${newPlan} for user ${subscription.userId.email}`,
            details: {
              reason,
              previousPlan,
              newPlan
            },
            category: 'financial',
            severity: 'medium'
          });
          break;

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      // Direct field updates
      const allowedUpdates = ['status', 'currentPeriodEnd', 'cancelAtPeriodEnd'];
      const previousValues = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          previousValues[field] = subscription[field];
          subscription[field] = updates[field];
        }
      });

      result = await subscription.save();

      // Log admin action
      await AdminAction.logAction({
        adminUserId: admin._id,
        action: 'user_subscription_modified',
        targetType: 'subscription',
        targetId: subscription._id,
        targetIdentifier: subscription.userId.email,
        description: `Updated subscription for user ${subscription.userId.email}`,
        details: {
          reason,
          previousValues,
          newValues: updates
        },
        category: 'financial',
        severity: 'low'
      });
    }

    res.status(200).json({
      message: 'Subscription updated successfully',
      subscription: result
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}

async function cancelSubscription(req, res, admin) {
  try {
    const { id } = req.query;
    const { reason, immediate = false } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await Subscription.findById(id).populate('userId', 'name email');
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let result;

    if (immediate) {
      // Immediate cancellation
      subscription.status = 'cancelled';
      subscription.currentPeriodEnd = new Date();
      result = await subscription.save();

      // Cancel in Stripe if it's a Stripe subscription
      if (subscription.stripeSubscriptionId) {
        try {
          await cancelStripeSubscription(subscription.stripeSubscriptionId, false);
        } catch (error) {
          console.error('Error cancelling Stripe subscription:', error);
        }
      }

      // Update user status
      const user = await User.findById(subscription.userId);
      if (user) {
        await user.updateSubscriptionStatus('cancelled', 'free');
      }
    } else {
      // Cancel at period end
      result = await cancelSubscriptionAtPeriodEnd(subscription.userId, admin._id, reason);
    }

    // Log admin action
    await AdminAction.logAction({
      adminUserId: admin._id,
      action: 'subscription_cancelled',
      targetType: 'subscription',
      targetId: subscription._id,
      targetIdentifier: subscription.userId.email,
      description: `${immediate ? 'Immediately cancelled' : 'Scheduled cancellation for'} subscription of user ${subscription.userId.email}`,
      details: {
        reason,
        immediate,
        subscriptionPlan: subscription.plan
      },
      category: 'financial',
      severity: immediate ? 'high' : 'medium'
    });

    res.status(200).json({
      message: `Subscription ${immediate ? 'cancelled immediately' : 'scheduled for cancellation'}`,
      subscription: result
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

// Export with admin authentication required
export default createApiHandler(composeMiddleware(requireAdmin, subscriptionsHandler), {
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}); 
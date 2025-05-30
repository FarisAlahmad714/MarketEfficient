// pages/api/admin/subscriptions/cancel.js
import { createApiHandler } from '../../../../lib/api-handler';
import { requireAdmin } from '../../../../middleware/auth';
import { composeMiddleware } from '../../../../lib/api-handler';
import Subscription from '../../../../models/Subscription';
import User from '../../../../models/User';
import stripe from 'stripe';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

async function cancelSubscriptionHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel in Stripe (if applicable)
    if (subscription.stripeSubscriptionId) {
      await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update local subscription status
    subscription.status = 'cancelled';
    await subscription.save();

    // Update user subscription status (assuming User model has this method)
    const user = await User.findById(userId);
    if (user) {
      await user.updateSubscriptionStatus('cancelled', subscription.plan);
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message,
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAdmin, cancelSubscriptionHandler),
  { methods: ['POST'] }
);
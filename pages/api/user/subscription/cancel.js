// pages/api/user/subscription/cancel.js
import User from '../../../../models/User';
import Subscription from '../../../../models/Subscription';
import connectDB from '../../../../lib/database';
import stripe from 'stripe';
import { createApiHandler } from '../../../../lib/api-handler';
import { requireAuth } from '../../../../middleware/auth';
import { composeMiddleware } from '../../../../lib/api-handler';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // User is already verified by requireAuth middleware
    const user = req.user;

    const subscription = await Subscription.findOne({
      userId: user._id,
      stripeSubscriptionId: { $exists: true, $ne: null },
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel in Stripe
    const stripeSubscription = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update local subscription
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription will be cancelled at the end of the billing period',
      subscription: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
}

export default createApiHandler(
  composeMiddleware(requireAuth, handler),
  { methods: ['POST'] }
);
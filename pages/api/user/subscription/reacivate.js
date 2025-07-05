// pages/api/user/subscription/reactivate.js
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import Subscription from '../../../../models/Subscription';
import connectDB from '../../../../lib/database';
import stripe from 'stripe';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      stripeSubscriptionId: { $exists: true, $ne: null },
      cancelAtPeriodEnd: true
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No cancelled subscription found to reactivate' });
    }

    // Reactivate in Stripe
    const stripeSubscription = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription reactivated successfully',
      subscription: {
        cancelAtPeriodEnd: false,
        status: subscription.status
      }
    });
  } catch (error) {
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      details: error.message 
    });
  }
}
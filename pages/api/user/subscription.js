import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get user's subscription data
    const subscription = await Subscription.findOne({ 
      userId: user._id,
      status: { $in: ['active', 'trialing', 'past_due'] }
    }).sort({ createdAt: -1 });

    const subscriptionData = {
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
      hasActiveSubscription: user.hasActiveSubscription,
      nextBillingDate: subscription?.currentPeriodEnd,
      stripeCustomerId: subscription?.stripeCustomerId,
      stripeSubscriptionId: subscription?.stripeSubscriptionId,
      planId: subscription?.planId,
      amount: subscription?.amount,
      currency: subscription?.currency || 'usd'
    };

    res.status(200).json(subscriptionData);

  } catch (error) {
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch subscription data',
      details: error.message 
    });
  }
} 
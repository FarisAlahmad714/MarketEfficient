// pages/api/cron/subscription-sync.js - Subscription sync cron job
import { authenticate } from '../../../middleware/auth';
import connectDB from '../../../lib/database';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';

export default async function handler(req, res) {
  // Only allow GET requests for cron jobs
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate cron secret for security
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();
    
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Get all subscriptions with Stripe IDs
    const subscriptions = await Subscription.find({
      stripeSubscriptionId: { $exists: true, $ne: null },
      status: { $in: ['active', 'trialing', 'past_due'] }
    });
    
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    const updates = [];
    
    for (const subscription of subscriptions) {
      try {
        // Get subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        
        // Check if status changed
        if (stripeSubscription.status !== subscription.status) {
          const oldStatus = subscription.status;
          
          // Update subscription
          subscription.status = stripeSubscription.status;
          subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          await subscription.save();
          
          // Update user subscription status
          const user = await User.findById(subscription.userId);
          if (user) {
            await user.updateSubscriptionStatus(stripeSubscription.status, subscription.plan);
          }
          
          updatedCount++;
          updates.push({
            subscriptionId: subscription._id,
            email: user?.email,
            oldStatus,
            newStatus: stripeSubscription.status
          });
          
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errorCount++;
        errors.push({
          subscriptionId: subscription._id,
          error: error.message
        });
      }
    }
    
    
    return res.status(200).json({
      message: 'Subscription sync cron job completed',
      totalSubscriptions: subscriptions.length,
      updatedCount,
      errorCount,
      updates: updates.slice(0, 10), // Return first 10 updates
      errors: errors.slice(0, 5) // Return first 5 errors
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Cron job failed',
      message: error.message 
    });
  }
}
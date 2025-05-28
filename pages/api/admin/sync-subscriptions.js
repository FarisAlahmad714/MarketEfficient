// pages/api/admin/sync-subscriptions.js
import { requireAdmin } from '../../../middleware/auth';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import stripe from 'stripe';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply admin authentication
  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        const subscriptions = await Subscription.find({
          stripeSubscriptionId: { $exists: true, $ne: null },
          status: { $in: ['active', 'trialing', 'past_due'] }
        }).limit(100); // Limit to prevent timeout

        let updated = 0;
        const results = [];

        for (const subscription of subscriptions) {
          try {
            const stripeSubscription = await stripeClient.subscriptions.retrieve(
              subscription.stripeSubscriptionId
            );

            if (stripeSubscription.status !== subscription.status) {
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
                userId: subscription.userId,
                oldStatus: subscription.status,
                newStatus: stripeSubscription.status
              });
            }
          } catch (error) {
            console.error(`Error syncing subscription ${subscription._id}:`, error);
          }
        }

        res.status(200).json({
          message: 'Sync completed',
          checked: subscriptions.length,
          updated,
          results
        });
      } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed' });
      } finally {
        resolve();
      }
    });
  });
}
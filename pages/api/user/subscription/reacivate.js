import { authenticateUser } from '../../../../middleware/auth';
import Subscription from '../../../../models/Subscription';
import stripe from '../../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      stripeSubscriptionId: { $exists: true, $ne: null },
      cancelAtPeriodEnd: true
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No canceled subscription found' });
    }

    // Reactivate in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription reactivated successfully',
      subscription
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
}
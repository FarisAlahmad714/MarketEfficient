import { authenticateUser } from '../../../../middleware/auth';
import Subscription from '../../../../models/Subscription';
import { cancelSubscription } from '../../../../lib/stripe';

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
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel in Stripe
    const stripeSubscription = await cancelSubscription(subscription.stripeSubscriptionId);

    // Update local subscription
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription canceled successfully',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
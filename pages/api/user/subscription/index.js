import { authenticateUser } from '../../../../middleware/auth';
import Subscription from '../../../../models/Subscription';
import PaymentHistory from '../../../../models/PaymentHistory';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get active subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trialing', 'past_due'] }
    }).sort({ createdAt: -1 });

    // Get billing history
    const billingHistory = await PaymentHistory.find({
      userId: user._id,
      status: 'succeeded'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount description createdAt status');

    return res.status(200).json({
      subscription,
      billingHistory
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription data' });
  }
}
import connectDB from '../../../lib/database';
import Subscription from '../../../models/Subscription';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const promoSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null }
    }).populate('userId', 'name email')
      .populate('promoCodeUsed', 'code description');

    const withExpiration = promoSubscriptions.filter(sub => sub.currentPeriodEnd !== null);
    const unlimited = promoSubscriptions.filter(sub => sub.currentPeriodEnd === null);

    const needsFixDetails = withExpiration.map(sub => ({
      email: sub.userId.email,
      name: sub.userId.name,
      promoCode: sub.promoCodeUsed.code,
      expiration: sub.currentPeriodEnd,
      daysRemaining: sub.getDaysRemaining(),
      status: sub.status
    }));

    res.status(200).json({
      total: promoSubscriptions.length,
      needsFix: withExpiration.length,
      unlimited: unlimited.length,
      needsFixDetails
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check promo status',
      details: error.message 
    });
  }
}
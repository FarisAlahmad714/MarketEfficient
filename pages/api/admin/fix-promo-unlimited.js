import connectDB from '../../../lib/database';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import PromoCode from '../../../models/PromoCode';
import AdminAction from '../../../models/AdminAction';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Find all subscriptions that used promo codes but have expiration dates
    const affectedSubscriptions = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      currentPeriodEnd: { $exists: true, $ne: null }
    }).populate('userId', 'name email registrationPromoCode')
      .populate('promoCodeUsed', 'code description discountType');


    if (affectedSubscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No subscriptions need fixing - all promo users already have unlimited access!',
        updated: 0,
        total: 0
      });
    }

    // Find admin user for logging
    const adminUser = await User.findOne({ isAdmin: true });
    
    // Update subscriptions
    let updated = 0;
    let errors = 0;
    const updatedUsers = [];

    for (const subscription of affectedSubscriptions) {
      try {
        const user = subscription.userId;
        const previousEnd = subscription.currentPeriodEnd;
        
        // Update to unlimited access
        subscription.currentPeriodEnd = null;
        subscription.status = subscription.status === 'inactive' ? 'active' : subscription.status;
        await subscription.save();

        // Update user subscription status if needed
        if (user && !user.hasActiveSubscription) {
          await user.updateSubscriptionStatus('active', subscription.plan);
        }

        // Log admin action
        if (adminUser) {
          await AdminAction.logAction({
            adminUserId: adminUser._id,
            action: 'subscription_unlimited_access_granted',
            targetType: 'subscription',
            targetId: subscription._id,
            targetIdentifier: user.email,
            description: `Granted unlimited access for promo code subscription`,
            details: {
              reason: 'Promo code users should have unlimited access - migration fix',
              promoCode: subscription.promoCodeUsed.code,
              previousExpiration: previousEnd,
              newExpiration: null
            },
            category: 'user_management',
            severity: 'medium'
          });
        }

        updatedUsers.push({
          email: user.email,
          name: user.name,
          promoCode: subscription.promoCodeUsed.code,
          previousExpiration: previousEnd
        });

        updated++;

      } catch (error) {
        errors++;
      }
    }

    // Verify the changes
    const remainingIssues = await Subscription.find({
      promoCodeUsed: { $exists: true, $ne: null },
      currentPeriodEnd: { $exists: true, $ne: null }
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updated} promo code users to unlimited access`,
      updated,
      errors,
      total: affectedSubscriptions.length,
      remainingIssues: remainingIssues.length,
      updatedUsers
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fix promo unlimited access',
      details: error.message 
    });
  }
}
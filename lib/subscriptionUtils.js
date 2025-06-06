import Subscription from '../models/Subscription';
import PromoCode from '../models/PromoCode';
import Payment from '../models/Payment';
import User from '../models/User';
import AdminAction from '../models/AdminAction';

// Subscription pricing in cents
export const SUBSCRIPTION_PRICES = {
  monthly: 3900, // $39.00
  annual: 36000  // $360.00
};

// Calculate savings for annual plan
export const ANNUAL_SAVINGS = 10800; // $108.00

/**
 * Get subscription price for a plan
 */
export function getSubscriptionPrice(plan) {
  return SUBSCRIPTION_PRICES[plan] || 0;
}

/**
 * Calculate discount and final price with promo code
 */
export async function calculatePriceWithPromo(plan, promoCode) {
  const originalPrice = getSubscriptionPrice(plan);
  
  if (!promoCode) {
    return {
      originalPrice,
      discountAmount: 0,
      finalPrice: originalPrice,
      promoCodeData: null
    };
  }
  
  try {
    const promoCodeDoc = await PromoCode.findValidCode(promoCode);
    
    if (!promoCodeDoc) {
      throw new Error('Invalid or expired promo code');
    }
    
    if (!promoCodeDoc.isAvailable) {
      throw new Error('Promo code is no longer available');
    }
    
    // Check if promo code applies to this plan
    const applicablePlans = promoCodeDoc.applicablePlans || [];
    
    // Check if the promo code applies to this specific plan or to 'both'
    const planApplies = applicablePlans.length === 0 || // No restrictions
                       applicablePlans.includes(plan) || // Specific plan
                       applicablePlans.includes('both') || // All plans
                       (plan === 'monthly' && applicablePlans.includes('monthly')) || // Monthly plan
                       (plan === 'annual' && applicablePlans.includes('annual')); // Annual plan
    
    if (!planApplies) {
      throw new Error(`Promo code is not applicable to ${plan} plan`);
    }
    
    const discount = promoCodeDoc.calculateDiscount(originalPrice);
    
    return {
      originalPrice: discount.originalAmount,
      discountAmount: discount.discountAmount,
      finalPrice: discount.finalAmount,
      promoCodeData: promoCodeDoc
    };
  } catch (error) {
    throw new Error(`Promo code error: ${error.message}`);
  }
}

/**
 * Create or update user subscription
 */
export async function createOrUpdateSubscription(userId, subscriptionData) {
  try {
    // Check if user already has a subscription
    let subscription = await Subscription.findOne({ userId });
    
    if (subscription) {
      // Update existing subscription
      Object.assign(subscription, subscriptionData);
      subscription.updatedAt = new Date();
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId,
        ...subscriptionData
      });
    }
    
    await subscription.save();
    
    // Update user subscription status
    const user = await User.findById(userId);
    if (user) {
      await user.updateSubscriptionStatus(
        subscriptionData.status,
        subscriptionData.plan === 'admin' ? 'admin' : subscriptionData.plan
      );
    }
    
    return subscription;
  } catch (error) {
    throw new Error(`Failed to create/update subscription: ${error.message}`);
  }
}

/**
 * Grant admin access to a user
 */
export async function grantAdminAccess(userId, adminUserId, reason = 'Admin override') {
  try {
    // Create admin subscription
    const subscription = await createOrUpdateSubscription(userId, {
      status: 'admin_access',
      plan: 'admin',
      amount: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null // No expiration for admin access
    });
    
    // Update user to admin status
    const user = await User.findById(userId);
    if (user) {
      user.isAdmin = true;
      user.subscriptionTier = 'admin';
      user.hasActiveSubscription = true;
      await user.save();
    }
    
    // Log admin action
    await AdminAction.logAction({
      adminUserId,
      action: 'user_access_granted',
      targetType: 'user',
      targetId: userId,
      targetIdentifier: user?.email,
      description: `Granted admin access to user ${user?.email}`,
      details: {
        reason,
        previousStatus: user?.subscriptionStatus,
        newStatus: 'admin_access'
      },
      category: 'user_management',
      severity: 'high'
    });
    
    return subscription;
  } catch (error) {
    throw new Error(`Failed to grant admin access: ${error.message}`);
  }
}

/**
 * Process promo code usage during registration/subscription
 */
export async function processPromoCodeUsage(promoCodeId, userId, originalAmount, discountAmount, finalAmount) {
  try {
    const promoCode = await PromoCode.findById(promoCodeId);
    if (!promoCode) {
      throw new Error('Promo code not found');
    }
    
    if (!promoCode.canBeUsedBy(userId)) {
      throw new Error('Promo code cannot be used by this user');
    }
    
    await promoCode.useCode(userId, originalAmount, discountAmount, finalAmount);
    
    // Update user's registration promo code
    await User.findByIdAndUpdate(userId, {
      registrationPromoCode: promoCode.code
    });
    
    return promoCode;
  } catch (error) {
    throw new Error(`Failed to process promo code: ${error.message}`);
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId) {
  try {
    const subscription = await Subscription.findActiveByUserId(userId);
    return !!subscription && !subscription.isExpired();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscriptionDetails(userId) {
  try {
    const subscription = await Subscription.findOne({ userId })
      .populate('promoCodeUsed', 'code description discountAmount');
    
    if (!subscription) {
      return {
        hasSubscription: false,
        status: 'none',
        plan: 'free',
        isActive: false
      };
    }
    
    return {
      hasSubscription: true,
      status: subscription.status,
      plan: subscription.plan,
      isActive: subscription.isActive,
      amount: subscription.amount,
      currency: subscription.currency,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      daysRemaining: subscription.getDaysRemaining(),
      promoCodeUsed: subscription.promoCodeUsed,
      discountAmount: subscription.discountAmount,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    };
  } catch (error) {
    throw new Error(`Failed to get subscription details: ${error.message}`);
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(userId, adminUserId, reason) {
  try {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      throw new Error('No subscription found');
    }
    
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
    // Log admin action if cancelled by admin
    if (adminUserId) {
      await AdminAction.logAction({
        adminUserId,
        action: 'subscription_cancelled',
        targetType: 'subscription',
        targetId: subscription._id,
        targetIdentifier: subscription.userId,
        description: `Cancelled subscription for user`,
        details: {
          reason,
          subscriptionPlan: subscription.plan,
          currentPeriodEnd: subscription.currentPeriodEnd
        },
        category: 'financial',
        severity: 'medium'
      });
    }
    
    return subscription;
  } catch (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Get subscription analytics for admin
 */
export async function getSubscriptionAnalytics(startDate, endDate) {
  try {
    const subscriptions = await Subscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            $lte: endDate || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            plan: '$plan'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    const promoCodeUsage = await Payment.getPromoCodeStats();
    const paymentStats = await Payment.getPaymentStats(startDate, endDate);
    
    return {
      subscriptions,
      promoCodeUsage,
      paymentStats,
      totalActiveSubscriptions: await Subscription.countDocuments({
        status: { $in: ['active', 'trialing'] }
      }),
      totalRevenue: paymentStats.totalRevenue || 0,
      conversionRate: paymentStats.totalPayments > 0 
        ? (paymentStats.successfulPayments / paymentStats.totalPayments * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
} 
// pages/api/user/subscription/details.js
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import Subscription from '../../../../models/Subscription';
import PaymentHistory from '../../../../models/PaymentHistory';
import Payment from '../../../../models/Payment';
import PromoCode from '../../../../models/PromoCode';
import connectDB from '../../../../lib/database';

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

    // Get user's subscription data with promo code details
    const subscription = await Subscription.findOne({ 
      userId: user._id 
    })
    .populate('promoCodeUsed', 'code description discountType discountValue')
    .sort({ createdAt: -1 });

    // Get billing history from both PaymentHistory and Payment collections
    let billingHistory = [];
    
    // Try Payment collection first (since it's the main payment model)
    const paymentRecords = await Payment.find({ 
      userId: user._id,
      status: { $in: ['succeeded', 'refunded', 'partially_refunded'] }
    })
    .populate('promoCodeUsed', 'code description')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('amount currency status description createdAt paymentMethod plan promoCodeUsed discountAmount originalAmount processedAt netAmount');

    if (paymentRecords.length > 0) {
      billingHistory = paymentRecords.map(record => ({
        id: record._id,
        amount: record.amount,
        netAmount: record.netAmount, // Amount after refunds
        currency: record.currency,
        status: record.status,
        description: record.description,
        createdAt: record.processedAt || record.createdAt,
        paymentMethod: record.paymentMethod,
        plan: record.plan,
        promoCode: record.promoCodeUsed ? {
          code: record.promoCodeUsed.code,
          description: record.promoCodeUsed.description
        } : null,
        discountAmount: record.discountAmount,
        originalAmount: record.originalAmount
      }));
    } else {
      // Fallback to PaymentHistory collection if exists
      const paymentHistoryRecords = await PaymentHistory.find({ 
        userId: user._id,
        status: { $in: ['succeeded', 'refunded'] }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount currency status description createdAt metadata');

      if (paymentHistoryRecords.length > 0) {
        billingHistory = paymentHistoryRecords.map(record => ({
          id: record._id,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          description: record.description || 'Subscription Payment',
          createdAt: record.createdAt,
          paymentMethod: 'stripe',
          promoCode: record.metadata?.promoCode ? {
            code: record.metadata.promoCode
          } : null
        }));
      }
    }

    // If user has a subscription but no payment history, check if it's a promo code activation
    if (subscription && billingHistory.length === 0) {
      // Check if the subscription was created with a promo code (free or discounted)
      if (subscription.promoCodeUsed || subscription.amount === 0) {
        billingHistory.push({
          id: 'initial-' + subscription._id,
          amount: subscription.amount || 0,
          netAmount: subscription.amount || 0,
          currency: subscription.currency || 'usd',
          status: 'succeeded',
          description: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} subscription activation`,
          createdAt: subscription.createdAt,
          paymentMethod: subscription.promoCodeUsed ? 'promo_code' : 'admin_override',
          plan: subscription.plan,
          promoCode: subscription.promoCodeUsed ? {
            code: subscription.promoCodeUsed.code,
            description: subscription.promoCodeUsed.description
          } : null,
          discountAmount: subscription.discountAmount || 0,
          originalAmount: subscription.originalAmount || 0
        });
      }
    }

    // Format subscription data
    const subscriptionData = subscription ? {
      id: subscription._id,
      status: subscription.status,
      plan: subscription.plan,
      amount: subscription.amount,
      originalAmount: subscription.originalAmount,
      discountAmount: subscription.discountAmount,
      currency: subscription.currency || 'usd',
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      promoCode: subscription.promoCodeUsed ? {
        code: subscription.promoCodeUsed.code,
        description: subscription.promoCodeUsed.description,
        discountType: subscription.promoCodeUsed.discountType,
        discountValue: subscription.promoCodeUsed.discountValue
      } : null,
      isActive: subscription.isActive,
      daysRemaining: subscription.getDaysRemaining()
    } : null;

    res.status(200).json({
      subscription: subscriptionData,
      billingHistory: billingHistory
    });

  } catch (error) {
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch subscription details',
      details: error.message 
    });
  }
}
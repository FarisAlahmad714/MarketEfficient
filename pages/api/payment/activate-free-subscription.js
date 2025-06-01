import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import PromoCode from '../../../models/PromoCode';
import { calculatePriceWithPromo, processPromoCodeUsage } from '../../../lib/subscriptionUtils';
import { sendWelcomeEmail, sendVerificationEmail } from '../../../lib/email-service';
import logger from '../../../lib/logger'; // Adjust path to your logger utility
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { plan, promoCode } = req.body;

    // Validate plan
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Validate promo code
    if (!promoCode) {
      return res.status(400).json({ error: 'Promo code is required for free activation' });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId: user._id,
      status: { $in: ['active', 'trialing', 'admin_access'] }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Calculate pricing with promo code
    const pricing = await calculatePriceWithPromo(plan, promoCode);

    // Verify that the promo code gives 100% discount
    if (pricing.finalPrice !== 0) {
      return res.status(400).json({ 
        error: 'This promo code does not provide 100% discount. Please use the checkout process.' 
      });
    }

    // Process promo code usage
    if (pricing.promoCodeData) {
      await processPromoCodeUsage(
        pricing.promoCodeData._id, 
        user._id, 
        pricing.originalPrice, 
        pricing.discountAmount, 
        pricing.finalPrice
      );
    }

    // Calculate subscription period
    const periodStart = new Date();
    const periodEnd = new Date();
    
    if (plan === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Create subscription record
    const subscription = await Subscription.create({
      userId: user._id,
      status: 'active',
      plan: plan,
      amount: 0,
      originalAmount: pricing.originalPrice,
      discountAmount: pricing.discountAmount,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      promoCodeUsed: pricing.promoCodeData?._id || null,
      currency: 'usd'
    });

    // Update user subscription status
    await user.updateSubscriptionStatus('active', plan);

    // Send verification email first (if not verified yet) and then welcome email
    if (!user.isVerified && user.verificationToken) {
      try {
        await sendVerificationEmail(user, user.verificationToken);
        logger.log('Verification email sent for free subscription');
      } catch (emailError) {
        console.error('Failed to send verification email for free subscription:', emailError);
      }
    }
    
    // Send welcome email now that subscription is active
    try {
      await sendWelcomeEmail(user);
      user.hasReceivedWelcomeEmail = true;
      await user.save();
      logger.log('Welcome email sent for free subscription');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Free subscription activated successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Free subscription activation error:', error);
    res.status(500).json({ 
      error: 'Failed to activate free subscription',
      details: error.message 
    });
  }
} 
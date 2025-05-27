import { createCheckoutSession, createStripeCustomer, createOneTimePaymentSession, getPriceIdForPlan } from '../../../lib/stripe';
import { calculatePriceWithPromo, SUBSCRIPTION_PRICES } from '../../../lib/subscriptionUtils';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import connectDB from '../../../lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { plan, promoCode } = req.body;

    // Validate plan
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

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

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId: user._id,
      status: { $in: ['active', 'trialing'] }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Calculate pricing with promo code
    const pricing = await calculatePriceWithPromo(plan, promoCode);

    // Create or get Stripe customer
    let stripeCustomerId;
    const existingSubscriptionRecord = await Subscription.findOne({ userId: user._id });
    
    if (existingSubscriptionRecord?.stripeCustomerId) {
      stripeCustomerId = existingSubscriptionRecord.stripeCustomerId;
    } else {
      const stripeCustomer = await createStripeCustomer(
        user.email,
        user.name,
        {
          userId: user._id.toString(),
          plan: plan,
          promoCode: promoCode || ''
        }
      );
      stripeCustomerId = stripeCustomer.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing?payment=cancelled`;

    let session;

    // If there's a significant discount (promo code), create a one-time payment
    if (pricing.promoCodeData && pricing.finalPrice < pricing.originalPrice) {
      // For promo codes, create a one-time payment for the discounted amount
      session = await createOneTimePaymentSession({
        customerId: stripeCustomerId,
        amount: pricing.finalPrice,
        description: `MarketEfficient ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription${promoCode ? ` (${promoCode})` : ''}`,
        successUrl,
        cancelUrl,
        metadata: {
          userId: user._id.toString(),
          plan: plan,
          promoCode: promoCode || '',
          originalAmount: pricing.originalPrice.toString(),
          discountAmount: pricing.discountAmount.toString(),
          finalAmount: pricing.finalPrice.toString(),
          promoCodeId: pricing.promoCodeData?._id?.toString() || '',
          subscriptionType: 'promo_payment'
        }
      });
    } else {
      // Regular subscription checkout
      const priceId = getPriceIdForPlan(plan);
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID not configured for this plan' });
      }

      session = await createCheckoutSession({
        customerId: stripeCustomerId,
        priceId: priceId,
        successUrl,
        cancelUrl,
        metadata: {
          userId: user._id.toString(),
          plan: plan,
          promoCode: promoCode || '',
          originalAmount: pricing.originalPrice.toString(),
          discountAmount: pricing.discountAmount.toString(),
          finalAmount: pricing.finalPrice.toString(),
          promoCodeId: pricing.promoCodeData?._id?.toString() || ''
        },
        discountAmount: pricing.discountAmount,
        promoCode: promoCode
      });
    }

    // Store the checkout session info temporarily
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        stripeCustomerId: stripeCustomerId,
        status: 'inactive',
        plan: plan,
        amount: pricing.finalPrice,
        originalAmount: pricing.originalPrice,
        discountAmount: pricing.discountAmount,
        promoCodeUsed: pricing.promoCodeData?._id || null,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
      pricing: {
        originalPrice: pricing.originalPrice,
        discountAmount: pricing.discountAmount,
        finalPrice: pricing.finalPrice,
        promoCode: promoCode || null
      }
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
} 
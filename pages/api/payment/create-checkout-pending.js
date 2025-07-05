// pages/api/payment/create-checkout-pending.js
import { calculatePriceWithPromo } from '../../../lib/subscriptionUtils';
import PendingRegistration from '../../../models/PendingRegistration';
import connectDB from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { plan, promoCode, pendingRegistrationId } = req.body;
    
    // Validate plan
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Validate pending registration
    if (!pendingRegistrationId) {
      return res.status(400).json({ error: 'Pending registration ID required' });
    }

    const pendingReg = await PendingRegistration.findById(pendingRegistrationId);
    if (!pendingReg) {
      return res.status(404).json({ error: 'Pending registration not found' });
    }

    // Calculate pricing with promo code (or without if null)
    const pricing = await calculatePriceWithPromo(plan, promoCode);

    // calculatePriceWithPromo throws an error if invalid, so if we get here it's valid

    // Don't allow free promo codes here
    if (pricing.finalPrice === 0) {
      return res.status(400).json({ 
        error: 'This promo code provides free access. Please use the standard registration flow.' 
      });
    }

    // Create Stripe checkout session for one-time payment
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `ChartSense ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
            description: promoCode 
              ? `${plan === 'monthly' ? 'Monthly' : 'Annual'} subscription with promo code ${promoCode}`
              : `${plan === 'monthly' ? 'Monthly' : 'Annual'} subscription`
          },
          unit_amount: pricing.finalPrice
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      customer_email: pendingReg.email,
      metadata: {
        pendingRegistrationId: pendingRegistrationId,
        plan: plan,
        promoCode: promoCode || '',
        promoCodeId: pricing.promoCodeData?._id?.toString() || '',
        originalAmount: pricing.originalPrice.toString(),
        discountAmount: pricing.discountAmount.toString(),
        finalAmount: pricing.finalPrice.toString(),
        subscriptionType: 'promo_payment'
      }
    };
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Update pending registration with session ID
    pendingReg.stripeSessionId = session.id;
    await pendingReg.save();

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
} 
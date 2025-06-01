// pages/api/payment/create-checkout-registration.js - NEW FILE
import { calculatePriceWithPromo } from '../../../lib/subscriptionUtils';
import connectDB from '../../../lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { plan, promoCode, tempToken } = req.body;
    
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    if (!tempToken) {
      return res.status(400).json({ error: 'Invalid registration session' });
    }

    // Verify and decode the temporary token
    let registrationData;
    try {
      registrationData = jwt.verify(tempToken, process.env.JWT_SECRET);
      
      if (registrationData.type !== 'registration_intent') {
        return res.status(401).json({ error: 'Invalid registration token' });
      }
      
      // Check if token is too old (2 hours)
      if (Date.now() - registrationData.createdAt > 2 * 60 * 60 * 1000) {
        return res.status(410).json({ 
          error: 'Registration session expired. Please start again.',
          shouldRetry: true
        });
      }
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired registration session',
        shouldRetry: true
      });
    }

    const pricing = await calculatePriceWithPromo(plan, promoCode);

    if (pricing.finalPrice === 0) {
      return res.status(400).json({ 
        error: 'This promo code provides free access. Please use the free registration option.',
        isFreePromo: true
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Remove exp from registrationData to avoid conflict with expiresIn
    const { exp, iat, ...cleanRegistrationData } = registrationData;
    
    // Pass ALL registration data in Stripe metadata
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `MarketEfficient ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
            description: promoCode 
              ? `${plan === 'monthly' ? 'Monthly' : 'Annual'} subscription with promo code ${promoCode}`
              : `${plan === 'monthly' ? 'Monthly' : 'Annual'} subscription`
          },
          unit_amount: pricing.finalPrice
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true&email=${encodeURIComponent(registrationData.email)}&plan=${plan}`,
      customer_email: registrationData.email,
      expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000),
      metadata: {
        // Store registration data securely
        registrationData: jwt.sign(cleanRegistrationData, process.env.JWT_SECRET, { expiresIn: '1h' }),
        plan: plan,
        promoCode: promoCode || '',
        promoCodeId: pricing.promoCodeData?._id?.toString() || '',
        originalAmount: pricing.originalPrice.toString(),
        discountAmount: pricing.discountAmount.toString(),
        finalAmount: pricing.finalPrice.toString(),
        subscriptionType: 'new_registration'
      }
    };
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`Created checkout session for ${registrationData.email}: ${session.id}`);

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    
    if (error.message && error.message.includes('promo')) {
      return res.status(400).json({ 
        error: error.message,
        shouldRetry: false
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create checkout session. Please try again.',
      shouldRetry: true
    });
  }
}
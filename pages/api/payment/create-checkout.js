// pages/api/payment/create-checkout.js
import { calculatePriceWithPromo } from '../../../lib/subscriptionUtils';
import PendingRegistration from '../../../models/PendingRegistration';
import connectDB from '../../../lib/database';
import jwt from 'jsonwebtoken';
import logger from '../../../lib/logger';
import { withCsrfProtect } from '../../../middleware/csrf';
import { rateLimit } from '../../../middleware/rateLimit';

// Payment-specific rate limiting
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 payment attempts per 15 minutes
  skipSuccessfulRequests: true
});

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { plan, promoCode, pendingRegistrationId, tempToken } = req.body;
    
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    let pendingReg;
    
    if (pendingRegistrationId) {
      pendingReg = await PendingRegistration.findById(pendingRegistrationId);
    } else if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (decoded.type === 'pending_registration' && decoded.pendingRegistrationId) {
          pendingReg = await PendingRegistration.findById(decoded.pendingRegistrationId);
        }
      } catch (error) {
        return res.status(401).json({ 
          error: 'Invalid or expired session. Please start registration again.',
          shouldRetry: true
        });
      }
    }

    if (!pendingReg) {
      return res.status(404).json({ 
        error: 'Registration session not found. Please start registration again.',
        shouldRetry: true
      });
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (pendingReg.createdAt < twoHoursAgo) {
      await PendingRegistration.findByIdAndDelete(pendingReg._id);
      return res.status(410).json({ 
        error: 'Registration session has expired. Please start again.',
        shouldRetry: true
      });
    }

    // Check if user already has an active Stripe session
    if (pendingReg.stripeSessionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const existingSession = await stripe.checkout.sessions.retrieve(pendingReg.stripeSessionId);
        
        if (existingSession.payment_status === 'paid') {
          return res.status(400).json({ 
            error: 'Payment has already been completed for this registration.',
            shouldRedirect: '/dashboard'
          });
        }
        
        if (existingSession.status === 'open') {
          return res.status(200).json({ 
            url: existingSession.url,
            sessionId: existingSession.id,
            message: 'Redirecting to existing checkout session...'
          });
        }
      } catch (stripeError) {
        logger.log('Previous Stripe session not found, creating new one:', stripeError.message);
      }
    }

    const pricing = await calculatePriceWithPromo(plan, promoCode);

    if (pricing.finalPrice === 0) {
      return res.status(400).json({ 
        error: 'This promo code provides free access. Please use the free registration option.',
        isFreePromo: true
      });
    }

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
          unit_amount: pricing.finalPrice,
          recurring: {
            interval: plan === 'monthly' ? 'month' : 'year'
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true&email=${encodeURIComponent(pendingReg.email)}&plan=${plan}`,
      customer_email: pendingReg.email,
      expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000), // 30 minutes
      metadata: {
        pendingRegistrationId: pendingReg._id.toString(),
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
    await pendingReg.startCheckout(session.id);

    logger.log(`Created checkout session for ${pendingReg.email}: ${session.id}`);

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    
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

// Apply rate limiting and CSRF protection
export default (req, res) => {
  return new Promise((resolve) => {
    paymentRateLimit(req, res, () => {
      withCsrfProtect(handler)(req, res).finally(resolve);
    });
  });
};
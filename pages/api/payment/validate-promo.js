import { calculatePriceWithPromo } from '../../../lib/subscriptionUtils';
import PromoCode from '../../../models/PromoCode';
import User from '../../../models/User';
import connectDB from '../../../lib/database';
import jwt from 'jsonwebtoken';
import logger from '../../../lib/logger'; // Adjust path to your logger utility

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { promoCode, plan } = req.body;

    // Validate inputs
    if (!promoCode || !plan) {
      return res.status(400).json({ error: 'Promo code and plan are required' });
    }

    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Get user from token (optional for validation)
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          userId = user._id;
        }
      } catch (error) {
        // Token validation failed, but we can still validate the promo code
        logger.log('Token validation failed during promo validation:', error.message);
      }
    }

    try {
      // Calculate pricing with promo code
      const pricing = await calculatePriceWithPromo(plan, promoCode);

      // Additional validation if user is provided
      if (userId && pricing.promoCodeData) {
        const canUse = pricing.promoCodeData.canBeUsedBy(userId);
        if (!canUse) {
          return res.status(400).json({ 
            error: 'This promo code has already been used or is not available for your account',
            valid: false 
          });
        }
      }

      // Get promo code details for response
      const promoCodeDoc = await PromoCode.findValidCode(promoCode);
      
      res.status(200).json({
        valid: true,
        promoCode: {
          code: promoCodeDoc.code,
          description: promoCodeDoc.description,
          discountType: promoCodeDoc.discountType,
          discountValue: promoCodeDoc.discountValue,
          finalPrice: promoCodeDoc.finalPrice
        },
        pricing: {
          originalPrice: pricing.originalPrice,
          discountAmount: pricing.discountAmount,
          finalPrice: pricing.finalPrice,
          savings: pricing.originalPrice - pricing.finalPrice
        },
        plan: plan
      });

    } catch (error) {
      // Promo code validation failed
      res.status(400).json({ 
        error: error.message,
        valid: false 
      });
    }

  } catch (error) {
    console.error('Promo validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate promo code',
      details: error.message 
    });
  }
} 
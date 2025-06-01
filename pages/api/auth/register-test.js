import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { generateToken, sendVerificationEmail, sendWelcomeEmail } from '../../../lib/email-service';
import logger from '../../../lib/logger'; // Adjust path to your logger utility
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    
    const { name, email, password, promoCode } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Enhanced input validation
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    // Validate name length and content
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Enhanced password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strengthScore = 0;
    if (hasUpperCase) strengthScore++;
    if (hasLowerCase) strengthScore++;
    if (hasNumbers) strengthScore++;
    if (hasSpecialChar) strengthScore++;

    if (strengthScore < 2) {
      return res.status(400).json({ 
        error: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and special characters.' 
      });
    }
    
    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please use a different email or login to your existing account.' });
    }
    
    // Also check pending registrations
    const PendingRegistration = require('../../../models/PendingRegistration');
    const existingPending = await PendingRegistration.findOne({
      email: email.toLowerCase().trim()
    });
    if (existingPending) {
      return res.status(409).json({ error: 'A registration with this email is already pending. Please complete the payment or use a different email.' });
    }
    
    // Validate promo code if provided
    let promoCodeValid = false;
    let promoCodeData = null;
    
    if (promoCode) {
      try {
        const PromoCode = require('../../../models/PromoCode');
        const promoCodeDoc = await PromoCode.findValidCode(promoCode);
        
        if (promoCodeDoc && promoCodeDoc.isAvailable) {
          promoCodeValid = true;
          promoCodeData = promoCodeDoc;
        }
      } catch (error) {
        console.error('Promo code validation error:', error);
      }
    }
    
    // If no promo code provided, create pending registration for payment
    if (!promoCode) {
      // No promo code - user must pay, create pending registration
      const PendingRegistration = require('../../../models/PendingRegistration');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);
      
      const pendingReg = await PendingRegistration.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: passwordHash,
        promoCode: null,
        plan: 'monthly' // Default plan, will be updated during checkout
      });
      
      return res.status(201).json({
        requiresPayment: true,
        message: 'Registration pending. Please complete payment to activate your account.',
        pendingRegistrationId: pendingReg._id,
        promoCodeValid: false,
        promoCodeData: null
      });
    }
    
    // Generate verification token (for promo code users only)
    const verificationToken = generateToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create new user (only for valid promo codes)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      verificationToken,
      verificationTokenExpires,
      registrationPromoCode: promoCodeValid ? promoCode : null,
      createdAt: new Date(),
      // Don't set hasActiveSubscription to true yet - wait for payment
      hasActiveSubscription: false,
      subscriptionStatus: 'none',
      subscriptionTier: 'free',
      hasReceivedWelcomeEmail: false
    });
    
    // Check if this is a paid promo code
    let isPaidPromoCode = false;
    if (promoCodeValid && promoCodeData) {
      const { calculatePriceWithPromo } = require('../../../lib/subscriptionUtils');
      const pricing = await calculatePriceWithPromo('monthly', promoCode);
      isPaidPromoCode = pricing.finalPrice > 0;
    }
    
    // For PAID promo codes - create pending registration instead of user
    if (isPaidPromoCode) {
      // Delete the user we just created - we'll create it after payment
      await User.findByIdAndDelete(user._id);
      
      // Create pending registration
      const PendingRegistration = require('../../../models/PendingRegistration');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Check if pending registration already exists
      await PendingRegistration.deleteOne({ email: email.toLowerCase().trim() });
      
      const pendingReg = await PendingRegistration.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: passwordHash,
        promoCode: promoCode,
        plan: 'monthly' // Default plan, will be updated during checkout
      });
      
      // Return special response for paid promo codes
      return res.status(201).json({
        requiresPayment: true,
        message: 'Registration pending. Please complete payment to activate your account.',
        pendingRegistrationId: pendingReg._id,
        promoCodeValid: true,
        promoCodeData: {
          code: promoCodeData.code,
          discountType: promoCodeData.discountType,
          description: promoCodeData.description
        }
      });
    }
    
    // For FREE promo codes - activate subscription immediately
    if (promoCodeValid && promoCodeData) {
      const { calculatePriceWithPromo } = require('../../../lib/subscriptionUtils');
      const pricing = await calculatePriceWithPromo('monthly', promoCode);
      
      if (pricing.finalPrice === 0) {
        // Free promo code - activate subscription
        const { createOrUpdateSubscription } = require('../../../lib/subscriptionUtils');
        await createOrUpdateSubscription(user._id, {
          status: 'active',
          plan: 'monthly',
          amount: 0,
          currency: 'usd',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          promoCodeUsed: promoCodeData._id,
          discountAmount: pricing.discountAmount
        });
        
        // Update user subscription status
        user.hasActiveSubscription = true;
        user.subscriptionStatus = 'active';
        user.subscriptionTier = 'monthly';
        await user.save();
        
        // CRITICAL: Mark promo code as used
        try {
          await promoCodeData.useCode(
            user._id, 
            pricing.originalPrice, 
            pricing.discountAmount, 
            pricing.finalPrice
          );
          logger.log('✅ Promo code marked as used successfully');
        } catch (useCodeError) {
          console.error('❌ Error marking promo code as used:', useCodeError.message);
          // Continue anyway - don't fail registration
        }
      }
    }
    
    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user info (without password) and token
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        hasActiveSubscription: user.hasActiveSubscription,
        subscriptionStatus: user.subscriptionStatus,
        registrationPromoCode: user.registrationPromoCode
      },
      token,
      promoCodeValid: promoCodeValid,
      promoCodeData: promoCodeValid ? {
        code: promoCodeData.code,
        discountType: promoCodeData.discountType,
        description: promoCodeData.description
      } : null,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
} 
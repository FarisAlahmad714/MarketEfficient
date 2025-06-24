// pages/api/auth/register.js - FIXED VERSION
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/database';
import User from '../../../models/User';
import { generateToken, sendVerificationEmail, sendWelcomeEmail } from '../../../lib/email-service';
import { authRateLimit } from '../../../middleware/rateLimit';
import logger from '../../../lib/logger'; // Adjust path to your logger utility
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    authRateLimit(req, res, async () => {
      try {
        await connectDB();
        
        const { name, email, password, promoCode } = req.body;
        
        if (!name || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
          return res.status(400).json({ error: 'Invalid input format' });
        }

        if (name.trim().length < 2 || name.trim().length > 50) {
          return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

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
        
        const emailLower = email.toLowerCase().trim();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          return res.status(409).json({ 
            error: 'An account with this email already exists. Please use a different email or login to your existing account.',
            redirectToLogin: true
          });
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
        
        // Check if this requires payment
        let requiresPayment = true;
        if (promoCodeValid && promoCodeData) {
          const { calculatePriceWithPromo } = require('../../../lib/subscriptionUtils');
          const pricing = await calculatePriceWithPromo('monthly', promoCode);
          requiresPayment = pricing.finalPrice > 0;
        }
        
        // If payment is required, create a temporary token instead of PendingRegistration
        if (!promoCode || requiresPayment) {
          const bcrypt = require('bcryptjs');
          const passwordHash = await bcrypt.hash(password, 12);
          
          // Create a secure temporary token with registration data
          const tempToken = jwt.sign(
            { 
              name: name.trim(),
              email: emailLower,
              passwordHash: passwordHash,
              promoCode: promoCode || null,
              type: 'registration_intent',
              createdAt: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
          );
          
          return res.status(201).json({
            requiresPayment: true,
            message: 'Continue to payment to complete registration',
            tempToken,
            promoCodeValid: promoCodeValid,
            promoCodeData: promoCodeData ? {
              code: promoCodeData.code,
              discountType: promoCodeData.discountType,
              description: promoCodeData.description
            } : null
          });
        }
        
        // For FREE promo codes - create user immediately
        const verificationToken = generateToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Auto-generate username
        let baseUsername = '';
        if (name.trim()) {
          // Use name, remove spaces and special characters, make lowercase
          baseUsername = name.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
        } else {
          // Use email prefix if no name
          baseUsername = emailLower
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
        }

        // Ensure it starts with a letter
        if (!/^[a-z]/.test(baseUsername)) {
          baseUsername = 'user' + baseUsername;
        }

        // Find an available username
        let username = baseUsername;
        let counter = 1;
        
        while (true) {
          const existingUser = await User.findOne({ username });
          if (!existingUser) {
            break;
          }
          username = `${baseUsername}${counter}`;
          counter++;
          
          // Prevent infinite loop
          if (counter > 9999) {
            username = `user${Date.now().toString().slice(-6)}`;
            break;
          }
        }
        
        const user = await User.create({
          name: name.trim(),
          email: emailLower,
          password,
          username, // Add the auto-generated username
          profileVisibility: 'public', // All profiles are public
          shareResults: true, // Share results by default
          verificationToken,
          verificationTokenExpires,
          registrationPromoCode: promoCodeValid ? promoCode : null,
          createdAt: new Date(),
          hasActiveSubscription: false,
          subscriptionStatus: 'none',
          subscriptionTier: 'free',
          hasReceivedWelcomeEmail: false
        });
        
        // For FREE promo codes - activate subscription immediately
        if (promoCodeValid && promoCodeData) {
          const { calculatePriceWithPromo, createOrUpdateSubscription } = require('../../../lib/subscriptionUtils');
          const pricing = await calculatePriceWithPromo('monthly', promoCode);
          
          if (pricing.finalPrice === 0) {
            await createOrUpdateSubscription(user._id, {
              status: 'active',
              plan: 'monthly',
              amount: 0,
              currency: 'usd',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              promoCodeUsed: promoCodeData._id,
              discountAmount: pricing.discountAmount
            });
            
            user.hasActiveSubscription = true;
            user.subscriptionStatus = 'active';
            user.subscriptionTier = 'monthly';
            await user.save();
            
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
            }
          }
        }
        
        try {
          await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
        
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
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
      } finally {
        resolve();
      }
    });
  });
}
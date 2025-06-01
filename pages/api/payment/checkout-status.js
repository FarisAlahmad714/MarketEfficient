// pages/api/payment/checkout-status.js - NEW FILE
import connectDB from '../../../lib/database';
import PendingRegistration from '../../../models/PendingRegistration';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { session_id, email, action = 'check' } = req.query;

    if (!session_id && !email) {
      return res.status(400).json({ error: 'Session ID or email is required' });
    }

    if (action === 'cleanup' && email) {
      const emailLower = email.toLowerCase().trim();
      
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(200).json({
          status: 'completed',
          message: 'Registration completed successfully',
          shouldRedirect: '/auth/login'
        });
      }

      const pendingReg = await PendingRegistration.findOne({ email: emailLower });
      
      if (pendingReg) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (pendingReg.checkoutStartedAt && pendingReg.checkoutStartedAt < fiveMinutesAgo) {
          pendingReg.status = 'expired';
          await pendingReg.save();
          
          return res.status(200).json({
            status: 'expired',
            message: 'Checkout session expired. You can start registration again.',
            canRetry: true,
            email: emailLower
          });
        } else {
          return res.status(200).json({
            status: 'pending',
            message: 'Checkout session is still active. Please complete payment or wait a moment.',
            canRetry: false,
            timeRemaining: pendingReg.checkoutStartedAt ? 
              Math.max(0, 5 - Math.floor((Date.now() - pendingReg.checkoutStartedAt.getTime()) / 60000)) : 0
          });
        }
      }

      return res.status(200).json({
        status: 'not_found',
        message: 'No pending registration found. You can start registration.',
        canRetry: true
      });
    }

    if (session_id) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        const pendingReg = await PendingRegistration.findOne({ stripeSessionId: session_id });
        
        let responseData = {
          sessionId: session_id,
          paymentStatus: session.payment_status,
          sessionStatus: session.status
        };

        if (session.payment_status === 'paid') {
          const user = await User.findOne({ email: session.customer_email });
          if (user) {
            responseData.status = 'completed';
            responseData.shouldRedirect = user.isVerified ? '/dashboard' : '/auth/email-verification';
            responseData.message = 'Payment completed successfully!';
          } else {
            responseData.status = 'processing';
            responseData.message = 'Payment received. Processing your account...';
          }
        } else if (session.status === 'expired') {
          if (pendingReg) {
            pendingReg.status = 'expired';
            await pendingReg.save();
          }
          responseData.status = 'expired';
          responseData.message = 'Checkout session expired. Please start again.';
          responseData.canRetry = true;
        } else {
          responseData.status = 'incomplete';
          responseData.message = 'Payment not completed.';
          responseData.canRetry = true;
        }

        return res.status(200).json(responseData);
        
      } catch (stripeError) {
        console.error('Stripe session retrieval error:', stripeError);
        
        const pendingReg = await PendingRegistration.findOne({ stripeSessionId: session_id });
        if (pendingReg) {
          pendingReg.status = 'expired';
          await pendingReg.save();
        }
        
        return res.status(200).json({
          status: 'not_found',
          message: 'Checkout session not found. Please start registration again.',
          canRetry: true
        });
      }
    }

    return res.status(400).json({ error: 'Invalid request parameters' });

  } catch (error) {
    console.error('Checkout status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check checkout status',
      canRetry: true
    });
  }
}
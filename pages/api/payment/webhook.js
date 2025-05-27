import { constructWebhookEvent } from '../../../lib/stripe';
import { createOrUpdateSubscription, processPromoCodeUsage } from '../../../lib/subscriptionUtils';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
import Payment from '../../../models/Payment';
import PromoCode from '../../../models/PromoCode';
import connectDB from '../../../lib/database';
import { sendWelcomeEmail, sendVerificationEmail } from '../../../lib/email-service';

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get raw body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Construct the webhook event
    const event = constructWebhookEvent(rawBody, signature);

    console.log(`Received webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    // Check if this is a pending registration (paid promo code)
    const pendingRegistrationId = session.metadata?.pendingRegistrationId;
    
    let user;
    let isNewUser = false;
    
    if (pendingRegistrationId) {
      // This is a pending registration - create the user now
      const PendingRegistration = require('../../../models/PendingRegistration');
      const pendingReg = await PendingRegistration.findById(pendingRegistrationId);
      
      if (!pendingReg) {
        console.error('Pending registration not found:', pendingRegistrationId);
        return;
      }
      
      // Generate verification token
      const { generateToken } = require('../../../lib/email-service');
      const verificationToken = generateToken();
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create the actual user
      user = await User.create({
        name: pendingReg.name,
        email: pendingReg.email,
        password: pendingReg.passwordHash, // Already hashed
        verificationToken,
        verificationTokenExpires,
        registrationPromoCode: pendingReg.promoCode,
        hasActiveSubscription: false,
        subscriptionStatus: 'none',
        subscriptionTier: 'free',
        hasReceivedWelcomeEmail: false,
        createdAt: new Date()
      });
      
      isNewUser = true;
      
      // Delete the pending registration
      await PendingRegistration.findByIdAndDelete(pendingRegistrationId);
    } else {
      // Normal flow - user already exists
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error('No userId in session metadata');
        return;
      }

      user = await User.findById(userId);
      if (!user) {
        console.error('User not found:', userId);
        return;
      }
    }

    const plan = session.metadata?.plan;
    const promoCodeId = session.metadata?.promoCodeId;
    const originalAmount = parseInt(session.metadata?.originalAmount || '0');
    const discountAmount = parseInt(session.metadata?.discountAmount || '0');
    const finalAmount = parseInt(session.metadata?.finalAmount || '0');
    const subscriptionType = session.metadata?.subscriptionType;

    // Handle promo code usage if applicable
    if (promoCodeId) {
      try {
        await processPromoCodeUsage(promoCodeId, userId, originalAmount, discountAmount, finalAmount);
      } catch (error) {
        console.error('Error processing promo code usage:', error);
      }
    }

    // For one-time payments (promo codes), create a manual subscription
    if (subscriptionType === 'promo_payment') {
      const periodStart = new Date();
      const periodEnd = new Date();
      
      if (plan === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (plan === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      await createOrUpdateSubscription(userId, {
        stripeCustomerId: session.customer,
        status: 'active',
        plan: plan,
        amount: finalAmount,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        promoCodeUsed: promoCodeId || null
      });

      // Create payment record
      await createPaymentRecord({
        userId,
        stripePaymentIntentId: session.payment_intent,
        amount: finalAmount,
        status: 'succeeded',
        paymentMethod: promoCodeId ? 'promo_code' : 'stripe',
        plan: plan,
        promoCodeUsed: promoCodeId,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        description: `${plan} subscription payment${session.metadata?.promoCode ? ` with promo code ${session.metadata.promoCode}` : ''}`,
        metadata: {
          customerEmail: user.email,
          customerName: user.name,
          sessionId: session.id
        }
      });
    }

    // Send verification email first (if not verified yet) and then welcome email
    if (!user.isVerified && user.verificationToken) {
      try {
        await sendVerificationEmail(user, user.verificationToken);
        console.log('Verification email sent after payment');
      } catch (emailError) {
        console.error('Failed to send verification email after payment:', emailError);
      }
    }
    
    // Send welcome email after successful payment
    if (!user.hasReceivedWelcomeEmail) {
      try {
        await sendWelcomeEmail(user);
        // Mark that welcome email has been sent
        user.hasReceivedWelcomeEmail = true;
        await user.save();
        console.log('Welcome email sent after payment');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    console.log(`Checkout completed for user ${userId}, plan: ${plan}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const plan = subscription.metadata?.plan;
    const promoCodeId = subscription.metadata?.promoCodeId;
    const originalAmount = parseInt(subscription.metadata?.originalAmount || '0');
    const discountAmount = parseInt(subscription.metadata?.discountAmount || '0');

    await createOrUpdateSubscription(userId, {
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      status: subscription.status === 'active' ? 'active' : subscription.status,
      plan: plan,
      amount: subscription.items.data[0]?.price?.unit_amount || 0,
      originalAmount: originalAmount,
      discountAmount: discountAmount,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      promoCodeUsed: promoCodeId || null
    });

    console.log(`Subscription created for user ${userId}: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (!existingSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Update subscription status
    existingSubscription.status = subscription.status;
    existingSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    existingSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    existingSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    await existingSubscription.save();

    // Update user subscription status
    const user = await User.findById(existingSubscription.userId);
    if (user) {
      await user.updateSubscriptionStatus(subscription.status, existingSubscription.plan);
    }

    console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (!existingSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Update subscription status
    existingSubscription.status = 'cancelled';
    await existingSubscription.save();

    // Update user subscription status
    const user = await User.findById(existingSubscription.userId);
    if (user) {
      await user.updateSubscriptionStatus('cancelled', 'free');
    }

    console.log(`Subscription deleted: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create payment record
    await createPaymentRecord({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      stripeInvoiceId: invoice.id,
      stripeChargeId: invoice.charge,
      amount: invoice.amount_paid,
      status: 'succeeded',
      paymentMethod: 'stripe',
      plan: subscription.plan,
      description: `${subscription.plan} subscription renewal`,
      metadata: {
        invoiceNumber: invoice.number,
        billingReason: invoice.billing_reason
      },
      processedAt: new Date(invoice.status_transitions.paid_at * 1000)
    });

    console.log(`Invoice payment succeeded: ${invoice.id}`);

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Create failed payment record
    await createPaymentRecord({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      status: 'failed',
      paymentMethod: 'stripe',
      plan: subscription.plan,
      description: `Failed ${subscription.plan} subscription payment`,
      failureReason: 'Invoice payment failed',
      metadata: {
        invoiceNumber: invoice.number,
        billingReason: invoice.billing_reason
      }
    });

    console.log(`Invoice payment failed: ${invoice.id}`);

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // This is mainly for one-time payments (promo codes)
    const metadata = paymentIntent.metadata;
    const userId = metadata?.userId;

    if (!userId) {
      console.log('No userId in payment intent metadata');
      return;
    }

    console.log(`Payment intent succeeded: ${paymentIntent.id} for user ${userId}`);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    const userId = metadata?.userId;

    if (!userId) {
      console.log('No userId in payment intent metadata');
      return;
    }

    console.log(`Payment intent failed: ${paymentIntent.id} for user ${userId}`);

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function createPaymentRecord(paymentData) {
  try {
    const payment = new Payment({
      ...paymentData,
      createdAt: new Date(),
      processedAt: paymentData.processedAt || new Date()
    });

    await payment.save();
    return payment;

  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
} 
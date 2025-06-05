import Stripe from 'stripe';
import logger from './logger';

let stripe;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables.');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Use a recent, fixed API version
  });
  logger.log('Stripe SDK initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Stripe SDK:', error.message);
  // Depending on your app's needs, you might want to prevent startup
  // or operate in a degraded mode if Stripe isn't available.
  // For now, we'll log the error. Functions calling stripe will fail if it's not initialized.
}

/**
 * Cancels a Stripe subscription.
 * @param {string} stripeSubscriptionId The ID of the Stripe subscription to cancel.
 * @returns {Promise<Stripe.Subscription>} The cancelled Stripe subscription object.
 * @throws {Error} If cancellation fails.
 */
export const cancelStripeSubscription = async (stripeSubscriptionId) => {
  if (!stripe) {
    throw new Error('Stripe SDK not initialized. Cannot cancel subscription.');
  }
  if (!stripeSubscriptionId) {
    throw new Error('Stripe Subscription ID is required to cancel.');
  }

  try {
    // By default, subscriptions.update with cancel_at_period_end: true
    // will schedule the subscription to be cancelled at the end of the current billing period.
    // If immediate cancellation is desired, use stripe.subscriptions.del(stripeSubscriptionId)
    // or stripe.subscriptions.cancel(stripeSubscriptionId) depending on prorations/refunds.
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    // For immediate deletion (no proration/refund by default):
    // const subscription = await stripe.subscriptions.del(stripeSubscriptionId);
    
    logger.log(`Stripe subscription marked for cancellation at period end`);
    return subscription;
  } catch (error) {
    logger.error(`Error cancelling Stripe subscription:`, error);
    throw error; 
  }
};

export default stripe; 
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe product and price configurations
export const STRIPE_CONFIG = {
  products: {
    monthly: {
      name: 'MarketEfficient Monthly Subscription',
      description: 'Monthly access to MarketEfficient trading platform',
      priceId: process.env.STRIPE_MONTHLY_PRICE_ID, // Will be set after creating in Stripe
      amount: 3900, // $39.00 in cents
      interval: 'month'
    },
    annual: {
      name: 'MarketEfficient Annual Subscription',
      description: 'Annual access to MarketEfficient trading platform (Save $108)',
      priceId: process.env.STRIPE_ANNUAL_PRICE_ID, // Will be set after creating in Stripe
      amount: 36000, // $360.00 in cents
      interval: 'year'
    }
  },
  currency: 'usd',
  successUrl: process.env.NEXT_PUBLIC_BASE_URL + '/dashboard?payment=success',
  cancelUrl: process.env.NEXT_PUBLIC_BASE_URL + '/pricing?payment=cancelled'
};

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(email, name, metadata = {}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
        source: 'MarketEfficient'
      }
    });
    return customer;
  } catch (error) {
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
  discountAmount = 0,
  promoCode = null
}) {
  try {
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        promoCode: promoCode || '',
        discountAmount: discountAmount.toString()
      },
      subscription_data: {
        metadata: {
          ...metadata,
          promoCode: promoCode || '',
          discountAmount: discountAmount.toString()
        }
      },
      allow_promotion_codes: true, // Allow Stripe promotion codes
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    };

    // Add discount if applicable
    if (discountAmount > 0 && promoCode) {
      // For custom discounts, we'll handle this via webhooks
      // Stripe doesn't support custom discounts in checkout sessions directly
      sessionConfig.metadata.customDiscount = 'true';
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session;
  } catch (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Create a one-time payment session (for discounted subscriptions)
 */
export async function createOneTimePaymentSession({
  customerId,
  amount,
  description,
  successUrl,
  cancelUrl,
  metadata = {}
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });
    return session;
  } catch (error) {
    throw new Error(`Failed to create one-time payment session: ${error.message}`);
  }
}

/**
 * Retrieve a checkout session
 */
export async function retrieveCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'payment_intent']
    });
    return session;
  } catch (error) {
    throw new Error(`Failed to retrieve checkout session: ${error.message}`);
  }
}

/**
 * Create or update a subscription
 */
export async function createSubscription(customerId, priceId, metadata = {}) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      expand: ['latest_invoice.payment_intent']
    });
    return subscription;
  } catch (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd
    });
    return subscription;
  } catch (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Retrieve a subscription
 */
export async function retrieveSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
}

/**
 * Create a refund
 */
export async function createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason
    });
    return refund;
  } catch (error) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * Retrieve customer
 */
export async function retrieveCustomer(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    throw new Error(`Failed to retrieve customer: ${error.message}`);
  }
}

/**
 * Update customer
 */
export async function updateCustomer(customerId, updateData) {
  try {
    const customer = await stripe.customers.update(customerId, updateData);
    return customer;
  } catch (error) {
    throw new Error(`Failed to update customer: ${error.message}`);
  }
}

/**
 * Get customer's payment methods
 */
export async function getCustomerPaymentMethods(customerId) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods;
  } catch (error) {
    throw new Error(`Failed to get payment methods: ${error.message}`);
  }
}

/**
 * Construct webhook event
 */
export function constructWebhookEvent(payload, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Format amount for display (cents to dollars)
 */
export function formatAmount(amountInCents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amountInCents / 100);
}

/**
 * Get price ID for plan
 */
export function getPriceIdForPlan(plan) {
  return STRIPE_CONFIG.products[plan]?.priceId;
}

export default stripe; 
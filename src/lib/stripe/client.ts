/**
 * Stripe Client
 *
 * Server-side Stripe SDK initialization and core operations
 *
 * Phase 2, Week 5, Day 1
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG, PLANS, getPlanByPriceId, type PlanId } from './config';

// ================================================================
// STRIPE CLIENT INITIALIZATION
// ================================================================

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    stripeClient = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
      appInfo: {
        name: 'AI Perception',
        version: '1.0.0',
        url: 'https://aiperception.io',
      },
    });
  }

  return stripeClient;
}

// ================================================================
// CUSTOMER MANAGEMENT
// ================================================================

export interface CreateCustomerParams {
  email: string;
  name?: string;
  userId: string;
  metadata?: Record<string, string>;
}

export async function createCustomer(
  params: CreateCustomerParams
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId,
      ...params.metadata,
    },
  });

  return customer;
}

export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  const stripe = getStripeClient();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch (error) {
    if ((error as Stripe.StripeRawError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  return stripe.customers.update(customerId, params);
}

export async function getOrCreateCustomer(
  params: CreateCustomerParams
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();

  // First, try to find existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    // Update metadata if userId is different
    if (customer.metadata?.userId !== params.userId) {
      return updateCustomer(customer.id, {
        metadata: { ...customer.metadata, userId: params.userId },
      });
    }
    return customer;
  }

  // Create new customer
  return createCustomer(params);
}

// ================================================================
// SUBSCRIPTION MANAGEMENT
// ================================================================

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: params.customerId,
    items: [{ price: params.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: params.metadata,
  };

  if (params.trialDays && params.trialDays > 0) {
    subscriptionParams.trial_period_days = params.trialDays;
  }

  return stripe.subscriptions.create(subscriptionParams);
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient();

  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    });
  } catch (error) {
    if ((error as Stripe.StripeRawError).code === 'resource_missing') {
      return null;
    }
    throw error;
  }
}

export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient();

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data[0] || null;
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0].id;

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

// ================================================================
// CHECKOUT SESSIONS
// ================================================================

export interface CreateCheckoutParams {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: params.metadata,
  };

  if (params.trialDays && params.trialDays > 0) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
    };
  }

  return stripe.checkout.sessions.create(sessionParams);
}

// ================================================================
// BILLING PORTAL
// ================================================================

export interface CreatePortalParams {
  customerId: string;
  returnUrl: string;
}

export async function createPortalSession(
  params: CreatePortalParams
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

// ================================================================
// INVOICES
// ================================================================

export async function getInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const stripe = getStripeClient();

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ['data.subscription'],
  });

  return invoices.data;
}

export async function getUpcomingInvoice(
  customerId: string
): Promise<Stripe.UpcomingInvoice | null> {
  const stripe = getStripeClient();

  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch (error) {
    if ((error as Stripe.StripeRawError).code === 'invoice_upcoming_none') {
      return null;
    }
    throw error;
  }
}

// ================================================================
// PAYMENT METHODS
// ================================================================

export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripeClient();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();

  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// ================================================================
// WEBHOOK HANDLING
// ================================================================

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();

  if (!STRIPE_CONFIG.webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.webhookSecret
  );
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

export function extractPlanFromSubscription(
  subscription: Stripe.Subscription
): PlanId {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return 'free';

  const plan = getPlanByPriceId(priceId);
  return plan?.id || 'free';
}

export function isSubscriptionActive(subscription: Stripe.Subscription): boolean {
  return ['active', 'trialing'].includes(subscription.status);
}

export function getSubscriptionStatus(
  subscription: Stripe.Subscription
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' {
  return subscription.status as
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'incomplete';
}

export function formatSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  return {
    start: new Date(subscription.current_period_start * 1000),
    end: new Date(subscription.current_period_end * 1000),
  };
}

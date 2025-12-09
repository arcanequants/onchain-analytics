/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle
 *
 * Phase 2, Week 5, Day 3
 * SRE Audit Fix: Connected to real database via subscription-service
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  constructWebhookEvent,
  getSubscription,
  extractPlanFromSubscription,
} from '@/lib/stripe/client';
import {
  findUserByStripeCustomer,
  updateUserSubscription,
  linkStripeCustomerToUser,
  upsertSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  downgradeToFree,
} from '@/lib/billing/subscription-service';
import type { SubscriptionStatus } from '@/lib/billing/subscription-service';
import {
  sendSubscriptionWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,
  sendCancellationConfirmationEmail,
  sendSubscriptionEndedEmail,
} from '@/lib/billing/emails';
import { getPlanById, formatPrice, type PlanId } from '@/lib/stripe/config';

// ================================================================
// HELPERS
// ================================================================

/**
 * Map Stripe subscription status to our internal status type
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'cancelled';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'trialing':
      return 'trialing';
    default:
      // incomplete, incomplete_expired, paused
      return 'unpaid';
  }
}

/**
 * Extract current period dates from subscription items
 * In Stripe API 2024+, current_period_start/end are on items, not subscription
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
} {
  const firstItem = subscription.items?.data?.[0];
  if (firstItem) {
    return {
      currentPeriodStart: new Date(firstItem.current_period_start * 1000),
      currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
    };
  }
  // Fallback to current date if no items (shouldn't happen)
  const now = new Date();
  return {
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
  };
}

// ================================================================
// WEBHOOK EVENT HANDLERS
// ================================================================

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log('[Webhook] Checkout session completed:', session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('[Webhook] No userId in session metadata');
    return;
  }

  // Get subscription details
  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    console.error('[Webhook] Subscription not found:', subscriptionId);
    return;
  }

  const planId = extractPlanFromSubscription(subscription);

  // Map Stripe status to our status type
  const status = mapStripeStatus(subscription.status);
  const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);

  console.log('[Webhook] Updating user subscription:', {
    userId,
    customerId,
    subscriptionId,
    planId,
    status,
  });

  // Link Stripe customer to user (first time checkout)
  await linkStripeCustomerToUser(userId, customerId);

  // Update user's subscription in users table
  const userUpdated = await updateUserSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan: planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
  });

  if (!userUpdated) {
    console.error('[Webhook] Failed to update user subscription');
  }

  // Get the price ID from subscription items
  const priceId = subscription.items?.data?.[0]?.price?.id || '';

  // Create subscription record in subscriptions table
  const subscriptionCreated = await upsertSubscription({
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    plan: planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  if (!subscriptionCreated) {
    console.error('[Webhook] Failed to create subscription record');
  }

  console.log('[Webhook] Checkout session processed successfully');
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);
  const status = mapStripeStatus(subscription.status);
  const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);

  console.log('[Webhook] New subscription details:', {
    subscriptionId: subscription.id,
    customerId,
    planId,
    status,
  });

  // Find user by Stripe customer ID
  const user = await findUserByStripeCustomer(customerId);
  if (!user) {
    console.warn('[Webhook] User not found for customer:', customerId);
    // This is OK - user might be created via checkout.session.completed
    return;
  }

  // Get the price ID from subscription items
  const priceId = subscription.items?.data?.[0]?.price?.id || '';

  // Create/update subscription record
  await upsertSubscription({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    plan: planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log('[Webhook] Subscription created in database');

  // Send welcome email
  try {
    const plan = getPlanById(planId as PlanId);
    await sendSubscriptionWelcomeEmail({
      email: user.email,
      planName: plan.name,
      planPrice: formatPrice(plan.price),
    });
    console.log('[Webhook] Welcome email sent');
  } catch (emailError) {
    console.error('[Webhook] Failed to send welcome email:', emailError);
    // Don't fail the webhook for email errors
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);
  const status = mapStripeStatus(subscription.status);
  const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);

  console.log('[Webhook] Subscription update:', {
    subscriptionId: subscription.id,
    customerId,
    planId,
    status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Find user by Stripe customer ID
  const user = await findUserByStripeCustomer(customerId);
  if (!user) {
    console.warn('[Webhook] User not found for customer:', customerId);
    return;
  }

  // Update user subscription in users table
  await updateUserSubscription({
    userId: user.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan: planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Get the price ID from subscription items
  const priceId = subscription.items?.data?.[0]?.price?.id || '';

  // Update subscription record
  await upsertSubscription({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    plan: planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Handle cancellation at period end
  if (subscription.cancel_at_period_end) {
    console.log('[Webhook] Subscription will cancel at period end');

    // Send cancellation confirmation email
    try {
      const plan = getPlanById(planId as PlanId);
      await sendCancellationConfirmationEmail({
        email: user.email,
        planName: plan.name,
        endDate: currentPeriodEnd,
      });
      console.log('[Webhook] Cancellation confirmation email sent');
    } catch (emailError) {
      console.error('[Webhook] Failed to send cancellation email:', emailError);
    }
  }

  console.log('[Webhook] Subscription updated in database');
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);

  console.log('[Webhook] Downgrading user to free plan:', {
    subscriptionId: subscription.id,
    customerId,
  });

  // Find user before downgrading (for email)
  const user = await findUserByStripeCustomer(customerId);

  // Mark subscription as cancelled in subscriptions table
  await cancelSubscription(subscription.id);

  // Downgrade user to free plan in users table
  const downgraded = await downgradeToFree(customerId);

  if (downgraded) {
    console.log('[Webhook] User downgraded to free plan');

    // Send subscription ended email
    if (user) {
      try {
        const plan = getPlanById(planId as PlanId);
        await sendSubscriptionEndedEmail({
          email: user.email,
          planName: plan.name,
        });
        console.log('[Webhook] Subscription ended email sent');
      } catch (emailError) {
        console.error('[Webhook] Failed to send subscription ended email:', emailError);
      }
    }
  } else {
    console.error('[Webhook] Failed to downgrade user to free plan');
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[Webhook] Invoice payment succeeded:', invoice.id);

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionId = (invoice as any).subscription as string | null;
  const amountPaid = invoice.amount_paid;

  console.log('[Webhook] Payment details:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    amountPaid: amountPaid / 100,
    currency: invoice.currency,
  });

  // Skip receipt for $0 invoices (trials, etc.)
  if (amountPaid === 0) {
    console.log('[Webhook] Skipping receipt for $0 invoice');
    return;
  }

  // Find user and send receipt email
  if (customerId) {
    const user = await findUserByStripeCustomer(customerId);
    if (user) {
      try {
        await sendPaymentReceiptEmail({
          email: user.email,
          amount: amountPaid,
          currency: invoice.currency,
          invoiceId: invoice.id,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
        });
        console.log('[Webhook] Receipt email sent');
      } catch (emailError) {
        console.error('[Webhook] Failed to send receipt email:', emailError);
      }
    }
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[Webhook] Invoice payment failed:', invoice.id);

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionId = (invoice as any).subscription as string | null;

  console.log('[Webhook] Failed payment:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null,
  });

  // Update subscription status to past_due
  if (subscriptionId) {
    const updated = await updateSubscriptionStatus(subscriptionId, 'past_due');
    if (updated) {
      console.log('[Webhook] Subscription status updated to past_due');
    } else {
      console.error('[Webhook] Failed to update subscription status');
    }
  }

  // Find user and send payment failed email
  if (customerId) {
    const user = await findUserByStripeCustomer(customerId);
    if (user) {
      try {
        await sendPaymentFailedEmail({
          email: user.email,
          amount: invoice.amount_due,
          currency: invoice.currency,
          retryDate: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000)
            : undefined,
        });
        console.log('[Webhook] Payment failed email sent');
      } catch (emailError) {
        console.error('[Webhook] Failed to send payment failed email:', emailError);
      }
    }
  }
}

async function handleCustomerSubscriptionTrialWillEnd(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Trial will end:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  console.log('[Webhook] Trial ending details:', {
    subscriptionId: subscription.id,
    customerId,
    trialEnd,
  });

  // Find user and send trial ending email
  if (trialEnd) {
    const user = await findUserByStripeCustomer(customerId);
    if (user) {
      try {
        const plan = getPlanById(planId as PlanId);
        await sendTrialEndingEmail({
          email: user.email,
          trialEndDate: trialEnd,
          planName: plan.name,
        });
        console.log('[Webhook] Trial ending email sent');
      } catch (emailError) {
        console.error('[Webhook] Failed to send trial ending email:', emailError);
      }
    }
  }
}

// ================================================================
// MAIN WEBHOOK HANDLER
// ================================================================

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] No signature provided');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log('[Webhook] Received event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleCustomerSubscriptionTrialWillEnd(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error handling event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ================================================================
// DISABLE BODY PARSING (Required for signature verification)
// ================================================================

export const config = {
  api: {
    bodyParser: false,
  },
};

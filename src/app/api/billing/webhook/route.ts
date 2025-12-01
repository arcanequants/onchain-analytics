/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle
 *
 * Phase 2, Week 5, Day 3
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  constructWebhookEvent,
  getSubscription,
  extractPlanFromSubscription,
} from '@/lib/stripe/client';

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

  // TODO: Update user subscription in database
  console.log('[Webhook] Updating user subscription:', {
    userId,
    customerId,
    subscriptionId,
    planId,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  // In production, update the database:
  // await updateUserSubscription({
  //   userId,
  //   stripeCustomerId: customerId,
  //   stripeSubscriptionId: subscriptionId,
  //   plan: planId,
  //   status: subscription.status,
  //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);

  console.log('[Webhook] New subscription details:', {
    subscriptionId: subscription.id,
    customerId,
    planId,
    status: subscription.status,
  });

  // TODO: Send welcome email
  // await sendWelcomeEmail(customerId, planId);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;
  const planId = extractPlanFromSubscription(subscription);

  // TODO: Update user subscription in database
  console.log('[Webhook] Subscription update:', {
    subscriptionId: subscription.id,
    customerId,
    planId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Handle cancellation at period end
  if (subscription.cancel_at_period_end) {
    console.log('[Webhook] Subscription will cancel at period end');
    // TODO: Send cancellation confirmation email
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // TODO: Downgrade user to free plan
  console.log('[Webhook] Downgrading user to free plan:', {
    subscriptionId: subscription.id,
    customerId,
  });

  // In production:
  // await updateUserSubscription({
  //   stripeCustomerId: customerId,
  //   plan: 'free',
  //   status: 'canceled',
  //   stripeSubscriptionId: null,
  // });

  // TODO: Send cancellation email
  // await sendCancellationEmail(customerId);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[Webhook] Invoice payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const amountPaid = invoice.amount_paid;

  console.log('[Webhook] Payment details:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    amountPaid: amountPaid / 100,
    currency: invoice.currency,
  });

  // TODO: Send receipt email
  // TODO: Log successful payment for analytics
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('[Webhook] Invoice payment failed:', invoice.id);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.log('[Webhook] Failed payment:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null,
  });

  // TODO: Send payment failed email with update link
  // await sendPaymentFailedEmail(customerId, invoice);

  // TODO: Update subscription status in database
  // await updateSubscriptionStatus(subscriptionId, 'past_due');
}

async function handleCustomerSubscriptionTrialWillEnd(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('[Webhook] Trial will end:', subscription.id);

  const customerId = subscription.customer as string;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  console.log('[Webhook] Trial ending details:', {
    subscriptionId: subscription.id,
    customerId,
    trialEnd,
  });

  // TODO: Send trial ending email
  // await sendTrialEndingEmail(customerId, trialEnd);
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

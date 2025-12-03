/**
 * Stripe Client-Side Utilities
 *
 * Browser-safe Stripe operations using @stripe/stripe-js
 *
 * Phase 2, Week 5, Day 1
 */

'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// ================================================================
// STRIPE INITIALIZATION
// ================================================================

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

// ================================================================
// CHECKOUT REDIRECT
// ================================================================

export interface RedirectToCheckoutParams {
  sessionId: string;
}

export async function redirectToCheckout(
  params: RedirectToCheckoutParams
): Promise<{ error?: string }> {
  const stripe = await getStripe();

  if (!stripe) {
    return { error: 'Stripe is not initialized' };
  }

  // Use type assertion for Stripe's redirectToCheckout method
  // The method exists at runtime but types may vary between versions
  const stripeWithCheckout = stripe as typeof stripe & {
    redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message?: string } }>;
  };

  const result = await stripeWithCheckout.redirectToCheckout({
    sessionId: params.sessionId,
  });

  if (result.error) {
    return { error: result.error.message };
  }

  return {};
}

// ================================================================
// PORTAL REDIRECT
// ================================================================

export async function redirectToPortal(portalUrl: string): Promise<void> {
  window.location.href = portalUrl;
}

// ================================================================
// CHECKOUT HOOKS
// ================================================================

export interface CheckoutResult {
  isLoading: boolean;
  error: string | null;
  redirectToCheckout: (priceId: string, isAnnual?: boolean) => Promise<void>;
}

export async function initiateCheckout(
  priceId: string
): Promise<{ sessionId?: string; error?: string }> {
  try {
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to create checkout session' };
    }

    const { sessionId } = await response.json();
    return { sessionId };
  } catch (error) {
    return { error: 'Failed to initiate checkout' };
  }
}

export async function startCheckout(priceId: string): Promise<{ error?: string }> {
  const { sessionId, error } = await initiateCheckout(priceId);

  if (error || !sessionId) {
    return { error: error || 'No session ID returned' };
  }

  return redirectToCheckout({ sessionId });
}

// ================================================================
// BILLING PORTAL
// ================================================================

export async function openBillingPortal(): Promise<{ error?: string }> {
  try {
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to open billing portal' };
    }

    const { url } = await response.json();
    window.location.href = url;
    return {};
  } catch (error) {
    return { error: 'Failed to open billing portal' };
  }
}

// ================================================================
// SUBSCRIPTION STATUS
// ================================================================

export interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionInfo(): Promise<{
  subscription?: SubscriptionInfo;
  error?: string;
}> {
  try {
    const response = await fetch('/api/billing/subscription');

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to fetch subscription' };
    }

    const subscription = await response.json();
    return { subscription };
  } catch (error) {
    return { error: 'Failed to fetch subscription info' };
  }
}

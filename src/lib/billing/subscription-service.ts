/**
 * Subscription Service
 *
 * Database operations for subscription management
 * Used by Stripe webhook handlers to persist subscription state
 *
 * Phase 2, Week 5 - SRE Audit Fix
 */

import { getSupabaseAdmin, isSupabaseAvailable } from '../supabase';
import type { PlanId } from '../stripe/config';

// ================================================================
// TYPES
// ================================================================

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';

export interface UserSubscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  subscription_tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ================================================================
// USER LOOKUP
// ================================================================

/**
 * Find user by Stripe customer ID
 */
export async function findUserByStripeCustomer(
  stripeCustomerId: string
): Promise<{ id: string; email: string } | null> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error('[Billing] Error finding user by Stripe customer:', error);
    return null;
  }

  return data;
}

/**
 * Find user by user ID
 */
export async function findUserById(
  userId: string
): Promise<{ id: string; email: string; stripe_customer_id: string | null } | null> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Billing] Error finding user by ID:', error);
    return null;
  }

  return data;
}

// ================================================================
// USER SUBSCRIPTION UPDATES
// ================================================================

/**
 * Update user's subscription tier and status
 */
export async function updateUserSubscription(
  params: UserSubscription
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available, skipping update');
    return false;
  }

  const supabase = getSupabaseAdmin();

  console.log('[Billing] Updating user subscription:', {
    userId: params.userId,
    plan: params.plan,
    status: params.status,
  });

  // Update users table
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: params.plan === 'free' ? 'free' : params.plan,
      subscription_status: params.status,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_ends_at: params.currentPeriodEnd?.toISOString() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId);

  if (userError) {
    console.error('[Billing] Error updating user subscription:', userError);
    return false;
  }

  console.log('[Billing] User subscription updated successfully');
  return true;
}

/**
 * Link Stripe customer to user (first time checkout)
 */
export async function linkStripeCustomerToUser(
  userId: string,
  stripeCustomerId: string
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return false;
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[Billing] Error linking Stripe customer:', error);
    return false;
  }

  return true;
}

// ================================================================
// SUBSCRIPTIONS TABLE OPERATIONS
// ================================================================

/**
 * Create or update subscription record
 */
export async function upsertSubscription(params: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
}): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return false;
  }

  const supabase = getSupabaseAdmin();

  console.log('[Billing] Upserting subscription:', {
    subscriptionId: params.stripeSubscriptionId,
    plan: params.plan,
    status: params.status,
  });

  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: params.userId,
        stripe_subscription_id: params.stripeSubscriptionId,
        stripe_customer_id: params.stripeCustomerId,
        stripe_price_id: params.stripePriceId,
        subscription_tier: params.plan,
        status: params.status === 'trialing' ? 'trialing' : params.status,
        current_period_start: params.currentPeriodStart.toISOString(),
        current_period_end: params.currentPeriodEnd.toISOString(),
        cancel_at_period_end: params.cancelAtPeriodEnd || false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'stripe_subscription_id',
      }
    );

  if (error) {
    console.error('[Billing] Error upserting subscription:', error);
    return false;
  }

  console.log('[Billing] Subscription upserted successfully');
  return true;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  cancelAtPeriodEnd?: boolean
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return false;
  }

  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (cancelAtPeriodEnd !== undefined) {
    updateData.cancel_at_period_end = cancelAtPeriodEnd;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', stripeSubscriptionId);

  if (error) {
    console.error('[Billing] Error updating subscription status:', error);
    return false;
  }

  return true;
}

/**
 * Cancel subscription (mark as cancelled)
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return false;
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId);

  if (error) {
    console.error('[Billing] Error cancelling subscription:', error);
    return false;
  }

  return true;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<SubscriptionRecord | null> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Billing] Error getting subscription:', error);
    return null;
  }

  return data;
}

/**
 * Get active subscription for user
 */
export async function getActiveSubscriptionForUser(
  userId: string
): Promise<SubscriptionRecord | null> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[Billing] Error getting active subscription:', error);
    return null;
  }

  return data;
}

// ================================================================
// DOWNGRADE TO FREE
// ================================================================

/**
 * Downgrade user to free plan
 */
export async function downgradeToFree(
  stripeCustomerId: string
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('[Billing] Supabase not available');
    return false;
  }

  const supabase = getSupabaseAdmin();

  console.log('[Billing] Downgrading user to free plan:', stripeCustomerId);

  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'active',
      stripe_subscription_id: null,
      subscription_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId);

  if (error) {
    console.error('[Billing] Error downgrading to free:', error);
    return false;
  }

  console.log('[Billing] User downgraded to free successfully');
  return true;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  findUserByStripeCustomer,
  findUserById,
  updateUserSubscription,
  linkStripeCustomerToUser,
  upsertSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  getSubscriptionByStripeId,
  getActiveSubscriptionForUser,
  downgradeToFree,
};

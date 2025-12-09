/**
 * Subscription Status API Route
 *
 * Gets current user subscription status
 *
 * Phase 2, Week 5, Day 3
 * SRE Audit Fix: Added real authentication and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveSubscription,
  extractPlanFromSubscription,
  formatSubscriptionPeriod,
} from '@/lib/stripe/client';
import { getPlanById, calculateUsageStatus, type PlanId } from '@/lib/stripe/config';
import { getSupabaseAdmin, isSupabaseAvailable } from '@/lib/supabase';

// ================================================================
// GET - Get Subscription Status
// ================================================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    if (!isSupabaseAvailable()) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user profile with subscription info
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', authUser.id)
      .single();

    const stripeCustomerId = userProfile?.stripe_customer_id || null;

    // Get usage count for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: analysesUsed } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .gte('created_at', startOfMonth.toISOString());

    const currentUsage = analysesUsed || 0;

    // If no customer ID, user is on free plan
    if (!stripeCustomerId) {
      const freePlan = getPlanById('free');
      const usageStatus = calculateUsageStatus('free', currentUsage, startOfMonth);

      return NextResponse.json({
        plan: 'free',
        planDetails: freePlan,
        status: 'active',
        subscription: null,
        usage: usageStatus,
        canUpgrade: true,
      });
    }

    // Get active subscription from Stripe
    const subscription = await getActiveSubscription(stripeCustomerId);

    // No subscription means free plan
    if (!subscription) {
      const freePlan = getPlanById('free');
      const usageStatus = calculateUsageStatus('free', currentUsage, startOfMonth);

      return NextResponse.json({
        plan: 'free',
        planDetails: freePlan,
        status: 'active',
        subscription: null,
        usage: usageStatus,
        canUpgrade: true,
      });
    }

    // Extract plan and period info
    const planId = extractPlanFromSubscription(subscription) as PlanId;
    const plan = getPlanById(planId);
    const period = formatSubscriptionPeriod(subscription);
    const usageStatus = calculateUsageStatus(planId, currentUsage, period.start);

    return NextResponse.json({
      plan: planId,
      planDetails: plan,
      status: subscription.status,
      subscription: {
        id: subscription.id,
        currentPeriodStart: period.start.toISOString(),
        currentPeriodEnd: period.end.toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      },
      usage: usageStatus,
      canUpgrade: planId !== 'pro',
      canDowngrade: planId !== 'free',
    });
  } catch (error) {
    console.error('[Subscription] Error fetching status:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

// ================================================================
// OPTIONS - CORS
// ================================================================

import { createPreflightResponse } from '@/lib/security/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createPreflightResponse(origin);
}

/**
 * Subscription Status API Route
 *
 * Gets current user subscription status
 *
 * Phase 2, Week 5, Day 3
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveSubscription,
  extractPlanFromSubscription,
  formatSubscriptionPeriod,
  isSubscriptionActive,
} from '@/lib/stripe/client';
import { getPlanById, calculateUsageStatus } from '@/lib/stripe/config';

// ================================================================
// GET - Get Subscription Status
// ================================================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user and their Stripe customer ID from session/auth
    // For now, return a mock response for development
    const stripeCustomerId = null; // Would come from database

    // If no customer ID, user is on free plan
    if (!stripeCustomerId) {
      const freePlan = getPlanById('free');
      const usageStatus = calculateUsageStatus('free', 0, new Date());

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
      const usageStatus = calculateUsageStatus('free', 0, new Date());

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
    const planId = extractPlanFromSubscription(subscription);
    const plan = getPlanById(planId);
    const period = formatSubscriptionPeriod(subscription);

    // TODO: Get actual usage from database
    const analysesUsed = 0; // Would come from database
    const usageStatus = calculateUsageStatus(planId, analysesUsed, period.start);

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

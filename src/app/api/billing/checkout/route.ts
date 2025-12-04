/**
 * Stripe Checkout API Route
 *
 * Creates a Stripe Checkout session for subscription purchases
 *
 * Phase 2, Week 5, Day 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe/client';
import { PLANS, getPlanByPriceId } from '@/lib/stripe/config';

// ================================================================
// TYPES
// ================================================================

interface CheckoutRequestBody {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// ================================================================
// POST - Create Checkout Session
// ================================================================

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequestBody = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    // Validate priceId
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Verify price exists in our plans
    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // TODO: Get user from session/auth
    // For now, we'll use a placeholder - in production, get from auth
    const user = {
      id: 'user-placeholder',
      email: 'user@example.com',
      name: 'User',
    };

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email: user.email,
      name: user.name,
      userId: user.id,
    });

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const finalSuccessUrl =
      successUrl || `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/pricing?checkout=canceled`;

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[Checkout] Error creating session:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
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

/**
 * Stripe Billing Portal API Route
 *
 * Creates a Stripe Billing Portal session for subscription management
 *
 * Phase 2, Week 5, Day 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, getCustomer } from '@/lib/stripe/client';

// ================================================================
// TYPES
// ================================================================

interface PortalRequestBody {
  returnUrl?: string;
}

// ================================================================
// POST - Create Portal Session
// ================================================================

export async function POST(request: NextRequest) {
  try {
    const body: PortalRequestBody = await request.json().catch(() => ({}));
    const { returnUrl } = body;

    // TODO: Get user and their Stripe customer ID from session/auth
    // For now, we'll use a placeholder - in production, get from database
    const stripeCustomerId = 'cus_placeholder';

    // Verify customer exists
    const customer = await getCustomer(stripeCustomerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Build return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const finalReturnUrl = returnUrl || `${baseUrl}/dashboard/settings`;

    // Create portal session
    const session = await createPortalSession({
      customerId: stripeCustomerId,
      returnUrl: finalReturnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('[Portal] Error creating session:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
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

/**
 * Stripe Billing Portal API Route
 *
 * Creates a Stripe Billing Portal session for subscription management
 *
 * Phase 2, Week 5, Day 2
 * SRE Audit Fix: Added real authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, getCustomer } from '@/lib/stripe/client';
import { getSupabaseAdmin, isSupabaseAvailable } from '@/lib/supabase';

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

    // Get user's Stripe customer ID from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const stripeCustomerId = userProfile.stripe_customer_id;

    // Verify customer exists in Stripe
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

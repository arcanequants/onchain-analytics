/**
 * API Route: Verify Email
 *
 * POST /api/auth/verify-email
 *
 * Verifies user email using verification token from email
 * Marks email_verified = true and sends welcome email
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/resend'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    // Validation
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with this token
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('verification_token', token)
      .single()

    if (fetchError || !profile) {
      console.error('[Verify Email] Token not found:', token)
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(profile.verification_token_expires_at) < new Date()) {
      console.error('[Verify Email] Token expired for user:', profile.email)
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (profile.email_verified) {
      console.log('[Verify Email] Already verified:', profile.email)
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Mark as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[Verify Email] Update failed:', updateError)
      throw updateError
    }

    console.log('[Verify Email] Email verified successfully:', profile.email)

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(profile.email, profile.full_name).catch((error) => {
      console.error('[Verify Email] Failed to send welcome email:', error)
      // Don't fail the verification if welcome email fails
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error: any) {
    console.error('[Verify Email] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}

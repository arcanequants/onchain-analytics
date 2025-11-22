/**
 * API Route: Resend Verification Email
 *
 * POST /api/auth/resend-verification
 *
 * Resends verification email to user
 * Regenerates token and sends new email
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/resend'
import { rateLimitByIP } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (prevent spam)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('cf-connecting-ip') ||
      '127.0.0.1'

    const rateLimitResult = await rateLimitByIP(ip)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      )
    }

    const { email } = await request.json()

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, email_verified, verification_token')
      .eq('email', email)
      .single()

    if (fetchError || !profile) {
      // Don't reveal if user exists (security)
      console.log('[Resend Verification] User not found:', email)
      return NextResponse.json(
        { success: true, message: 'If this email exists, a verification email has been sent.' }
      )
    }

    // Check if already verified
    if (profile.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const newToken = Buffer.from(
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Update token in database
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        verification_token: newToken,
        verification_token_expires_at: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[Resend Verification] Update failed:', updateError)
      throw updateError
    }

    // Send verification email
    await sendVerificationEmail(email, newToken)

    console.log('[Resend Verification] Verification email sent:', email)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error: any) {
    console.error('[Resend Verification] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    )
  }
}

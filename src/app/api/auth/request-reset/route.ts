/**
 * Request Password Reset API Route
 *
 * Generates a reset token and sends email via Resend
 * Does NOT reveal if email exists (security)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/resend'
import { getSupabaseAdmin } from '@/lib/supabase'

// Validation schema
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = requestResetSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const normalizedEmail = email.toLowerCase().trim()

    console.log('[Request Reset] Processing request for:', normalizedEmail)

    // Get lazy-initialized Supabase admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Check if user exists (but don't reveal this to the client)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single()

    // Always return success message (security - don't reveal if email exists)
    if (profileError || !profile) {
      console.log('[Request Reset] Email not found:', normalizedEmail)
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    // Generate reset token
    const { data: tokenData, error: tokenError } = await supabaseAdmin.rpc(
      'generate_reset_token',
      { user_email: normalizedEmail }
    )

    if (tokenError) {
      console.error('[Request Reset] Token generation error:', tokenError)
      // Still return success to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    const resetToken = tokenData as string

    if (!resetToken) {
      console.error('[Request Reset] No token returned')
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    console.log('[Request Reset] Token generated for:', normalizedEmail)

    // Send reset email via Resend
    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken)
      console.log('[Request Reset] Reset email sent to:', normalizedEmail)
    } catch (emailError) {
      console.error('[Request Reset] Email send error:', emailError)
      // Don't fail the request if email fails - user can try again
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    })

  } catch (error: any) {
    console.error('[Request Reset] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Process Password Reset API Route
 *
 * Validates the reset token and updates the user's password
 * Uses Supabase Admin API to update password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schema
const processResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = processResetSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    console.log('[Process Reset] Validating token...')

    // Verify token and get user info
    const { data: tokenData, error: tokenError } = await supabaseAdmin.rpc(
      'verify_reset_token',
      { token }
    )

    if (tokenError) {
      console.error('[Process Reset] Token verification error:', tokenError)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const tokenResult = tokenData as { user_id: string; user_email: string; is_valid: boolean }[] | null

    if (!tokenResult || tokenResult.length === 0) {
      console.log('[Process Reset] Token not found')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const { user_id, user_email, is_valid } = tokenResult[0]

    if (!is_valid) {
      console.log('[Process Reset] Token expired for:', user_email)
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    console.log('[Process Reset] Token valid for:', user_email)

    // Update password using Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password }
    )

    if (updateError) {
      console.error('[Process Reset] Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[Process Reset] Password updated for:', user_email)

    // Clear the reset token
    const { error: clearError } = await supabaseAdmin.rpc(
      'clear_reset_token',
      { user_email }
    )

    if (clearError) {
      console.error('[Process Reset] Clear token error:', clearError)
      // Don't fail the request - password was already updated
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })

  } catch (error: any) {
    console.error('[Process Reset] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

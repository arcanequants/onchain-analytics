/**
 * Signup API Route
 *
 * Handles user registration with manual profile creation
 * (Workaround because auth.users trigger is disabled in Supabase)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
})

// Create Supabase admin client with service role
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
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, fullName } = validation.data

    console.log('[Signup API] Creating user:', email)

    // Step 1: Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        full_name: fullName || null,
      },
    })

    if (authError) {
      console.error('[Signup API] Auth error:', authError)

      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('[Signup API] User created:', authData.user.id)

    // Step 2: Create user profile manually
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || null,
        email_verified: false,
      })

    if (profileError) {
      console.error('[Signup API] Profile error:', profileError)

      // If profile creation fails, delete the auth user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('[Signup API] Profile created for:', authData.user.id)

    // Step 3: Generate verification token and send email
    try {
      const { error: tokenError } = await supabaseAdmin.rpc('regenerate_verification_token', {
        user_email: email,
      })

      if (tokenError) {
        console.error('[Signup API] Token generation error:', tokenError)
        // Don't fail signup if token generation fails
      } else {
        // Get the token and send verification email
        const { data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .select('verification_token')
          .eq('email', email)
          .single()

        if (profileData?.verification_token) {
          // Import and send verification email
          const { sendVerificationEmail } = await import('@/lib/resend')
          await sendVerificationEmail(email, profileData.verification_token)
          console.log('[Signup API] Verification email sent to:', email)
        }
      }
    } catch (emailError) {
      console.error('[Signup API] Email error:', emailError)
      // Don't fail signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })

  } catch (error: any) {
    console.error('[Signup API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

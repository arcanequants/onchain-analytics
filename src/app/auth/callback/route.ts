/**
 * OAuth Callback Route
 *
 * Handles OAuth redirects from Google, GitHub, etc.
 */

import { createClient } from '@/lib/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home page after successful auth
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

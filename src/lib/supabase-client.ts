/**
 * Supabase Client for Browser Authentication
 *
 * This client is used for authentication flows in the browser.
 * It persists sessions and automatically refreshes tokens.
 */

import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

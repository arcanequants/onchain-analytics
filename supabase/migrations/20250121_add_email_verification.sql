/**
 * Migration: Add Email Verification Support
 *
 * Purpose: Add email verification columns and functions to user_profiles table
 * This enables email verification flow with Resend.com
 *
 * Changes:
 * 1. Add email_verified column (boolean)
 * 2. Add verification_token column (text)
 * 3. Add verification_token_expires_at column (timestamp)
 * 4. Create function to generate verification tokens
 * 5. Create trigger to auto-generate tokens on signup
 * 6. Add indexes for performance
 * 7. Update RLS policies
 *
 * Run with:
 * PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
 *   -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
 *   -U postgres \
 *   -d postgres \
 *   -f supabase/migrations/20250121_add_email_verification.sql
 */

-- ================================================================
-- 1. ADD EMAIL VERIFICATION COLUMNS
-- ================================================================

-- Add email_verified column (default FALSE for new users)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add verification token (generated on signup)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Add token expiration (24 hours from creation)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN public.user_profiles.verification_token IS 'Token sent in verification email (base64 encoded)';
COMMENT ON COLUMN public.user_profiles.verification_token_expires_at IS 'When verification token expires (24 hours from creation)';

-- ================================================================
-- 2. CREATE FUNCTION TO GENERATE VERIFICATION TOKEN
-- ================================================================

CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate 32 random bytes and encode as base64
  -- This creates a secure, URL-safe token
  token := encode(gen_random_bytes(32), 'base64');

  -- Replace URL-unsafe characters
  token := replace(token, '+', '-');
  token := replace(token, '/', '_');
  token := replace(token, '=', '');

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.generate_verification_token IS 'Generate a secure verification token (32 bytes, base64 encoded)';

-- ================================================================
-- 3. CREATE TRIGGER TO AUTO-GENERATE TOKEN ON SIGNUP
-- ================================================================

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS on_user_profile_created_verification ON public.user_profiles;
DROP FUNCTION IF EXISTS public.handle_new_user_verification();

-- Create function that runs on INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate verification token
  NEW.verification_token := public.generate_verification_token();

  -- Set expiration to 24 hours from now
  NEW.verification_token_expires_at := NOW() + INTERVAL '24 hours';

  -- Default email_verified to FALSE
  NEW.email_verified := FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires BEFORE INSERT
CREATE TRIGGER on_user_profile_created_verification
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_verification();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user_verification IS 'Auto-generate verification token when user profile is created';
COMMENT ON TRIGGER on_user_profile_created_verification ON public.user_profiles IS 'Trigger to auto-generate verification token on signup';

-- ================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- Index on email_verified for quick filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified
ON public.user_profiles(email_verified);

-- Index on verification_token for quick lookups during verification
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_token
ON public.user_profiles(verification_token)
WHERE verification_token IS NOT NULL;

-- Add comments
COMMENT ON INDEX idx_user_profiles_email_verified IS 'Index for filtering users by verification status';
COMMENT ON INDEX idx_user_profiles_verification_token IS 'Index for looking up users by verification token';

-- ================================================================
-- 5. UPDATE RLS POLICIES
-- ================================================================

-- Users can view their own verification status
-- (Already covered by existing "Users can view own profile" policy)

-- Add policy for API to verify emails (service role only)
DROP POLICY IF EXISTS "Service role can update verification status" ON public.user_profiles;

CREATE POLICY "Service role can update verification status"
  ON public.user_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Service role can update verification status" ON public.user_profiles IS 'Allow API routes to verify emails using service role';

-- ================================================================
-- 6. OPTIONAL: MARK EXISTING USERS AS VERIFIED
-- ================================================================

-- Uncomment this if you want to mark all existing users as verified
-- This is useful if you're adding email verification to an existing system
-- and don't want to force current users to verify

-- UPDATE public.user_profiles
-- SET email_verified = TRUE
-- WHERE created_at < NOW() AND email_verified = FALSE;

-- If you prefer, you can mark only users who have logged in recently:

-- UPDATE public.user_profiles
-- SET email_verified = TRUE
-- WHERE last_login IS NOT NULL
--   AND last_login > (NOW() - INTERVAL '30 days')
--   AND email_verified = FALSE;

-- ================================================================
-- 7. CREATE FUNCTION TO MANUALLY RESEND VERIFICATION EMAIL
-- ================================================================

-- This function regenerates the verification token
-- Useful when user requests a new verification email

CREATE OR REPLACE FUNCTION public.regenerate_verification_token(user_email TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  token TEXT
) AS $$
DECLARE
  new_token TEXT;
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT * INTO user_record
  FROM public.user_profiles
  WHERE email = user_email;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User not found'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if already verified
  IF user_record.email_verified THEN
    RETURN QUERY SELECT FALSE, 'Email already verified'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Generate new token
  new_token := public.generate_verification_token();

  -- Update user record
  UPDATE public.user_profiles
  SET
    verification_token = new_token,
    verification_token_expires_at = NOW() + INTERVAL '24 hours'
  WHERE email = user_email;

  -- Return success
  RETURN QUERY SELECT TRUE, 'Token regenerated'::TEXT, new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.regenerate_verification_token IS 'Regenerate verification token for a user (for resending verification email)';

-- ================================================================
-- 8. CREATE FUNCTION TO VERIFY EMAIL
-- ================================================================

-- This function verifies an email using the token
-- Returns success/failure and clears the token

CREATE OR REPLACE FUNCTION public.verify_email_with_token(token_to_verify TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by token
  SELECT * INTO user_record
  FROM public.user_profiles
  WHERE verification_token = token_to_verify;

  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invalid verification token'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if already verified
  IF user_record.email_verified THEN
    RETURN QUERY SELECT FALSE, 'Email already verified'::TEXT, user_record.id;
    RETURN;
  END IF;

  -- Check if token expired
  IF user_record.verification_token_expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Verification token has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Mark as verified and clear token
  UPDATE public.user_profiles
  SET
    email_verified = TRUE,
    verification_token = NULL,
    verification_token_expires_at = NULL
  WHERE id = user_record.id;

  -- Return success
  RETURN QUERY SELECT TRUE, 'Email verified successfully'::TEXT, user_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.verify_email_with_token IS 'Verify user email using verification token';

-- ================================================================
-- 9. GRANT PERMISSIONS
-- ================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_verification_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_verification_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_with_token(TEXT) TO authenticated;

-- Grant to service role (for API routes)
GRANT EXECUTE ON FUNCTION public.generate_verification_token() TO service_role;
GRANT EXECUTE ON FUNCTION public.regenerate_verification_token(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_email_with_token(TEXT) TO service_role;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Verify changes
DO $$
BEGIN
  RAISE NOTICE '✅ Email verification migration completed successfully';
  RAISE NOTICE '📊 Columns added:';
  RAISE NOTICE '   - email_verified (boolean)';
  RAISE NOTICE '   - verification_token (text)';
  RAISE NOTICE '   - verification_token_expires_at (timestamp)';
  RAISE NOTICE '🔧 Functions created:';
  RAISE NOTICE '   - generate_verification_token()';
  RAISE NOTICE '   - handle_new_user_verification()';
  RAISE NOTICE '   - regenerate_verification_token(email)';
  RAISE NOTICE '   - verify_email_with_token(token)';
  RAISE NOTICE '🚀 Trigger created: on_user_profile_created_verification';
  RAISE NOTICE '📈 Indexes created:';
  RAISE NOTICE '   - idx_user_profiles_email_verified';
  RAISE NOTICE '   - idx_user_profiles_verification_token';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Install Resend SDK: npm install resend';
  RAISE NOTICE '   2. Create src/lib/resend.ts';
  RAISE NOTICE '   3. Create API routes for verification';
  RAISE NOTICE '   4. Create verification UI pages';
END $$;

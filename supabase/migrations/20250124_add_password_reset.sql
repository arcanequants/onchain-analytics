-- Migration: Add password reset token columns to user_profiles
-- Date: 2025-01-24
-- Description: Add columns for custom password reset flow using Resend

-- Add password reset columns
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_reset_token
ON public.user_profiles(reset_token)
WHERE reset_token IS NOT NULL;

-- Function to generate password reset token
CREATE OR REPLACE FUNCTION public.generate_reset_token(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
  token_expiry TIMESTAMPTZ;
BEGIN
  -- Generate a secure random token (32 bytes = 44 base64 chars)
  new_token := encode(gen_random_bytes(32), 'base64');
  -- Token expires in 1 hour
  token_expiry := NOW() + INTERVAL '1 hour';

  -- Update user profile with new token
  UPDATE public.user_profiles
  SET
    reset_token = new_token,
    reset_token_expires_at = token_expiry,
    updated_at = NOW()
  WHERE email = user_email;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN new_token;
END;
$$;

-- Function to verify reset token and clear it
CREATE OR REPLACE FUNCTION public.verify_reset_token(token TEXT)
RETURNS TABLE(user_id UUID, user_email TEXT, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    CASE
      WHEN p.reset_token IS NULL THEN FALSE
      WHEN p.reset_token_expires_at < NOW() THEN FALSE
      ELSE TRUE
    END AS is_valid
  FROM public.user_profiles p
  WHERE p.reset_token = token;
END;
$$;

-- Function to clear reset token after successful password change
CREATE OR REPLACE FUNCTION public.clear_reset_token(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    reset_token = NULL,
    reset_token_expires_at = NULL,
    updated_at = NOW()
  WHERE email = user_email;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.generate_reset_token(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_reset_token(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_reset_token(TEXT) TO service_role;

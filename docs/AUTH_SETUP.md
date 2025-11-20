# Authentication System Setup Guide

## Overview

This guide covers the complete authentication system implementation for Onchain Analytics, including user signup, login, OAuth (Google/GitHub), profile management, and API key system.

## Features Implemented

### 1. Authentication Methods
- **Email/Password**: Traditional signup and login
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub
- **Password Reset**: Email-based password recovery

### 2. User Management
- **User Profiles**: Extended user data with plan tiers
- **API Keys**: User-specific API keys for programmatic access
- **Usage Tracking**: Daily and monthly API call limits
- **Saved Wallets**: Personalized wallet watchlist
- **Saved Tokens**: Custom token favorites

### 3. Subscription Tiers
- **Free**: 100 API calls/day, 3,000/month, 5 wallets, 10 tokens
- **Pro**: 1,000 API calls/day, 30,000/month, 50 wallets, 100 tokens
- **Enterprise**: 10,000 API calls/day, 300,000/month, unlimited wallets and tokens

## Database Schema

### Tables Created

1. **user_profiles** - Extends Supabase auth.users
   - User details (name, avatar, email)
   - Plan tier and subscription info
   - API usage tracking
   - Stripe integration fields

2. **saved_wallets** - User's wallet watchlist
   - Wallet address + chain
   - Custom labels and notes
   - User-specific

3. **saved_tokens** - User's token favorites
   - CoinGecko ID
   - Custom notes
   - User-specific

4. **api_usage_logs** - API call history
   - Endpoint tracking
   - Response times
   - Status codes

5. **activity_logs** - User activity tracking
   - Login/logout events
   - Subscription changes
   - API key generation

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Service role (API routes) has full access for CRON jobs and admin tasks

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── setup-auth/
│   │           └── route.ts              # Database setup endpoint
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                  # OAuth callback handler
│   └── dashboard/
│       ├── page.tsx                      # Main dashboard
│       └── dashboard.css                 # Dashboard styles
├── components/
│   ├── AuthModal.tsx                     # Login/Signup modal
│   ├── AuthModal.css                     # Modal styles
│   ├── UserMenu.tsx                      # User menu in header
│   └── UserMenu.css                      # User menu styles
├── hooks/
│   └── useAuth.ts                        # Authentication hook
├── lib/
│   ├── supabase.ts                       # Server-side Supabase client
│   └── supabase-client.ts                # Browser Supabase client
├── types/
│   └── auth.ts                           # Type definitions
└── supabase/
    └── migrations/
        └── 20250120_auth_users.sql       # Database migration
```

## Setup Instructions

### 1. Apply Database Migration

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250120_auth_users.sql`
4. Paste into SQL Editor and run

**Option B: Using setup endpoint**
```bash
# Run the setup route (one-time only)
curl http://localhost:3000/api/admin/setup-auth
```

### 2. Configure OAuth Providers

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://your-domain.com`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`
     - `https://<project-ref>.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase Dashboard → Authentication → Providers:
   - Enable Google provider
   - Add Client ID and Client Secret

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. In Supabase Dashboard → Authentication → Providers:
   - Enable GitHub provider
   - Add Client ID and Client Secret

### 3. Update Email Templates (Optional)

In Supabase Dashboard → Authentication → Email Templates, customize:
- Confirmation email
- Password reset email
- Magic link email

## Usage Guide

### For Users

#### Signing Up
1. Click "Sign In" button in top-right corner
2. Switch to "Sign up" tab
3. Enter email, password, and optional full name
4. Check email for confirmation link
5. Click confirmation link to activate account

#### Signing In
1. Click "Sign In" button
2. Enter email and password, OR
3. Click "Google" or "GitHub" for social login

#### Accessing Dashboard
1. After login, click on your avatar/name in top-right
2. Select "Dashboard" from dropdown
3. View:
   - Current plan and features
   - API usage (daily and monthly)
   - Quick actions

### For Developers

#### Using the Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const {
    user,           // Current user object
    profile,        // User profile with plan info
    loading,        // Loading state
    signIn,         // Sign in with email/password
    signUp,         // Sign up with email/password
    signOut,        // Sign out
    updateProfile   // Update user profile
  } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return <div>Welcome {profile?.full_name}</div>
}
```

#### Protecting Routes

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return <div>Protected content</div>
}
```

#### API Route Protection

```typescript
import { createClient } from '@/lib/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check API limits
  if (profile.api_calls_today >= profile.api_limit_daily) {
    return NextResponse.json(
      { error: 'Daily API limit exceeded' },
      { status: 429 }
    )
  }

  // Process request...

  return NextResponse.json({ data: 'success' })
}
```

## Testing

### Manual Testing Checklist

- [ ] **Sign Up with Email**
  - Create account with email/password
  - Receive confirmation email
  - Confirm email and activate account

- [ ] **Sign In with Email**
  - Log in with email/password
  - Verify user menu appears
  - Check dashboard access

- [ ] **Google OAuth**
  - Click "Google" button
  - Complete OAuth flow
  - Verify profile created with Google data

- [ ] **GitHub OAuth**
  - Click "GitHub" button
  - Complete OAuth flow
  - Verify profile created with GitHub data

- [ ] **Password Reset**
  - Click "Forgot password?"
  - Enter email
  - Receive reset email
  - Reset password successfully

- [ ] **Dashboard**
  - Access dashboard after login
  - Verify plan information displayed
  - Check API usage stats
  - Test quick actions

- [ ] **Sign Out**
  - Click sign out
  - Verify redirect to homepage
  - Verify user menu shows "Sign In" again

## Next Steps

### Week 2-3: User Dashboard Enhancement
- [ ] Personalized analytics charts
- [ ] Saved wallets functionality
- [ ] Custom watchlists management
- [ ] Activity history view

### Week 3: API Key Management
- [ ] Generate API keys
- [ ] Rate limiting implementation
- [ ] Usage analytics per key
- [ ] Key rotation functionality

### Week 4: Monetization
- [ ] Stripe integration
- [ ] Subscription checkout flow
- [ ] Billing portal
- [ ] Usage-based billing

## Troubleshooting

### Common Issues

**Issue**: "Invalid login credentials" error
- **Solution**: Check that email is confirmed. Resend confirmation email from Supabase dashboard.

**Issue**: OAuth redirects to error page
- **Solution**: Verify redirect URLs match exactly in OAuth provider settings and Supabase configuration.

**Issue**: Database tables not created
- **Solution**: Run migration manually in Supabase SQL Editor.

**Issue**: User profile not found after signup
- **Solution**: Check that `handle_new_user()` trigger is active in database.

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to git
2. **Service Role Key**: Only use in server-side code (API routes, CRON jobs)
3. **RLS Policies**: All user data tables have RLS enabled
4. **Password Requirements**: Minimum 6 characters (can be increased)
5. **Email Confirmation**: Required before account activation
6. **OAuth Scopes**: Only request necessary user data

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Check API route logs in Vercel
4. Contact support at support@onchain-analytics.com

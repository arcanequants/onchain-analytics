# OAuth Production Setup Guide

## Your Production URLs

- **Production Domain**: `https://crypto-lotto-six.vercel.app`
- **Supabase Project**: `https://xkrkqntnpzkwzqkbfyex.supabase.co`
- **Supabase Callback URL**: `https://xkrkqntnpzkwzqkbfyex.supabase.co/auth/v1/callback`

---

## 1. Google OAuth Setup

### Step 1: Go to Google Cloud Console

Open: https://console.cloud.google.com/

### Step 2: Create or Select Project

1. Click on project dropdown (top left)
2. Click "NEW PROJECT"
3. Name: `Onchain Analytics` or use existing project
4. Click "CREATE"

### Step 3: Enable Google+ API (OAuth Consent Screen)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users)
3. Click **CREATE**

**Fill in App Information:**
- **App name**: `Onchain Analytics`
- **User support email**: Your email
- **App logo**: (optional)
- **App domain**:
  - Application home page: `https://crypto-lotto-six.vercel.app`
  - Privacy policy: `https://crypto-lotto-six.vercel.app/privacy` (create later)
  - Terms of service: `https://crypto-lotto-six.vercel.app/terms` (create later)
- **Authorized domains**: `crypto-lotto-six.vercel.app`
- **Developer contact**: Your email

4. Click **SAVE AND CONTINUE**

**Scopes:**
- Click **ADD OR REMOVE SCOPES**
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

**Test users** (skip for now):
- Click **SAVE AND CONTINUE**

**Summary**:
- Review and click **BACK TO DASHBOARD**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Onchain Analytics Production`

**Authorized JavaScript origins:**
```
https://crypto-lotto-six.vercel.app
https://xkrkqntnpzkwzqkbfyex.supabase.co
```

**Authorized redirect URIs:**
```
https://xkrkqntnpzkwzqkbfyex.supabase.co/auth/v1/callback
https://crypto-lotto-six.vercel.app/auth/callback
```

5. Click **CREATE**

### Step 5: Copy Credentials

You'll see:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

**⚠️ IMPORTANT**: Keep these safe! You'll need them in the next step.

---

## 2. Configure Google OAuth in Supabase

### Step 1: Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex

### Step 2: Navigate to Authentication

1. Click **Authentication** (left sidebar)
2. Click **Providers**
3. Find **Google** in the list

### Step 3: Enable and Configure Google

1. Toggle **Enable Google provider** to ON
2. Paste your **Client ID** from Google
3. Paste your **Client Secret** from Google
4. Click **Save**

### Step 4: Verify Callback URL

Supabase shows: `https://xkrkqntnpzkwzqkbfyex.supabase.co/auth/v1/callback`

Make sure this matches what you added in Google Cloud Console.

---

## 3. GitHub OAuth Setup

### Step 1: Go to GitHub Developer Settings

Open: https://github.com/settings/developers

### Step 2: Create New OAuth App

1. Click **OAuth Apps**
2. Click **New OAuth App**

**Fill in Application Details:**
- **Application name**: `Onchain Analytics`
- **Homepage URL**: `https://crypto-lotto-six.vercel.app`
- **Application description**: `Cryptocurrency analytics and tracking platform`
- **Authorization callback URL**: `https://xkrkqntnpzkwzqkbfyex.supabase.co/auth/v1/callback`

3. Click **Register application**

### Step 3: Generate Client Secret

1. After creation, you'll see your **Client ID**
2. Click **Generate a new client secret**
3. Copy the **Client Secret** immediately (you won't see it again!)

**⚠️ IMPORTANT**: Save both:
- **Client ID**: `Ov23xxxxx`
- **Client Secret**: `xxxxx`

---

## 4. Configure GitHub OAuth in Supabase

### Step 1: Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex

### Step 2: Navigate to Authentication

1. Click **Authentication** (left sidebar)
2. Click **Providers**
3. Find **GitHub** in the list

### Step 3: Enable and Configure GitHub

1. Toggle **Enable GitHub provider** to ON
2. Paste your **Client ID** from GitHub
3. Paste your **Client Secret** from GitHub
4. Click **Save**

---

## 5. Update Site URL in Supabase

### Important: Set Your Site URL

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://crypto-lotto-six.vercel.app`
3. Add to **Redirect URLs**:
   - `https://crypto-lotto-six.vercel.app/**`
   - `https://crypto-lotto-six.vercel.app/auth/callback`
4. Click **Save**

---

## 6. Testing

### Test Google OAuth

1. Go to: https://crypto-lotto-six.vercel.app
2. Click **Sign In**
3. Click **Google** button
4. Should redirect to Google login
5. After successful login, redirect back to your app
6. Check Supabase Dashboard → **Authentication** → **Users** to see new user

### Test GitHub OAuth

1. Go to: https://crypto-lotto-six.vercel.app
2. Click **Sign In**
3. Click **GitHub** button
4. Should redirect to GitHub authorization
5. After successful login, redirect back to your app
6. Check Supabase Dashboard → **Authentication** → **Users** to see new user

---

## 7. Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch" (Google)**
- Solution: Check that URLs in Google Cloud Console EXACTLY match Supabase callback URL
- No trailing slashes
- HTTPS (not HTTP)

**Error: "The redirect_uri MUST match the registered callback URL" (GitHub)**
- Solution: Verify GitHub OAuth App callback URL is exactly: `https://xkrkqntnpzkwzqkbfyex.supabase.co/auth/v1/callback`

**Error: "Invalid login credentials"**
- Solution: Check that OAuth provider is enabled in Supabase
- Verify Client ID and Secret are correct

**Redirects to wrong URL after login**
- Solution: Check Site URL in Supabase Authentication settings
- Should be: `https://crypto-lotto-six.vercel.app`

---

## Security Checklist

- ✅ Never commit Client IDs/Secrets to git (they're in Supabase Dashboard only)
- ✅ OAuth apps are set to "External" for public access
- ✅ Redirect URLs use HTTPS only
- ✅ Site URL matches production domain exactly
- ✅ Email confirmation is required (default in Supabase)

---

## Next Steps After OAuth Setup

1. Test signup with email/password
2. Test Google OAuth login
3. Test GitHub OAuth login
4. Verify user profiles are created automatically
5. Check that RLS policies work (users can only see their own data)

---

## Support Resources

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth Docs**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase OAuth Guide**: https://supabase.com/docs/guides/auth/social-login

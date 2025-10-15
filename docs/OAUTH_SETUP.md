# OAuth Authentication Setup Guide

## Overview

TravelBlogr uses Supabase Auth for OAuth authentication with Google (and potentially other providers). This guide documents the complete setup process and troubleshooting steps.

## Table of Contents

1. [Architecture](#architecture)
2. [Supabase Configuration](#supabase-configuration)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Code Implementation](#code-implementation)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Testing](#testing)

## 📊 Visual Flow Diagram

For a detailed visual representation of the OAuth flow, see [OAUTH_FLOW_DIAGRAM.md](./OAUTH_FLOW_DIAGRAM.md)

---

## Architecture

### Authentication Flow

```
User clicks "Sign in with Google"
    ↓
Redirect to Google OAuth consent screen
    ↓
User approves access
    ↓
Google redirects to /auth/callback with tokens in URL hash
    ↓
Supabase client automatically processes tokens
    ↓
onAuthStateChange listener fires with SIGNED_IN event
    ↓
AuthContext updates state with user + profile
    ↓
User redirected to /dashboard
```

### Key Components

1. **Supabase Auth** - Handles OAuth flow, token management, session persistence
2. **AuthContext** - React context for auth state management
3. **OAuth Callback Page** - Handles redirect from OAuth provider
4. **Profile Trigger** - Auto-creates profile when user signs up

---

## Supabase Configuration

### 1. Enable Google Provider

In Supabase Dashboard → Authentication → Providers:

1. Enable **Google** provider
2. Add **Client ID** from Google Cloud Console
3. Add **Client Secret** from Google Cloud Console
4. Set **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`

### 2. Configure Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL**: `http://localhost:3000` (development) or `https://yourdomain.com` (production)

**Redirect URLs** (add all of these):
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
https://your-project.supabase.co/auth/v1/callback
```

### 3. Database Setup

#### Profiles Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Auto-Create Profile Trigger

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google+ API** (required for OAuth)

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `TravelBlogr`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (for development)

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `TravelBlogr Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   https://your-project.supabase.co
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```
7. Save and copy **Client ID** and **Client Secret**

### 4. Add Credentials to Supabase

Paste the Client ID and Client Secret into Supabase Dashboard → Authentication → Providers → Google

---

## Code Implementation

### 1. Supabase Client Setup

**File**: `apps/web/lib/supabase.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Important for OAuth!
      }
    }
  )
}
```

### 2. AuthContext

**File**: `apps/web/contexts/AuthContext.tsx`

Key points:
- ✅ Use `onAuthStateChange` listener (not `getSession()`)
- ✅ Handle `SIGNED_IN` and `INITIAL_SESSION` events
- ✅ Auto-fetch profile after sign-in
- ✅ Don't call `getSession()` on mount (causes hanging)

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, session, loading: false })
      }
    }
  )
  return () => subscription.unsubscribe()
}, [supabase])
```

### 3. OAuth Callback Page

**File**: `apps/web/app/auth/callback/page.tsx`

Key points:
- ✅ Let Supabase automatically process hash params
- ✅ Don't manually call `setSession()` (causes hanging)
- ✅ Just wait and redirect

```typescript
useEffect(() => {
  const handleCallback = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (accessToken) {
      // Supabase handles session automatically
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    }
  }
  handleCallback()
}, [router])
```

### 4. Sign In Button

**File**: `apps/web/app/auth/signin/page.tsx`

```typescript
const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  if (error) console.error('OAuth error:', error)
}
```

### 5. Avatar Display

**File**: `apps/web/components/layout/AuthAwareHeader.tsx`

Key points:
- ✅ Use `referrerPolicy="no-referrer"` for Google images
- ✅ Add `crossOrigin="anonymous"` for CORS
- ✅ Fallback to `user.user_metadata.avatar_url` if profile is null

```typescript
<img
  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
  alt={profile?.full_name || user?.email}
  className="h-8 w-8 rounded-full object-cover"
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
  onError={(e) => {
    // Fallback to initials
  }}
/>
```

### 6. Next.js Image Configuration

**File**: `apps/web/next.config.js`

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com', // Google avatars
    },
    // ... other domains
  ]
}
```

---

## Common Issues & Solutions

### Issue 1: `getSession()` Hangs/Timeouts

**Symptom**: Infinite spinner on callback page, timeout errors in console

**Solution**: Don't call `getSession()` on mount. Use `onAuthStateChange` listener instead.

```typescript
// ❌ DON'T DO THIS
const { data: { session } } = await supabase.auth.getSession()

// ✅ DO THIS
supabase.auth.onAuthStateChange((event, session) => {
  // Handle session
})
```

### Issue 2: Avatar Image Fails to Load

**Symptom**: Broken image icon, 403 error in Network tab

**Solution**: Add `referrerPolicy="no-referrer"` to `<img>` tag

```typescript
<img
  src={avatarUrl}
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
/>
```

### Issue 3: Profile Not Created

**Symptom**: User signs in but profile is null

**Solution**: Check trigger exists and is enabled

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Manually create profile if needed
INSERT INTO profiles (id, full_name, avatar_url)
SELECT id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id = 'user-id-here';
```

### Issue 4: Redirect Loop

**Symptom**: Keeps redirecting between /auth/callback and /auth/signin

**Solution**: Check redirect URLs in Supabase match exactly

### Issue 5: "Invalid redirect URL" Error

**Symptom**: Error message from Supabase about invalid redirect

**Solution**: Add ALL redirect URLs to Supabase Dashboard → Authentication → URL Configuration

---

## Testing

### Local Testing Checklist

- [ ] Click "Sign in with Google"
- [ ] Redirected to Google consent screen
- [ ] Approve access
- [ ] Redirected to /auth/callback
- [ ] See "Completing sign in..." spinner
- [ ] Redirected to /dashboard
- [ ] Avatar displays correctly
- [ ] Profile data saved in database
- [ ] Sign out works
- [ ] Sign in again works (no consent screen)

### Production Testing Checklist

- [ ] Update redirect URLs in Google Cloud Console
- [ ] Update redirect URLs in Supabase Dashboard
- [ ] Set `NEXT_PUBLIC_SITE_URL` environment variable
- [ ] Test OAuth flow on production domain
- [ ] Check HTTPS is working
- [ ] Verify avatar loads over HTTPS

---

## Environment Variables

```bash
# Required for OAuth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or production URL

# Optional (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Additional Providers

To add GitHub, Facebook, etc.:

1. Follow same steps in Supabase Dashboard → Providers
2. Create OAuth app in provider's developer console
3. Add redirect URLs
4. Update sign-in button to use new provider

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github', // or 'facebook', 'twitter', etc.
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

**Last Updated**: 2025-01-13  
**Status**: ✅ Working in Production


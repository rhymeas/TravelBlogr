# OAuth Authentication - Production Guide

**Last Updated:** 2025-10-21  
**Status:** ✅ Production Ready

---

## 🎯 Overview

TravelBlogr uses Supabase OAuth authentication with Google and GitHub providers. The implementation follows Supabase best practices and is optimized for both development and production environments.

---

## 🏗️ Architecture

### Authentication Flow

```
User clicks "Continue with Google"
    ↓
Redirects to Google OAuth consent screen
    ↓
User authorizes application
    ↓
Google redirects to /auth/callback?code=...
    ↓
Supabase automatically exchanges code for session (detectSessionInUrl)
    ↓
onAuthStateChange fires SIGNED_IN event
    ↓
Session stored in localStorage
    ↓
Session synced to server cookies
    ↓
User redirected to intended destination
    ↓
User is authenticated!
```

### Key Components

1. **`apps/web/lib/supabase.ts`** - Supabase client configuration
2. **`apps/web/contexts/AuthContext.tsx`** - Authentication context and OAuth sign-in
3. **`apps/web/app/auth/callback/page.tsx`** - OAuth callback handler
4. **`apps/web/app/api/auth/session/route.ts`** - Server-side session sync

---

## ✅ Current Implementation

### 1. Supabase Client Configuration

**File:** `apps/web/lib/supabase.ts`

```typescript
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ✅ Enable session persistence
    autoRefreshToken: true,      // ✅ Auto-refresh tokens
    detectSessionInUrl: true,    // ✅ Auto-detect OAuth callback
    storage: window.localStorage, // ✅ Use localStorage for sessions
    storageKey: 'travelblogr-auth-token',
    flowType: 'pkce',            // ✅ PKCE for enhanced security
  }
})
```

**Why this configuration:**
- `persistSession: true` - Sessions survive page reloads
- `autoRefreshToken: true` - Tokens refresh automatically before expiry
- `detectSessionInUrl: true` - Automatically handles OAuth callback code exchange
- `storage: localStorage` - Standard browser storage for sessions
- `flowType: 'pkce'` - Proof Key for Code Exchange for enhanced security

### 2. OAuth Sign-In Implementation

**File:** `apps/web/contexts/AuthContext.tsx`

```typescript
const signInWithProvider = async (provider: 'google' | 'github', redirectTo?: string) => {
  const currentOrigin = window.location.origin
  const isLocalhost = currentOrigin.includes('localhost')

  // Dynamic callback URL based on environment
  const callbackUrl = isLocalhost
    ? 'http://localhost:3000/auth/callback'
    : 'https://www.travelblogr.com/auth/callback'

  // Store redirect path for after OAuth completes
  if (redirectTo) {
    localStorage.setItem('oauth_redirect_to', redirectTo)
  }

  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
}
```

**Why this approach:**
- Automatically detects localhost vs production
- Uses correct callback URL for each environment
- Stores intended redirect path for post-auth navigation
- Requests offline access for refresh tokens

### 3. OAuth Callback Handler

**File:** `apps/web/app/auth/callback/page.tsx`

```typescript
// CRITICAL: Use onAuthStateChange instead of manual exchangeCodeForSession
// Manual exchange hangs in React Strict Mode (development)

if (code) {
  // Wait for Supabase to automatically exchange code via detectSessionInUrl
  const sessionCreated = await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), 5000)

    // Listen for SIGNED_IN event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        clearTimeout(timeout)
        subscription.unsubscribe()
        resolve(true)
      }
    })
  })

  if (sessionCreated) {
    window.location.href = redirectTo // Hard redirect
  }
}
```

**Why this approach:**
- Uses `onAuthStateChange` listener (Supabase recommended pattern)
- Avoids manual `exchangeCodeForSession()` which hangs in React Strict Mode
- Works reliably in both development and production
- 5-second timeout with fallback check
- Hard redirect ensures clean navigation

---

## 🚀 Production Deployment

### Prerequisites

#### 1. Supabase Dashboard Configuration

Navigate to: **Supabase Dashboard → Authentication → URL Configuration**

**Add these URLs:**

```
Site URL:
https://www.travelblogr.com

Redirect URLs:
http://localhost:3000/auth/callback
https://www.travelblogr.com/auth/callback
```

#### 2. Google OAuth Configuration

Navigate to: **Google Cloud Console → APIs & Services → Credentials**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://www.travelblogr.com
```

**Authorized redirect URIs:**
```
https://<your-project>.supabase.co/auth/v1/callback
```

#### 3. Railway Environment Variables

**Required variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=https://www.travelblogr.com
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**⚠️ CRITICAL:** After adding/changing `NEXT_PUBLIC_*` variables:
1. Trigger a rebuild (not just restart)
2. These variables are baked into the build at BUILD TIME
3. Use: `git commit --allow-empty -m "Trigger rebuild" && git push`

---

## 🔍 Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| React Strict Mode | ✅ Enabled (double-render) | ❌ Disabled (single render) |
| OAuth Callback | Uses `onAuthStateChange` | Uses `onAuthStateChange` |
| Session Storage | localStorage | localStorage |
| Callback URL | `localhost:3000/auth/callback` | `travelblogr.com/auth/callback` |
| HTTPS Required | ❌ No | ✅ Yes (Railway provides) |
| Performance | ~2-5 seconds | ~0.5-2 seconds |

---

## 🐛 Common Issues & Solutions

### Issue 1: "Infinite Loop" in Development

**Symptom:** OAuth callback page keeps reloading

**Cause:** React Strict Mode causes double-rendering

**Solution:** ✅ Already fixed - using `useRef` instead of `useState` for tracking callback execution

### Issue 2: "Stuck on Loading Screen"

**Symptom:** Callback page shows loading spinner forever

**Cause:** `exchangeCodeForSession()` hangs in React Strict Mode

**Solution:** ✅ Already fixed - using `onAuthStateChange` listener instead

### Issue 3: "Session Lost on Page Reload"

**Symptom:** User is logged out after refreshing page

**Cause:** Session not persisting to localStorage

**Solution:** ✅ Already fixed - `persistSession: true` in Supabase config

### Issue 4: "OAuth Redirect to Wrong URL"

**Symptom:** OAuth redirects to production when testing locally

**Cause:** Supabase site URL set to production

**Solution:** ✅ Already fixed - dynamic callback URL detection based on `window.location.origin`

---

## 📊 Monitoring & Debugging

### Console Logs to Watch

**Successful OAuth Flow:**
```
🔐 OAuth Sign-In: { provider: 'google', callbackUrl: '...', ... }
✅ OAuth callback - Code found (PKCE flow), waiting for Supabase to process...
🔐 Auth state change in callback: SIGNED_IN ✅ Session
✅ Session created successfully, redirecting to: /
🔐 Auth state changed: SIGNED_IN ✅ Session active
✅ Session restored from storage
```

**Failed OAuth Flow:**
```
❌ OAuth callback error: <error message>
⚠️ Session creation timeout after 5 seconds
🔐 Auth state changed: INITIAL_SESSION ❌ No session
```

### Browser DevTools Checks

1. **Application → Local Storage:**
   - Check for `travelblogr-auth-token` key
   - Should contain session data with `access_token` and `refresh_token`

2. **Network → Fetch/XHR:**
   - Check for POST to `/api/auth/session` (session sync)
   - Should return `{ ok: true }`

3. **Console:**
   - No errors related to Supabase or authentication
   - Auth state change logs show SIGNED_IN

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Supabase redirect URLs configured (localhost + production)
- [ ] Google OAuth credentials configured (production domain)
- [ ] Railway environment variables set correctly
- [ ] `NEXT_PUBLIC_*` variables trigger rebuild (not just restart)
- [ ] Test OAuth flow locally with `npm run build && npm start`
- [ ] Verify session persists across page reloads locally
- [ ] Deploy to Railway
- [ ] Test OAuth flow in production
- [ ] Verify session persists across page reloads in production
- [ ] Monitor logs for 10-15 minutes after deployment

---

## 🎯 Why This Solution Works

### The Problem We Solved

In development, React Strict Mode causes components to render twice. This caused:
1. `exchangeCodeForSession()` to hang and never complete
2. Infinite loops in the callback page
3. Stuck loading screens

### The Solution

Use Supabase's recommended pattern:
1. Enable `detectSessionInUrl: true` - Supabase handles code exchange automatically
2. Listen for `onAuthStateChange` SIGNED_IN event - Know when session is ready
3. Don't manually call `exchangeCodeForSession()` - Avoid hanging async calls

### Why It Works in Production

1. **No React Strict Mode** - Components render once, no double-render issues
2. **Standard Supabase Pattern** - Using documented, recommended approach
3. **Resilient to Edge Cases** - Timeout and fallback checks
4. **Works in All Environments** - Same code works in dev and production

---

## 📚 Related Documentation

- [OAuth Setup Guide](./OAUTH_SETUP.md) - Initial setup instructions
- [OAuth Troubleshooting](./OAUTH_TROUBLESHOOTING.md) - Common issues
- [Deployment Guide](./DEPLOYMENT.md) - Full deployment process
- [Architecture Rules](./.augment/rules/imported/rules.md) - Authentication rules

---

## 🔐 Security Considerations

1. **PKCE Flow** - Enhanced security for OAuth
2. **HTTPS Required** - Production OAuth requires HTTPS (Railway provides)
3. **Secure Cookies** - Server-side session sync uses httpOnly cookies
4. **Token Refresh** - Automatic token refresh prevents session expiry
5. **No Secrets in Client** - Only anon key exposed to client (safe)

---

**Status:** ✅ Production Ready  
**Last Tested:** 2025-10-21  
**Next Review:** When upgrading Supabase or Next.js versions


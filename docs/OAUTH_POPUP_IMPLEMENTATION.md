# OAuth Popup Implementation - Complete Guide

## 📋 Overview

TravelBlogr uses a **popup-based OAuth flow** instead of full-page redirects for Google and GitHub authentication. This provides a better user experience by keeping the user on their current page while authenticating in a separate popup window.

## ✅ What We Implemented

### 1. Popup OAuth Flow
- OAuth consent screen opens in a **centered popup window** (500x600px)
- Main page remains visible and interactive
- Popup closes automatically after OAuth completes
- User stays on the same page they were on

### 2. Smart Redirect Handling
- **No redirect by default** - User stays on current page after sign-in
- **Optional redirect** - Only redirects if explicitly requested
- **Client-side navigation** - Uses Next.js router instead of full page reload
- **Prevents race conditions** - No forced page reloads that cause inconsistent state

## 🏗️ Architecture

```
User clicks "Sign in with Google"
    ↓
SignInModal calls signInWithProvider(provider, redirectTo?)
    ↓
AuthContext opens OAuth URL in popup window
    ↓
User completes OAuth in popup
    ↓
Popup redirects to /auth/callback
    ↓
Callback page sends success message to parent window
    ↓
Popup closes immediately
    ↓
Parent window waits for session to be established
    ↓
onAuthStateChange listener updates auth state
    ↓
UI re-renders with authenticated state
    ↓
Optional: Redirect to specific page (if requested)
```

## 📁 Key Files

### 1. `apps/web/contexts/AuthContext.tsx`
**Purpose**: Manages authentication state and OAuth flow

**Key Functions**:
- `signInWithProvider(provider, redirectTo?)` - Initiates OAuth popup flow
- `onAuthStateChange` listener - Updates state when session changes
- Session establishment logic - Waits for session before proceeding

**Critical Implementation Details**:

```typescript
// ✅ CORRECT: Use skipBrowserRedirect to prevent full-page redirect
const { data, error } = await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: callbackUrl,
    skipBrowserRedirect: true, // CRITICAL!
  }
})

// ✅ CORRECT: Open popup manually
const popup = window.open(data.url, 'oauth-popup', '...')

// ✅ CORRECT: Only store redirect if explicitly provided
if (redirectTo) {
  localStorage.setItem('oauth_redirect_to', redirectTo)
}

// ✅ CORRECT: Use router.push() not window.location.href
if (redirectPath && redirectPath !== window.location.pathname) {
  router.push(redirectPath)
}
```

### 2. `apps/web/app/auth/callback/page.tsx`
**Purpose**: Handles OAuth callback and closes popup

**Key Implementation**:

```typescript
// ✅ CORRECT: Detect popup mode
const isPopupMode = localStorage.getItem('oauth_popup_mode') === 'true'

if (isPopupMode) {
  // Send success message to parent window
  window.opener?.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin)
  
  // Close popup immediately
  window.close()
}
```

### 3. `apps/web/components/auth/SignInModal.tsx`
**Purpose**: Sign-in modal that triggers OAuth

**Key Implementation**:

```typescript
// ✅ CORRECT: Only store redirect if explicitly provided
if (redirectTo) {
  localStorage.setItem('oauth_redirect_to', redirectTo)
}

// ✅ CORRECT: Pass redirectTo (or undefined)
const result = await signInWithProvider('google', redirectTo)
```

## 🚫 Common Mistakes & What NOT to Do

### ❌ DON'T: Use full page redirects after OAuth
```typescript
// ❌ WRONG: Causes page reload and race conditions
window.location.href = redirectTo

// ✅ CORRECT: Use Next.js router
router.push(redirectTo)
```

### ❌ DON'T: Always redirect after sign-in
```typescript
// ❌ WRONG: Forces redirect even when user wants to stay
const actualRedirectTo = redirectTo || pathname || '/'
window.location.href = actualRedirectTo

// ✅ CORRECT: Only redirect if explicitly requested
if (redirectTo && redirectTo !== window.location.pathname) {
  router.push(redirectTo)
}
```

### ❌ DON'T: Store current page as redirect path
```typescript
// ❌ WRONG: Stores current page even when not needed
const actualRedirectTo = redirectTo || pathname || '/'
localStorage.setItem('oauth_redirect_to', actualRedirectTo)

// ✅ CORRECT: Only store if explicitly provided
if (redirectTo) {
  localStorage.setItem('oauth_redirect_to', redirectTo)
}
```

### ❌ DON'T: Forget skipBrowserRedirect
```typescript
// ❌ WRONG: Will redirect entire page to OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: callbackUrl }
})

// ✅ CORRECT: Prevents redirect, returns URL for popup
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl,
    skipBrowserRedirect: true // CRITICAL!
  }
})
```

### ❌ DON'T: Close popup before sending message
```typescript
// ❌ WRONG: Popup closes before parent receives message
window.close()
window.opener?.postMessage({ type: 'OAUTH_SUCCESS' }, origin)

// ✅ CORRECT: Send message first, then close
window.opener?.postMessage({ type: 'OAUTH_SUCCESS' }, origin)
setTimeout(() => window.close(), 100)
```

## 🎯 Lessons Learned

### 1. **Race Conditions with Page Reloads**
**Problem**: Using `window.location.href` after OAuth caused inconsistent auth state
**Solution**: Use `router.push()` for client-side navigation
**Why**: Full page reloads can interrupt the `onAuthStateChange` listener

### 2. **Unnecessary Redirects**
**Problem**: Always redirecting to current page caused confusion
**Solution**: Only redirect if explicitly requested AND different from current page
**Why**: Users expect to stay on the page they were on after signing in

### 3. **Session Establishment Timing**
**Problem**: UI updated before session was fully established
**Solution**: Wait for session to exist before proceeding
**Why**: Supabase needs time to establish session after OAuth callback

### 4. **Popup Communication**
**Problem**: Parent window didn't know when OAuth completed
**Solution**: Use `postMessage` API for cross-window communication
**Why**: Popup and parent are separate windows that need to communicate

### 5. **LocalStorage for State Persistence**
**Problem**: OAuth redirect loses in-memory state
**Solution**: Use localStorage to persist redirect path and popup mode
**Why**: OAuth callback is a new page load, in-memory state is lost

## 🔧 Configuration

### Environment Variables
```bash
# Required for OAuth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth callback URLs (configured in Supabase Dashboard)
# Development: http://localhost:3000/auth/callback
# Production: https://www.travelblogr.com/auth/callback
```

### Supabase Dashboard Setup
1. Go to Authentication → URL Configuration
2. Add Site URL: `https://www.travelblogr.com`
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://www.travelblogr.com/auth/callback` (production)

## 🧪 Testing Checklist

### Local Testing (http://localhost:3000)
- [ ] Click "Sign in with Google" from homepage
- [ ] Popup opens (not full page redirect)
- [ ] Complete OAuth in popup
- [ ] Popup closes automatically
- [ ] User stays on homepage
- [ ] Header shows authenticated state (avatar/name)
- [ ] No page reload occurs

### Production Testing (https://www.travelblogr.com)
- [ ] Same as local testing
- [ ] Test from different pages (/plan, /locations, etc.)
- [ ] Verify user stays on same page after sign-in
- [ ] Test explicit redirect (e.g., from protected route)

### Edge Cases
- [ ] Popup blocked by browser - Shows error message
- [ ] OAuth timeout - Shows timeout message
- [ ] Network error during OAuth - Shows error message
- [ ] User closes popup manually - Cleans up state
- [ ] Multiple sign-in attempts - Handles correctly

## 📊 Flow Diagrams

### Normal Flow (Stay on Current Page)
```
User on /plan → Click "Sign in" → Popup opens → OAuth completes → 
Popup closes → Session established → UI updates → User still on /plan ✅
```

### Redirect Flow (Explicit Redirect)
```
User on / → Click "View my trips" (requires auth) → Modal opens with redirectTo="/dashboard/trips" →
Click "Sign in with Google" → Popup opens → OAuth completes → Popup closes →
Session established → Redirect to /dashboard/trips ✅
```

## 🐛 Debugging

### Enable Debug Logging
The implementation includes extensive console logging:
- `🔐 OAuth Sign-In (Popup Mode)` - OAuth initiated
- `✅ OAuth popup opened` - Popup window created
- `✅ OAuth success message received` - Popup sent success message
- `⏳ Waiting for session to be established` - Waiting for session
- `✅ Session established successfully` - Session ready
- `📍 Storing redirect path` - Redirect path stored
- `📍 No redirect path - will stay on current page` - No redirect

### Common Issues

**Issue**: "Sign In" button still shows after OAuth
**Cause**: Session not established or UI not re-rendering
**Fix**: Check console for session establishment logs, verify `onAuthStateChange` listener

**Issue**: Popup doesn't close
**Cause**: Message not received or COOP policy blocking
**Fix**: Check `window.opener` exists, verify origin matches

**Issue**: User redirected when they shouldn't be
**Cause**: Redirect path stored incorrectly
**Fix**: Check localStorage for `oauth_redirect_to`, should only be set when explicitly provided

## 🚀 Deployment Notes

### Railway Deployment
- No special configuration needed
- Environment variables automatically used
- Callback URL must match production domain
- Test thoroughly after deployment

### Vercel/Netlify Deployment
- Same implementation works
- Update callback URLs in Supabase Dashboard
- Ensure environment variables are set

## 📚 Related Documentation
- [OAuth Setup Guide](./OAUTH_SETUP.md)
- [OAuth Troubleshooting](./OAUTH_TROUBLESHOOTING.md)
- [Authentication Architecture](./AUTHENTICATION.md)


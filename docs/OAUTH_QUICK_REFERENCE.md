# OAuth Popup - Quick Reference

## ✅ DO's

### 1. Use skipBrowserRedirect
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    skipBrowserRedirect: true, // ✅ Returns URL instead of redirecting
    redirectTo: callbackUrl
  }
})
```

### 2. Open popup manually
```typescript
const popup = window.open(
  oauthUrl,
  'oauth-popup',
  'width=500,height=600,left=...,top=...'
)
```

### 3. Use postMessage for communication
```typescript
// In popup (callback page)
window.opener?.postMessage({ type: 'OAUTH_SUCCESS' }, origin)

// In parent window
window.addEventListener('message', (event) => {
  if (event.data.type === 'OAUTH_SUCCESS') {
    // Handle success
  }
})
```

### 4. Use router.push() for navigation
```typescript
// ✅ Client-side navigation
router.push(redirectPath)

// ❌ NOT window.location.href (causes reload)
```

### 5. Only redirect when needed
```typescript
// ✅ Only redirect if explicitly requested
if (redirectTo && redirectTo !== window.location.pathname) {
  router.push(redirectTo)
}
```

### 6. Wait for session before proceeding
```typescript
// ✅ Check if session exists first
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  // Wait for onAuthStateChange
  await new Promise((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        resolve(true)
      }
    })
  })
}
```

## ❌ DON'Ts

### 1. Don't use full page redirects
```typescript
// ❌ WRONG
window.location.href = redirectTo

// ✅ CORRECT
router.push(redirectTo)
```

### 2. Don't always redirect
```typescript
// ❌ WRONG: Always redirects
const actualRedirectTo = redirectTo || pathname || '/'
router.push(actualRedirectTo)

// ✅ CORRECT: Only redirect if needed
if (redirectTo) {
  router.push(redirectTo)
}
```

### 3. Don't store current page as redirect
```typescript
// ❌ WRONG
localStorage.setItem('oauth_redirect_to', pathname)

// ✅ CORRECT: Only store if explicitly provided
if (redirectTo) {
  localStorage.setItem('oauth_redirect_to', redirectTo)
}
```

### 4. Don't forget to clean up
```typescript
// ✅ Always remove localStorage items after use
localStorage.removeItem('oauth_popup_mode')
localStorage.removeItem('oauth_redirect_to')
```

### 5. Don't close popup before sending message
```typescript
// ❌ WRONG
window.close()
window.opener?.postMessage(...)

// ✅ CORRECT
window.opener?.postMessage(...)
setTimeout(() => window.close(), 100)
```

## 🔍 Quick Debug Checklist

1. **Popup not opening?**
   - Check if `skipBrowserRedirect: true` is set
   - Check browser popup blocker
   - Check console for errors

2. **Popup not closing?**
   - Check if message is being sent
   - Check if `window.opener` exists
   - Check origin matches

3. **Auth state not updating?**
   - Check `onAuthStateChange` listener is active
   - Check session is established
   - Check console for session logs

4. **Unwanted redirects?**
   - Check localStorage for `oauth_redirect_to`
   - Check if redirect logic only runs when needed
   - Check if using `router.push()` not `window.location.href`

## 📝 Code Snippets

### Initiating OAuth (AuthContext)
```typescript
const signInWithProvider = async (provider, redirectTo?) => {
  // Only store redirect if provided
  if (redirectTo) {
    localStorage.setItem('oauth_redirect_to', redirectTo)
  }
  
  localStorage.setItem('oauth_popup_mode', 'true')
  
  const { data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      skipBrowserRedirect: true,
      redirectTo: callbackUrl
    }
  })
  
  const popup = window.open(data.url, 'oauth-popup', '...')
  
  // Listen for success message
  window.addEventListener('message', handleMessage)
}
```

### Callback Page
```typescript
const isPopupMode = localStorage.getItem('oauth_popup_mode') === 'true'

if (isPopupMode) {
  localStorage.removeItem('oauth_popup_mode')
  window.opener?.postMessage({ type: 'OAUTH_SUCCESS' }, origin)
  setTimeout(() => window.close(), 100)
}
```

### Sign-In Modal
```typescript
const handleGoogleSignIn = async () => {
  // Only store redirect if explicitly provided
  if (redirectTo) {
    localStorage.setItem('oauth_redirect_to', redirectTo)
  }
  
  await signInWithProvider('google', redirectTo)
}
```

## 🎯 Key Principles

1. **Popup, not redirect** - OAuth opens in popup window
2. **Stay on page by default** - Only redirect if explicitly requested
3. **Client-side navigation** - Use Next.js router, not full page reload
4. **Wait for session** - Don't proceed until session is established
5. **Clean up state** - Remove localStorage items after use
6. **Communicate via postMessage** - Popup and parent communicate safely

## 🚀 Testing Commands

```bash
# Start dev server
npm run dev

# Test OAuth flow
# 1. Go to http://localhost:3000
# 2. Click "Sign in with Google"
# 3. Complete OAuth in popup
# 4. Verify popup closes
# 5. Verify you stay on same page
# 6. Verify header shows authenticated state
```

## 📊 Expected Console Output

```
🔐 OAuth Sign-In (Popup Mode): { provider: 'google', ... }
✅ OAuth popup opened
✅ OAuth success message received from popup
⏳ Waiting for session to be established...
🔐 Auth state change after popup: SIGNED_IN ✅ Session
✅ Session established successfully
📍 No redirect path - will stay on current page
✅ Staying on current page, UI will update automatically
```


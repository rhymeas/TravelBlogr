# OAuth Troubleshooting Guide

Quick reference for debugging OAuth authentication issues in TravelBlogr.

## Quick Diagnostics

### Check Auth Status

Open browser console and run:

```javascript
// Check if user is authenticated
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Check localStorage
console.log('Auth token:', localStorage.getItem('sb-nchhcxokrzabbkvhzsor-auth-token'))

// Check user metadata
console.log('User metadata:', session?.user?.user_metadata)
```

### Check Profile in Database

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = 'user-id-here';

-- Check user in auth.users
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';

-- Check if trigger exists
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

---

## Common Error Messages

### "getSession timeout after 3s"

**Cause**: Calling `getSession()` on mount causes hanging

**Fix**: Remove `getSession()` call, use `onAuthStateChange` instead

**Location**: `apps/web/contexts/AuthContext.tsx`

```typescript
// ❌ Remove this
const { data: { session } } = await supabase.auth.getSession()

// ✅ Use this instead
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Handle sign in
  }
})
```

---

### "Invalid redirect URL"

**Cause**: Redirect URL not whitelisted in Supabase

**Fix**: Add to Supabase Dashboard → Authentication → URL Configuration

**Required URLs**:
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
https://your-project.supabase.co/auth/v1/callback
```

---

### Avatar Image 403 Error

**Cause**: Google blocks images without proper referrer policy

**Fix**: Add `referrerPolicy="no-referrer"` to `<img>` tag

**Location**: `apps/web/components/layout/AuthAwareHeader.tsx`

```typescript
<img
  src={avatarUrl}
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
/>
```

---

### "No session returned after setSession"

**Cause**: Manually calling `setSession()` with OAuth tokens

**Fix**: Let Supabase handle OAuth tokens automatically

**Location**: `apps/web/app/auth/callback/page.tsx`

```typescript
// ❌ Don't do this
await supabase.auth.setSession({ access_token, refresh_token })

// ✅ Do this instead
// Just wait for Supabase to process hash params automatically
await new Promise(resolve => setTimeout(resolve, 1000))
router.push('/dashboard')
```

---

### Profile is null after sign-in

**Cause**: Trigger didn't fire or profile fetch failed

**Fix 1**: Check trigger exists

```sql
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

**Fix 2**: Manually create profile

```sql
INSERT INTO profiles (id, full_name, avatar_url)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id = 'user-id-here';
```

**Fix 3**: Add fallback in code

```typescript
// Fallback to user_metadata if profile is null
const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
const fullName = profile?.full_name || user?.user_metadata?.full_name
```

---

### Redirect loop between /auth/callback and /auth/signin

**Cause**: Session not being established properly

**Fix**: Check console for errors, verify:
1. Supabase client has `detectSessionInUrl: true`
2. Callback page waits before redirecting
3. No errors in `onAuthStateChange` listener

---

### "OAuth provider returned an error"

**Cause**: Google OAuth credentials invalid or misconfigured

**Fix**: Verify in Google Cloud Console:
1. OAuth consent screen is published
2. Client ID and Secret are correct
3. Redirect URIs match exactly
4. Google+ API is enabled

---

## Debug Logging

### Enable Verbose Logging

Add to `apps/web/lib/supabase.ts`:

```typescript
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        debug: true, // Enable debug logging
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }
  )
}
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to:
   - `supabase.co/auth/v1/token`
   - `supabase.co/auth/v1/user`
   - `accounts.google.com`

---

## Testing Checklist

### Before Testing

- [ ] Clear browser cache and cookies
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Open incognito/private window
- [ ] Check environment variables are set

### During Testing

- [ ] Open browser console
- [ ] Watch for errors
- [ ] Check Network tab for failed requests
- [ ] Verify redirect URLs in address bar

### After Sign In

- [ ] Check session in localStorage
- [ ] Verify profile in database
- [ ] Test avatar loads
- [ ] Test sign out
- [ ] Test sign in again

---

## Emergency Fixes

### Reset User Session

```javascript
// In browser console
await supabase.auth.signOut()
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Delete and Recreate User

```sql
-- Delete user (cascades to profile)
DELETE FROM auth.users WHERE email = 'user@example.com';

-- User can now sign up again
```

### Recreate Trigger

```sql
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate (see OAUTH_SETUP.md for full code)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Contact & Support

If issues persist:

1. Check [Supabase Status](https://status.supabase.com/)
2. Review [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
3. Check [GitHub Issues](https://github.com/supabase/supabase/issues)
4. Ask in [Supabase Discord](https://discord.supabase.com/)

---

**Last Updated**: 2025-01-13


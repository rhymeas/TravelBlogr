# Plan Page Authentication & Admin Credits Fix

## 🎯 Problems Fixed

### 1. Authentication Failing for Logged-In Users
**Issue:** Even when logged in, users got "Authentication required" error when trying to generate itineraries.

**Root Cause:** Middleware was NOT running for `/api/*` routes, so session wasn't being refreshed before API calls.

**Solution:** Updated middleware matcher to include API routes.

### 2. Admin Users Should Have Unlimited Credits
**Issue:** Admin users were subject to the same credit limits as regular users.

**Solution:** Added admin role check in API route to bypass credit limits and usage tracking.

## 🔧 Technical Changes

### 1. Middleware Configuration (`apps/web/middleware.ts`)

**Before:**
```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',  // ❌ Excludes /api
  ],
}
```

**After:**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',  // ✅ Includes /api
  ],
}
```

**Why This Matters:**
- Middleware calls `supabase.auth.getSession()` which refreshes expired sessions
- Without middleware running on API routes, cookies weren't being refreshed
- This caused authentication to fail even for logged-in users

### 2. API Route Admin Check (`apps/web/app/api/itineraries/generate/route.ts`)

**Added Admin Role Check:**
```typescript
// 4. Check if user is admin (unlimited credits)
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

const isAdmin = profile?.role === 'admin'
console.log('👤 User role:', { userId: user.id, role: profile?.role, isAdmin })
```

**Skip Usage Tracking for Admins:**
```typescript
// 8. Increment monthly usage counter (for free tier tracking)
// Skip for admins - they have unlimited usage
if (!isAdmin) {
  await incrementAIUsage(user.id)
}
```

**Include Admin Status in Response:**
```typescript
meta: {
  generationTimeMs: generationTime,
  generatedAt: new Date().toISOString(),
  usedCredit,
  isAdmin, // Include admin status in response for debugging
}
```

### 3. Debug Logging Added

```typescript
// Debug logging
console.log('🔐 Auth check:', {
  hasUser: !!user,
  userId: user?.id,
  authError: authError?.message,
  cookies: request.cookies.getAll().map(c => c.name)
})

console.log('👤 User role:', { userId: user.id, role: profile?.role, isAdmin })
```

## 📋 How to Set Admin Role

To make a user an admin, run this SQL in Supabase:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

Or use your email:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## ✅ Benefits

1. **Authentication Works** - Logged-in users can now generate itineraries
2. **Admin Unlimited** - Admin users have unlimited itinerary generations
3. **Better Debugging** - Console logs show auth status and role
4. **Session Refresh** - Middleware refreshes sessions for all routes including API

## 🧪 Testing

### Test as Regular User:
1. Sign in as regular user
2. Go to `/plan`
3. Fill in locations and dates
4. Click "Generate plan"
5. ✅ Should work (subject to free tier limits)

### Test as Admin:
1. Set your user role to 'admin' in database
2. Sign in
3. Go to `/plan`
4. Fill in locations and dates
5. Click "Generate plan"
6. ✅ Should work with unlimited generations
7. Check console logs - should see `isAdmin: true`

### Check Console Logs:
```
🔐 Auth check: { hasUser: true, userId: '...', authError: undefined, cookies: [...] }
👤 User role: { userId: '...', role: 'admin', isAdmin: true }
```

## 🔄 Flow Diagram

### Before (Broken):
```
User clicks "Generate plan"
    ↓
Frontend makes API call to /api/itineraries/generate
    ↓
Middleware SKIPS (matcher excludes /api)
    ↓
Session NOT refreshed
    ↓
API checks auth → Session expired
    ↓
❌ 401 Unauthorized
```

### After (Fixed):
```
User clicks "Generate plan"
    ↓
Frontend makes API call to /api/itineraries/generate
    ↓
Middleware RUNS (matcher includes /api)
    ↓
Session refreshed via getSession()
    ↓
API checks auth → Session valid
    ↓
API checks role → Admin or regular user
    ↓
If admin: Skip usage tracking
    ↓
✅ Plan generated successfully
```

## 📦 Files Modified

1. **`apps/web/middleware.ts`**
   - Updated matcher to include API routes
   - Added comment explaining why

2. **`apps/web/app/api/itineraries/generate/route.ts`**
   - Added admin role check
   - Skip usage tracking for admins
   - Added debug logging
   - Include admin status in response

3. **`apps/web/components/itinerary/ItineraryGenerator.tsx`**
   - Added auth hooks (from previous fix)
   - Check authentication before API call

## 🎉 Result

- ✅ Authentication works for logged-in users
- ✅ Admin users have unlimited credits
- ✅ Better debugging with console logs
- ✅ Session refresh works for all routes

---

**Implementation Date:** 2025-10-17  
**Status:** ✅ Complete  
**Tested:** Pending user testing

**Next Steps:**
1. Test with your admin account
2. Verify console logs show correct role
3. Try generating multiple itineraries as admin
4. Check that usage counter doesn't increment for admin


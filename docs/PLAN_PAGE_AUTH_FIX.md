# Plan Page Authentication Fix

## 🎯 Problem

When users tried to plan a trip on `/plan`, they would see an "Authentication required" error message in a red box, but couldn't dismiss it or understand what to do. The error came from the API after the user clicked "Generate plan", which was confusing.

**User Experience Before:**
1. User goes to `/plan`
2. Fills in locations and dates
3. Clicks "Generate plan"
4. ❌ Red error box appears: "Authentication required"
5. ❌ No way to sign in from the page
6. ❌ User is confused and stuck

**Console Errors:**
```
api/itineraries/generate:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## ✅ Solution

Added authentication checks to the `ItineraryGenerator` component to show the sign-in modal BEFORE attempting to generate a plan, preventing the confusing error message.

**User Experience After:**
1. User goes to `/plan`
2. Fills in locations and dates
3. Clicks "Generate plan"
4. ✅ Sign-in modal appears immediately
5. ✅ User can sign in or close modal
6. ✅ After signing in, plan generation proceeds
7. ✅ Clear, expected behavior

## 🔧 Technical Implementation

### File: `apps/web/components/itinerary/ItineraryGenerator.tsx`

**Changes Made:**

1. **Added Auth Imports:**
```typescript
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
```

2. **Added Auth Hooks:**
```typescript
const { isAuthenticated, isLoading: authLoading } = useAuth()
const { showSignIn } = useAuthModal()
```

3. **Updated `handleGenerate` Function:**
```typescript
const handleGenerate = async () => {
  // Check authentication first
  if (!isAuthenticated) {
    showSignIn('/plan')  // Show modal, redirect to /plan after sign-in
    return
  }

  // Validation
  const filledLocations = locations.filter(loc => loc.value.trim())
  if (filledLocations.length < 2) {
    setError('Please enter at least a starting location and destination')
    return
  }
  // ... rest of function
}
```

## 🔄 Flow Diagram

### Before (Broken):
```
User fills form
    ↓
Clicks "Generate plan"
    ↓
API call to /api/itineraries/generate
    ↓
API checks auth → Not authenticated
    ↓
API returns 401 error
    ↓
❌ Red error box: "Authentication required"
    ↓
User confused, no way to sign in
```

### After (Fixed):
```
User fills form
    ↓
Clicks "Generate plan"
    ↓
Frontend checks: isAuthenticated?
    ↓
NO → Show sign-in modal
    ↓
User signs in
    ↓
Modal closes, stays on /plan
    ↓
User clicks "Generate plan" again
    ↓
Frontend checks: isAuthenticated?
    ↓
YES → API call proceeds
    ↓
✅ Plan generated successfully
```

## 📋 Related Files

### API Route (No Changes Needed)
**File:** `apps/web/app/api/itineraries/generate/route.ts`

The API route already has proper authentication checks:
```typescript
// 3. Check authentication
const supabase = await createServerSupabase()
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  return NextResponse.json(
    {
      success: false,
      error: 'Authentication required',
      action: 'login',
    },
    { status: 401 }
  )
}
```

This is correct - the API should always validate authentication. The fix was to add frontend checks to prevent reaching this error state.

## ✅ Benefits

1. **Better UX** - Users see sign-in modal immediately, not after API error
2. **Clear Action** - Modal provides clear path to sign in
3. **No Confusion** - No cryptic error messages
4. **Consistent** - Matches behavior of other protected features
5. **Prevents Wasted API Calls** - Checks auth before making request

## 🧪 Testing Checklist

- [ ] Test as guest user:
  - [ ] Go to `/plan`
  - [ ] Fill in locations and dates
  - [ ] Click "Generate plan"
  - [ ] Sign-in modal appears
  - [ ] Close modal → stays on /plan
  - [ ] Sign in → modal closes, stays on /plan
  - [ ] Click "Generate plan" again → plan generates

- [ ] Test as authenticated user:
  - [ ] Go to `/plan`
  - [ ] Fill in locations and dates
  - [ ] Click "Generate plan"
  - [ ] Plan generates immediately (no modal)

- [ ] Test edge cases:
  - [ ] Session expires while on /plan
  - [ ] Click "Generate plan" → modal appears
  - [ ] Sign in → plan generates

## 🎉 Result

The plan page now has proper authentication flow that matches the rest of the application. Users are never confused by error messages and always know what action to take.

---

**Implementation Date:** 2025-10-17  
**Status:** ✅ Complete  
**Tested:** Pending user testing


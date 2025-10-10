# 🔄 Mock to Real Implementation Migration Plan

## Overview
This document outlines all areas where TravelBlogr currently uses mock/placeholder data and provides a roadmap to replace them with real Supabase integrations and external APIs.

---

## 🔐 1. Authentication System (HIGH PRIORITY)

### Current State
- **File**: `apps/web/hooks/useAuth.ts`
- **Issues**:
  - Uses localStorage for session persistence (`mock_auth_session`)
  - Hardcoded test account credentials
  - Mock user IDs and sessions
  - `signIn()` accepts any credentials for non-test accounts
  - `signUp()` returns mock success without creating real users
  - Profile fetching returns mock data instead of querying Supabase

### Mock Code Locations
```typescript
// Line 39-51: Hardcoded test accounts
const TEST_ACCOUNTS = {
  'test@example.com': { password: 'password123', ... }
}

// Line 53-73: Mock profile fetching
const fetchProfile = async (userId: string, email: string) => {
  // Returns mock data instead of Supabase query
}

// Line 80-120: localStorage session management
const storedSession = localStorage.getItem('mock_auth_session')

// Line 140-219: Mock signIn implementation
const signIn = async (email: string, password: string) => {
  // Creates mock user and session
}

// Line 221-232: Mock signUp implementation
const signUp = async (email: string, password: string) => {
  // Returns success without creating user
}
```

### Migration Steps
1. ✅ **OAuth is already real** - `signInWithProvider()` uses real Supabase OAuth
2. Replace `signIn()` with real Supabase auth:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
   ```
3. Replace `signUp()` with real Supabase auth:
   ```typescript
   const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
   ```
4. Replace `fetchProfile()` with real Supabase query:
   ```typescript
   const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
   ```
5. Remove localStorage session management - use Supabase's built-in session handling
6. Remove TEST_ACCOUNTS or create real test users in Supabase

---

## 👤 2. Profile Management

### Current State
- **File**: `apps/web/hooks/useAuth.ts` (lines 53-73)
- **Issue**: Returns hardcoded mock profiles instead of querying `public.profiles` table

### Migration Steps
1. Update `fetchProfile()` to query Supabase:
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('id, full_name, username, avatar_url, bio, created_at, updated_at')
     .eq('id', userId)
     .single()
   ```
2. Handle profile creation via trigger (already implemented in Supabase)
3. Implement profile update functionality

---

## 🗺️ 3. Location Data & Images

### Current State
- **Files**:
  - `apps/web/lib/services/enhancedImageService.ts`
  - `apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts`
  - `apps/web/lib/mappers/locationMapper.ts`

### Placeholder Usage
```typescript
// Fallback images
'/placeholder-location.svg'
'/placeholder-location.jpg'
'/placeholder-restaurant.svg'
'/placeholder-activity.svg'

// Community upload placeholder
`/api/placeholder/community-upload?location=${locationName}`
```

### Migration Steps
1. **Already partially implemented**: Uses OpenTripMap, WikiVoyage, Unsplash
2. Remove Lorem Picsum placeholders (line 899 in LocationDiscoveryService.ts)
3. Implement real community image upload to Supabase Storage
4. Create fallback to generic travel images instead of placeholder SVGs
5. Add image moderation/approval system

---

## 🏨 4. Restaurant & Activity Data

### Current State
- **File**: `apps/web/lib/mappers/locationMapper.ts`
- **Issue**: Uses placeholder images when data is missing

### Migration Steps
1. Integrate real restaurant APIs:
   - Google Places API (paid but comprehensive)
   - Yelp Fusion API (free tier available)
   - Foursquare Places API
2. Integrate real activity APIs:
   - OpenTripMap (already used for attractions)
   - GetYourGuide API
   - Viator API
3. Store fetched data in Supabase for caching
4. Implement user-contributed restaurant/activity system

---

## 🧳 5. Trip Management

### Current State
- **Files**: Various API routes and components
- **Status**: Mostly real, but check for any mock data in development

### Verification Needed
- Check `/api/trips/*` routes for mock responses
- Verify all trip CRUD operations use real Supabase queries
- Ensure trip sharing uses real database records

---

## 📸 6. Image Upload & Storage

### Current State
- **Issue**: No real image upload implementation yet
- **Placeholder**: Using external URLs and placeholders

### Migration Steps
1. Set up Supabase Storage buckets:
   - `trip-images` - User trip photos
   - `profile-avatars` - User profile pictures
   - `location-images` - Community-contributed location photos
2. Implement upload functionality:
   ```typescript
   const { data, error } = await supabase.storage
     .from('trip-images')
     .upload(`${userId}/${tripId}/${fileName}`, file)
   ```
3. Implement image optimization (resize, compress)
4. Add image moderation queue
5. Implement CDN integration for faster delivery

---

## 🔄 7. Session Management

### Current State
- **File**: `apps/web/hooks/useAuth.ts`
- **Issue**: Uses localStorage instead of Supabase's session management

### Migration Steps
1. Remove all localStorage session code
2. Use Supabase's built-in session handling:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession()
   ```
3. Implement session refresh:
   ```typescript
   supabase.auth.onAuthStateChange((event, session) => {
     if (event === 'SIGNED_IN') setState({ user: session?.user, ... })
     if (event === 'SIGNED_OUT') setState({ user: null, ... })
   })
   ```
4. Use HTTP-only cookies for production security

---

## 🧪 8. Test Account System

### Current State
- **File**: `apps/web/hooks/useAuth.ts` (lines 39-51)
- **Issue**: Hardcoded test credentials

### Migration Options

**Option A: Create Real Test Users**
1. Create test users in Supabase Auth
2. Seed test data (trips, locations, etc.)
3. Document test credentials in README

**Option B: Remove Test Accounts**
1. Remove TEST_ACCOUNTS constant
2. Require real sign-up for all users
3. Implement demo mode with read-only access

**Recommendation**: Option A - Create real test users for easier onboarding

---

## 📊 Priority Order

### Phase 1: Critical (Week 1)
1. ✅ OAuth Authentication (Already done!)
2. [ ] Replace mock signIn/signUp with real Supabase auth
3. [ ] Replace mock profile fetching with real queries
4. [ ] Remove localStorage session management

### Phase 2: Important (Week 2)
5. [ ] Implement real image upload to Supabase Storage
6. [ ] Create real test users in Supabase
7. [ ] Verify all trip operations use real database

### Phase 3: Enhancement (Week 3-4)
8. [ ] Integrate real restaurant APIs
9. [ ] Integrate real activity APIs
10. [ ] Implement community image upload system
11. [ ] Add image moderation

---

## 🎯 Success Metrics

- [ ] No localStorage usage for authentication
- [ ] All user data comes from Supabase database
- [ ] All images stored in Supabase Storage or external APIs
- [ ] No hardcoded credentials
- [ ] Session management uses Supabase's built-in system
- [ ] Test accounts are real Supabase users

---

## 🚀 Next Steps

1. **Start with Phase 1** - Authentication is the foundation
2. **Test thoroughly** - Each migration step should be tested
3. **Maintain backwards compatibility** - Don't break existing features
4. **Document changes** - Update README with new setup instructions
5. **Monitor errors** - Use Sentry or similar for error tracking

---

## 📝 Notes

- Google OAuth is already working! ✅
- Most location data already uses real APIs (OpenTripMap, WikiVoyage)
- Trip management appears to be mostly real
- Main focus should be on authentication and profile management


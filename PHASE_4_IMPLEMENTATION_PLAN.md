# 🚀 Phase 4: Real-Time Features - Implementation Plan

**Goal:** Add real-time updates to existing systems using Upstash Pub/Sub

---

## 📋 Phase 4A: Foundation (30 minutes)

### **Step 1: Create Real-Time Infrastructure**

**Files to create:**

1. **`apps/web/lib/upstash-realtime.ts`** - Pub/Sub helper functions
2. **`apps/web/app/api/subscribe/route.ts`** - SSE endpoint template

**What we'll build:**
- Publish functions for comments, ratings, likes, saves, presence
- Subscribe endpoint for Server-Sent Events (SSE)
- Type definitions for real-time events

**Testing:**
- Test pub/sub with simple message
- Verify SSE connection works

---

## 📋 Phase 4B: Real-Time Comments (1.5 hours)

### **Step 1: Update Comment APIs** (30 minutes)

**Files to modify:**

1. **`apps/web/app/api/trips/[tripId]/comments/route.ts`**
   - Add `publishComment()` after creating comment
   - Add `publishCommentDelete()` after deleting comment

2. **`apps/web/app/api/locations/[slug]/comments/route.ts`**
   - Same as above for location comments

3. **`apps/web/app/api/posts/[postId]/comments/route.ts`**
   - Same as above for post comments

**Changes:**
```typescript
// After creating comment
await publishComment('trip', tripId, comment)

// After deleting comment
await publishCommentDelete('trip', tripId, commentId)
```

### **Step 2: Create SSE Endpoint** (15 minutes)

**File to create:**

**`apps/web/app/api/subscribe/[type]/[id]/comments/route.ts`**

**What it does:**
- Subscribes to Redis channel
- Streams updates to client via SSE

### **Step 3: Update React Components** (45 minutes)

**Files to modify:**

1. **`apps/web/components/comments/TripCommentSection.tsx`**
2. **`apps/web/components/comments/PostCommentSection.tsx`**
3. **`apps/web/components/locations/LocationComments.tsx`** (if exists)

**Changes:**
- Add `useEffect` to subscribe to SSE
- Update comments state on new messages
- Show toast notification for new comments

**Testing:**
- Open trip page in 2 browser windows
- Post comment in window 1
- Verify it appears instantly in window 2

---

## 📋 Phase 4C: Real-Time Ratings (30 minutes)

### **Step 1: Update Rating API** (15 minutes)

**File to modify:**

**`apps/web/app/api/locations/[slug]/rating/route.ts`**

**Changes:**
```typescript
// After updating rating
const newAverage = await calculateAverageRating(locationId)
const newCount = await getRatingCount(locationId)

await publishRating('location', locationId, {
  averageRating: newAverage,
  ratingCount: newCount
})
```

### **Step 2: Update Rating Component** (15 minutes)

**File to modify:**

**`apps/web/components/locations/LocationRating.tsx`**

**Changes:**
- Subscribe to rating updates via SSE
- Update rating/count state on new messages

**Testing:**
- Open location page in 2 windows
- Rate in window 1
- Verify rating updates in window 2

---

## 📋 Phase 4D: Real-Time Likes (30 minutes)

### **Step 1: Create Like API** (15 minutes)

**File to create:**

**`apps/web/app/api/trips/[tripId]/like/route.ts`**

**What it does:**
- Toggle like/unlike
- Publish like count update
- Return new like state

### **Step 2: Update Trip Components** (15 minutes)

**Files to modify:**

1. **`apps/web/components/social/TripDiscovery.tsx`**
2. **`apps/web/app/trips/[id]/page.tsx`** (if exists)

**Changes:**
- Add like button with real-time count
- Subscribe to like updates via SSE

**Testing:**
- Open trip in 2 windows
- Like in window 1
- Verify count updates in window 2

---

## 📋 Phase 4E: Save/Bookmark System (1 hour)

### **Step 1: Create Database Table** (5 minutes)

**File to create:**

**`infrastructure/database/migrations/008_trip_saves.sql`**

**SQL:**
```sql
CREATE TABLE trip_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);
```

**Run in Supabase SQL Editor**

### **Step 2: Create Save API** (20 minutes)

**File to create:**

**`apps/web/app/api/trips/[tripId]/save/route.ts`**

**What it does:**
- Toggle save/unsave
- Publish save count update
- Return new save state

### **Step 3: Add Save Button to UI** (35 minutes)

**Files to modify:**

1. **`apps/web/components/locations/LocationHeader.tsx`**
2. **`apps/web/components/trips/TripCard.tsx`** (if exists)

**Changes:**
- Add save button with heart icon
- Subscribe to save count updates
- Show saved state (filled heart)

**Testing:**
- Save trip in window 1
- Verify count updates in window 2

---

## 📋 Phase 4F: Real-Time Presence (1 hour)

### **Step 1: Create Presence Tracking** (20 minutes)

**File to create:**

**`apps/web/lib/upstash-presence.ts`**

**Functions:**
- `trackViewer(tripId, userId)` - Add viewer to sorted set
- `getActiveViewers(tripId)` - Get viewers from last 5 minutes
- `publishViewerCount(tripId, count)` - Publish to channel

### **Step 2: Create Presence API** (15 minutes)

**File to create:**

**`apps/web/app/api/trips/[tripId]/presence/route.ts`**

**What it does:**
- Track current user as viewer
- Return active viewer count

### **Step 3: Add Presence to Trip Page** (25 minutes)

**File to modify:**

**`apps/web/app/trips/[id]/page.tsx`**

**Changes:**
- Track viewer on mount
- Update every 30 seconds
- Subscribe to viewer count updates
- Display "X people viewing"

**Testing:**
- Open trip in 3 windows
- Verify "3 people viewing" appears
- Close 1 window, verify count drops to 2

---

## 📋 Phase 4G: Real-Time Gallery (2 hours)

### **Step 1: Update Image APIs** (30 minutes)

**Files to modify:**

1. **`apps/web/app/api/admin/add-location-image/route.ts`**
2. **`apps/web/app/api/admin/delete-location-image/route.ts`**
3. **`apps/web/app/api/admin/set-featured-image/route.ts`**

**Changes:**
```typescript
// After adding image
await publishImageUpdate('location', locationId, {
  action: 'image_added',
  imageUrl
})

// After deleting image
await publishImageUpdate('location', locationId, {
  action: 'image_deleted',
  imageUrl
})

// After setting featured
await publishImageUpdate('location', locationId, {
  action: 'featured_changed',
  imageUrl
})
```

### **Step 2: Update Gallery Component** (45 minutes)

**File to modify:**

**`apps/web/components/locations/PhotoGalleryView.tsx`**

**Changes:**
- Subscribe to image updates via SSE
- Add new images to state
- Remove deleted images from state
- Update featured image

### **Step 3: Add Community Upload Button** (45 minutes)

**File to modify:**

**`apps/web/components/locations/PhotoGalleryView.tsx`**

**Changes:**
- Add "Upload Photo" button (visible to all users)
- Use existing `uploadLocationImage()` function
- Show upload progress
- Publish update after upload

**Testing:**
- Upload image in window 1
- Verify it appears in window 2
- Delete image in window 1
- Verify it disappears in window 2

---

## 📊 Testing Checklist

### **Phase 4B: Comments**
- [ ] Post comment in window 1 → appears in window 2
- [ ] Delete comment in window 1 → disappears in window 2
- [ ] Toast notification shows for new comments

### **Phase 4C: Ratings**
- [ ] Rate in window 1 → rating updates in window 2
- [ ] Rating count updates correctly

### **Phase 4D: Likes**
- [ ] Like in window 1 → count updates in window 2
- [ ] Unlike in window 1 → count decreases in window 2

### **Phase 4E: Saves**
- [ ] Save in window 1 → count updates in window 2
- [ ] Unsave in window 1 → count decreases in window 2
- [ ] Saved state persists on refresh

### **Phase 4F: Presence**
- [ ] Open 3 windows → "3 people viewing" appears
- [ ] Close 1 window → count drops to 2
- [ ] Count updates every 30 seconds

### **Phase 4G: Gallery**
- [ ] Upload image → appears instantly in other windows
- [ ] Delete image → disappears instantly
- [ ] Set featured → updates instantly

---

## 🎯 Implementation Order

**Day 1: Foundation + Comments** (2 hours)
- Phase 4A: Foundation (30 min)
- Phase 4B: Real-Time Comments (1.5 hours)

**Day 2: Ratings + Likes + Saves** (2 hours)
- Phase 4C: Real-Time Ratings (30 min)
- Phase 4D: Real-Time Likes (30 min)
- Phase 4E: Save/Bookmark System (1 hour)

**Day 3: Presence + Gallery** (3 hours)
- Phase 4F: Real-Time Presence (1 hour)
- Phase 4G: Real-Time Gallery (2 hours)

**Total: 7 hours over 3 days**

---

## 🚀 Ready to Start?

**Let's begin with Phase 4A: Foundation!**

This will set up the infrastructure for all real-time features.

**Should I start implementing Phase 4A now?** 🎯


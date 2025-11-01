# Trip-Specific Live Feed Strategy

**Created:** 2025-01-31  
**Goal:** Each trip has its own personalized feed, and public trips share images to a global "all travelers" feed

---

## 🎯 Core Requirements

### 1. Trip-Specific Feeds
- **Each trip** has its own isolated feed showing only that trip's posts/images
- Users can post images directly to a specific trip
- Trip feed shows chronological timeline of trip moments
- Accessible via trip detail page (tab or section)

### 2. Global Feed Pool
- **Public trips** automatically contribute their images to global `/live-feed`
- **Private/password-protected trips** keep images isolated (not in global feed)
- Global feed shows real-time updates from all public trips
- Already exists at `/live-feed` (accessible from header)

### 3. Privacy Hierarchy
```
Trip Privacy Setting → Feed Visibility

public              → Trip feed + Global feed
password-protected  → Trip feed only (authorized users)
private             → Trip feed only (owner + family members)
```

---

## 📊 Current State Analysis

### ✅ Existing Components

**Trip Pages:**
- `/trips/[slug]/page.tsx` - Public trip detail page
- `/trips-library/[slug]/page.tsx` - Trip template pages
- `TripTimelineWithToggle` - Has `live-feed` view mode
- `LiveTripUpdates` - Real-time trip updates component

**Global Feed:**
- `/live-feed/page.tsx` - Global feed page (accessible from header)
- `AuthenticatedLiveFeed` - Following/Discover tabs
- `FeedPost` - Instagram-style post card
- `feedData.ts` - Mock feed data structure

**Database Tables:**
- ✅ `trips` - Trip metadata with privacy settings
- ✅ `posts` - Trip posts (linked via `trip_id`)
- ✅ `activity_feed` - Global activity feed
- ⚠️ Need: `trip_feed_images` table for trip-specific images

### ⚠️ Missing Pieces

1. **Trip feed image posting system** - No way to post images to trip feed
2. **Global feed aggregation** - No logic to pull public trip images into `/live-feed`
3. **Privacy filtering** - No filtering based on trip privacy settings
4. **Trip feed UI** - `LiveTripUpdates` exists but needs image posting capability

---

## 🏗️ Architecture Design

### Database Schema

#### New Table: `trip_feed_images`

```sql
CREATE TABLE trip_feed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location_name TEXT,
  location_coordinates JSONB, -- { lat, lng }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trip_feed_images_trip ON trip_feed_images(trip_id, created_at DESC);
CREATE INDEX idx_trip_feed_images_user ON trip_feed_images(user_id, created_at DESC);
CREATE INDEX idx_trip_feed_images_created ON trip_feed_images(created_at DESC);

-- RLS Policies
ALTER TABLE trip_feed_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images from public trips
CREATE POLICY "Public trip images are viewable by everyone"
  ON trip_feed_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_feed_images.trip_id
      AND trips.privacy = 'public'
    )
  );

-- Users can view images from their own trips
CREATE POLICY "Users can view their own trip images"
  ON trip_feed_images FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view images from password-protected trips they have access to
CREATE POLICY "Users can view password-protected trip images if authorized"
  ON trip_feed_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_feed_images.trip_id
      AND trips.privacy = 'password'
      -- TODO: Add password verification logic
    )
  );

-- Users can insert images to their own trips
CREATE POLICY "Users can post images to their trips"
  ON trip_feed_images FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_feed_images.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON trip_feed_images FOR DELETE
  USING (auth.uid() = user_id);
```

#### Update Existing Tables

```sql
-- Add feed image count to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS feed_image_count INTEGER DEFAULT 0;

-- Trigger to maintain count
CREATE OR REPLACE FUNCTION update_trip_feed_image_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trips SET feed_image_count = feed_image_count + 1 WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trips SET feed_image_count = GREATEST(feed_image_count - 1, 0) WHERE id = OLD.trip_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_feed_images_count_trigger
  AFTER INSERT OR DELETE ON trip_feed_images
  FOR EACH ROW EXECUTE FUNCTION update_trip_feed_image_count();
```

---

## 🔌 API Routes

### 1. Post Image to Trip Feed

**Endpoint:** `POST /api/trips/[tripId]/feed/images`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id, privacy')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to post to this trip' }, { status: 403 })
    }

    const body = await request.json()
    const { image_url, caption, location_name, location_coordinates } = body

    // Validate image URL
    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Insert image into trip feed
    const { data: feedImage, error: insertError } = await supabase
      .from('trip_feed_images')
      .insert({
        trip_id: params.tripId,
        user_id: user.id,
        image_url,
        caption,
        location_name,
        location_coordinates
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting trip feed image:', insertError)
      return NextResponse.json({ error: 'Failed to post image' }, { status: 500 })
    }

    // If trip is public, also add to global activity feed
    if (trip.privacy === 'public') {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        type: 'trip_image',
        data: {
          trip_id: params.tripId,
          image_id: feedImage.id,
          image_url,
          caption,
          location_name
        }
      })
    }

    return NextResponse.json({ success: true, image: feedImage })
  } catch (error) {
    console.error('Error in trip feed image endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 2. Get Trip Feed Images

**Endpoint:** `GET /api/trips/[tripId]/feed/images`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch images with user info
    const { data: images, error } = await supabase
      .from('trip_feed_images')
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('trip_id', params.tripId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching trip feed images:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    return NextResponse.json({ success: true, images })
  } catch (error) {
    console.error('Error in get trip feed images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Get Global Feed (Public Trip Images)

**Endpoint:** `GET /api/feed/global`

```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch images from public trips only
    const { data: images, error } = await supabase
      .from('trip_feed_images')
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        trip:trips!trip_id (
          id,
          title,
          slug,
          destination,
          privacy
        )
      `)
      .eq('trips.privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching global feed:', error)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, images })
  } catch (error) {
    console.error('Error in global feed endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 🎨 Frontend Components

### 1. Trip Feed Image Upload Component

**File:** `apps/web/components/trips/TripFeedImageUpload.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { Camera, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface TripFeedImageUploadProps {
  tripId: string
  onImagePosted?: () => void
}

export function TripFeedImageUpload({ tripId, onImagePosted }: TripFeedImageUploadProps) {
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (url: string) => {
    setUploading(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/feed/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image_url: url,
          caption,
          location_name: locationName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to post image')
      }

      toast.success('Image posted to trip feed!')
      setCaption('')
      setLocationName('')
      onImagePosted?.()
    } catch (error) {
      console.error('Error posting image:', error)
      toast.error('Failed to post image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <ImageUpload
        bucket="trip-feed-images"
        userId={tripId}
        onUploadComplete={handleImageUpload}
        maxSizeMB={5}
      />
      
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Add a caption..."
        className="w-full px-3 py-2 border rounded-lg"
        rows={3}
      />
      
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Add location (optional)"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  )
}
```

---

## 📋 Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `trip_feed_images` table
- [ ] Add RLS policies for privacy filtering
- [ ] Create triggers for cached counts
- [ ] Test privacy policies with different trip types

### Phase 2: API Routes
- [ ] Create `POST /api/trips/[tripId]/feed/images`
- [ ] Create `GET /api/trips/[tripId]/feed/images`
- [ ] Create `GET /api/feed/global` (or update existing)
- [ ] Test with public, private, and password-protected trips

### Phase 3: Frontend Components
- [ ] Create `TripFeedImageUpload` component
- [ ] Create `TripFeedGallery` component
- [ ] Update `LiveTripUpdates` to show feed images
- [ ] Update `/live-feed/page.tsx` to pull from global feed

### Phase 4: Integration
- [ ] Add feed tab to trip detail pages
- [ ] Wire up real-time subscriptions
- [ ] Test privacy filtering
- [ ] Test global feed aggregation

---

## 🔐 Privacy Flow Diagram

```
User posts image to Trip A (public)
    ↓
Image saved to trip_feed_images (trip_id = A)
    ↓
Image also added to activity_feed (global pool)
    ↓
Image appears in:
  - Trip A's feed ✅
  - Global /live-feed ✅

---

User posts image to Trip B (private)
    ↓
Image saved to trip_feed_images (trip_id = B)
    ↓
Image appears in:
  - Trip B's feed ✅ (owner + family only)
  - Global /live-feed ❌ (filtered out)
```

---

**Next Steps:** Start with Phase 1 (Database Setup)


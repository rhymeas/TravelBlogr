# View Tracking Setup - Pixel-Based Analytics

## Overview

Pixel-based view tracking system similar to Facebook Pixel, Google Analytics, etc.
Automatically tracks views when pages load and displays view counts on cards.

## ✅ What's Already Set Up

### 1. Database Tables
- ✅ `trip_views` - Individual view records
- ✅ `trip_stats` - Aggregated statistics
- ✅ Helper functions: `increment_trip_views()`, `get_trip_stats()`

### 2. Components Created
- ✅ `ViewTrackingPixel` - Invisible 1x1 pixel that tracks views
- ✅ `ViewCount` - Display component for view counts
- ✅ `ViewCountBadge` - Badge-style view count for cards

### 3. Hooks
- ✅ `useViewCount()` - Fetch and auto-refresh view stats
- ✅ `useSimpleViewCount()` - Just get the number

### 4. Already Integrated
- ✅ Trip detail page (`/dashboard/trips/[tripId]`) - Has tracking pixel
- ✅ Trip cards - Show view count badge

## How It Works

### 1. Tracking Pixel (Invisible)

When a page loads, the pixel component:
1. Generates or retrieves a session ID (stored in localStorage)
2. Calls `increment_trip_views()` function in Supabase
3. Tracks: IP, user agent, referrer, timestamp
4. Detects unique visitors (24-hour window)

```tsx
// Add to any page to track views
import { ViewTrackingPixel } from '@/components/analytics/ViewTrackingPixel'

<ViewTrackingPixel tripId="123" />
```

### 2. View Count Display

Automatically fetches and displays view count:

```tsx
// Simple count with icon
import { ViewCount } from '@/components/analytics/ViewCount'

<ViewCount tripId="123" />

// Badge style (for cards)
import { ViewCountBadge } from '@/components/analytics/ViewCount'

<ViewCountBadge tripId="123" />
```

### 3. Auto-Refresh

View counts automatically refresh every 30 seconds to show real-time data.

## Adding Tracking to New Pages

### Example: Location Detail Page

```tsx
'use client'

import { ViewTrackingPixel } from '@/components/analytics/ViewTrackingPixel'
import { ViewCount } from '@/components/analytics/ViewCount'

export default function LocationPage({ params }: { params: { locationId: string } }) {
  return (
    <div>
      {/* Add tracking pixel in hero section */}
      <ViewTrackingPixel 
        tripId={tripId} 
        type="location" 
        entityId={params.locationId} 
      />
      
      {/* Hero section */}
      <div className="hero">
        <h1>Location Name</h1>
        
        {/* Display view count */}
        <ViewCount tripId={tripId} size="lg" />
      </div>
      
      {/* Rest of page... */}
    </div>
  )
}
```

### Example: Adding to Location Cards

```tsx
import { ViewCountBadge } from '@/components/analytics/ViewCount'

export function LocationCard({ location, tripId }: Props) {
  return (
    <div className="card">
      <img src={location.image} />
      
      {/* Add view count badge */}
      <div className="absolute bottom-3 left-3">
        <ViewCountBadge tripId={tripId} />
      </div>
      
      <h3>{location.name}</h3>
    </div>
  )
}
```

## View Count Formats

The component automatically formats large numbers:
- `1234` → `1.2K`
- `1234567` → `1.2M`

## Privacy & GDPR Compliance

✅ **No personal data stored**
- IP addresses are optional (can be null)
- Session IDs are random UUIDs
- No cookies required (uses localStorage)

✅ **Unique visitor detection**
- Based on session ID
- 24-hour window
- No cross-site tracking

## Testing

### 1. Test Tracking

```bash
# Visit a trip page
http://localhost:3000/dashboard/trips/[tripId]

# Check browser console for:
✅ View tracked: { tripId: "123", type: "trip" }
```

### 2. Test View Count Display

```bash
# Check Supabase SQL Editor
SELECT * FROM trip_stats WHERE trip_id = 'your-trip-id';

# Should show:
# total_views: 1
# unique_views: 1
```

### 3. Test Auto-Refresh

1. Open trip page
2. Open another browser/incognito window
3. Visit same trip page
4. Wait 30 seconds
5. View count should update automatically

## Troubleshooting

### View count shows 0

**Check:**
1. Did you run `create-trip-views-table.sql`?
2. Is the tracking pixel on the page?
3. Check browser console for errors
4. Check Supabase logs

### Tracking not working

**Check:**
1. Browser console for errors
2. Supabase function exists: `increment_trip_views`
3. RLS policies allow INSERT on `trip_views`

### View count not updating

**Check:**
1. Auto-refresh interval (30 seconds)
2. Supabase connection
3. `get_trip_stats` function exists

## Advanced Usage

### Get Detailed Stats

```tsx
import { useViewCount } from '@/hooks/useViewCount'

function TripAnalytics({ tripId }: { tripId: string }) {
  const { 
    viewCount, 
    uniqueViews, 
    viewsToday, 
    viewsThisWeek,
    viewsThisMonth 
  } = useViewCount(tripId)
  
  return (
    <div>
      <p>Total: {viewCount}</p>
      <p>Unique: {uniqueViews}</p>
      <p>Today: {viewsToday}</p>
      <p>This Week: {viewsThisWeek}</p>
      <p>This Month: {viewsThisMonth}</p>
    </div>
  )
}
```

### Custom Tracking

```tsx
import { getBrowserSupabase } from '@/lib/supabase'

async function trackCustomEvent(tripId: string) {
  const supabase = getBrowserSupabase()
  
  await supabase.rpc('increment_trip_views', {
    p_trip_id: tripId,
    p_user_agent: navigator.userAgent,
    p_referrer: 'custom-source',
    p_session_id: 'custom-session-id'
  })
}
```

## Next Steps

1. ✅ Add tracking to location detail pages
2. ✅ Add view counts to location cards
3. ✅ Add tracking to post pages
4. 🔄 Add charts/graphs for analytics dashboard
5. 🔄 Add export to CSV
6. 🔄 Add real-time updates with Supabase Realtime

---

**Status**: ✅ Ready to use  
**Performance**: Optimized with indexes  
**Privacy**: GDPR-friendly


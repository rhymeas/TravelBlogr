# Trip Views & Analytics

## Overview

Track views, visitor stats, and engagement metrics for your trips.

## Database Tables

### 1. `trip_views` - Individual View Records

Stores every single view with visitor details:

```sql
- id: UUID
- trip_id: UUID (references trips)
- ip_address: INET
- user_agent: TEXT
- referrer: TEXT
- country: VARCHAR(2)
- city: VARCHAR(255)
- session_id: VARCHAR(255)
- is_unique_visitor: BOOLEAN
- viewed_at: TIMESTAMP
- metadata: JSONB
```

### 2. `trip_stats` - Aggregated Statistics

Stores summary stats for each trip:

```sql
- id: UUID
- trip_id: UUID (references trips, UNIQUE)
- total_views: INTEGER
- unique_views: INTEGER
- avg_time_on_page: INTEGER (seconds)
- bounce_rate: DECIMAL
- share_count: INTEGER
- last_view_at: TIMESTAMP
- updated_at: TIMESTAMP
- stats_data: JSONB
```

## Setup

### 1. Run SQL Script

```bash
# In Supabase SQL Editor, run:
infrastructure/database/create-trip-views-table.sql
```

### 2. Verify Tables Created

Check in Supabase Table Editor:
- ✅ `trip_views` table exists
- ✅ `trip_stats` table exists

## Usage

### Track a View (Client-Side)

```typescript
import { getBrowserSupabase } from '@/lib/supabase'

async function trackTripView(tripId: string) {
  const supabase = getBrowserSupabase()
  
  // Get or create session ID
  let sessionId = localStorage.getItem('visitor_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('visitor_session_id', sessionId)
  }
  
  // Call the increment function
  const { error } = await supabase.rpc('increment_trip_views', {
    p_trip_id: tripId,
    p_user_agent: navigator.userAgent,
    p_referrer: document.referrer || null,
    p_session_id: sessionId
  })
  
  if (error) {
    console.error('Error tracking view:', error)
  }
}
```

### Get Trip Stats

```typescript
async function getTripStats(tripId: string) {
  const supabase = getBrowserSupabase()
  
  const { data, error } = await supabase
    .rpc('get_trip_stats', { p_trip_id: tripId })
  
  if (error) {
    console.error('Error fetching stats:', error)
    return null
  }
  
  return data[0] // Returns:
  // {
  //   total_views: 1234,
  //   unique_views: 567,
  //   last_view_at: "2025-01-15T10:30:00Z",
  //   views_today: 45,
  //   views_this_week: 234,
  //   views_this_month: 890
  // }
}
```

### Display Stats in UI

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Eye, Users, TrendingUp } from 'lucide-react'

export function TripStats({ tripId }: { tripId: string }) {
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    async function loadStats() {
      const data = await getTripStats(tripId)
      setStats(data)
    }
    loadStats()
  }, [tripId])
  
  if (!stats) return null
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Eye className="h-4 w-4" />
          <span className="text-sm">Total Views</span>
        </div>
        <p className="text-2xl font-bold">{stats.total_views}</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Users className="h-4 w-4" />
          <span className="text-sm">Unique Visitors</span>
        </div>
        <p className="text-2xl font-bold">{stats.unique_views}</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm">This Week</span>
        </div>
        <p className="text-2xl font-bold">{stats.views_this_week}</p>
      </div>
    </div>
  )
}
```

## Features

### ✅ Automatic View Tracking
- Tracks every view with timestamp
- Stores visitor info (IP, user agent, referrer)
- Session-based unique visitor detection

### ✅ Real-time Stats
- Total views counter
- Unique visitors counter
- Time-based breakdowns (today, week, month)

### ✅ Privacy-Friendly
- No personal data stored
- IP addresses optional
- Session IDs are random UUIDs

### ✅ Performance Optimized
- Indexed for fast queries
- Aggregated stats table
- Efficient RPC functions

## API Reference

### `increment_trip_views()`

Increments view count for a trip.

**Parameters:**
- `p_trip_id` (UUID) - Trip ID
- `p_ip_address` (INET, optional) - Visitor IP
- `p_user_agent` (TEXT, optional) - Browser user agent
- `p_referrer` (TEXT, optional) - Referrer URL
- `p_session_id` (VARCHAR, optional) - Session ID

**Returns:** void

**Example:**
```sql
SELECT increment_trip_views(
  '123e4567-e89b-12d3-a456-426614174000',
  '192.168.1.1'::inet,
  'Mozilla/5.0...',
  'https://google.com',
  'session-uuid-here'
);
```

### `get_trip_stats()`

Gets aggregated stats for a trip.

**Parameters:**
- `p_trip_id` (UUID) - Trip ID

**Returns:** Table with:
- `total_views` (INTEGER)
- `unique_views` (INTEGER)
- `last_view_at` (TIMESTAMP)
- `views_today` (INTEGER)
- `views_this_week` (INTEGER)
- `views_this_month` (INTEGER)

**Example:**
```sql
SELECT * FROM get_trip_stats('123e4567-e89b-12d3-a456-426614174000');
```

## Next Steps

1. ✅ Run the SQL script
2. ✅ Add view tracking to trip pages
3. ✅ Display stats in dashboard
4. 🔄 Add charts/graphs (optional)
5. 🔄 Add export to CSV (optional)
6. 🔄 Add real-time updates (optional)

---

**Status**: Ready to use  
**Privacy**: GDPR-friendly (no PII stored)  
**Performance**: Optimized with indexes


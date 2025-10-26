# Interactive Route Planning - Implementation Plan

## Overview
Implement Komoot-style interactive route features with elevation profiles, POI suggestions, and user notes.

## Goals
1. **Interactive Route Popup** - Click anywhere on route to see details
2. **Elevation Profile** - Visual elevation chart like Komoot
3. **POI Suggestions** - Show nearby attractions along route
4. **User Notes & Checklists** - Add notes to route segments
5. **Route Manipulation** - Add/remove waypoints dynamically

---

## Phase 1: Brave API Extensions for Route Data

### Available Brave API Features (Free Tier)
- ✅ **Web Search** - 2,000 requests/month (currently using)
- ✅ **Image Search** - 2,000 requests/month (currently using)
- ✅ **News Search** - 2,000 requests/month (NOT using yet)
- ✅ **Videos** - 2,000 requests/month (NOT using yet)
- ✅ **Extra AI Snippets** - Enhanced descriptions (NOT using yet)
- ✅ **Spellcheck** - 5,000 requests/month (NOT using yet)

### New Brave API Functions to Add

#### 1. Search POIs Along Route
```typescript
// apps/web/lib/services/braveSearchService.ts

export async function searchPOIsNearLocation(
  latitude: number,
  longitude: number,
  radius: number = 10, // km
  category?: 'restaurant' | 'attraction' | 'hotel' | 'gas-station'
): Promise<BravePOIResult[]> {
  // Use Brave Web Search with location modifiers
  const query = `${category || 'points of interest'} near ${latitude},${longitude} within ${radius}km`
  
  const results = await searchWeb(query, 20)
  
  // Filter and enrich with location data
  return results.map(r => ({
    ...r,
    estimatedDistance: calculateDistance(latitude, longitude, r.coordinates),
    category: classifyPOI(r.title, r.description)
  }))
}
```

#### 2. Get Route Segment Information
```typescript
export async function getRouteSegmentInfo(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteSegmentInfo> {
  // Search for road information, conditions, scenic points
  const query = `road from ${startLat},${startLng} to ${endLat},${endLng} conditions scenic viewpoints`
  
  const results = await searchWeb(query, 10)
  
  return {
    scenicPoints: extractScenicPoints(results),
    roadConditions: extractRoadConditions(results),
    warnings: extractWarnings(results)
  }
}
```

#### 3. Get Location News & Events
```typescript
export async function searchLocationNews(
  locationName: string,
  limit: number = 5
): Promise<BraveNewsResult[]> {
  const BRAVE_NEWS_URL = 'https://api.search.brave.com/res/v1/news/search'
  
  const response = await fetch(
    `${BRAVE_NEWS_URL}?q=${encodeURIComponent(locationName + ' travel events')}&count=${limit}`,
    {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
    }
  )
  
  const data = await response.json()
  return data.results || []
}
```

---

## Phase 2: Elevation Data Integration

### Option A: Open-Elevation API (FREE)
```typescript
// apps/web/lib/services/elevationService.ts

export async function getElevationProfile(
  coordinates: Array<{ latitude: number; longitude: number }>
): Promise<ElevationPoint[]> {
  // Open-Elevation API: https://open-elevation.com/
  const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: coordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude }))
    })
  })
  
  const data = await response.json()
  
  return data.results.map((point: any, index: number) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    elevation: point.elevation, // meters
    distance: calculateCumulativeDistance(coordinates, index), // km from start
    incline: calculateIncline(data.results, index) // percentage
  }))
}

function calculateIncline(points: any[], index: number): number {
  if (index === 0) return 0
  
  const prev = points[index - 1]
  const curr = points[index]
  
  const elevationDiff = curr.elevation - prev.elevation
  const distance = calculateDistance(
    prev.latitude, prev.longitude,
    curr.latitude, curr.longitude
  ) * 1000 // meters
  
  return (elevationDiff / distance) * 100 // percentage
}
```

### Option B: OpenRouteService Elevation (FREE)
- Already using ORS for routing
- Can request elevation data in route response
- Add `elevation=true` parameter to routing API

---

## Phase 3: Interactive Route Popup Component

### Component Structure
```typescript
// apps/web/components/maps/RoutePopup.tsx

interface RoutePopupProps {
  position: { latitude: number; longitude: number }
  distanceFromStart: number // km
  elevation: number // meters
  incline: number // percentage
  roadType: 'paved' | 'unpaved' | 'mixed'
  onAddNote: (note: string) => void
  onAddChecklistItem: (item: string) => void
  onAddWaypoint: () => void
  onClose: () => void
  existingNotes?: RouteNote[]
  existingChecklist?: ChecklistItem[]
}

export function RoutePopup({ ... }: RoutePopupProps) {
  return (
    <div className="bg-white rounded-lg shadow-xl border p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Route Point</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">After:</span>
          <span className="text-sm font-medium">{distanceFromStart} km ({formatDuration(distanceFromStart)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Elevation:</span>
          <span className="text-sm font-medium">{elevation} m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Incline:</span>
          <span className={`text-sm font-medium ${incline > 5 ? 'text-orange-600' : 'text-green-600'}`}>
            ~ {incline.toFixed(1)} %
          </span>
        </div>
      </div>
      
      {/* Road Type */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className={`h-3 w-3 rounded-full ${roadType === 'paved' ? 'bg-gray-400' : 'bg-gray-300'}`} />
          <span className="text-gray-600">{roadType === 'paved' ? 'Paved' : 'Road'}</span>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
        {existingNotes?.map(note => (
          <div key={note.id} className="text-sm text-gray-600 mb-1">• {note.text}</div>
        ))}
        <button
          onClick={() => {/* Open note input */}}
          className="text-sm text-rausch-500 hover:text-rausch-600 font-medium"
        >
          + Add note
        </button>
      </div>
      
      {/* Checklist Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Checklist</h4>
        {existingChecklist?.map(item => (
          <div key={item.id} className="flex items-center gap-2 mb-1">
            <input type="checkbox" checked={item.completed} className="rounded" />
            <span className="text-sm text-gray-600">{item.text}</span>
          </div>
        ))}
        <button
          onClick={() => {/* Open checklist input */}}
          className="text-sm text-rausch-500 hover:text-rausch-600 font-medium"
        >
          + Add checklist item
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAddWaypoint}
          className="flex-1 bg-rausch-500 hover:bg-rausch-600 text-white text-sm font-medium py-2 px-3 rounded-lg"
        >
          Add as waypoint
        </button>
      </div>
    </div>
  )
}
```

---

## Phase 4: Elevation Profile Chart

### Using Recharts (Already in package.json)
```typescript
// apps/web/components/maps/ElevationProfile.tsx

import { LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts'

interface ElevationProfileProps {
  elevationData: ElevationPoint[]
  onPointClick: (point: ElevationPoint) => void
  highlightedPoint?: number // index
}

export function ElevationProfile({ elevationData, onPointClick, highlightedPoint }: ElevationProfileProps) {
  const chartData = elevationData.map((point, index) => ({
    distance: point.distance.toFixed(1),
    elevation: point.elevation,
    incline: point.incline,
    index
  }))
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Elevation</h3>
      
      <AreaChart width={600} height={200} data={chartData}>
        <defs>
          <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        <XAxis
          dataKey="distance"
          label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }}
          tick={{ fontSize: 12 }}
        />
        
        <YAxis
          label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-white border rounded-lg shadow-lg p-2 text-xs">
                  <p className="font-medium">{data.distance} km</p>
                  <p className="text-gray-600">{data.elevation} m</p>
                  <p className={data.incline > 5 ? 'text-orange-600' : 'text-green-600'}>
                    {data.incline.toFixed(1)}% incline
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        
        <Area
          type="monotone"
          dataKey="elevation"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#elevationGradient)"
          onClick={(data: any) => onPointClick(elevationData[data.index])}
          style={{ cursor: 'pointer' }}
        />
      </AreaChart>
      
      {/* Stats */}
      <div className="flex justify-between mt-4 text-xs text-gray-600">
        <div>
          <span className="text-red-600">▲</span> Highest: {Math.max(...elevationData.map(p => p.elevation))} m
        </div>
        <div>
          <span className="text-green-600">▼</span> Lowest: {Math.min(...elevationData.map(p => p.elevation))} m
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 5: POI Suggestions Along Route

### Component
```typescript
// apps/web/components/maps/RoutePOISuggestions.tsx

interface RoutePOISuggestionsProps {
  routeSegment: { start: Coordinates; end: Coordinates }
  radius: number // km
  onPOISelect: (poi: POI) => void
}

export function RoutePOISuggestions({ routeSegment, radius, onPOISelect }: RoutePOISuggestionsProps) {
  const [pois, setPOIs] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<'all' | 'restaurant' | 'attraction' | 'hotel'>('all')
  
  useEffect(() => {
    fetchPOIs()
  }, [routeSegment, radius, category])
  
  const fetchPOIs = async () => {
    setLoading(true)
    try {
      // Calculate midpoint of route segment
      const midpoint = calculateMidpoint(routeSegment.start, routeSegment.end)
      
      // Fetch POIs using Brave API
      const results = await searchPOIsNearLocation(
        midpoint.latitude,
        midpoint.longitude,
        radius,
        category === 'all' ? undefined : category
      )
      
      setPOIs(results)
    } catch (error) {
      console.error('Error fetching POIs:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Nearby Points of Interest</h3>
      
      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'restaurant', 'attraction', 'hotel'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              category === cat
                ? 'bg-rausch-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      
      {/* POI List */}
      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pois.map((poi, index) => (
            <button
              key={index}
              onClick={() => onPOISelect(poi)}
              className="w-full text-left p-3 rounded-lg border hover:border-rausch-500 hover:bg-rausch-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{poi.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{poi.description}</p>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {poi.estimatedDistance.toFixed(1)} km
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Implementation Steps

### Step 1: Extend Brave API Service ✅
- Add `searchPOIsNearLocation()`
- Add `getRouteSegmentInfo()`
- Add `searchLocationNews()`

### Step 2: Create Elevation Service ✅
- Integrate Open-Elevation API
- Add `getElevationProfile()`
- Add `calculateIncline()`

### Step 3: Build Route Popup Component ✅
- Create `RoutePopup.tsx`
- Add notes & checklist functionality
- Add waypoint insertion

### Step 4: Build Elevation Profile Chart ✅
- Create `ElevationProfile.tsx`
- Use Recharts for visualization
- Add click handlers

### Step 5: Build POI Suggestions ✅
- Create `RoutePOISuggestions.tsx`
- Integrate with Brave API
- Add category filtering

### Step 6: Integrate with TripOverviewMap ✅
- Add route click handler
- Show popup on route click
- Display elevation profile
- Show POI suggestions panel

---

## Database Schema Updates

```sql
-- Route notes table
CREATE TABLE route_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  distance_from_start DECIMAL(10, 2), -- km
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route checklist items
CREATE TABLE route_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  distance_from_start DECIMAL(10, 2), -- km
  item_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_route_notes_trip ON route_notes(trip_id);
CREATE INDEX idx_route_checklist_trip ON route_checklist_items(trip_id);
```

---

## API Endpoints

### GET /api/elevation/profile
```typescript
// Get elevation profile for route
POST /api/elevation/profile
Body: {
  coordinates: Array<{ latitude: number; longitude: number }>
}
Response: {
  elevationPoints: ElevationPoint[]
}
```

### GET /api/pois/nearby
```typescript
// Get POIs near location
GET /api/pois/nearby?lat=48.8566&lng=2.3522&radius=10&category=restaurant
Response: {
  pois: POI[]
}
```

---

## Next Steps
1. Implement Brave API extensions
2. Create elevation service
3. Build UI components
4. Integrate with existing maps
5. Add database tables
6. Test with real routes

**Estimated Time:** 15-20 hours
**Priority:** HIGH (enhances core trip planning feature)


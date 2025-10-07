# Location Disambiguation System

## Problem Statement

**Issue:** Ambiguous location names cause incorrect location selection.

**Example:**
- User searches "Sunshine Coast"
- System finds "Sunshine Coast Regional, Australia"
- User actually meant "Sunshine Coast, BC, Canada"

**Impact:**
- Wrong location detail pages
- Incorrect trip planning
- Poor user experience
- Wasted API calls

## Solution Overview

Implemented a **3-tier location disambiguation system**:

1. **Enhanced Search Results** - Show country/region in autocomplete
2. **Disambiguation Dialog** - Ask user to clarify when multiple matches exist
3. **Smart Matching** - Prioritize database locations, then geocoding results

## Implementation

### 1. Enhanced Location Search API

**Endpoint:** `GET /api/locations/search?q=sunshine+coast&limit=10`

**Features:**
- ✅ Searches database first (existing locations)
- ✅ Falls back to geocoding API (Nominatim/OSM)
- ✅ Returns country + region for each result
- ✅ Deduplicates results (same name + country)
- ✅ Sorts by relevance (database > importance)
- ✅ Indicates if multiple matches exist

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "name": "Sunshine Coast",
      "slug": "sunshine-coast-regional",
      "country": "Australia",
      "region": "Queensland",
      "latitude": -26.6833,
      "longitude": 153.0667,
      "displayName": "Sunshine Coast, Queensland, Australia",
      "source": "database",
      "importance": 1.0
    },
    {
      "name": "Sunshine Coast",
      "country": "Canada",
      "region": "British Columbia",
      "latitude": 49.4747,
      "longitude": -123.7560,
      "displayName": "Sunshine Coast, British Columbia, Canada",
      "source": "geocoding",
      "importance": 0.85
    }
  ],
  "count": 2,
  "hasMultiple": true
}
```

### 2. Location Disambiguation Component

**Component:** `LocationDisambiguation.tsx`

**When to show:**
- Multiple locations with same/similar name
- User needs to clarify which location they mean

**Features:**
- ✅ Shows all matching locations
- ✅ Displays country + region for each
- ✅ Highlights "Most likely" option
- ✅ Shows coordinates for verification
- ✅ Allows user to cancel and search again

**Usage:**
```tsx
<LocationDisambiguation
  query="Sunshine Coast"
  onSelect={(location) => {
    // User selected a specific location
    console.log(location.name, location.country)
  }}
  onCancel={() => {
    // User wants to search again
  }}
/>
```

### 3. Enhanced Autocomplete

**Component:** `LocationAutocomplete.tsx`

**Changes:**
- ✅ Shows country + region in dropdown
- ✅ Helps user distinguish between similar locations
- ✅ Better visual hierarchy

**Before:**
```
Tokyo
tokyo
```

**After:**
```
Tokyo
Tokyo, Japan
```

## User Flow

### Scenario 1: Unique Location
```
User types: "Paris"
→ System finds: "Paris, Île-de-France, France"
→ Auto-selects (only one match)
→ Creates trip with correct location
```

### Scenario 2: Ambiguous Location
```
User types: "Sunshine Coast"
→ System finds:
   1. Sunshine Coast, Queensland, Australia
   2. Sunshine Coast, British Columbia, Canada
→ Shows disambiguation dialog
→ User selects: "Sunshine Coast, BC, Canada"
→ Creates trip with correct location
```

### Scenario 3: New Location
```
User types: "Tofino"
→ Not in database
→ Searches geocoding API
→ Finds: "Tofino, British Columbia, Canada"
→ Creates location in database
→ Creates trip with new location
```

## Integration Points

### 1. Trip Planning (`/plan`)
```tsx
// When user selects location
const handleLocationSelect = (locationName: string) => {
  // 1. Search for locations
  const results = await fetch(`/api/locations/search?q=${locationName}`)
  
  // 2. If multiple results, show disambiguation
  if (results.hasMultiple) {
    setShowDisambiguation(true)
    setDisambiguationOptions(results.data)
  } else {
    // 3. Use the single result
    selectLocation(results.data[0])
  }
}
```

### 2. Location Detail Pages (`/locations/[slug]`)
```tsx
// Ensure correct location is shown
// Slug should include country/region for disambiguation
// Example: /locations/sunshine-coast-australia
//          /locations/sunshine-coast-canada
```

### 3. Itinerary Generation
```tsx
// When generating itinerary
const generateItinerary = async (locations: string[]) => {
  // 1. Resolve each location to specific lat/lng
  const resolvedLocations = await Promise.all(
    locations.map(loc => resolveLocation(loc))
  )
  
  // 2. Generate route with correct coordinates
  const route = await calculateRoute(resolvedLocations)
}
```

## Database Schema Updates

### Recommended: Add `location_aliases` table
```sql
CREATE TABLE location_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data:
-- location_id: sunshine-coast-australia
-- alias: "Sunshine Coast Regional"
-- country: "Australia"
-- region: "Queensland"
```

### Recommended: Update `locations` table
```sql
ALTER TABLE locations
ADD COLUMN alternative_names TEXT[], -- ["Sunshine Coast Regional", "Sunshine Coast QLD"]
ADD COLUMN disambiguation_hint TEXT; -- "Queensland, Australia (not BC, Canada)"
```

## Best Practices

### 1. Always Show Country/Region
```tsx
// ❌ Bad
<div>{location.name}</div>

// ✅ Good
<div>
  {location.name}
  <span className="text-gray-500">
    {location.region && `${location.region}, `}
    {location.country}
  </span>
</div>
```

### 2. Use Specific Slugs
```tsx
// ❌ Bad
slug: "sunshine-coast"

// ✅ Good
slug: "sunshine-coast-australia"
slug: "sunshine-coast-canada"
```

### 3. Validate User Input
```tsx
// ❌ Bad
const location = await findLocation(userInput)

// ✅ Good
const results = await searchLocations(userInput)
if (results.length > 1) {
  // Show disambiguation
} else if (results.length === 1) {
  // Use single result
} else {
  // Show "not found" message
}
```

## Testing Scenarios

### Test Cases:
1. ✅ Search "Paris" → Should find Paris, France
2. ✅ Search "London" → Should find London, England (not London, Ontario)
3. ✅ Search "Sunshine Coast" → Should show 2 options (Australia + Canada)
4. ✅ Search "Springfield" → Should show multiple US cities
5. ✅ Search "Tokyo" → Should find Tokyo, Japan (unique)
6. ✅ Search "Portland" → Should show Portland, OR + Portland, ME
7. ✅ Search "Cambridge" → Should show Cambridge, UK + Cambridge, MA

## Performance Considerations

### Caching Strategy:
```typescript
// Cache geocoding results for 24 hours
const cacheKey = `location:${query.toLowerCase()}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const results = await searchGeocodingAPI(query)
await redis.setex(cacheKey, 86400, JSON.stringify(results))
```

### Rate Limiting:
- Nominatim: 1 request/second
- Use database results first to avoid API calls
- Implement request debouncing (300ms)

## Future Enhancements

1. **Smart Defaults** - Use user's location/timezone to guess correct location
2. **Recent Searches** - Remember user's previous selections
3. **Popular Locations** - Prioritize frequently searched locations
4. **Fuzzy Matching** - Handle typos ("Tokio" → "Tokyo")
5. **Multi-language** - Support location names in different languages
6. **Map Preview** - Show location on map in disambiguation dialog

## Summary

**Problem:** Ambiguous location names cause incorrect selections

**Solution:** 3-tier disambiguation system
1. Enhanced search with country/region
2. Disambiguation dialog for multiple matches
3. Smart matching and deduplication

**Result:** Users always select the correct location! ✅


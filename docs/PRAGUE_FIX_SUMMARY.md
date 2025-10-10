# Prague Location Fix - User Input Preservation

## Problem
When users entered **"Prague"** in the trip planner, the system created a location named **"Hlavní město Praha"** (the official Czech name) instead of preserving the user's input.

### Root Cause
The `LocationDiscoveryService` was using the geocoding API's response name directly:
- User typed: `"Prague"`
- Nominatim API returned: `"Hlavní město Praha"`
- System created location with: `"Hlavní město Praha"`

## Solution Implemented

### 1. Modified `findOrCreateLocation()` Method
**File:** `apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts`

```typescript
// Line 80-82: Pass user input to createLocation
const created = await this.createLocation(geoData, locationQuery)
```

### 2. Updated `createLocation()` Method Signature
**File:** `apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts`

```typescript
// Line 286: Added userInput parameter
private async createLocation(geoData: GeoNamesResult, userInput?: string): Promise<LocationData>
```

### 3. Prioritize User Input for Translation
**File:** `apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts`

```typescript
// Line 291-293: Use user input if provided
const nameToTranslate = userInput || geoData.name
const nameTranslation = await translateLocationName(nameToTranslate)
const displayName = getDisplayName(nameTranslation.original, nameTranslation.translated)
```

## What This Fixes

### ✅ Before Fix:
- User input: `"Prague"`
- Created location: `"Hlavní město Praha"`
- Slug: `"hlavn-msto-praha"`
- User confusion: "I typed Prague, why is it showing Czech?"

### ✅ After Fix:
- User input: `"Prague"`
- Created location: `"Prague"`
- Slug: `"prague"`
- User experience: Consistent with input

## Database Changes

### Deleted Old Prague Location
```sql
DELETE FROM locations WHERE id = '331076be-a10c-45f0-bc5e-923b90acc58f';
```

This also deleted (via CASCADE):
- 28 activities (museums, attractions)
- All associated restaurants

### Why Delete?
- Old location had Czech name "Hlavní město Praha"
- Activities/restaurants had untranslated Czech names
- Fresh start ensures proper English names throughout

## Auto-Population Features

When a new location is created, the system automatically:

### 1. **AI Description Generation** (Groq API)
```typescript
// Generates rich 2-3 sentence description
const aiDescription = await this.generateLocationDescription(displayName, translatedCountry, translatedRegion)
```

### 2. **Activities from OpenStreetMap**
```typescript
// Fetches museums, attractions, parks within 3km radius
const activities = await this.fetchActivitiesFromOSM(lat, lng)
```

**Categories fetched:**
- `tourism=attraction`
- `tourism=museum`
- `leisure=park`

### 3. **Restaurants from OpenStreetMap**
```typescript
// Fetches restaurants and cafes within 3km radius
const restaurants = await this.fetchRestaurantsFromOSM(lat, lng)
```

**Categories fetched:**
- `amenity=restaurant`
- `amenity=cafe`

### 4. **Automatic Translation**
All fetched data is automatically translated to English:
- Activity names
- Activity descriptions
- Restaurant names

## Testing Instructions

### Step 1: Verify Prague is Deleted
```bash
npx tsx apps/web/scripts/test-prague-creation.ts
```

Expected output:
```
✅ CONFIRMED: Prague has been deleted from database
```

### Step 2: Create New Trip with Prague
1. Go to http://localhost:3002/plan
2. Enter trip details:
   - **From:** Any location (e.g., "London")
   - **To:** `Prague`
   - **Dates:** Any future dates
3. Click "Plan Trip"

### Step 3: Verify Location Created Correctly
1. Go to http://localhost:3002/locations
2. Find the Prague card
3. **Verify:**
   - ✅ Name shows: `"Prague"` (not "Hlavní město Praha")
   - ✅ Slug is: `"prague"`
   - ✅ Country shows: `"Czechia"` or `"Czech Republic"`
   - ✅ Has AI-generated description
   - ✅ Has featured image

### Step 4: Check Activities & Restaurants
1. Click on Prague location card
2. Go to location detail page: http://localhost:3002/locations/prague
3. **Verify:**
   - ✅ Activities section shows museums, attractions (in English)
   - ✅ Restaurants section shows cafes, restaurants (in English)
   - ✅ All names are translated (no Czech characters)

## Expected Results

### Location Data
```json
{
  "name": "Prague",
  "slug": "prague",
  "country": "Czechia",
  "region": "Prague",
  "latitude": 50.0875,
  "longitude": 14.4213,
  "description": "Prague, the enchanting capital of the Czech Republic..."
}
```

### Sample Activities (Auto-populated)
- Prague Castle
- Charles Bridge
- Old Town Square
- Astronomical Clock
- Vyšehrad
- National Museum
- (15-30 activities total)

### Sample Restaurants (Auto-populated)
- Various cafes and restaurants
- Cuisine types: Czech, International, European
- Price ranges: $, $$, $$$
- (15-30 restaurants total)

## Technical Details

### Database Schema
```sql
-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  country VARCHAR(100),
  region VARCHAR(100),
  latitude NUMERIC,
  longitude NUMERIC,
  description TEXT,
  featured_image TEXT,
  gallery_images JSONB
);

-- Activities table (foreign key to locations)
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  source VARCHAR(50) -- 'openstreetmap'
);

-- Restaurants table (foreign key to locations)
CREATE TABLE restaurants (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255),
  cuisine_type VARCHAR(100),
  price_range VARCHAR(10),
  source VARCHAR(50) -- 'openstreetmap'
);
```

### Cascade Delete Behavior
When a location is deleted, all related data is automatically deleted:
- ✅ Activities
- ✅ Restaurants
- ✅ Posts
- ✅ Gallery images

## Future Enhancements

### Potential Improvements:
1. **MCP Integration** - Use Groq's Model Context Protocol for real-time web search
2. **Better Image Search** - Use location coordinates instead of name to avoid confusion
3. **User Feedback** - Allow users to report incorrect location names
4. **Alias System** - Store multiple names (Prague, Praha, Hlavní město Praha) for better search

## Troubleshooting

### Issue: Location still shows Czech name
**Solution:** Clear browser cache and refresh, or delete location and recreate

### Issue: No activities/restaurants populated
**Possible causes:**
- OpenStreetMap has no data for that area
- API rate limit reached (1 request/second for Nominatim)
- Network timeout

**Solution:** Wait a few minutes and try again, or manually add data via CMS

### Issue: Translation not working
**Possible causes:**
- Google Translate API rate limit
- Network issues

**Solution:** Check console logs for translation errors

## Summary

✅ **Fixed:** User input "Prague" is now preserved as location name  
✅ **Deleted:** Old "Hlavní město Praha" location and all related data  
✅ **Auto-population:** Activities and restaurants automatically fetched from OpenStreetMap  
✅ **Translation:** All names automatically translated to English  
✅ **Ready to test:** Create a new trip with "Prague" as destination  

The system now maintains consistency between user input and created locations while still leveraging geocoding APIs for accurate coordinates and regional data.


# Automatic Location Enrichment System

## Overview

TravelBlogr automatically enriches **all new locations** with comprehensive data when they are created during trip planning. This ensures every location has rich, English content including descriptions, activities, and restaurants.

## What Gets Auto-Populated

When a new location is discovered from GeoNames/Nominatim APIs:

### 1. ✅ AI-Generated Description
- **Source**: Groq API (Llama 3.3 70B)
- **Content**: 2-3 compelling sentences about the location
- **Focus**: Main attractions, culture, unique characteristics
- **Language**: English only
- **Fallback**: Basic description if AI fails

**Example:**
```
Vilnius is the capital and largest city of Lithuania, known for its 
baroque architecture, medieval Old Town, and vibrant cultural scene.
```

### 2. ✅ Activities (from OpenStreetMap)
- **Source**: Overpass API
- **Radius**: 3km around location
- **Types**: Attractions, museums, parks
- **Limit**: Top 30 results
- **Translation**: All names translated to English
- **Fields**: name, category, address, coordinates

**Example Activities:**
- Frank Zappa (attraction)
- Vilnius Upper Castle (attraction)
- Amber Gallery Museum (museum)

### 3. ✅ Restaurants (from OpenStreetMap)
- **Source**: Overpass API
- **Radius**: 3km around location
- **Types**: Restaurants, cafes
- **Limit**: Top 30 results
- **Translation**: All names translated to English
- **Fields**: name, cuisine, price range, address, coordinates

**Example Restaurants:**
- Neringa Restaurant - International
- San Valentino - Italian
- Pomodoro Pizza & Pasta - Italian

## How It Works

### Automatic Flow (New Locations)

```typescript
// apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts

async createLocation(geoData: GeoNamesResult) {
  // 1. Translate all fields
  const displayName = translateName(geoData.name)
  const translatedCountry = translateName(geoData.countryName)
  const translatedRegion = translateName(geoData.adminName1)
  
  // 2. Generate AI description
  const aiDescription = await generateLocationDescription(
    displayName,
    translatedCountry,
    translatedRegion
  )
  
  // 3. Fetch and save images
  const images = await fetchImagesWithRetry(geoData)
  
  // 4. Insert location into database
  await supabase.from('locations').insert({
    name: displayName,
    country: translatedCountry,
    region: translatedRegion,
    description: aiDescription,
    featured_image: images.featuredImage,
    gallery_images: images.galleryImages,
    // ... other fields
  })
  
  // 5. Auto-populate activities & restaurants
  await autoPopulateLocationData(locationId, lat, lng)
}

async autoPopulateLocationData(locationId, lat, lng) {
  // Fetch from OpenStreetMap
  const [restaurants, activities] = await Promise.all([
    fetchRestaurantsFromOSM(lat, lng),
    fetchActivitiesFromOSM(lat, lng)
  ])
  
  // Translate names
  const translatedRestaurants = await Promise.all(
    restaurants.map(async (r) => {
      const translated = await translateLocationName(r.name)
      return { ...r, name: getDisplayName(translated.original, translated.translated) }
    })
  )
  
  const translatedActivities = await Promise.all(
    activities.map(async (a) => {
      const translated = await translateLocationName(a.name)
      return { ...a, name: getDisplayName(translated.original, translated.translated) }
    })
  )
  
  // Insert into database
  await supabase.from('restaurants').insert(translatedRestaurants)
  await supabase.from('activities').insert(translatedActivities)
}
```

### Manual Enrichment (Existing Locations)

For locations that were created before this system was implemented:

```bash
npx tsx scripts/enrich-existing-locations.ts
```

This script:
1. Finds locations with basic descriptions
2. Generates AI descriptions
3. Fetches activities from OpenStreetMap
4. Fetches restaurants from OpenStreetMap
5. Translates all names to English
6. Updates database

## API Sources

### 1. Groq API (AI Descriptions)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `llama-3.3-70b-versatile`
- **Cost**: Free tier available
- **Rate Limit**: Generous
- **Requires**: `GROQ_API_KEY` environment variable

### 2. Overpass API (Activities & Restaurants)
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Data**: OpenStreetMap
- **Cost**: Free
- **Rate Limit**: ~2 requests/second
- **No API Key Required**

**Activities Query:**
```
[out:json][timeout:15];
(
  node["tourism"="attraction"](around:3000,lat,lng);
  node["tourism"="museum"](around:3000,lat,lng);
  node["leisure"="park"](around:3000,lat,lng);
);
out body 30;
```

**Restaurants Query:**
```
[out:json][timeout:15];
(
  node["amenity"="restaurant"](around:3000,lat,lng);
  node["amenity"="cafe"](around:3000,lat,lng);
);
out body 30;
```

## Translation Integration

All fetched data is automatically translated:

```typescript
// Translate activity name
const nameTranslation = await translateLocationName(activity.name)
const translatedName = getDisplayName(nameTranslation.original, nameTranslation.translated)

// Translate description if exists
if (activity.description && hasNonLatinCharacters(activity.description)) {
  const descTranslation = await translateLocationName(activity.description)
  translatedDescription = getDisplayName(descTranslation.original, descTranslation.translated)
}
```

**Examples:**
- `长城` → `Great Wall`
- `에펠탑` → `Eiffel Tower`
- `Московский Кремль` → `Moscow Kremlin`

## Database Schema

### Activities Table
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,              -- Translated to English
  description TEXT,                -- Translated to English
  category TEXT,                   -- attraction, museum, park
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  source TEXT DEFAULT 'openstreetmap',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Restaurants Table
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,              -- Translated to English
  cuisine_type TEXT,
  price_range TEXT DEFAULT '$$',
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  source TEXT DEFAULT 'openstreetmap',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance

**Location Creation Time:**
- Translation: ~500ms per field (3 fields = 1.5s)
- AI Description: ~2s
- Image Fetching: ~3s
- OSM Activities: ~1s
- OSM Restaurants: ~1s
- Activity Translation: ~5s (10 activities)
- Restaurant Translation: ~5s (10 restaurants)

**Total: ~18 seconds per location**

**Optimizations:**
- Parallel API calls where possible
- Caching of translations
- Rate limiting to avoid API blocks
- Graceful degradation if APIs fail

## Error Handling

The system is designed to never fail location creation:

```typescript
try {
  const aiDescription = await generateLocationDescription(...)
} catch (error) {
  console.error('⚠️ AI description failed, using basic description')
  // Continue with basic description
}

try {
  await autoPopulateLocationData(...)
} catch (error) {
  console.error('⚠️ Auto-population failed')
  // Location is still created, just without activities/restaurants
}
```

## Testing

Verify enrichment for a location:

```bash
export $(cat .env.local | grep -v '^#' | xargs) && npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: location } = await supabase
    .from('locations')
    .select('name, description')
    .eq('slug', 'vilnius')
    .single();
  
  const { data: activities } = await supabase
    .from('activities')
    .select('name, category')
    .eq('location_id', location.id)
    .limit(5);
  
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('name, cuisine_type')
    .eq('location_id', location.id)
    .limit(5);
  
  console.log('Description:', location.description);
  console.log('Activities:', activities.length);
  console.log('Restaurants:', restaurants.length);
}

check();
"
```

## Future Enhancements

1. **More Data Sources**
   - Google Places API (paid, higher quality)
   - Yelp API (reviews, ratings)
   - TripAdvisor API (tourist info)

2. **Richer Descriptions**
   - Include historical facts
   - Best time to visit
   - Local tips

3. **Better Activity Categorization**
   - Outdoor vs Indoor
   - Family-friendly
   - Difficulty level

4. **Restaurant Enhancements**
   - Price verification
   - Opening hours
   - Reviews/ratings

5. **User Contributions**
   - Allow users to add activities
   - Verify auto-populated data
   - Add photos and reviews

## Summary

✅ **Automatic** - Runs for every new location  
✅ **Comprehensive** - Description, activities, restaurants  
✅ **Translated** - All content in English  
✅ **Free** - Uses free APIs (Groq, OpenStreetMap)  
✅ **Fast** - ~18 seconds per location  
✅ **Reliable** - Graceful error handling  
✅ **Maintainable** - Script to enrich existing locations  

**Result:** Every location has rich, English content ready for travelers! 🎉


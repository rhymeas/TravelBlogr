# Blog Post Enrichment System

## Overview

The blog post enrichment system automatically enhances blog posts with rich location data, including:

1. **Location Images** - High-quality images for each location mentioned
2. **POIs (Points of Interest)** - Clickable links to explore attractions
3. **Public Transportation** - Information about local transit providers
4. **Interactive Maps** - Same map integration as /plan and trip pages

---

## Features

### 1. Location Images

Each day/location in a blog post now displays a beautiful featured image:

- **Source**: Enhanced Image Service (Pexels, Unsplash, Wikimedia, Wikipedia)
- **Fallback**: Hierarchical fallback (city → region → country)
- **Quality**: High-resolution (1200x800+)
- **Display**: Rounded card with gradient overlay and location name

**Example:**
```typescript
{
  location: {
    name: "Rome",
    image: "https://images.pexels.com/photos/..."
  }
}
```

---

### 2. POIs (Points of Interest)

Clickable cards showing nearby attractions and places to explore:

- **Source**: Database (activities table) or OpenTripMap API
- **Limit**: Up to 6 POIs per location
- **Display**: Grid layout with hover effects
- **Links**: Click to navigate to location detail page

**Features:**
- Icon with location pin
- Name and category
- Short description
- External link icon on hover
- Smooth transitions

**Example:**
```typescript
{
  location: {
    pois: [
      {
        name: "Colosseum",
        category: "Historical Site",
        description: "Ancient Roman amphitheater",
        coordinates: { lat: 41.8902, lng: 12.4922 }
      }
    ]
  }
}
```

---

### 3. Public Transportation

Information about local transit providers:

- **Source**: OpenStreetMap Overpass API
- **Radius**: 10km around location
- **Display**: Blue info card with provider badges
- **Limit**: Up to 5 providers

**Features:**
- Bus/Train icons
- Provider names in badges
- Helpful tips
- Clean, accessible design

**Example:**
```typescript
{
  location: {
    transportation: {
      providers: ["ATAC", "Metro Roma", "Trenitalia"],
      tips: "Rome has 3 public transportation providers available."
    }
  }
}
```

---

### 4. Interactive Map

Same map integration as /plan and trip pages:

- **Component**: `TripOverviewMap`
- **Features**: 
  - Shows all locations on route
  - Numbered markers
  - Route lines between locations
  - Zoom controls
  - Responsive design

**Toggle Button:**
- "Show Map" / "Hide Map" button
- Smooth expand/collapse animation
- Full-width map view

---

## Data Flow

```
Blog Post Page
    ↓
enrichBlogPostDays()
    ↓
For each day/location:
    ↓
enrichLocation()
    ↓
┌─────────────────────────────────────┐
│ 1. Check Database (locations table) │
│ 2. Geocode if needed (GeoNames)     │
│ 3. Fetch Image (Enhanced Service)   │
│ 4. Fetch POIs (DB or OpenTripMap)   │
│ 5. Fetch Transport (Overpass API)   │
└─────────────────────────────────────┘
    ↓
Enriched Location Data
    ↓
BlogPostTemplate
    ↓
Rendered Blog Post
```

---

## API Usage

### Blog Enrichment Service

**File:** `apps/web/lib/services/blogEnrichmentService.ts`

**Main Functions:**

1. **`enrichLocation(locationName, useServerClient)`**
   - Enriches a single location with all data
   - Returns: `EnrichedLocation`

2. **`enrichBlogPostDays(days, useServerClient)`**
   - Enriches all days in a blog post
   - Returns: Array of enriched days

**Example Usage:**
```typescript
import { enrichBlogPostDays } from '@/lib/services/blogEnrichmentService'

const enrichedDays = await enrichBlogPostDays(post.content.days, false)
```

---

## Data Sources

### 1. Supabase Database
- **Tables**: `locations`, `activities`
- **Priority**: First choice (fastest, cached)
- **Cost**: Free (our data)

### 2. GeoNames API
- **Purpose**: Geocoding location names
- **Limit**: Unlimited (free)
- **Username**: `travelblogr`

### 3. OpenTripMap API
- **Purpose**: POIs and attractions
- **Limit**: Generous free tier
- **Key**: Stored in env vars

### 4. OpenStreetMap Overpass API
- **Purpose**: Public transportation data
- **Limit**: Unlimited (free)
- **Endpoint**: `https://overpass-api.de/api/interpreter`

### 5. Enhanced Image Service
- **Sources**: Pexels, Unsplash, Wikimedia, Wikipedia
- **Fallback**: Hierarchical (city → region → country)
- **Quality**: High-resolution images

---

## UI Components

### Location Image Card
```tsx
<div className="relative h-48 rounded-lg overflow-hidden">
  <OptimizedImage src={image} alt={name} fill />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60" />
  <div className="absolute bottom-4 left-4 text-white">
    <MapPin /> {name}
  </div>
</div>
```

### POI Card
```tsx
<Link href={`/locations/${slug}`}>
  <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-rausch-300">
    <MapPin />
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-500">{category}</p>
    </div>
  </div>
</Link>
```

### Transportation Card
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4><Bus /> Getting Around</h4>
  <div className="flex flex-wrap gap-2">
    {providers.map(provider => (
      <span className="px-3 py-1 bg-white border rounded-full">
        <Train /> {provider}
      </span>
    ))}
  </div>
  <p className="text-sm">{tips}</p>
</div>
```

---

## Performance

### Caching Strategy

1. **Database Cache**: Locations and activities cached in Supabase
2. **Image Cache**: 24-hour cache in `enhancedImageService`
3. **API Cache**: Minimal external API calls

### Loading States

- **Initial Load**: Skeleton loader
- **Enrichment**: "Enriching with location data..." toast
- **Fallback**: Original data if enrichment fails

### Optimization

- **Parallel Fetching**: All data sources queried simultaneously
- **Smart Fallbacks**: Graceful degradation if APIs fail
- **Lazy Loading**: Images loaded on demand
- **Debouncing**: Prevents duplicate enrichment calls

---

## Future Enhancements

### Planned Features

1. **Weather Data**: Current weather for each location
2. **Currency Info**: Local currency and exchange rates
3. **Language Tips**: Common phrases in local language
4. **Safety Ratings**: Travel safety information
5. **Cost Estimates**: Average daily budget
6. **Best Time to Visit**: Seasonal recommendations

### Batch Generation Integration

When batch generating blog posts, the enrichment service will:

1. Pre-fetch all location data
2. Cache images and POIs
3. Generate transportation info
4. Store enriched data in database
5. Reuse across multiple blog posts

---

## Troubleshooting

### No Images Showing

**Cause**: Image service failed or no images found

**Solution**:
1. Check Enhanced Image Service logs
2. Verify API keys (Pexels, Unsplash)
3. Check fallback image service
4. Ensure location name is correct

### No POIs Showing

**Cause**: Location not in database, OpenTripMap failed

**Solution**:
1. Check database for location
2. Verify OpenTripMap API key
3. Check coordinates are valid
4. Ensure location name is geocodable

### No Transportation Info

**Cause**: Overpass API timeout or no data

**Solution**:
1. Check Overpass API status
2. Verify coordinates are correct
3. Try larger radius (currently 10km)
4. Check if location has public transit

---

## Testing

### Manual Testing

1. Create a blog post with multiple locations
2. Verify each location shows:
   - ✅ Featured image
   - ✅ POIs (if available)
   - ✅ Transportation (if available)
3. Click POI links → Should navigate to location page
4. Toggle map → Should show/hide smoothly

### Automated Testing

```typescript
// Test enrichment service
const enriched = await enrichLocation('Rome')
expect(enriched.image).toBeDefined()
expect(enriched.pois).toHaveLength(6)
expect(enriched.transportation).toBeDefined()
```

---

## Summary

The blog post enrichment system transforms basic blog posts into rich, interactive travel guides with:

- 📸 **Beautiful location images**
- 🗺️ **Clickable POI links**
- 🚌 **Public transportation info**
- 🗺️ **Interactive maps**

All data is fetched automatically, cached efficiently, and displayed beautifully!


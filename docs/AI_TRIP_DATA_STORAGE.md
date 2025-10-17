# AI Trip Data Storage & Display

## Problem

AI-generated trips were showing empty content on the public trip page (`/trips/[slug]`) because:

1. **Posts weren't being created** - The `saveAIGeneratedTrip()` function was missing the `user_id` field when creating posts
2. **Data was stored but not displayed** - AI trip data was stored in `location_data` JSONB field but not converted to posts

## Solution

### ✅ Fixed: Post Creation

**File:** `apps/web/lib/services/aiTripConversionService.ts`

**Changes:**
```typescript
// ❌ BEFORE: Missing user_id
return {
  trip_id: trip.id,
  title: `Day ${day.day}: ${cleanedLocation}`,
  content,
  post_date: day.date,
  order_index: index,
  featured_image: locationImages?.[cleanedLocation]
}

// ✅ AFTER: Added user_id and excerpt
return {
  trip_id: trip.id,
  user_id: userId, // ✅ CRITICAL: Required by posts table
  title: `Day ${day.day}: ${cleanedLocation}`,
  content,
  excerpt: `Day ${day.day} in ${cleanedLocation} - ${activities.length} activities`,
  post_date: day.date,
  order_index: index,
  featured_image: locationImages?.[cleanedLocation] || null
}
```

---

## How AI Trip Data is Stored

### 1. **Trip Record** (`trips` table)

```typescript
{
  id: UUID,
  user_id: UUID,
  title: "Exploring Germany: Braak to Berlin",
  description: "A 7-day adventure through Germany",
  slug: "exploring-germany-braak-to-berlin-lYwNcy",
  cover_image: "https://...",
  start_date: "2025-01-20",
  end_date: "2025-01-27",
  status: "draft",
  location_data: {
    aiGenerated: true,
    transportMode: "car",
    interests: ["culture", "history"],
    budget: "moderate",
    totalCost: 1500,
    tips: ["Book accommodations in advance", "..."],
    destination: "Braak to Berlin",
    durationDays: 7
  }
}
```

### 2. **Posts** (`posts` table)

Each day of the AI-generated itinerary becomes a post:

```typescript
{
  id: UUID,
  trip_id: UUID, // References trip
  user_id: UUID, // ✅ NOW INCLUDED
  title: "Day 1: Hamburg",
  content: `# Day 1: Hamburg

## 🚗 Travel
- Drive from Braak to Hamburg (30 minutes)

## 🎯 Activities
- **Miniatur Wunderland**: World's largest model railway
- **Speicherstadt**: Historic warehouse district
- **Elbphilharmonie**: Concert hall with panoramic views

## 🍽️ Meals
- Lunch at Fischereihafen Restaurant
- Dinner at Bullerei`,
  excerpt: "Day 1 in Hamburg - 3 activities",
  featured_image: "https://...",
  post_date: "2025-01-20",
  order_index: 0
}
```

---

## Data Flow

```
User Creates AI Trip
    ↓
Groq AI Generates Itinerary
    ↓
GenerateItineraryUseCase
    ↓
saveAIGeneratedTrip()
    ├─ Create Trip Record (with location_data JSONB)
    └─ Create Posts (one per day)
        ├─ Day 1: Hamburg
        ├─ Day 2: Berlin
        ├─ Day 3: Dresden
        └─ ...
    ↓
Trip Page (/trips/[slug])
    ├─ Fetches trip + posts
    └─ Displays day-by-day itinerary
```

---

## Database Schema

### `trips` table

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  description TEXT,
  slug VARCHAR(255),
  cover_image TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20), -- 'draft', 'published', 'archived'
  location_data JSONB, -- ✅ Stores AI metadata
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `posts` table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  user_id UUID REFERENCES auth.users(id), -- ✅ REQUIRED
  title VARCHAR(255),
  content TEXT, -- Markdown content
  excerpt TEXT,
  featured_image TEXT,
  post_date TIMESTAMPTZ,
  order_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Testing

### 1. **Create a New AI Trip**

```bash
# Go to: http://localhost:3000/dashboard/trips/new
# Click "Create trip with AI"
# Fill in:
- From: Braak
- To: Berlin
- Days: 7
- Interests: Culture, History
- Budget: Moderate
```

### 2. **Verify Data in Database**

```sql
-- Check trip was created
SELECT id, title, slug, status, location_data
FROM trips
WHERE slug LIKE '%braak-to-berlin%';

-- Check posts were created
SELECT id, title, post_date, order_index
FROM posts
WHERE trip_id = '<trip-id-from-above>'
ORDER BY order_index;
```

### 3. **View Public Page**

```bash
# Go to: http://localhost:3000/trips/<slug>
# Should show:
- Trip title and description
- Cover image
- Day-by-day itinerary with activities
- Trip details sidebar
```

---

## Troubleshooting

### Issue: "Empty trip page, no content"

**Cause:** Posts weren't created due to missing `user_id`

**Fix:** ✅ Already fixed in `aiTripConversionService.ts`

**Verify:**
```sql
SELECT COUNT(*) FROM posts WHERE trip_id = '<trip-id>';
-- Should return number of days (e.g., 7)
```

### Issue: "Posts created but not showing"

**Cause:** Trip status is 'draft' and privacy is 'private'

**Fix:** Either:
1. Publish the trip (change status to 'published')
2. Use preview mode: `/trips/<slug>?preview=true`

### Issue: "No images showing"

**Cause:** Location images weren't fetched or stored

**Fix:** Check `location_data.locationImages` in trip record:
```sql
SELECT location_data->'locationImages' FROM trips WHERE id = '<trip-id>';
```

---

## Future Enhancements

### 1. **Rich Content Editor**

Instead of plain markdown, use a rich editor (Novel, Tiptap) for posts:

```typescript
content: {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [...] },
    { type: 'paragraph', content: [...] },
    { type: 'image', attrs: { src: '...', alt: '...' } }
  ]
}
```

### 2. **Activity Cards**

Store activities as structured data instead of markdown:

```typescript
// New table: trip_activities
{
  id: UUID,
  post_id: UUID,
  title: "Miniatur Wunderland",
  description: "World's largest model railway",
  type: "activity",
  time: "10:00",
  duration: "2 hours",
  cost: 15,
  location: { lat: 53.5438, lng: 9.9879 },
  image: "https://...",
  booking_link: "https://..."
}
```

### 3. **Interactive Map**

Show all activities on a map:

```typescript
<TripMap
  activities={activities}
  route={route}
  center={[53.5438, 9.9879]}
/>
```

### 4. **Cost Breakdown**

Show detailed cost breakdown:

```typescript
{
  accommodation: 500,
  food: 300,
  activities: 200,
  transport: 150,
  total: 1150
}
```

---

## Related Files

- `apps/web/lib/services/aiTripConversionService.ts` - Converts AI plan to trip + posts
- `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts` - Orchestrates AI generation
- `apps/web/lib/itinerary/application/services/GroqAIService.ts` - Calls Groq API
- `apps/web/app/trips/[slug]/page.tsx` - Displays trip and posts
- `apps/web/app/dashboard/trips/[tripId]/page.tsx` - Trip editor
- `infrastructure/database/schema.sql` - Database schema

---

## Summary

✅ **Fixed:** AI-generated trips now create posts with proper `user_id`
✅ **Data Flow:** AI plan → Trip record + Posts → Public page display
✅ **Storage:** Trip metadata in `location_data` JSONB, daily itinerary in `posts` table
✅ **Display:** `/trips/[slug]` page shows day-by-day itinerary from posts

**Next Steps:**
1. Test creating a new AI trip
2. Verify posts are created in database
3. Check public page displays content
4. Consider implementing rich content editor for better formatting


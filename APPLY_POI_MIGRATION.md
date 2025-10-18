# Apply POI Migration - Quick Guide

## 🚀 Step 1: Apply Database Migration

### **Option A: Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **TravelBlogr**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the FULL SQL from:
   `infrastructure/database/migrations/008_add_trip_plan_data.sql`

   Or copy this:

```sql
-- Create trip_plan table
CREATE TABLE IF NOT EXISTS trip_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    time TIME NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'activity',
    duration INTEGER,
    cost DECIMAL(10,2),
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    plan_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_plan_trip ON trip_plan(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_day ON trip_plan(day);
CREATE INDEX IF NOT EXISTS idx_trip_plan_time ON trip_plan(time);
CREATE INDEX IF NOT EXISTS idx_trip_plan_data ON trip_plan USING GIN (plan_data);

ALTER TABLE trip_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trip plans"
ON trip_plan FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip plans"
ON trip_plan FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip plans"
ON trip_plan FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip plans"
ON trip_plan FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_location_data ON trips USING GIN (location_data);
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success: You should see "Success. No rows returned"

### **Option B: Automated Script**

```bash
npx tsx apps/web/scripts/apply-trip-plan-migration.ts
```

---

## ✅ Step 2: Verify Migration

Run this query in Supabase SQL Editor:

```sql
-- Check if trip_plan table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'trip_plan';

-- Check if indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('trip_plan', 'trips')
AND indexname IN ('idx_trip_plan_data', 'idx_trips_location_data');
```

Expected result:
```
table_name
-----------
trip_plan

indexname
-------------------
idx_trip_plan_data
idx_trips_location_data
```

---

## 🧪 Step 3: Test POI Display

1. **Generate a new trip:**
   - Go to http://localhost:3000/plan
   - From: Hamburg, To: Munich
   - Dates: Any 5-7 day range
   - Interests: food, culture, nature
   - Click "Generate Trip"

2. **Save the trip:**
   - Click "Save Trip" in the modal
   - Give it a title
   - Click "Save"

3. **View the trip page:**
   - Navigate to `/trips/[slug]`
   - Scroll down past the itinerary
   - You should see "Recommended Stops Along the Way" section
   - POIs should display with badges, ratings, detour times

---

## 🔍 Step 4: Verify POI Data in Database

Run this query to check POI data:

```sql
-- Check POI data in trip_plan table (newer trips)
SELECT
  t.title,
  t.slug,
  jsonb_array_length(tp.plan_data->'__context'->'topRankedPOIs') as poi_count,
  tp.plan_data->'__context'->'topRankedPOIs'->0->>'name' as first_poi_name,
  tp.plan_data->'__context'->'topRankedPOIs'->0->>'score' as first_poi_score
FROM trips t
JOIN trip_plan tp ON tp.trip_id = t.id
WHERE tp.type = 'ai_plan'
  AND tp.plan_data->'__context'->'topRankedPOIs' IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- Check POI data in trips.location_data (older trips)
SELECT
  t.title,
  t.slug,
  jsonb_array_length(t.location_data->'__context'->'topRankedPOIs') as poi_count,
  t.location_data->'__context'->'topRankedPOIs'->0->>'name' as first_poi_name,
  t.location_data->'__context'->'topRankedPOIs'->0->>'score' as first_poi_score
FROM trips t
WHERE t.location_data->'__context'->'topRankedPOIs' IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;
```

Expected result:
```
title                    | slug           | poi_count | first_poi_name        | first_poi_score
-------------------------|----------------|-----------|----------------------|----------------
Hamburg to Munich        | hamburg-munich | 15        | Neuschwanstein Castle| 92
```

---

## 🐛 Troubleshooting

### **Migration fails with "index already exists"**
✅ This is fine! The index was already added. Skip to Step 2.

### **No POIs showing on trip page**
1. Check if trip was generated AFTER migration
2. Old trips won't have POI data - generate a new trip
3. Check browser console for errors
4. Verify index exists (Step 2)

### **POI section is empty**
1. Make sure you added interests when generating the trip
2. Check if route has POIs nearby (some routes may have few POIs)
3. Try a route with major cities (e.g., Hamburg → Munich)

### **TypeScript errors**
Run: `npm run type-check`
- Pre-existing error in POISection.tsx is unrelated
- New components should compile without errors

---

## 📊 What's Next?

After migration is applied and tested:

1. **Deploy to production** (Railway)
2. **Monitor POI display** on production trips
3. **Implement POI caching** (Priority 2)
4. **Create POI database table** (Priority 3)
5. **Add dashboard integration** (Priority 4)

See `docs/POI_INTEGRATION_COMPLETE.md` for full roadmap.

---

## ✅ Success Checklist

- [ ] Migration applied successfully
- [ ] Column verified in database
- [ ] New trip generated with POIs
- [ ] POIs display on trip page
- [ ] POI data visible in database
- [ ] No console errors
- [ ] Ready for production deployment


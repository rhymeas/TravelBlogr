# Fix Trips Database - Simple Solution

## Problem

The trips table doesn't exist or has wrong schema.

Error: `400 Bad Request` when fetching trips.

## Solution - Option 1: Create Fresh Table (RECOMMENDED)

This creates the trips table from scratch. **Use this if you don't have any trips yet.**

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your TravelBlogr project (nchhcxokrzabbkvhzsor)

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Create Script**
   - Copy ALL contents of `infrastructure/database/create-trips-table.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd+Enter
   - Should see: "Success. No rows returned"

4. **Verify**
   - Click "Table Editor" in left sidebar
   - Look for "trips" table
   - Should see columns: id, user_id, title, slug, etc.

5. **Test**
   - Refresh http://localhost:3000/dashboard/trips
   - Should now load without errors
   - Try creating a new trip

---

## Solution - Option 2: Fix Existing Table

**Only use this if you already have trips data you want to keep.**

1. Open Supabase SQL Editor
2. Copy contents of `infrastructure/database/fix-trips-schema.sql`
3. Run it
4. Test the app

## What the Script Does

1. ✅ Fixes foreign key: `trips.user_id` → `auth.users(id)`
2. ✅ Enables Row Level Security (RLS)
3. ✅ Creates policies:
   - Anyone can view trips (for public sharing)
   - Only owners can create/update/delete their trips
4. ✅ Fixes `posts`, `share_links`, and `media` tables too

## Simple Explanation

- **Before**: Trips tried to link to `public.users` (doesn't exist)
- **After**: Trips link to `auth.users` (Supabase's auth table)
- **RLS**: Ensures users can only modify their own trips
- **Public viewing**: Anyone can view trips (needed for share links like `tripname.travelblogr.com`)

## Alternative: Quick Fix (If Script Fails)

If the script fails, you can manually create the trips table:

```sql
-- Drop and recreate trips table
DROP TABLE IF EXISTS trips CASCADE;

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL,
    cover_image TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    location_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Anyone can view trips (for public sharing)
CREATE POLICY "Anyone can view trips" ON trips
  FOR SELECT
  USING (true);

-- Only owners can modify
CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
```

## After Running the Script

1. **Refresh the app**: http://localhost:3000/dashboard/trips
2. **Create a test trip**: Click "Create Trip"
3. **Verify it appears**: Should see your trip in the list
4. **Check subdomain**: Trip should be accessible at `tripname.travelblogr.com` (when deployed)

---

**Status**: Ready to run  
**Time**: ~1 minute  
**Risk**: Low (only fixes foreign keys and adds RLS)


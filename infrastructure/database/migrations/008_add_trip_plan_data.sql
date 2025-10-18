-- Migration 008: Create trip_plan table and optimize trips.location_data
-- This migration creates the trip_plan table for manual trip planning
-- and adds an index to trips.location_data for POI queries

-- 1. Create trip_plan table (for manual day-by-day planning)
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
    duration INTEGER, -- in hours
    cost DECIMAL(10,2),
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    plan_data JSONB, -- Store full AI plan JSON here (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for trip_plan
CREATE INDEX IF NOT EXISTS idx_trip_plan_trip ON trip_plan(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_day ON trip_plan(day);
CREATE INDEX IF NOT EXISTS idx_trip_plan_time ON trip_plan(time);
CREATE INDEX IF NOT EXISTS idx_trip_plan_data ON trip_plan USING GIN (plan_data);

-- 3. Enable RLS on trip_plan
ALTER TABLE trip_plan ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for trip_plan
CREATE POLICY "Users can view their own trip plans"
ON trip_plan FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip plans"
ON trip_plan FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip plans"
ON trip_plan FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip plans"
ON trip_plan FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create index for faster JSONB queries on trips.location_data
CREATE INDEX IF NOT EXISTS idx_trips_location_data ON trips USING GIN (location_data);

-- Comments
COMMENT ON TABLE trip_plan IS 'Manual trip planning items (day-by-day activities)';
COMMENT ON COLUMN trip_plan.plan_data IS 'Optional: Full AI-generated plan JSON with structured context (POIs, route segments, etc.)';
COMMENT ON COLUMN trips.location_data IS 'AI metadata including POIs in __context field';


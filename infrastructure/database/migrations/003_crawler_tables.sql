-- Migration: Add tables for content crawler
-- Created: 2025-01-XX
-- Description: Tables for storing crawled restaurant data, weather data, and crawler logs

-- ============================================================================
-- LOCATION WEATHER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS location_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Current weather data
  temperature INTEGER NOT NULL, -- Celsius
  feels_like INTEGER NOT NULL,
  condition VARCHAR(100) NOT NULL, -- Clear, Clouds, Rain, etc.
  description TEXT, -- More detailed description
  humidity INTEGER NOT NULL, -- Percentage
  wind_speed INTEGER NOT NULL, -- km/h
  wind_direction INTEGER, -- Degrees
  pressure INTEGER, -- hPa
  visibility INTEGER, -- km
  icon VARCHAR(10) NOT NULL, -- OpenWeatherMap icon code
  
  -- Sun times
  sunrise TIMESTAMPTZ,
  sunset TIMESTAMPTZ,
  
  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(location_id)
);

CREATE INDEX idx_location_weather_location ON location_weather(location_id);
CREATE INDEX idx_location_weather_updated ON location_weather(updated_at);

-- ============================================================================
-- LOCATION RESTAURANTS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS location_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cuisine VARCHAR(100) NOT NULL,
  price_range VARCHAR(10), -- $, $$, $$$, $$$$
  
  -- Ratings
  rating DECIMAL(2,1), -- 0.0 to 5.0
  review_count INTEGER,
  
  -- Contact info
  address TEXT,
  phone VARCHAR(50),
  website TEXT,
  menu_url TEXT,
  
  -- Media
  image_url TEXT,
  
  -- Additional details
  specialties TEXT[], -- Array of specialty items
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Crawler metadata
  source_url TEXT NOT NULL, -- Where data was crawled from
  is_verified BOOLEAN DEFAULT FALSE, -- Manual verification flag
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_location_restaurants_location ON location_restaurants(location_id);
CREATE INDEX idx_location_restaurants_cuisine ON location_restaurants(cuisine);
CREATE INDEX idx_location_restaurants_rating ON location_restaurants(rating DESC);
CREATE INDEX idx_location_restaurants_verified ON location_restaurants(is_verified);

-- ============================================================================
-- LOCATION ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS location_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- Hiking, Skiing, Sightseeing, etc.
  
  -- Details
  difficulty VARCHAR(50), -- Easy, Moderate, Hard
  duration VARCHAR(100), -- "2-3 hours", "Full day", etc.
  cost VARCHAR(50), -- Free, $, $$, $$$
  best_time VARCHAR(100), -- "Summer", "Year-round", etc.
  booking_required BOOLEAN DEFAULT FALSE,
  
  -- Media
  image_url TEXT,
  website TEXT,
  
  -- Location
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Ratings
  rating DECIMAL(2,1),
  review_count INTEGER,
  
  -- Crawler metadata
  source_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_activity_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_location_activities_location ON location_activities(location_id);
CREATE INDEX idx_location_activities_category ON location_activities(category);
CREATE INDEX idx_location_activities_difficulty ON location_activities(difficulty);

-- ============================================================================
-- CRAWLER LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job info
  job_type VARCHAR(50) NOT NULL, -- 'restaurants', 'weather', 'activities'
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
  
  -- Stats
  items_crawled INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Duration in milliseconds
  
  -- Details
  error_messages TEXT[], -- Array of error messages
  metadata JSONB, -- Additional metadata
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_logs_job_type ON crawler_logs(job_type);
CREATE INDEX idx_crawler_logs_location ON crawler_logs(location_id);
CREATE INDEX idx_crawler_logs_status ON crawler_logs(status);
CREATE INDEX idx_crawler_logs_started ON crawler_logs(started_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_location_weather_updated_at
  BEFORE UPDATE ON location_weather
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_restaurants_updated_at
  BEFORE UPDATE ON location_restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_activities_updated_at
  BEFORE UPDATE ON location_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE location_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for weather, restaurants, activities
CREATE POLICY "Public read access" ON location_weather FOR SELECT USING (true);
CREATE POLICY "Public read access" ON location_restaurants FOR SELECT USING (true);
CREATE POLICY "Public read access" ON location_activities FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "Service role write access" ON location_weather FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON location_restaurants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON location_activities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON crawler_logs FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE location_weather IS 'Current weather data for locations, updated every 6 hours';
COMMENT ON TABLE location_restaurants IS 'Restaurants crawled from various sources with structured data';
COMMENT ON TABLE location_activities IS 'Activities and experiences available at locations';
COMMENT ON TABLE crawler_logs IS 'Logs of crawler job executions for monitoring and debugging';


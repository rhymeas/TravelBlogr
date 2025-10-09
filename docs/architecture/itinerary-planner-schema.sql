-- ============================================================================
-- plan PLANNER SCHEMA EXTENSIONS
-- Extends existing TravelBlogr schema for AI-powered plan planning
-- ============================================================================

-- ============================================================================
-- 1. plan TEMPLATES (Pre-built itineraries by AI or experts)
-- ============================================================================
CREATE TABLE plan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL, -- e.g., 3, 5, 7 days
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
    budget_level VARCHAR(20) CHECK (budget_level IN ('budget', 'moderate', 'luxury')),
    tags TEXT[] DEFAULT '{}', -- ['family-friendly', 'adventure', 'cultural']
    template_data JSONB NOT NULL, -- Full plan structure
    created_by UUID REFERENCES users(id),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ROUTING CACHE (Cache OpenTripPlanner / routing results)
-- ============================================================================
CREATE TABLE routing_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_lat DECIMAL(10, 8) NOT NULL,
    origin_lng DECIMAL(11, 8) NOT NULL,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lng DECIMAL(11, 8) NOT NULL,
    transport_mode VARCHAR(20) NOT NULL, -- 'walk', 'transit', 'car', 'bike'
    route_data JSONB NOT NULL, -- Full route with waypoints, duration, distance
    duration_minutes INTEGER,
    distance_meters INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Index for fast lookups
CREATE INDEX idx_routing_cache_coords ON routing_cache(
    origin_lat, origin_lng, destination_lat, destination_lng, transport_mode
);

-- ============================================================================
-- 3. AI GENERATION LOGS (Track AI-generated itineraries)
-- ============================================================================
CREATE TABLE ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL, -- User's input prompt
    constraints JSONB, -- Budget, time, preferences
    model_used VARCHAR(100), -- 'gpt-4', 'claude-3', etc.
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    result_quality_score DECIMAL(3, 2), -- User feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. plan OPTIMIZATION REQUESTS (Queue for background processing)
-- ============================================================================
CREATE TABLE plan_optimization_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    optimization_type VARCHAR(50) NOT NULL, -- 'route', 'time', 'cost', 'full'
    input_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    result_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. EXTEND EXISTING trip_plan TABLE
-- ============================================================================
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id);
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(20);
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS route_data JSONB; -- Cached route info
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20);
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE trip_plan ADD COLUMN IF NOT EXISTS optimization_score DECIMAL(3, 2);

-- ============================================================================
-- 6. LOCATION CONNECTIVITY (Pre-compute transit/routing between locations)
-- ============================================================================
CREATE TABLE location_connectivity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    transport_modes JSONB NOT NULL, -- {'car': {duration: 120, distance: 150}, 'train': {...}}
    best_mode VARCHAR(20),
    estimated_cost JSONB, -- {'car': 50, 'train': 30}
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_location_id, to_location_id)
);

-- ============================================================================
-- 7. USER PREFERENCES (For personalized recommendations)
-- ============================================================================
CREATE TABLE user_travel_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_transport TEXT[] DEFAULT '{}', -- ['train', 'walk']
    budget_level VARCHAR(20) DEFAULT 'moderate',
    pace VARCHAR(20) DEFAULT 'moderate', -- 'relaxed', 'moderate', 'fast'
    interests TEXT[] DEFAULT '{}', -- ['museums', 'nature', 'food']
    dietary_restrictions TEXT[] DEFAULT '{}',
    accessibility_needs TEXT[] DEFAULT '{}',
    preferred_accommodation_type TEXT[] DEFAULT '{}',
    travel_style TEXT[] DEFAULT '{}', -- ['solo', 'family', 'adventure']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_plan_templates_location ON plan_templates(location_id);
CREATE INDEX idx_plan_templates_duration ON plan_templates(duration_days);
CREATE INDEX idx_plan_templates_tags ON plan_templates USING GIN(tags);

CREATE INDEX idx_routing_cache_expires ON routing_cache(expires_at);

CREATE INDEX idx_ai_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_trip ON ai_generation_logs(trip_id);
CREATE INDEX idx_ai_logs_created ON ai_generation_logs(created_at);

CREATE INDEX idx_optimization_queue_status ON plan_optimization_queue(status);
CREATE INDEX idx_optimization_queue_trip ON plan_optimization_queue(trip_id);

CREATE INDEX idx_trip_plan_activity ON trip_plan(activity_id);
CREATE INDEX idx_trip_plan_restaurant ON trip_plan(restaurant_id);

CREATE INDEX idx_location_connectivity_from ON location_connectivity(from_location_id);
CREATE INDEX idx_location_connectivity_to ON location_connectivity(to_location_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- plan templates (public read, admin write)
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published templates" ON plan_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can create templates" ON plan_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- AI generation logs (users can only see their own)
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs" ON ai_generation_logs
    FOR SELECT USING (auth.uid() = user_id);

-- User preferences (users can only manage their own)
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON user_travel_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Optimization queue (users can only see their own)
ALTER TABLE plan_optimization_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own optimization requests" ON plan_optimization_queue
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean expired routing cache
CREATE OR REPLACE FUNCTION clean_expired_routing_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM routing_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate plan optimization score
CREATE OR REPLACE FUNCTION calculate_plan_score(trip_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL := 0;
    total_items INTEGER;
    completed_items INTEGER;
    avg_duration DECIMAL;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
    INTO total_items, completed_items
    FROM trip_plan
    WHERE trip_id = trip_id_param;
    
    IF total_items > 0 THEN
        score := (completed_items::DECIMAL / total_items) * 100;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample template for Tokyo
INSERT INTO plan_templates (
    location_id,
    name,
    description,
    duration_days,
    difficulty,
    budget_level,
    tags,
    template_data,
    is_ai_generated
) VALUES (
    (SELECT id FROM locations WHERE slug = 'tokyo' LIMIT 1),
    '3-Day Tokyo Highlights',
    'Perfect introduction to Tokyo covering major attractions, food, and culture',
    3,
    'easy',
    'moderate',
    ARRAY['cultural', 'food', 'family-friendly'],
    '{
        "days": [
            {
                "day": 1,
                "title": "Traditional Tokyo",
                "items": [
                    {"time": "09:00", "title": "Senso-ji Temple", "duration": 2},
                    {"time": "12:00", "title": "Lunch at Tsukiji Market", "duration": 1.5},
                    {"time": "15:00", "title": "Imperial Palace Gardens", "duration": 2}
                ]
            }
        ]
    }'::jsonb,
    true
);

-- ============================================================================
-- CLEANUP SCHEDULED JOB (Run daily)
-- ============================================================================
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('clean-routing-cache', '0 2 * * *', 'SELECT clean_expired_routing_cache()');


-- Migration: Location Copying & Attribution System
-- Created: 2025-10-16
-- Description: Add support for copying locations, tracking versions, and managing attribution

-- ============================================================================
-- 1. ALTER LOCATIONS TABLE - Add new fields
-- ============================================================================

ALTER TABLE locations ADD COLUMN IF NOT EXISTS original_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS current_owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS visibility_status VARCHAR(20) DEFAULT 'public' CHECK (visibility_status IN ('private', 'public', 'shared'));
ALTER TABLE locations ADD COLUMN IF NOT EXISTS modification_permissions JSONB DEFAULT '{"name": false, "description": false, "notes": true, "duration": true, "custom_fields": true}'::jsonb;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. CREATE LOCATION_VERSIONS TABLE - Track modification history
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Store the changes made in this version
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Full snapshot of location at this version (for easy rollback)
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Change description
    change_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(location_id, version_number)
);

-- ============================================================================
-- 3. CREATE LOCATION_ATTRIBUTION TABLE - Track ownership & credits
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

    -- Original creator (who created the location first)
    original_creator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Current owner (who owns it in their trip)
    current_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Modification chain - track all changes
    modification_chain JSONB DEFAULT '[]'::jsonb,
    
    -- Attribution text to display
    attribution_text TEXT,
    
    -- Whether attribution is required
    requires_attribution BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(location_id, current_owner_id)
);

-- ============================================================================
-- 4. CREATE INDEXES - Optimize queries
-- ============================================================================

-- Index for finding copied locations
CREATE INDEX IF NOT EXISTS idx_locations_original_location_id ON locations(original_location_id) WHERE original_location_id IS NOT NULL;

-- Index for finding locations by creator
CREATE INDEX IF NOT EXISTS idx_locations_creator_id ON locations(creator_id) WHERE creator_id IS NOT NULL;

-- Index for finding locations by owner
CREATE INDEX IF NOT EXISTS idx_locations_current_owner_id ON locations(current_owner_id) WHERE current_owner_id IS NOT NULL;

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_locations_visibility_status ON locations(visibility_status);

-- Index for soft deletes
CREATE INDEX IF NOT EXISTS idx_locations_is_deleted ON locations(is_deleted) WHERE is_deleted = FALSE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_locations_creator_visibility ON locations(creator_id, visibility_status) WHERE is_deleted = FALSE;

-- Index for version history
CREATE INDEX IF NOT EXISTS idx_location_versions_location_id ON location_versions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_versions_created_by ON location_versions(created_by);

-- Index for attribution
CREATE INDEX IF NOT EXISTS idx_location_attribution_location_id ON location_attribution(location_id);
CREATE INDEX IF NOT EXISTS idx_location_attribution_original_creator ON location_attribution(original_creator_id);
CREATE INDEX IF NOT EXISTS idx_location_attribution_current_owner ON location_attribution(current_owner_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE location_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_attribution ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Location Versions Policies
CREATE POLICY location_versions_select_own ON location_versions
    FOR SELECT
    USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = location_versions.location_id 
            AND (locations.creator_id = auth.uid() OR locations.current_owner_id = auth.uid())
        )
    );

CREATE POLICY location_versions_insert_own ON location_versions
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Location Attribution Policies
CREATE POLICY location_attribution_select_own ON location_attribution
    FOR SELECT
    USING (
        auth.uid() = original_creator_id 
        OR auth.uid() = current_owner_id
        OR EXISTS (
            SELECT 1 FROM locations 
            WHERE locations.id = location_attribution.location_id 
            AND locations.visibility_status = 'public'
        )
    );

CREATE POLICY location_attribution_insert_own ON location_attribution
    FOR INSERT
    WITH CHECK (auth.uid() = current_owner_id);

CREATE POLICY location_attribution_update_own ON location_attribution
    FOR UPDATE
    USING (auth.uid() = current_owner_id);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(location_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((
        SELECT MAX(version_number) + 1 
        FROM location_versions 
        WHERE location_id = location_uuid
    ), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to create version entry
CREATE OR REPLACE FUNCTION create_location_version(
    p_location_id UUID,
    p_created_by UUID,
    p_changes JSONB,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
    v_snapshot JSONB;
BEGIN
    -- Get next version number
    v_version_number := get_next_version_number(p_location_id);
    
    -- Get current location snapshot
    SELECT to_jsonb(locations.*) INTO v_snapshot
    FROM locations
    WHERE id = p_location_id;
    
    -- Create version entry
    INSERT INTO location_versions (
        location_id,
        version_number,
        created_by,
        changes,
        snapshot,
        change_description
    ) VALUES (
        p_location_id,
        v_version_number,
        p_created_by,
        p_changes,
        v_snapshot,
        p_description
    )
    RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to copy location
CREATE OR REPLACE FUNCTION copy_location(
    p_original_location_id UUID,
    p_new_owner_id UUID,
    p_trip_id UUID,
    p_custom_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_new_location_id UUID;
    v_original_location RECORD;
BEGIN
    -- Get original location
    SELECT * INTO v_original_location
    FROM locations
    WHERE id = p_original_location_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original location not found';
    END IF;
    
    -- Create new location instance
    INSERT INTO locations (
        name,
        slug,
        description,
        country,
        region,
        city,
        latitude,
        longitude,
        featured_image,
        gallery_images,
        timezone,
        currency,
        language,
        best_time_to_visit,
        budget_info,
        rating,
        is_featured,
        is_published,
        original_location_id,
        creator_id,
        current_owner_id,
        visibility_status,
        modification_permissions
    ) VALUES (
        COALESCE(p_custom_name, v_original_location.name),
        v_original_location.slug || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
        v_original_location.description,
        v_original_location.country,
        v_original_location.region,
        v_original_location.city,
        v_original_location.latitude,
        v_original_location.longitude,
        v_original_location.featured_image,
        v_original_location.gallery_images,
        v_original_location.timezone,
        v_original_location.currency,
        v_original_location.language,
        v_original_location.best_time_to_visit,
        v_original_location.budget_info,
        v_original_location.rating,
        FALSE,
        TRUE,
        p_original_location_id,
        v_original_location.creator_id,
        p_new_owner_id,
        'private',
        '{"name": false, "description": false, "notes": true, "duration": true, "custom_fields": true}'::jsonb
    )
    RETURNING id INTO v_new_location_id;
    
    -- Create attribution entry
    INSERT INTO location_attribution (
        location_id,
        original_creator_id,
        current_owner_id,
        attribution_text,
        requires_attribution
    ) VALUES (
        v_new_location_id,
        v_original_location.creator_id,
        p_new_owner_id,
        'Originally created by ' || COALESCE(v_original_location.creator_id::text, 'Unknown'),
        TRUE
    );
    
    RETURN v_new_location_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON location_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_attribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_version_number TO authenticated;
GRANT EXECUTE ON FUNCTION create_location_version TO authenticated;
GRANT EXECUTE ON FUNCTION copy_location TO authenticated;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE location_versions IS 'Tracks all modifications to locations for version history and rollback capability';
COMMENT ON TABLE location_attribution IS 'Manages location ownership, creator credits, and modification chains';
COMMENT ON COLUMN locations.original_location_id IS 'Reference to original location if this is a copy';
COMMENT ON COLUMN locations.creator_id IS 'User who originally created this location';
COMMENT ON COLUMN locations.current_owner_id IS 'User who currently owns this location in their trip';
COMMENT ON COLUMN locations.visibility_status IS 'Privacy level: private, public, or shared';
COMMENT ON COLUMN locations.modification_permissions IS 'JSON object defining which fields can be edited';
COMMENT ON COLUMN locations.is_deleted IS 'Soft delete flag for data retention';

-- ============================================================================
-- 10. MIGRATION VERIFICATION
-- ============================================================================

-- Verify all columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'locations' AND column_name = 'original_location_id'
    ) THEN
        RAISE EXCEPTION 'Migration failed: original_location_id column not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'location_versions'
    ) THEN
        RAISE EXCEPTION 'Migration failed: location_versions table not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'location_attribution'
    ) THEN
        RAISE EXCEPTION 'Migration failed: location_attribution table not created';
    END IF;
    
    RAISE NOTICE 'Migration 008 completed successfully!';
END $$;


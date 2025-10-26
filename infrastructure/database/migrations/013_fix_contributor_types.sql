-- Migration 013: Normalize contributor_types array to TEXT[]
-- Purpose: Fix varchar[] vs text[] type mismatch warnings in views/functions
-- Date: 2025-10-25

-- 1) Update location_top_contributors view to cast contribution_types to TEXT[]
DROP VIEW IF EXISTS location_top_contributors;
CREATE VIEW location_top_contributors AS
SELECT 
  lc.location_id,
  lc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) AS contribution_count,
  MAX(lc.created_at) AS last_contribution_at,
  ARRAY_AGG(DISTINCT lc.contribution_type)::TEXT[] AS contribution_types
FROM location_contributions lc
JOIN profiles p ON p.id = lc.user_id
GROUP BY lc.location_id, lc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY lc.location_id, contribution_count DESC;

-- 2) Update user_contribution_stats view to cast contribution_types to TEXT[]
DROP VIEW IF EXISTS user_contribution_stats;
CREATE VIEW user_contribution_stats AS
SELECT 
  lc.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  COUNT(*) AS total_contributions,
  COUNT(DISTINCT lc.location_id) AS locations_contributed,
  MAX(lc.created_at) AS last_contribution_at,
  ARRAY_AGG(DISTINCT lc.contribution_type)::TEXT[] AS contribution_types
FROM location_contributions lc
JOIN profiles p ON p.id = lc.user_id
GROUP BY lc.user_id, p.full_name, p.username, p.avatar_url
ORDER BY total_contributions DESC;

-- 3) Notes
-- - trip_top_contributors view already casts to TEXT[] in migration 012
-- - get_location_top_contributors() and get_trip_top_contributors() signatures return TEXT[]
--   so this aligns all sources and removes varchar[] vs text[] mismatches

-- Done


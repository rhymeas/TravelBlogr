-- 015_wishlist_collections.sql
-- Wishlist Collections feature (collections + junction table)
-- RLS-enabled and indexed

-- Tables
CREATE TABLE IF NOT EXISTS wishlist_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishlist_collections_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS collection_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES wishlist_collections(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT collection_locations_unique UNIQUE (collection_id, location_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_collections_user_id ON wishlist_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_locations_collection_id ON collection_locations(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_locations_location_id ON collection_locations(location_id);

-- Row Level Security
ALTER TABLE wishlist_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_locations ENABLE ROW LEVEL SECURITY;

-- Policies for wishlist_collections (owner-only)
CREATE POLICY IF NOT EXISTS wishlist_collections_select_own ON wishlist_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS wishlist_collections_insert_own ON wishlist_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS wishlist_collections_update_own ON wishlist_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS wishlist_collections_delete_own ON wishlist_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for collection_locations (owner via parent collection)
CREATE POLICY IF NOT EXISTS collection_locations_select_own ON collection_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wishlist_collections c
      WHERE c.id = collection_locations.collection_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS collection_locations_insert_own ON collection_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlist_collections c
      WHERE c.id = collection_locations.collection_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS collection_locations_delete_own ON collection_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wishlist_collections c
      WHERE c.id = collection_locations.collection_id
      AND c.user_id = auth.uid()
    )
  );


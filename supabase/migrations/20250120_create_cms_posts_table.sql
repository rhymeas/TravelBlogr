-- Migration: Create CMS Posts Table
-- Date: 2025-01-20
-- Purpose: Create cms_posts table for Blog CMS with Novel editor

-- ============================================================================
-- CMS POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cms_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content JSONB, -- Rich content from Novel editor
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'password')),
    password VARCHAR(255),
    featured_image TEXT,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_posts_author ON cms_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status);
CREATE INDEX IF NOT EXISTS idx_cms_posts_published_at ON cms_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_posts_category ON cms_posts(category);
CREATE INDEX IF NOT EXISTS idx_cms_posts_tags ON cms_posts USING GIN(tags);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Public can view published cms posts" ON cms_posts
  FOR SELECT
  USING (status = 'published' AND visibility = 'public');

-- Authors can view their own posts
CREATE POLICY "Authors can view own cms posts" ON cms_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Authors can create posts
CREATE POLICY "Authors can create cms posts" ON cms_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update own cms posts" ON cms_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own cms posts" ON cms_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cms_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cms_posts_updated_at
  BEFORE UPDATE ON cms_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_posts_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cms_posts IS 'Blog posts for CMS with Novel editor - separate from AI-generated blog_posts';
COMMENT ON COLUMN cms_posts.content IS 'Rich content from Novel editor stored as JSONB';
COMMENT ON COLUMN cms_posts.status IS 'Post status: draft, published, or scheduled';
COMMENT ON COLUMN cms_posts.visibility IS 'Post visibility: public, private, or password-protected';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CMS Posts table migration complete!';
    RAISE NOTICE '📊 Created table: cms_posts';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '⚡ Triggers created for updated_at';
END $$;


-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    location_data JSONB,
    post_date TIMESTAMP WITH TIME ZONE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share links table
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subdomain VARCHAR(63) UNIQUE NOT NULL, -- DNS subdomain limit
    token VARCHAR(64) UNIQUE NOT NULL, -- Backup token for direct access
    title VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}', -- Privacy and access settings
    customization JSONB DEFAULT '{}', -- Theme, colors, branding
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    caption TEXT,
    location_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share link views table (for analytics)
CREATE TABLE share_link_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(255),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live locations table (for real-time tracking)
CREATE TABLE live_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    display_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_slug ON trips(slug);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);

CREATE INDEX idx_posts_trip_id ON posts(trip_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_post_date ON posts(post_date DESC);
CREATE INDEX idx_posts_order_index ON posts(order_index);

CREATE INDEX idx_share_links_subdomain ON share_links(subdomain);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_trip_id ON share_links(trip_id);
CREATE INDEX idx_share_links_user_id ON share_links(user_id);
CREATE INDEX idx_share_links_is_active ON share_links(is_active);

CREATE INDEX idx_live_locations_trip_id ON live_locations(trip_id);
CREATE INDEX idx_live_locations_user_id ON live_locations(user_id);
CREATE INDEX idx_live_locations_timestamp ON live_locations(timestamp DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- User follows table (social connections)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Activity feed table
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity likes table
CREATE TABLE activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Trip likes table
CREATE TABLE trip_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Trip views table (for analytics)
CREATE TABLE trip_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (for posts and trips)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (post_id IS NOT NULL OR trip_id IS NOT NULL)
);

-- Indexes for social features
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at);

CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(type);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at);

CREATE INDEX idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX idx_activity_likes_user ON activity_likes(user_id);

CREATE INDEX idx_trip_likes_trip ON trip_likes(trip_id);
CREATE INDEX idx_trip_likes_user ON trip_likes(user_id);

CREATE INDEX idx_trip_views_trip ON trip_views(trip_id);
CREATE INDEX idx_trip_views_user ON trip_views(user_id);
CREATE INDEX idx_trip_views_created_at ON trip_views(created_at);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_trip ON comments(trip_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Row Level Security Policies for Social Features

-- User follows policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON user_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Activity feed policies
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity from people they follow or public activities" ON activity_feed
    FOR SELECT USING (
        auth.uid() = user_id OR
        user_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own activities" ON activity_feed
    FOR ALL USING (auth.uid() = user_id);

-- Activity likes policies
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all activity likes" ON activity_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own activity likes" ON activity_likes
    FOR ALL USING (auth.uid() = user_id);

-- Trip likes policies
ALTER TABLE trip_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all trip likes" ON trip_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own trip likes" ON trip_likes
    FOR ALL USING (auth.uid() = user_id);

-- Trip views policies
ALTER TABLE trip_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trip views for their own trips" ON trip_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips WHERE trips.id = trip_views.trip_id AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create trip views" ON trip_views
    FOR INSERT WITH CHECK (true);

-- Comments policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible content" ON comments
    FOR SELECT USING (
        -- Comments on own content
        auth.uid() = user_id OR
        -- Comments on posts they can access
        (post_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = comments.post_id
            AND (posts.user_id = auth.uid() OR posts.is_public = true)
        )) OR
        -- Comments on trips they can access
        (trip_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = comments.trip_id
            AND (trips.user_id = auth.uid() OR trips.is_public = true)
        ))
    );

CREATE POLICY "Users can manage their own comments" ON comments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can comment on accessible content" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            -- Can comment on posts they can access
            (post_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM posts
                WHERE posts.id = comments.post_id
                AND (posts.user_id = auth.uid() OR posts.is_public = true)
            )) OR
            -- Can comment on trips they can access
            (trip_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM trips
                WHERE trips.id = comments.trip_id
                AND (trips.user_id = auth.uid() OR trips.is_public = true)
            ))
        )
    );

-- Trip plan table (for trip planning)
CREATE TABLE trip_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip expenses table (for budget tracking)
CREATE TABLE trip_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    date DATE NOT NULL,
    location VARCHAR(255),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip collaborators table (for shared trips)
CREATE TABLE trip_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- owner, editor, viewer
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(trip_id, user_id)
);

-- Indexes for new tables
CREATE INDEX idx_trip_plan_trip ON trip_plan(trip_id);
CREATE INDEX idx_trip_plan_day ON trip_plan(day);
CREATE INDEX idx_trip_plan_time ON trip_plan(time);

CREATE INDEX idx_trip_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX idx_trip_expenses_date ON trip_expenses(date);
CREATE INDEX idx_trip_expenses_category ON trip_expenses(category);

CREATE INDEX idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user ON trip_collaborators(user_id);

-- RLS Policies for new tables

-- Trip plan policies
ALTER TABLE trip_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan for accessible trips" ON trip_plan
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_plan.trip_id
            AND (trips.user_id = auth.uid() OR trips.is_public = true)
        ) OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trip_plan.trip_id
            AND trip_collaborators.user_id = auth.uid()
            AND trip_collaborators.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Users can manage plan for their trips" ON trip_plan
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_plan.trip_id
            AND trips.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trip_plan.trip_id
            AND trip_collaborators.user_id = auth.uid()
            AND trip_collaborators.role IN ('owner', 'editor')
            AND trip_collaborators.accepted_at IS NOT NULL
        )
    );

-- Trip expenses policies
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for accessible trips" ON trip_expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trip_expenses.trip_id
            AND trip_collaborators.user_id = auth.uid()
            AND trip_collaborators.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Users can manage expenses for their trips" ON trip_expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trip_expenses.trip_id
            AND trip_collaborators.user_id = auth.uid()
            AND trip_collaborators.role IN ('owner', 'editor')
            AND trip_collaborators.accepted_at IS NOT NULL
        )
    );

-- Trip collaborators policies
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators for accessible trips" ON trip_collaborators
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_collaborators.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip owners can manage collaborators" ON trip_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_collaborators.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can accept their own invitations" ON trip_collaborators
    FOR UPDATE USING (
        user_id = auth.uid() AND accepted_at IS NULL
    );

-- CMS Posts table (for content management system)
CREATE TABLE cms_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content JSONB, -- Rich content from Novel editor
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, scheduled
    visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public, private, password
    password VARCHAR(255),
    featured_image TEXT,
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Categories table
CREATE TABLE cms_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    parent_id UUID REFERENCES cms_categories(id) ON DELETE SET NULL,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Comments table
CREATE TABLE cms_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES cms_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES cms_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'approved', -- pending, approved, rejected, spam
    author_name VARCHAR(255), -- For guest comments
    author_email VARCHAR(255), -- For guest comments
    author_ip INET,
    user_agent TEXT,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Tags table
CREATE TABLE cms_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'document')),
    title VARCHAR(255),
    caption TEXT,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for videos in seconds
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media collections/albums table
CREATE TABLE media_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for media files in collections
CREATE TABLE media_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES media_collections(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, media_file_id)
);

-- Indexes for media files
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_trip_id ON media_files(trip_id);
CREATE INDEX idx_media_files_type ON media_files(type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);

CREATE INDEX idx_media_collections_user_id ON media_collections(user_id);
CREATE INDEX idx_media_collections_trip_id ON media_collections(trip_id);

CREATE INDEX idx_media_collection_items_collection_id ON media_collection_items(collection_id);
CREATE INDEX idx_media_collection_items_media_file_id ON media_collection_items(media_file_id);
CREATE INDEX idx_media_collection_items_sort_order ON media_collection_items(sort_order);

-- Legacy media indexes (keeping for backward compatibility)
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_trip_id ON media(trip_id);
CREATE INDEX idx_media_post_id ON media(post_id);

CREATE INDEX idx_share_link_views_share_link_id ON share_link_views(share_link_id);
CREATE INDEX idx_share_link_views_viewed_at ON share_link_views(viewed_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_views ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Share links policies
CREATE POLICY "Users can view own share links" ON share_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own share links" ON share_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own share links" ON share_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own share links" ON share_links FOR DELETE USING (auth.uid() = user_id);

-- Media policies (legacy)
CREATE POLICY "Users can view own media" ON media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own media" ON media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media" ON media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON media FOR DELETE USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can view own media files" ON media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own media files" ON media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media files" ON media_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media files" ON media_files FOR DELETE USING (auth.uid() = user_id);

-- Media collections policies
CREATE POLICY "Users can view own media collections" ON media_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own media collections" ON media_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media collections" ON media_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media collections" ON media_collections FOR DELETE USING (auth.uid() = user_id);

-- Media collection items policies
CREATE POLICY "Users can view own collection items" ON media_collection_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM media_collections mc
    WHERE mc.id = collection_id AND mc.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create own collection items" ON media_collection_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM media_collections mc
    WHERE mc.id = collection_id AND mc.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own collection items" ON media_collection_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM media_collections mc
    WHERE mc.id = collection_id AND mc.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own collection items" ON media_collection_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM media_collections mc
    WHERE mc.id = collection_id AND mc.user_id = auth.uid()
  )
);

-- Share link views policies (only owners can see analytics)
CREATE POLICY "Users can view own share link analytics" ON share_link_views FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM share_links 
    WHERE share_links.id = share_link_views.share_link_id 
    AND share_links.user_id = auth.uid()
));

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON share_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Locations table (for location detail pages)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    content JSONB, -- Rich content from CMS
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    featured_image TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    timezone VARCHAR(50),
    currency VARCHAR(10),
    language VARCHAR(50),
    best_time_to_visit TEXT,
    budget_info TEXT,
    rating DECIMAL(3, 2),
    visit_count INTEGER DEFAULT 0,
    last_visited TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location categories table
CREATE TABLE location_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES location_categories(id) ON DELETE SET NULL,
    location_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location posts table (CMS posts about locations)
CREATE TABLE location_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content JSONB,
    featured_image TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, slug)
);

-- Location media table
CREATE TABLE location_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    caption TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location tips table
CREATE TABLE location_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- transportation, accommodation, food, activities, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_featured BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending topics table (for live feed)
CREATE TABLE trending_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    hashtag VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    post_count INTEGER DEFAULT 0,
    trend_score DECIMAL(10, 2) DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location categories junction table
CREATE TABLE location_category_assignments (
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES location_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (location_id, category_id)
);

-- Indexes for new tables
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_country ON locations(country);
CREATE INDEX idx_locations_region ON locations(region);
CREATE INDEX idx_locations_featured ON locations(is_featured);
CREATE INDEX idx_locations_published ON locations(is_published);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

CREATE INDEX idx_location_categories_slug ON location_categories(slug);
CREATE INDEX idx_location_categories_parent ON location_categories(parent_id);

CREATE INDEX idx_location_posts_location ON location_posts(location_id);
CREATE INDEX idx_location_posts_author ON location_posts(author_id);
CREATE INDEX idx_location_posts_status ON location_posts(status);
CREATE INDEX idx_location_posts_published ON location_posts(published_at);
CREATE INDEX idx_location_posts_slug ON location_posts(location_id, slug);

CREATE INDEX idx_location_media_location ON location_media(location_id);
CREATE INDEX idx_location_media_type ON location_media(type);
CREATE INDEX idx_location_media_featured ON location_media(is_featured);

CREATE INDEX idx_location_tips_location ON location_tips(location_id);
CREATE INDEX idx_location_tips_category ON location_tips(category);
CREATE INDEX idx_location_tips_featured ON location_tips(is_featured);

CREATE INDEX idx_trending_topics_trending ON trending_topics(is_trending);
CREATE INDEX idx_trending_topics_score ON trending_topics(trend_score);

-- RLS Policies for new tables

-- Locations policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published locations" ON locations
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Location categories policies
ALTER TABLE location_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location categories" ON location_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage location categories" ON location_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Location posts policies
ALTER TABLE location_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published location posts" ON location_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their location posts" ON location_posts
    FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all location posts" ON location_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Location media policies
ALTER TABLE location_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location media" ON location_media
    FOR SELECT USING (true);

CREATE POLICY "Users can upload location media" ON location_media
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can manage their location media" ON location_media
    FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all location media" ON location_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Location tips policies
ALTER TABLE location_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location tips" ON location_tips
    FOR SELECT USING (true);

CREATE POLICY "Users can create location tips" ON location_tips
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can manage their location tips" ON location_tips
    FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all location tips" ON location_tips
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Trending topics policies
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending topics" ON trending_topics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trending topics" ON trending_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Location category assignments policies
ALTER TABLE location_category_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location category assignments" ON location_category_assignments
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage location category assignments" ON location_category_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

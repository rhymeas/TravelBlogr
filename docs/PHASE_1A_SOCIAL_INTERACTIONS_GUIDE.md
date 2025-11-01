# Phase 1A: Social Interactions Backend Implementation Guide

**Goal:** Wire up existing like/bookmark/comment UI to real backend APIs  
**Duration:** 1 week  
**Status:** Ready to implement

---

## 📋 Overview

Currently, the `FeedItem` and `FeedPost` components have like/bookmark/comment buttons, but they use mock data and don't persist to the database. This phase will:

1. Create backend API routes for likes, bookmarks, and follows
2. Add database tables and triggers for cached counts
3. Update frontend components to use real APIs
4. Add real-time subscriptions for live updates

---

## 🗄️ Database Changes

### Step 1: Create Tables

```sql
-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_created ON post_likes(created_at DESC);

-- Post bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_bookmarks_user ON post_bookmarks(user_id);
CREATE INDEX idx_post_bookmarks_post ON post_bookmarks(post_id);
CREATE INDEX idx_post_bookmarks_created ON post_bookmarks(created_at DESC);

-- Add cached counts to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0;

-- Add cached counts to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
```

### Step 2: Create Triggers for Cached Counts

```sql
-- Trigger to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Trigger to update post bookmark count
CREATE OR REPLACE FUNCTION update_post_bookmark_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_bookmarks_count_trigger
  AFTER INSERT OR DELETE ON post_bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_post_bookmark_count();

-- Trigger to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_follows_count_trigger
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
```

### Step 3: Enable Row Level Security (RLS)

```sql
-- Enable RLS on new tables
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can view all likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark posts"
  ON post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unbookmark their own bookmarks"
  ON post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔌 Backend API Routes

### 1. Like Endpoint: `/api/posts/[postId]/like/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', params.postId)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', params.postId)

      if (deleteError) {
        console.error('Error unliking post:', deleteError)
        return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 })
      }

      // Invalidate caches
      await deleteCached(CacheKeys.post(params.postId))
      revalidatePath('/live-feed')

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          user_id: user.id,
          post_id: params.postId
        })

      if (insertError) {
        console.error('Error liking post:', insertError)
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
      }

      // Invalidate caches
      await deleteCached(CacheKeys.post(params.postId))
      revalidatePath('/live-feed')

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error in like endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check if user has liked a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ liked: false })
    }

    const { data: like } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', params.postId)
      .single()

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json({ liked: false })
  }
}
```

### 2. Bookmark Endpoint: `/api/posts/[postId]/bookmark/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('post_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', params.postId)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', params.postId)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: false })
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('post_bookmarks')
        .insert({
          user_id: user.id,
          post_id: params.postId
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to bookmark post' }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error('Error in bookmark endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Follow Endpoint: `/api/users/[username]/follow/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get target user ID from username
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', params.username)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't follow yourself
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUser.id)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUser.id)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
      }

      return NextResponse.json({ following: false })
    } else {
      // Follow
      const { error: insertError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUser.id
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to follow' }, { status: 500 })
      }

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error('Error in follow endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 🎨 Frontend Component Updates

### Update `FeedItem.tsx`

Replace the mock `handleLike` function with real API call:

```typescript
const handleLike = async () => {
  try {
    const response = await fetch(`/api/posts/${activity.id}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to like post')
    }

    const { liked } = await response.json()
    setLiked(liked)
    setLikeCount((prev: number) => liked ? prev + 1 : prev - 1)
  } catch (error) {
    console.error('Error liking post:', error)
    toast.error('Failed to like post')
  }
}
```

---

## ✅ Testing Checklist

- [ ] Database tables created successfully
- [ ] Triggers update cached counts correctly
- [ ] RLS policies allow proper access
- [ ] Like endpoint toggles like status
- [ ] Bookmark endpoint toggles bookmark status
- [ ] Follow endpoint toggles follow status
- [ ] Frontend components call APIs correctly
- [ ] Real-time updates work across users
- [ ] Cache invalidation works properly

---

**Next:** Phase 1B - Content Creation Flow


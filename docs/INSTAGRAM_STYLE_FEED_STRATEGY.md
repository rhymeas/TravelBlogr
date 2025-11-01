# Instagram-Style Travel Feed Enhancement Strategy

**Created:** 2025-01-31  
**Status:** Planning Phase  
**Goal:** Transform TravelBlogr's live feed into a comprehensive Instagram-style travel social platform

---

## 📊 Current State Assessment

### ✅ Existing Infrastructure (70% Complete)

**Database Tables:**
- ✅ `activity_feed` - Main feed content
- ✅ `user_follows` - Social graph (follower/following)
- ✅ `profiles` - User data (avatar, bio, username)
- ✅ `comments` - Comment system with threading
- ✅ `posts` - Post content (linked to trips)
- ✅ `locations` - Location database for tagging

**Components:**
- ✅ `LiveFeed` - Real-time feed with Supabase subscriptions
- ✅ `FeedItem` - Activity card with like/comment/share UI
- ✅ `FeedPost` - Instagram-style post card
- ✅ `AuthenticatedLiveFeed` - Following/Discover tabs
- ✅ `PostCommentsModal` - Comment thread viewer
- ✅ `ActivityLikeButton` - Like button component

**Features:**
- ✅ Real-time updates (Supabase subscriptions)
- ✅ Feed types: All, Following, Trending, Live
- ✅ Location tagging
- ✅ User verification badges
- ✅ Image carousels
- ✅ Comment threading
- ✅ Follow system (database ready)

### ⚠️ Missing Features (30% to Complete)

**Backend APIs:**
- ❌ `/api/posts/[postId]/like` - Like endpoint
- ❌ `/api/posts/[postId]/bookmark` - Bookmark endpoint
- ❌ `/api/users/[username]/follow` - Follow/unfollow endpoint
- ❌ `/api/feed/algorithm` - Engagement-weighted feed

**UI Components:**
- ❌ Post creation modal (image upload + caption)
- ❌ User profile page (`/users/[username]`)
- ❌ Stories feature (24-hour content)
- ❌ Search/Explore page
- ❌ Direct messaging

**Features:**
- ❌ Content creation flow
- ❌ Feed algorithm (currently chronological only)
- ❌ Hashtag system
- ❌ Advanced search
- ❌ Instagram import tool

---

## 🎯 Strategic Decision: Native Platform First

### Why Build Native > Instagram Integration

**Instagram API Limitations:**
- Read-only access (can't post from your app)
- Rate limits: 200 requests/hour per user
- Only public accounts accessible
- No control over content moderation
- Risk of API deprecation (happened before)

**Native Platform Advantages:**
- Full control over features and UX
- Travel-specific functionality (trip planning integration)
- Data ownership and monetization
- Custom engagement features
- No API rate limits

**Hybrid Approach (Best of Both Worlds):**
1. Build native platform for core features
2. Add Instagram import for one-time content migration
3. Allow cross-posting to Instagram (share from your app)

---

## 🚀 Implementation Roadmap

### **Phase 1: Core Social Features (Weeks 1-4)**

#### 1A: Complete Social Interactions Backend (Week 1)
**Goal:** Wire up existing UI to real backend APIs

**Tasks:**
- Create `/api/posts/[postId]/like` endpoint
  - Insert/delete from `post_likes` table
  - Update cached `like_count` on posts
  - Invalidate Upstash cache
  - Return updated like status
  
- Create `/api/posts/[postId]/bookmark` endpoint
  - Insert/delete from `post_bookmarks` table
  - Return updated bookmark status
  
- Create `/api/users/[username]/follow` endpoint
  - Insert/delete from `user_follows` table
  - Update cached `follower_count` and `following_count`
  - Create activity feed entry
  
- Update `FeedItem` and `FeedPost` components
  - Replace mock data with real API calls
  - Add real-time subscriptions for likes
  - Show loading states during API calls

**Database Changes:**
```sql
-- Add cached counts to posts table
ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN bookmark_count INTEGER DEFAULT 0;

-- Create triggers to maintain counts
CREATE FUNCTION update_post_like_count() RETURNS TRIGGER AS $$
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
```

**Success Criteria:**
- ✅ Like button toggles and persists to database
- ✅ Like count updates in real-time across all users
- ✅ Bookmark button saves posts to user's saved collection
- ✅ Follow button updates follower counts

---

#### 1B: Content Creation Flow (Week 2)
**Goal:** Build Instagram-style post creation

**Tasks:**
- Create `CreatePostModal` component
  - Image upload (reuse existing `ImageUpload` component)
  - Multi-image support (carousel)
  - Caption editor with hashtag autocomplete
  - Location autocomplete (reuse existing location search)
  - Privacy settings (public/followers/private)
  
- Create `/api/posts/create` endpoint
  - Upload images to Supabase Storage (`feed-posts` bucket)
  - Extract hashtags from caption
  - Create post in `posts` table
  - Create activity feed entry
  - Invalidate feed caches
  
- Add "Create Post" button to feed header
  - Floating action button (mobile)
  - Header button (desktop)
  - Keyboard shortcut (Cmd/Ctrl + N)

**Image Optimization:**
- Resize to max 1080px width (Instagram standard)
- Generate thumbnails (320px, 640px)
- Convert to WebP format
- Store original + variants in Supabase Storage

**Success Criteria:**
- ✅ Users can upload 1-10 images per post
- ✅ Caption supports hashtags and @mentions
- ✅ Location tagging integrates with existing locations database
- ✅ Posts appear in feed immediately after creation

---

#### 1C: Enhanced Feed Algorithm (Week 3)
**Goal:** Upgrade from chronological to engagement-weighted feed

**Current:** Simple chronological ordering  
**Target:** Personalized feed based on engagement and user preferences

**Algorithm Components:**

1. **Recency Score** (40% weight)
   ```typescript
   const recencyScore = Math.exp(-hoursSincePost / 24)
   // Exponential decay: 100% at 0h, 37% at 24h, 14% at 48h
   ```

2. **Engagement Score** (30% weight)
   ```typescript
   const engagementScore = (
     likes * 1.0 +
     comments * 2.0 +
     bookmarks * 3.0 +
     shares * 4.0
   ) / (hoursSincePost + 1)
   ```

3. **User Affinity Score** (20% weight)
   ```typescript
   const affinityScore = (
     isFollowing ? 1.0 : 0.0 +
     mutualFollowers * 0.1 +
     previousInteractions * 0.2
   )
   ```

4. **Content Type Preference** (10% weight)
   ```typescript
   const contentScore = userPreferences.preferredCategories.includes(post.category) ? 1.0 : 0.5
   ```

**Final Score:**
```typescript
const finalScore = (
  recencyScore * 0.4 +
  engagementScore * 0.3 +
  affinityScore * 0.2 +
  contentScore * 0.1
)
```

**Implementation:**
- Create `/api/feed/algorithm` endpoint
- Cache scores in Upstash Redis (TTL: 5 minutes)
- Recompute scores on new engagement
- Mix in discovery content (10% of feed)

**Success Criteria:**
- ✅ Feed shows most relevant content first
- ✅ High-engagement posts surface faster
- ✅ Following feed prioritizes followed users
- ✅ Discover feed shows trending content

---

#### 1D: User Profiles & Following (Week 4)
**Goal:** Create comprehensive user profile pages

**Tasks:**
- Create `/users/[username]/page.tsx`
  - User header (avatar, bio, follower/following counts)
  - Posts grid (3 columns, Instagram-style)
  - Trip highlights (carousel of user's trips)
  - Follow/Unfollow button
  - Edit profile button (own profile only)
  
- Create `/api/users/[username]/posts` endpoint
  - Fetch user's posts with pagination
  - Include engagement metrics
  - Filter by privacy settings
  
- Add mutual followers display
  - "Followed by @user1, @user2, and 5 others"
  - Click to see full follower list

**Success Criteria:**
- ✅ User profiles show all public posts
- ✅ Follow/unfollow works with real-time updates
- ✅ Follower/following counts update immediately
- ✅ Mutual followers displayed correctly

---

### **Phase 2: Advanced Features (Weeks 5-8)**

#### 2A: Stories Feature (Week 5)
- 24-hour expiring content
- Story viewer modal with swipe navigation
- Story rings on user avatars
- Auto-delete via cron job

#### 2B: Search & Discovery (Week 6)
- Search page with tabs (Users, Posts, Locations, Hashtags)
- Autocomplete for all search types
- Trending hashtags
- Suggested users to follow

#### 2C: Travel-Specific Features (Weeks 7-8)
- "Add to Trip" button on location-tagged posts
- Travel collections (saved posts by destination)
- Trip timeline in user profiles
- Budget/itinerary sharing

---

### **Phase 3: Instagram Import (Week 9)**

**Goal:** Allow users to import their Instagram travel posts

**Implementation:**
1. OAuth with Instagram Basic Display API
2. Fetch user's media (filter by #travel hashtags)
3. Download images and upload to Supabase Storage
4. Create posts in `activity_feed` table
5. Show import progress modal

**Limitations:**
- One-time import only (not continuous sync)
- Public accounts only
- Rate limited to 200 requests/hour
- No stories or reels

---

## 📦 Technology Stack

### Existing (Keep)
- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Caching:** Upstash Redis
- **Styling:** Tailwind CSS
- **Image CDN:** Supabase Storage (or migrate to ImageKit)

### New Additions
- **Image Processing:** Sharp (already used)
- **Hashtag Parsing:** Custom regex + database
- **Feed Algorithm:** Custom scoring + Redis caching
- **Instagram API:** Instagram Basic Display API (Phase 3)

---

## 🎨 UI/UX Principles

### Design Language
- **Bubbly, roundish UI** (user preference)
- **Light-only theme** (no dark mode)
- **Minimal colors** (sleek gray/black/light gray)
- **Instagram-inspired** but travel-focused

### Key Interactions
- **Double-tap to like** (mobile)
- **Swipe for carousel** (mobile)
- **Infinite scroll** (feed)
- **Pull to refresh** (mobile)
- **Keyboard shortcuts** (desktop)

---

## 📊 Success Metrics

### Phase 1 Goals
- ✅ 100% of social interactions functional
- ✅ Users can create posts with images
- ✅ Feed algorithm improves engagement by 30%
- ✅ User profiles fully functional

### Phase 2 Goals
- ✅ Stories feature adopted by 20% of users
- ✅ Search used by 50% of users weekly
- ✅ Travel collections created by 30% of users

### Phase 3 Goals
- ✅ 40% of users import Instagram content
- ✅ Average 50 posts imported per user

---

## 🚧 Implementation Notes

### Reuse Existing Components
- ✅ `ImageUpload` - For post creation
- ✅ Location autocomplete - For location tagging
- ✅ `LocationShareActions` - For sharing posts
- ✅ Trip planning system - For "Add to Trip" feature

### Database Optimization
- ✅ Add cached counts (like_count, comment_count)
- ✅ Create indexes on frequently queried fields
- ✅ Use Upstash Redis for feed algorithm scores
- ✅ Implement pagination for all lists

### Performance Considerations
- ✅ Lazy load images (already implemented)
- ✅ Virtual scrolling for long feeds
- ✅ Debounce search queries
- ✅ Cache feed results (5-minute TTL)

---

## 📚 Resources

### Open Source References
- [Pixelfed](https://github.com/pixelfed/pixelfed) - Instagram alternative
- [Mastodon](https://github.com/mastodon/mastodon) - Social platform architecture
- [Stream](https://github.com/GetStream/stream-js) - Activity feeds SDK

### Documentation
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

**Next Steps:** Start with Phase 1A (Social Interactions Backend) - estimated 1 week


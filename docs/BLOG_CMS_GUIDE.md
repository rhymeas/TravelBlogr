# TravelBlogr Blog/CMS System - Complete Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Getting Started](#getting-started)
5. [Database Schema](#database-schema)
6. [API Routes](#api-routes)
7. [Components](#components)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The TravelBlogr Blog/CMS system is a comprehensive content management solution built with:

- **Next.js 14** - App Router with Server Components
- **Supabase** - PostgreSQL database with Row Level Security
- **Novel Editor** - Rich text editing (Tiptap-based)
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Key Features

✅ **Content Management**
- Rich text blog post editor (Novel/Tiptap)
- Media library with Supabase Storage
- Draft/publish workflow
- SEO metadata management

✅ **Monetization**
- Affiliate link integration (Booking.com, sleek, GetYourGuide, Viator)
- Click tracking and analytics
- Revenue dashboard (70/30 creator/platform split)
- Conversion tracking

✅ **Community Features**
- Nested comment system
- Social sharing (Twitter, Facebook, LinkedIn, WhatsApp)
- User profiles
- Like/reaction system

✅ **SEO & Performance**
- Dynamic sitemap generation
- RSS feed
- Open Graph tags
- Structured data (JSON-LD)
- Image optimization

---

## 🏗️ Architecture

### Directory Structure

```
apps/web/
├── app/
│   ├── blog/                      # Public blog pages
│   │   ├── page.tsx               # Blog homepage
│   │   ├── posts/
│   │   │   ├── page.tsx           # Posts list
│   │   │   └── [slug]/page.tsx    # Individual post
│   │   ├── layout.tsx             # Blog layout with nav/footer
│   │   ├── sitemap.ts             # Dynamic sitemap
│   │   └── feed.xml/route.ts      # RSS feed
│   ├── (dashboard)/
│   │   ├── blog-cms/              # CMS dashboard
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   └── posts/
│   │   │       ├── new/page.tsx   # Create post
│   │   │       └── [id]/edit/page.tsx  # Edit post
│   │   └── earnings/page.tsx      # Revenue dashboard
│   └── api/
│       ├── blog/                  # Blog API routes
│       │   ├── posts/route.ts
│       │   ├── posts/[id]/route.ts
│       │   ├── posts/[id]/comments/route.ts
│       │   ├── destinations/route.ts
│       │   ├── testimonials/route.ts
│       │   └── stats/route.ts
│       ├── affiliate/
│       │   └── track-click/route.ts
│       └── newsletter/
│           └── subscribe/route.ts
├── components/
│   └── blog/
│       ├── BlogLayout.tsx
│       ├── HeroSection.tsx
│       ├── DestinationCard.tsx
│       ├── DestinationsCarousel.tsx
│       ├── TestimonialCard.tsx
│       ├── NewsletterSubscription.tsx
│       ├── BlogCommentSection.tsx
│       ├── SocialShare.tsx
│       ├── MediaLibrary.tsx
│       ├── EditableHeroSection.tsx
│       └── ContentBlockManager.tsx
├── hooks/
│   └── useBlogData.ts             # SWR hooks for data fetching
└── lib/
    └── utils/
        └── affiliateLinks.ts      # Affiliate link generation
```

### Database Schema

```sql
-- Blog Posts
cms_posts (
  id, title, slug, content, excerpt, status, visibility,
  featured_image, tags, category, author_id, published_at,
  view_count, like_count, comment_count, seo_title, seo_description
)

-- Comments
cms_comments (
  id, post_id, user_id, parent_id, content, status,
  like_count, created_at, updated_at
)

-- Destinations
blog_destinations (
  id, name, slug, country, description, image_url,
  is_featured, is_trending, stats
)

-- Testimonials
blog_testimonials (
  id, content, author_name, author_role, author_location,
  author_avatar, rating, trip_reference, is_featured, status
)

-- Newsletter
newsletter_subscriptions (
  id, email, status, source, subscribed_at
)

-- Affiliate Tracking
affiliate_clicks (
  id, user_id, post_id, trip_id, provider, location_name,
  context, click_url, created_at
)

affiliate_conversions (
  id, click_id, user_id, post_id, provider, commission_amount,
  status, confirmed_at
)

creator_earnings (
  id, user_id, conversion_id, total_commission, creator_share,
  platform_share, status, paid_at
)
```

---

## 🚀 Getting Started

### 1. Database Setup

Run the migrations in order:

```bash
# Blog tables
supabase migration up 20250118_create_blog_tables.sql

# Affiliate tracking
supabase migration up 20250118_create_affiliate_tracking.sql
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://travelblogr.com

# Affiliate IDs (optional)
NEXT_PUBLIC_BOOKING_AFFILIATE_ID=your_booking_id
NEXT_PUBLIC_sleek_AFFILIATE_ID=your_sleek_id
NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID=your_getyourguide_id
NEXT_PUBLIC_VIATOR_PARTNER_ID=your_viator_id
```

### 3. Seed Data (Optional)

Insert sample data for testing:

```sql
-- Sample blog stats
INSERT INTO blog_stats (stat_label, stat_value, icon, color, display_order)
VALUES
  ('Trips Planned', '10,000+', 'map', 'blue', 1),
  ('Destinations', '500+', 'globe', 'green', 2),
  ('Happy Travelers', '50,000+', 'users', 'purple', 3);

-- Sample destinations
INSERT INTO blog_destinations (name, slug, country, description, image_url, is_featured)
VALUES
  ('Paris', 'paris', 'France', 'The City of Light', 'https://...', true),
  ('Tokyo', 'tokyo', 'Japan', 'Modern meets traditional', 'https://...', true);
```

### 4. Start Development

```bash
npm run dev
```

Visit:
- Blog: http://localhost:3000/blog
- CMS Dashboard: http://localhost:3000/blog-cms
- Earnings: http://localhost:3000/earnings

---

## 📝 Usage Guide

### Creating a Blog Post

1. Navigate to `/blog-cms`
2. Click "New Post" button
3. Enter title (slug auto-generates)
4. Write content using Novel editor
5. Add featured image, tags, category
6. Set SEO metadata (optional)
7. Save as draft or publish immediately

### Managing Media

1. Go to `/blog-cms` → Media Library tab
2. Upload images (drag & drop or click)
3. Copy image URLs for use in posts
4. Delete unused images

### Tracking Earnings

1. Visit `/earnings` dashboard
2. View total earnings, available balance, pending
3. See click and conversion metrics
4. Request payout when balance > minimum

### Moderating Comments

1. Go to `/blog-cms` → Posts tab
2. Click on a post
3. View and manage comments
4. Approve, reject, or delete as needed

---

## 🔧 API Reference

### Blog Posts

```typescript
// GET /api/blog/posts
// Query params: status, category, tag, limit, offset
const response = await fetch('/api/blog/posts?status=published&limit=10')

// POST /api/blog/posts
const response = await fetch('/api/blog/posts', {
  method: 'POST',
  body: JSON.stringify({
    title: 'My Post',
    content: {...},
    status: 'published'
  })
})

// GET /api/blog/posts/[id]
const response = await fetch('/api/blog/posts/post-slug')

// PATCH /api/blog/posts/[id]
const response = await fetch('/api/blog/posts/123', {
  method: 'PATCH',
  body: JSON.stringify({ title: 'Updated Title' })
})
```

### Comments

```typescript
// GET /api/blog/posts/[id]/comments
const response = await fetch('/api/blog/posts/123/comments')

// POST /api/blog/posts/[id]/comments
const response = await fetch('/api/blog/posts/123/comments', {
  method: 'POST',
  body: JSON.stringify({
    content: 'Great post!',
    parentId: null // or comment ID for replies
  })
})
```

### Affiliate Tracking

```typescript
// Track click
import { trackAffiliateClick } from '@/lib/utils/affiliateLinks'

await trackAffiliateClick(
  'booking',      // provider
  'Paris',        // location
  'blog_post',    // context
  'post-123',     // postId
  null            // tripId
)
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Run `npm run build` locally - no errors
- [ ] Run `npm run type-check` - no TypeScript errors
- [ ] Run `npm run lint` - no ESLint errors
- [ ] Test critical flows (create post, comment, share)
- [ ] All environment variables set in Railway
- [ ] Database migrations applied
- [ ] Test affiliate links work

### Deploy to Railway

1. Push to GitHub:
   ```bash
   git push origin feature/blog-cms-ui
   ```

2. Create PR and merge to main

3. Railway auto-deploys from main branch

4. Verify deployment:
   - Check build logs
   - Test blog homepage
   - Test creating a post
   - Test comments
   - Test affiliate links

### Post-Deployment

- [ ] Submit sitemap to Google Search Console
- [ ] Test RSS feed: `/blog/feed.xml`
- [ ] Verify Open Graph tags (use debugger)
- [ ] Monitor error logs for 24 hours
- [ ] Test on mobile devices

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Missing Supabase environment variables"
**Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Railway, then trigger rebuild

**Issue**: Comments not showing
**Fix**: Check RLS policies on `cms_comments` table, ensure status='approved'

**Issue**: Affiliate links not tracking
**Fix**: Check `/api/affiliate/track-click` endpoint, verify database function exists

**Issue**: Images not uploading
**Fix**: Check Supabase Storage bucket permissions, verify `images` bucket exists

---

## 📚 Additional Resources

- [Novel Editor Docs](https://github.com/steven-tey/novel)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎉 Summary

You now have a fully-featured blog/CMS system with:

✅ Rich text editing
✅ Media management
✅ Affiliate monetization
✅ Community features
✅ SEO optimization
✅ Revenue tracking

**Happy blogging!** 🚀


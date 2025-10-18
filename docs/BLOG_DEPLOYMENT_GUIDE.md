# TravelBlogr Blog/CMS - Deployment Guide

## 🚀 Quick Deployment Checklist

This guide will walk you through deploying the TravelBlogr Blog/CMS system to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] All ESLint errors resolved
- [x] All pre-commit checks passing
- [x] Branch pushed to GitHub: `feature/blog-cms-ui`

### ✅ Database
- [ ] Migrations reviewed and tested locally
- [ ] Seed data prepared
- [ ] RLS policies verified

### ✅ Environment Variables
- [ ] All required env vars documented
- [ ] Production values ready

---

## 🗄️ Step 1: Database Setup

### 1.1 Apply Migrations

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project: **TravelBlogr**
3. Navigate to **SQL Editor**
4. Run migrations in order:

```sql
-- Migration 1: Blog Tables
-- Copy content from: supabase/migrations/20250118_create_blog_tables.sql
-- Paste and execute

-- Migration 2: Affiliate Tracking
-- Copy content from: supabase/migrations/20250118_create_affiliate_tracking.sql
-- Paste and execute
```

**Option B: Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

### 1.2 Insert Seed Data

```sql
-- Copy content from: supabase/seed_blog_data.sql
-- Paste and execute in SQL Editor
```

This will create:
- ✅ 4 blog stats
- ✅ 6 featured destinations
- ✅ 6 testimonials
- ✅ 3 test newsletter subscriptions

### 1.3 Verify Tables

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'cms_posts',
  'cms_comments',
  'blog_destinations',
  'blog_testimonials',
  'blog_stats',
  'newsletter_subscriptions',
  'affiliate_clicks',
  'affiliate_conversions',
  'creator_earnings',
  'content_blocks'
)
ORDER BY table_name;
```

Expected result: 10 tables

---

## 🔐 Step 2: Environment Variables

### 2.1 Required Variables

Add these to Railway environment variables:

```env
# Supabase (Already set)
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Site URL (Update if using custom domain)
NEXT_PUBLIC_SITE_URL=https://travelblogr-production.up.railway.app

# Affiliate IDs (Optional - add when you have them)
NEXT_PUBLIC_BOOKING_AFFILIATE_ID=your_booking_id
NEXT_PUBLIC_AIRBNB_AFFILIATE_ID=your_airbnb_id
NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID=your_getyourguide_id
NEXT_PUBLIC_VIATOR_PARTNER_ID=your_viator_id

# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2.2 Verify in Railway

1. Go to Railway dashboard
2. Select **TravelBlogr** project
3. Click **Variables** tab
4. Verify all variables are set
5. **Important**: After adding/changing `NEXT_PUBLIC_*` variables, you MUST trigger a rebuild!

---

## 🔀 Step 3: Merge to Main

### 3.1 Create Pull Request

1. Go to: https://github.com/rhymeas/TravelBlogr/pull/new/feature/blog-cms-ui
2. Title: `feat: Add Blog/CMS System - Complete Implementation`
3. Description:

```markdown
## 🎉 Blog/CMS System - Complete Implementation

This PR adds a comprehensive blog/CMS system to TravelBlogr with:

### ✅ Features
- Rich text blog editor (Novel/Tiptap)
- Media library with Supabase Storage
- Affiliate link integration & tracking
- Community features (comments, social sharing)
- SEO optimization (sitemap, RSS, metadata)
- Revenue dashboard (70/30 split)

### 📦 Deliverables
- 15 React components
- 8 API routes
- 8 database tables
- 9 pages (6 public + 3 dashboard)
- 2 SQL migrations
- 3 comprehensive guides

### 🔍 Testing
- ✅ All TypeScript errors resolved
- ✅ All ESLint errors resolved
- ✅ All pre-commit checks passing
- ✅ Tested locally

### 📚 Documentation
- [Complete Usage Guide](docs/BLOG_CMS_GUIDE.md)
- [Implementation Summary](docs/BLOG_CMS_IMPLEMENTATION_SUMMARY.md)
- [Deployment Guide](docs/BLOG_DEPLOYMENT_GUIDE.md)

### 🚀 Deployment Steps
1. Apply database migrations (see deployment guide)
2. Insert seed data
3. Merge this PR
4. Railway auto-deploys
5. Verify deployment

Ready for production! 🎊
```

### 3.2 Review and Merge

1. Review the changes
2. Approve the PR
3. Click **Merge pull request**
4. Select **Squash and merge** or **Create a merge commit**
5. Confirm merge

---

## 🚂 Step 4: Railway Deployment

### 4.1 Automatic Deployment

Railway will automatically deploy when you merge to `main`:

1. Watch the deployment in Railway dashboard
2. Monitor build logs for errors
3. Wait for "Deployed" status (green checkmark)

### 4.2 Manual Trigger (if needed)

If auto-deploy doesn't trigger:

1. Go to Railway dashboard
2. Click **Deployments** tab
3. Click **Deploy** button
4. Select `main` branch

### 4.3 Monitor Build

Watch for these stages:
- ✅ Building (npm install, npm run build)
- ✅ Deploying (starting server)
- ✅ Deployed (green checkmark)

**Expected build time**: 3-5 minutes

---

## ✅ Step 5: Post-Deployment Verification

### 5.1 Test Public Pages

Visit these URLs and verify they load:

- [ ] Blog homepage: `https://your-domain.com/blog`
- [ ] Posts list: `https://your-domain.com/blog/posts`
- [ ] Sitemap: `https://your-domain.com/blog/sitemap.xml`
- [ ] RSS feed: `https://your-domain.com/blog/feed.xml`
- [ ] Robots.txt: `https://your-domain.com/robots.txt`

### 5.2 Test CMS Dashboard

1. Sign in to your account
2. Visit: `https://your-domain.com/blog-cms`
3. Verify tabs load: Posts, Destinations, Testimonials, Media
4. Click **New Post** button
5. Verify Novel editor loads

### 5.3 Test Creating a Post

1. Go to `/blog-cms/posts/new`
2. Enter title: "Test Post"
3. Write some content in Novel editor
4. Add a tag
5. Click **Save Draft**
6. Verify post appears in dashboard
7. Click **Publish**
8. Visit `/blog/posts/test-post`
9. Verify post displays correctly

### 5.4 Test Comments

1. On a blog post page, scroll to comments section
2. Write a test comment
3. Click **Post Comment**
4. Verify comment appears
5. Try replying to the comment
6. Verify nested reply works

### 5.5 Test Social Sharing

1. On a blog post page, find social share buttons
2. Click **Copy Link**
3. Verify "Link copied!" message
4. Click Twitter/Facebook icons
5. Verify share dialogs open

### 5.6 Test Affiliate Tracking

1. Create a blog post with affiliate links
2. Click an affiliate link
3. Check browser console for tracking event
4. Go to `/earnings` dashboard
5. Verify click is recorded

### 5.7 Test Media Library

1. Go to `/blog-cms` → Media tab
2. Upload a test image
3. Verify image appears in grid
4. Click **Copy URL**
5. Use URL in a blog post
6. Verify image displays

---

## 🔍 Step 6: SEO Setup

### 6.1 Submit Sitemap to Google

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (if not already added)
3. Go to **Sitemaps** section
4. Add sitemap URL: `https://your-domain.com/blog/sitemap.xml`
5. Click **Submit**

### 6.2 Verify Open Graph Tags

1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter a blog post URL
3. Click **Debug**
4. Verify image, title, description appear correctly

### 6.3 Verify Twitter Cards

1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter a blog post URL
3. Click **Preview card**
4. Verify card displays correctly

---

## 📊 Step 7: Monitoring

### 7.1 Check Error Logs

Monitor Railway logs for 24 hours:

```bash
# In Railway dashboard
Deployments → Latest → View Logs
```

Watch for:
- ❌ 500 errors
- ❌ Database connection errors
- ❌ Missing environment variables
- ❌ API route failures

### 7.2 Monitor Performance

Use Railway metrics:
- CPU usage
- Memory usage
- Response times
- Request count

### 7.3 Test on Mobile

1. Open blog on mobile device
2. Test navigation
3. Test creating a comment
4. Test social sharing
5. Verify responsive design

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Fix**: 
1. Add env vars in Railway
2. Trigger rebuild (git push or manual deploy)
3. Wait for new deployment

### Issue: Blog pages show 404

**Fix**:
1. Verify migrations were applied
2. Check Railway build logs for errors
3. Verify `app/blog/` directory exists in deployment

### Issue: Comments not showing

**Fix**:
1. Check RLS policies on `cms_comments` table
2. Verify user is authenticated
3. Check browser console for errors

### Issue: Affiliate links not tracking

**Fix**:
1. Verify `/api/affiliate/track-click` endpoint exists
2. Check database function `track_affiliate_click()` exists
3. Check browser console for errors

### Issue: Images not uploading

**Fix**:
1. Verify Supabase Storage bucket `images` exists
2. Check bucket permissions (public read, authenticated write)
3. Verify file size < 5MB

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All public pages load without errors
- ✅ CMS dashboard is accessible
- ✅ Can create and publish blog posts
- ✅ Comments work
- ✅ Social sharing works
- ✅ Affiliate tracking works
- ✅ Media library works
- ✅ Sitemap and RSS feed accessible
- ✅ No errors in Railway logs
- ✅ Mobile responsive

---

## 📞 Support

If you encounter issues:

1. Check [Troubleshooting Guide](./BLOG_CMS_GUIDE.md#troubleshooting)
2. Review Railway deployment logs
3. Check Supabase logs
4. Verify all environment variables
5. Test locally first

---

## 🎊 Congratulations!

Your TravelBlogr Blog/CMS system is now live! 🚀

**Next steps:**
- Create your first real blog post
- Invite content creators
- Set up affiliate accounts
- Monitor analytics
- Promote your blog

**Happy blogging!** ✈️🌍📝


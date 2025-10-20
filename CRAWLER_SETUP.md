# 🚀 TravelBlogr Content Crawler Setup Guide

Complete guide to set up and use the automated content crawler system for TravelBlogr.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Supabase project set up
- ✅ OpenWeatherMap API key (free tier available)
- ✅ Vercel account (for deployment and cron jobs)

---

## Installation

### 1. Install Dependencies

```bash
npm install crawlee playwright cheerio axios
```

**Note:** Playwright will download browser binaries (~300MB). This is required for JavaScript-heavy websites.

### 2. Verify Installation

```bash
# Check if Crawlee is installed
npm list crawlee

# Check if Playwright browsers are installed
npx playwright install --dry-run
```

---

## Database Setup

### 1. Run Migration

Apply the crawler tables migration to your Supabase database:

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manually in Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy contents of infrastructure/database/migrations/003_crawler_tables.sql
# 3. Execute the SQL
```

### 2. Verify Tables

Check that these tables were created:
- `location_weather`
- `location_restaurants`
- `location_activities`
- `crawler_logs`

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'location_%' OR table_name = 'crawler_logs';
```

---

## Configuration

### 1. Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

**Free Tier Limits:**
- 1,000 API calls per day
- 60 calls per minute
- Current weather + 5-day forecast

### 2. Set Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenWeatherMap API
OPENWEATHER_API_KEY=your-api-key-here

# Crawler Settings
CRAWLER_MAX_REQUESTS=100
CRAWLER_TIMEOUT=30000
CRAWLER_MAX_CONCURRENCY=5

# Security
CRON_SECRET=$(openssl rand -base64 32)
ADMIN_SECRET=$(openssl rand -base64 32)
```

### 3. Generate Secrets

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate ADMIN_SECRET
openssl rand -base64 32
```

Add these to your `.env.local` file.

---

## Usage

### Manual Triggers (Development)

#### 1. Weather Sync

**Sync weather for a single location:**

```bash
curl -X POST http://localhost:3000/api/admin/crawler/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "type": "weather",
    "locationId": "your-location-uuid",
    "latitude": 51.1784,
    "longitude": -115.5708
  }'
```

**Sync weather for all locations:**

```bash
curl -X POST http://localhost:3000/api/cron/sync-weather \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### 2. Restaurant Crawler

```bash
curl -X POST http://localhost:3000/api/admin/crawler/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "type": "restaurants",
    "locationId": "your-location-uuid",
    "urls": [
      "https://restaurant1.com",
      "https://restaurant2.com"
    ]
  }'
```

### Admin Dashboard (Recommended)

1. Navigate to `http://localhost:3000/admin/crawler`
2. Fill in the form fields
3. Click the appropriate button to trigger crawlers

**Features:**
- ✅ Visual interface for triggering crawlers
- ✅ Real-time feedback and error messages
- ✅ JSON response display
- ✅ No need to remember API endpoints

---

## Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Set Environment Variables in Vercel

Go to your Vercel project settings and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENWEATHER_API_KEY
CRON_SECRET
ADMIN_SECRET
```

### 3. Setup Cron Job (Railway)

Configure cron job in Railway:

1. Go to Railway Dashboard → Your Project
2. Click on "Cron Jobs" tab
3. Add new cron job:
   - **Path**: `/api/cron/sync-weather`
   - **Schedule**: `0 */6 * * *` (every 6 hours)
   - **Authorization**: Add `CRON_SECRET` header

**Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)

**Manual Trigger (for testing):**
```bash
curl -X POST https://your-app.railway.app/api/cron/sync-weather \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## How It Works

### Weather Sync Flow

```
1. Cron job triggers /api/cron/sync-weather
2. Fetch all locations from Supabase
3. For each location:
   - Call OpenWeatherMap API
   - Transform data to our format
   - Upsert to location_weather table
4. Return stats (processed, errors)
```

### Restaurant Crawler Flow

```
1. Admin triggers crawler with URLs
2. Crawlee visits each URL
3. Extract JSON-LD structured data (Schema.org)
4. Fallback to HTML parsing if no structured data
5. Validate extracted data
6. Save to location_restaurants table
7. Return stats (crawled, saved, errors)
```

---

## Troubleshooting

### Issue: "OPENWEATHER_API_KEY is not set"

**Solution:** Add the API key to your `.env.local` file and restart the dev server.

### Issue: Playwright browser not found

**Solution:** Install Playwright browsers:

```bash
npx playwright install chromium
```

### Issue: Cron job not running

**Solutions:**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check cron job logs in Vercel Dashboard
3. Ensure the cron schedule is correct in `vercel.json`

### Issue: Restaurant crawler finds no data

**Possible causes:**
1. Website doesn't have Schema.org JSON-LD markup
2. Website blocks crawlers (check robots.txt)
3. Website requires JavaScript rendering (Crawlee should handle this)

**Debug steps:**
1. Check the website's source code for `<script type="application/ld+json">`
2. Try the URL in the admin dashboard to see detailed error messages
3. Check crawler logs in Supabase `crawler_logs` table

### Issue: Rate limiting errors

**Solution:** The crawler respects rate limits (1 req/sec by default). If you hit OpenWeatherMap limits:
- Free tier: 60 calls/minute, 1,000 calls/day
- Reduce sync frequency or upgrade to paid tier

---

## Best Practices

### 1. Start Small

Test with 1-2 locations before running full sync:

```bash
# Test weather sync for one location first
curl -X POST .../api/admin/crawler/trigger \
  -d '{"type": "weather", "locationId": "...", ...}'
```

### 2. Monitor Logs

Check Supabase `crawler_logs` table regularly:

```sql
SELECT * FROM crawler_logs 
ORDER BY started_at DESC 
LIMIT 10;
```

### 3. Verify Crawled Data

Always manually verify a few crawled restaurants before marking them as verified:

```sql
UPDATE location_restaurants 
SET is_verified = true 
WHERE id = 'restaurant-uuid';
```

### 4. Respect Robots.txt

The crawler respects `robots.txt` by default. Don't disable this unless you have permission.

---

## Next Steps

1. ✅ Set up OpenWeatherMap API key
2. ✅ Run database migration
3. ✅ Test weather sync locally
4. ✅ Test restaurant crawler with 1-2 URLs
5. ✅ Deploy to Vercel
6. ✅ Verify cron job is running
7. ✅ Monitor first few automated syncs

---

## Support

For issues or questions:
- Check the [README](services/content-crawler/README.md)
- Review crawler logs in Supabase
- Check Vercel deployment logs

---

**Happy Crawling! 🕷️**


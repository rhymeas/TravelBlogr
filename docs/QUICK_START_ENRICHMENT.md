# Quick Start: Activity Enrichment

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

Already installed! The enrichment system uses existing dependencies:
- ✅ `@supabase/supabase-js`
- ✅ `groq-sdk`
- ✅ `tsx` (for running TypeScript scripts)

### Step 2: Set Environment Variables

Add to `.env.local`:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://nchhcxokrzabbkvhzsor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (but recommended)
BRAVE_SEARCH_API_KEY=your-brave-api-key
GROQ_API_KEY=your-groq-api-key
CRON_SECRET=your-secure-random-string
```

### Step 3: Test with Small Batch

```bash
# Enrich first 5 locations to test
npm run enrich-activities:limit 5
```

**Expected output:**
```
🚀 Starting Location Activity Enrichment
📊 Found 5 location(s) to process

📍 Processing: Banff (12 activities)
  🔍 Enriching: Lake Louise Gondola
    ✅ Link: https://www.banffjaspercollection.com/...
    ✅ Image: https://i.redd.it/abc123.jpg
  ✅ Updated Banff

============================================================
✅ Enrichment Complete!
============================================================
```

### Step 4: Verify Results

**Check database:**
```sql
-- See enriched activities
SELECT 
  name,
  jsonb_array_length(activities) as activity_count,
  (
    SELECT COUNT(*) 
    FROM jsonb_array_elements(activities) a 
    WHERE a->>'link_url' IS NOT NULL
  ) as activities_with_links
FROM locations
WHERE activities IS NOT NULL
LIMIT 10;
```

**Check location page:**
```
Visit: http://localhost:3001/locations/banff-canada
```

Activities should now have:
- ✅ Clickable "Learn more" links
- ✅ High-quality images
- ✅ Contextual descriptions

### Step 5: Enrich All Locations

```bash
# Enrich all locations (may take 10-30 minutes)
npm run enrich-activities
```

## 🔄 Set Up Periodic Enrichment

### Option 1: Railway Cron (Recommended)

1. **Add to `railway.toml`:**
```toml
[[crons]]
schedule = "0 2 * * *"  # Daily at 2 AM
command = "curl https://travelblogr.up.railway.app/api/cron/enrich-activities?secret=$CRON_SECRET&limit=50"
```

2. **Add environment variable in Railway:**
```
CRON_SECRET=your-secure-random-string
```

### Option 2: External Cron Service

1. **Sign up at [cron-job.org](https://cron-job.org)**

2. **Create new cron job:**
   - URL: `https://travelblogr.up.railway.app/api/cron/enrich-activities?secret=<CRON_SECRET>&limit=50`
   - Schedule: `0 2 * * *` (Daily at 2 AM)
   - Timeout: 300 seconds

3. **Test manually:**
```bash
curl "https://travelblogr.up.railway.app/api/cron/enrich-activities?secret=<CRON_SECRET>&limit=5"
```

## 📊 Monitor Progress

### Admin Dashboard

Visit: `https://travelblogr.up.railway.app/dashboard/admin/analytics`

Check:
- ✅ API call statistics
- ✅ Error rates
- ✅ Performance metrics

### Database Queries

```sql
-- Enrichment progress
SELECT 
  COUNT(*) FILTER (WHERE a->>'link_url' IS NOT NULL) * 100.0 / COUNT(*) as link_percentage,
  COUNT(*) FILTER (WHERE a->>'image_url' IS NOT NULL AND a->>'image_url' NOT LIKE '%placeholder%') * 100.0 / COUNT(*) as image_percentage
FROM locations, jsonb_array_elements(activities) a
WHERE activities IS NOT NULL;

-- Recent enrichments
SELECT 
  name,
  updated_at,
  jsonb_array_length(activities) as activities
FROM locations
WHERE activities IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## 🎯 Common Use Cases

### New Location Added
```bash
# Enrich specific location immediately
npm run enrich-activities:location <location-uuid>
```

### Weekly Maintenance
```bash
# Enrich 50 locations with missing data
npm run enrich-activities:limit 50
```

### Full Re-enrichment
```bash
# Re-enrich all locations (updates stale data)
npm run enrich-activities
```

## ⚠️ Troubleshooting

### No links being added?

**Check Brave API key:**
```bash
curl -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
  "https://api.search.brave.com/res/v1/web/search?q=test"
```

### No images being added?

**Check image API:**
```bash
curl "http://localhost:3001/api/images/discover?query=Banff&limit=1&context=activity"
```

### Script timing out?

**Reduce batch size:**
```bash
npm run enrich-activities:limit 10
```

## 📈 Expected Results

After enrichment, you should see:

**Before:**
- ❌ Activities with no links
- ❌ Placeholder images
- ❌ Generic descriptions

**After:**
- ✅ 80-90% of activities have official links (Brave API)
- ✅ 90-95% of activities have high-quality images (Brave images FIRST, Reddit ULTRA fallback)
- ✅ 90-100% of activities have contextual descriptions (Brave + GROQ)

**Image Priority:**
1. **Brave Image Search** (primary - high quality, fast)
2. **Reddit ULTRA** (fallback - only if Brave fails)
3. **No placeholder images** (skip if both fail)

## 🎉 Success Checklist

- [ ] Environment variables configured
- [ ] Test enrichment completed (5 locations)
- [ ] Results verified in database
- [ ] Location pages showing enriched data
- [ ] Full enrichment completed
- [ ] Periodic cron job configured
- [ ] Admin dashboard monitoring set up

## 📚 Next Steps

- Read full documentation: [ACTIVITY_ENRICHMENT.md](./ACTIVITY_ENRICHMENT.md)
- Set up monitoring alerts
- Review API costs monthly
- Plan for scaling (parallel processing)

## 🆘 Need Help?

- Check logs: `npm run enrich-activities:limit 1`
- Review admin dashboard: `/dashboard/admin/analytics`
- Check database: Run SQL queries above
- Review error messages in console


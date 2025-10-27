# Location Activity Enrichment System

## Overview

The Activity Enrichment System automatically populates location activities with high-quality images and official links using the same proven logic from the V2 Trip Planner.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Activity Enrichment Flow                    │
└─────────────────────────────────────────────────────────────┘

1. Fetch locations with activities from database
   ↓
2. For each activity without image/link:
   ↓
3. ┌─────────────────────────────────────────────────────┐
   │ STEP 1: Brave API (Primary - Images + Links!)       │
   │ - Brave Image Search for high-quality photos        │
   │ - Brave Web Search for official/booking links       │
   │ - Extract description from search results           │
   │ - 2 parallel API calls (web + images)               │
   └─────────────────────────────────────────────────────┘
   ↓
4. ┌─────────────────────────────────────────────────────┐
   │ STEP 2: Reddit ULTRA (Fallback for images only)     │
   │ - ONLY if Brave images failed                       │
   │ - Fetch high-quality contextual images              │
   │ - Use same /api/images/discover as V2 planner       │
   └─────────────────────────────────────────────────────┘
   ↓
5. ┌─────────────────────────────────────────────────────┐
   │ STEP 3: GROQ Fallback (if still missing link)       │
   │ - ONLY if Brave link failed                         │
   │ - Generate contextual 2-line description           │
   │ - Fetch booking URL via Brave search                │
   └─────────────────────────────────────────────────────┘
   ↓
6. Update locations.activities JSONB in database
   ↓
7. Track stats: images added, links added, errors
```

## Features

### ✅ Leverages V2 Trip Planner Logic
- **Brave API FIRST** - Images + links in parallel (2 API calls)
- **Reddit ULTRA fallback** - Only if Brave images fail
- **GROQ fallback** - Only if Brave links fail
- **Smart rate limiting** - 200ms delay = max 10 activities/sec = 20 API calls/sec (under Brave's 20/sec limit)

### ✅ Smart Enrichment
- Only enriches activities missing `image_url` or `link_url`
- Skips activities with placeholder images
- Preserves existing data (no overwrites)
- Tracks enrichment source (`brave`, `groq`, etc.)

### ✅ Multiple Execution Modes
1. **CLI Script** - One-time manual enrichment
2. **Cron Job API** - Periodic automated enrichment
3. **Targeted Enrichment** - Specific location or limited batch

## Usage

### 1. CLI Script (One-Time Enrichment)

**Enrich all locations:**
```bash
npm run enrich-activities
```

**Enrich first 10 locations:**
```bash
npm run enrich-activities:limit 10
```

**Enrich specific location:**
```bash
npm run enrich-activities:location <location-uuid>
```

**Example output:**
```
🚀 Starting Location Activity Enrichment

Using V2 Trip Planner enrichment logic:
  - Brave API FIRST (images + links in parallel)
  - Reddit ULTRA fallback (only if Brave images fail)
  - GROQ fallback (only if Brave links fail)

📊 Found 25 location(s) to process

📍 Processing: Banff (12 activities)
  🔍 Enriching: Lake Louise Gondola
    ✅ Link: https://www.banffjaspercollection.com/attractions/lake-louise-gondola/
    ✅ Image: https://i.redd.it/abc123.jpg
  🔍 Enriching: Johnston Canyon
    ✅ Link: https://www.pc.gc.ca/en/pn-np/ab/banff/activ/randonee-hiking/johnston
    ✅ Image: https://i.redd.it/def456.jpg
  ✅ Updated Banff

============================================================
✅ Enrichment Complete!
============================================================
📊 Stats:
  - Locations processed: 25
  - Activities enriched: 156
  - Activities skipped: 44
  - Images added: 142
  - Links added: 138
  - Errors: 0
  - Duration: 245.3s
============================================================
```

### 2. Cron Job API (Periodic Enrichment)

**Setup in Railway/Vercel:**

1. Add environment variable:
   ```
   CRON_SECRET=your-secure-random-string
   ```

2. Configure cron job (Railway Cron):
   ```yaml
   # railway.toml
   [[crons]]
   schedule = "0 2 * * *"  # Daily at 2 AM
   command = "curl https://your-app.com/api/cron/enrich-activities?secret=$CRON_SECRET&limit=50"
   ```

3. Or use external cron service (cron-job.org):
   ```
   URL: https://your-app.com/api/cron/enrich-activities?secret=<CRON_SECRET>&limit=50
   Schedule: Daily at 2 AM
   ```

**API Endpoints:**

```bash
# Enrich 10 locations (default)
GET /api/cron/enrich-activities?secret=<CRON_SECRET>

# Enrich 50 locations
GET /api/cron/enrich-activities?secret=<CRON_SECRET>&limit=50

# Enrich specific location
GET /api/cron/enrich-activities?secret=<CRON_SECRET>&location_id=<uuid>
```

**Response:**
```json
{
  "success": true,
  "message": "Enrichment complete",
  "stats": {
    "locationsProcessed": 10,
    "activitiesEnriched": 67,
    "activitiesSkipped": 23,
    "imagesAdded": 62,
    "linksAdded": 58,
    "errors": 0,
    "duration": "89.4s"
  }
}
```

## Data Structure

### Before Enrichment
```json
{
  "id": "abc-123",
  "name": "Lake Louise Gondola",
  "description": "Scenic gondola ride",
  "category": "outdoor",
  "image_url": null,
  "link_url": null,
  "link_source": null
}
```

### After Enrichment
```json
{
  "id": "abc-123",
  "name": "Lake Louise Gondola",
  "description": "Scenic gondola ride offering panoramic views of the Canadian Rockies. Open year-round with seasonal activities.",
  "category": "outdoor",
  "image_url": "https://i.redd.it/lake-louise-gondola-abc123.jpg",
  "link_url": "https://www.banffjaspercollection.com/attractions/lake-louise-gondola/",
  "link_source": "brave"
}
```

## Environment Variables

Required:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional (but recommended):
```bash
BRAVE_SEARCH_API_KEY=your-brave-api-key
GROQ_API_KEY=your-groq-api-key
CRON_SECRET=your-secure-random-string
```

## Performance

### Rate Limiting
- **200ms delay** between activities
- Brave makes 2 parallel API calls per activity (web + images)
- Max 10 activities/second = 20 API calls/second
- Stays safely under Brave's 20 calls/second limit
- Prevents API rate limit errors

### Estimated Times
| Locations | Activities | Duration | API Calls |
|-----------|-----------|----------|-----------|
| 10        | ~80       | ~3min    | ~160      |
| 50        | ~400      | ~13min   | ~800      |
| 100       | ~800      | ~27min   | ~1600     |
| 500       | ~4000     | ~2.2hrs  | ~8000     |

*Note: 200ms per activity = 5 activities/sec = 10 API calls/sec (well under 20/sec limit)*

### API Costs (Approximate)
| Service | Cost per 1000 calls | 100 locations |
|---------|---------------------|---------------|
| Brave API | $5 | ~$4 |
| GROQ API | Free (rate limited) | $0 |
| Reddit ULTRA | Free | $0 |

## Monitoring

### Check Enrichment Status

**Query database:**
```sql
-- Count activities with links
SELECT 
  COUNT(*) FILTER (WHERE a->>'link_url' IS NOT NULL) as with_links,
  COUNT(*) FILTER (WHERE a->>'link_url' IS NULL) as without_links,
  COUNT(*) as total
FROM locations, jsonb_array_elements(activities) a
WHERE activities IS NOT NULL;

-- Count activities with images
SELECT 
  COUNT(*) FILTER (WHERE a->>'image_url' IS NOT NULL AND a->>'image_url' NOT LIKE '%placeholder%') as with_images,
  COUNT(*) FILTER (WHERE a->>'image_url' IS NULL OR a->>'image_url' LIKE '%placeholder%') as without_images,
  COUNT(*) as total
FROM locations, jsonb_array_elements(activities) a
WHERE activities IS NOT NULL;

-- Enrichment sources
SELECT 
  a->>'link_source' as source,
  COUNT(*) as count
FROM locations, jsonb_array_elements(activities) a
WHERE a->>'link_url' IS NOT NULL
GROUP BY a->>'link_source'
ORDER BY count DESC;
```

### Admin Dashboard

Visit `/dashboard/admin/analytics` to see:
- Activity enrichment progress
- API call statistics
- Error rates
- Performance metrics

## Troubleshooting

### Issue: No links being added

**Check:**
1. `BRAVE_SEARCH_API_KEY` is set correctly
2. Brave API quota not exceeded
3. Activity names are descriptive (not generic)

**Solution:**
```bash
# Test Brave API manually
curl -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
  "https://api.search.brave.com/res/v1/web/search?q=Lake+Louise+Gondola+Banff"
```

### Issue: No images being added

**Check:**
1. Image discovery API is working: `/api/images/discover`
2. Reddit ULTRA engine is configured
3. Network connectivity to Reddit

**Solution:**
```bash
# Test image API manually
curl "http://localhost:3001/api/images/discover?query=Lake+Louise+Gondola&limit=1&context=activity"
```

### Issue: Cron job timing out

**Check:**
1. Reduce `limit` parameter (try 10-20 instead of 50)
2. Increase `maxDuration` in route.ts
3. Check Railway/Vercel timeout limits

**Solution:**
```bash
# Use smaller batches
GET /api/cron/enrich-activities?secret=<SECRET>&limit=10
```

## Best Practices

### 1. Initial Enrichment
```bash
# Start small to test
npm run enrich-activities:limit 5

# Check results in database
# If good, enrich all
npm run enrich-activities
```

### 2. Periodic Enrichment
```bash
# Set up daily cron for new locations
# Limit to 50 to avoid timeouts
GET /api/cron/enrich-activities?secret=<SECRET>&limit=50
```

### 3. Targeted Enrichment
```bash
# After adding new location manually
npm run enrich-activities:location <location-uuid>
```

### 4. Monitoring
- Check admin dashboard weekly
- Monitor API costs monthly
- Review error logs regularly

## Future Enhancements

- [ ] Parallel processing for faster enrichment
- [ ] Image quality validation
- [ ] Link verification (check for 404s)
- [ ] A/B testing different image sources
- [ ] Machine learning for better link selection
- [ ] Automatic re-enrichment of stale data (> 90 days)

## Related Documentation

- [V2 Trip Planner Enhancement Plan](../V2_TRIP_PLANNER_ENHANCEMENT_PLAN.md)
- [Image System Documentation](./IMAGE_SYSTEM.md)
- [Brave API Integration](./BRAVE_API.md)
- [GROQ Integration](./GROQ_INTEGRATION.md)


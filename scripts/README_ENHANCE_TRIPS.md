# Trip Enhancement Script

Automatically enrich existing trips with high-quality images, official website links, and activity descriptions using the smart Brave API integration.

---

## 🎯 What It Does

This script enhances existing trips by:

1. **Fetching high-quality images** from Brave Image Search (16:9 optimized)
2. **Finding official website links** using smart multi-query strategy
3. **Adding activity descriptions** from web search results
4. **Enriching POI metadata** with relevant information

### **Smart Features:**

- ✅ **Rate limiting** - Respects Brave API 20 RPS limit (18 RPS to be safe)
- ✅ **Concurrency control** - Processes multiple trips/activities in parallel
- ✅ **Dry run mode** - Preview changes before applying
- ✅ **Progress tracking** - Detailed logs and statistics
- ✅ **Automatic retry** - Handles failures gracefully
- ✅ **Preserves existing data** - Only fills missing fields

---

## 📋 Prerequisites

1. **Environment variables** must be set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   BRAVE_SEARCH_API_KEY=your_brave_api_key
   ```

2. **Dependencies** must be installed:
   ```bash
   npm install
   ```

---

## 🚀 Usage

### **1. Dry Run (Preview Changes)**

Preview what would be enhanced without saving to database:

```bash
npm run enhance-trips:dry-run
```

**Output:**
```
🚀 TravelBlogr Trip Enhancement Script
============================================================
🔍 DRY RUN MODE - No changes will be saved
============================================================

📊 Fetching trips to enhance...
✅ Found 10 trips to process

📍 Processing Trip: "Paris Weekend" (ID: abc123)
   Created: 1/15/2025
   Found 8 activities to enhance
  🔍 Enriching: "Eiffel Tower" in Paris, France
  ✅ Found: 🖼️🔗📝
  🔍 Enriching: "Louvre Museum" in Paris, France
  ✅ Found: 🖼️🔗📝
   🔍 DRY RUN: Would enhance 8 activities

📊 Progress: 3/10 trips processed
...

============================================================
📊 ENHANCEMENT COMPLETE
============================================================
Trips Processed:      10
Trips Enhanced:       8
Trips Skipped:        2
Trips Failed:         0
Activities Enhanced:  64
Activities Failed:    2
Images Added:         62
Links Added:          60
Descriptions Added:   58
============================================================

🔍 This was a DRY RUN - no changes were saved
   Run without --dry-run to apply changes
```

---

### **2. Enhance All Trips**

Enhance all trips in the database:

```bash
npm run enhance-trips
```

**⚠️ Warning:** This will modify your database. Run dry-run first!

---

### **3. Enhance Specific Trip**

Enhance a single trip by ID:

```bash
npm run enhance-trips -- --trip-id=abc123
```

---

### **4. Enhance User's Trips**

Enhance all trips for a specific user:

```bash
npm run enhance-trips -- --user-id=user123
```

---

### **5. Combine Options**

Dry run for specific user:

```bash
npm run enhance-trips -- --dry-run --user-id=user123
```

---

## 📊 What Gets Enhanced

### **Trip Structure:**

```json
{
  "location_data": [
    {
      "day": 1,
      "location": "Paris, France",
      "schedule": [
        {
          "name": "Eiffel Tower",
          "image_url": "",        // ← ENHANCED with Brave CDN image
          "link_url": "",         // ← ENHANCED with official website
          "description": ""       // ← ENHANCED with description
        }
      ],
      "pois": [
        {
          "name": "Louvre Museum",
          "image": "",            // ← ENHANCED with Brave CDN image
          "link": "",             // ← ENHANCED with official website
          "description": ""       // ← ENHANCED with description
        }
      ]
    }
  ]
}
```

### **Before Enhancement:**

```json
{
  "name": "Eiffel Tower",
  "image_url": "",
  "link_url": "",
  "description": ""
}
```

### **After Enhancement:**

```json
{
  "name": "Eiffel Tower",
  "image_url": "https://imgs.search.brave.com/...",
  "link_url": "https://www.toureiffel.paris/",
  "description": "The iconic iron lattice tower on the Champ de Mars in Paris..."
}
```

---

## ⚙️ Configuration

### **Rate Limiting:**

```typescript
const RATE_LIMIT_RPS = 18  // Requests per second (under 20 RPS limit)
const RATE_LIMIT_DELAY = 1000 / RATE_LIMIT_RPS  // ~55ms between requests
```

### **Concurrency:**

```typescript
const MAX_CONCURRENT_TRIPS = 3       // Process 3 trips in parallel
const MAX_CONCURRENT_ACTIVITIES = 5  // Process 5 activities per trip in parallel
```

**Total RPS:** 3 trips × 5 activities = 15 concurrent requests (under 18 RPS limit)

---

## 🔍 How It Works

### **Step 1: Fetch Trips**

```typescript
// Fetch all trips (or filtered by trip-id/user-id)
const trips = await supabase
  .from('trips')
  .select('*')
  .order('created_at', { ascending: false })
```

### **Step 2: Extract Activities**

```typescript
// Extract activities from location_data
const activities = extractActivities(trip)
// Returns: [{ name: "Eiffel Tower", location: "Paris, France", day: 1 }, ...]
```

### **Step 3: Enhance Activities**

```typescript
// Use smart searchActivity service
const { images, links } = await searchActivity(activityName, location)

// Extract enrichment data
const enrichment = {
  image: images[0]?.thumbnail || images[0]?.url,
  link: links[0]?.url,
  description: links[0]?.description
}
```

### **Step 4: Update Trip**

```typescript
// Update location_data with enriched activities
await supabase
  .from('trips')
  .update({
    location_data: updatedLocationData,
    updated_at: new Date().toISOString()
  })
  .eq('id', trip.id)
```

---

## 📈 Performance

### **Estimated Time:**

- **10 trips** with **5 activities each** = **50 activities**
- **Rate limit:** 18 RPS
- **Time:** ~3 seconds (with concurrency)

### **API Calls:**

- **Per activity:** 2-3 Brave API calls (images + links)
- **Total for 50 activities:** ~100-150 API calls
- **Time:** ~6-8 seconds

### **Brave API Limits:**

- **Free tier:** 2,000 queries/month (66/day)
- **Paid tier:** 20 requests/second (unlimited monthly)
- **This script:** Uses paid tier (20 RPS)

---

## 🛡️ Safety Features

### **1. Dry Run Mode**

Always test with `--dry-run` first:

```bash
npm run enhance-trips:dry-run
```

### **2. Preserves Existing Data**

Only fills missing fields:

```typescript
image_url: enrichment.image || activity.image_url  // Keep existing if present
```

### **3. Error Handling**

Continues on failures:

```typescript
try {
  await enhanceActivity(activity)
} catch (error) {
  console.error('Failed to enhance activity:', error)
  stats.activitiesFailed++
  // Continue with next activity
}
```

### **4. Rate Limiting**

Respects API limits:

```typescript
await sleep(RATE_LIMIT_DELAY)  // 55ms between requests
```

---

## 📊 Statistics Tracking

The script tracks detailed statistics:

```typescript
{
  tripsProcessed: 10,      // Total trips processed
  tripsEnhanced: 8,        // Trips successfully enhanced
  tripsSkipped: 2,         // Trips with no activities
  tripsFailed: 0,          // Trips that failed to update
  activitiesEnhanced: 64,  // Activities successfully enriched
  activitiesFailed: 2,     // Activities that failed
  imagesAdded: 62,         // Images added
  linksAdded: 60,          // Links added
  descriptionsAdded: 58    // Descriptions added
}
```

---

## 🐛 Troubleshooting

### **Error: Missing environment variables**

```bash
❌ Missing required environment variables:
   NEXT_PUBLIC_SUPABASE_URL: false
   SUPABASE_SERVICE_ROLE_KEY: false
```

**Solution:** Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BRAVE_SEARCH_API_KEY=your_brave_api_key
```

---

### **Error: Rate limit exceeded**

```bash
❌ Brave API error: 429 Too Many Requests
```

**Solution:** Reduce concurrency:

```typescript
const MAX_CONCURRENT_TRIPS = 2       // Reduce from 3
const MAX_CONCURRENT_ACTIVITIES = 3  // Reduce from 5
```

---

### **Error: No activities found**

```bash
⚠️ No activities found, skipping...
```

**Reason:** Trip has no `location_data` or activities in schedule/pois

**Solution:** This is normal for empty trips. They will be skipped.

---

## 🎯 Best Practices

1. **Always run dry-run first:**
   ```bash
   npm run enhance-trips:dry-run
   ```

2. **Test on single trip:**
   ```bash
   npm run enhance-trips -- --dry-run --trip-id=abc123
   ```

3. **Enhance in batches:**
   ```bash
   npm run enhance-trips -- --user-id=user1
   npm run enhance-trips -- --user-id=user2
   ```

4. **Monitor API usage:**
   - Check Brave API dashboard
   - Watch for rate limit errors
   - Adjust concurrency if needed

5. **Backup database before bulk operations:**
   ```bash
   # Export trips table
   supabase db dump --table trips > trips_backup.sql
   ```

---

## 📚 Related Documentation

- **Smart Link Fetching:** `apps/web/lib/services/braveSearchService.ts`
- **Brave API Strategy:** `docs/BRAVE_QUERY_FINAL_STRATEGY.md`
- **Image Optimization:** `docs/BRAVE_API_IMAGE_AUDIT.md`
- **Codebase Rules:** `.augment/rules/imported/rules.md`

---

## 🚀 Quick Start

```bash
# 1. Preview changes (dry run)
npm run enhance-trips:dry-run

# 2. Enhance all trips
npm run enhance-trips

# 3. Check results in database
# Navigate to Supabase dashboard → trips table
```

---

## ✅ Success Criteria

After running the script, trips should have:

- ✅ High-quality images for all activities
- ✅ Official website links for all activities
- ✅ Descriptions for all activities
- ✅ No broken image URLs
- ✅ No duplicate data

---

**Happy Enhancing! 🎉**


# Upstash Cache Management Guide

## Overview

TravelBlogr uses **Upstash Redis** for caching frequently accessed data (location details, activity images, etc.) to improve performance and reduce API calls. This guide covers cache management, debugging, and preventing "cached errors".

---

## 🔧 Cache Management Tools

### **1. Upstash REST API (Direct Access)**

The simplest way to inspect and manage cache is via the Upstash REST API using `curl`:

```bash
# List all cache keys matching a pattern
curl -s "https://massive-colt-27827.upstash.io/keys/activity:*" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN" \
  | jq -r '.result[]'

# Get value for a specific key
curl -s "https://massive-colt-27827.upstash.io/get/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN" \
  | jq '.'

# Delete a specific key
curl -s "https://massive-colt-27827.upstash.io/del/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN"

# Count keys matching pattern
curl -s "https://massive-colt-27827.upstash.io/keys/activity:*" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN" \
  | jq -r '.result | length'
```

### **2. Bulk Cache Cleanup Script**

Use the provided script to clean up buggy cache keys:

```bash
# Clear all buggy cache keys with ::: pattern
bash scripts/clear-buggy-cache.sh

# This will:
# 1. Find all keys with ::: pattern (buggy cache from old code)
# 2. Show count and sample keys
# 3. Ask for confirmation
# 4. Delete all matching keys
```

### **3. API Endpoint for Cache Clearing**

Use the `/api/cache/clear-activity` endpoint to clear cache for specific activities:

```typescript
// Clear cache for a specific activity
const response = await fetch('/api/cache/clear-activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    activityName: 'Lake Louise Gondola',
    locationName: 'Banff, Canada'
  })
})
```

---

## 🐛 Common Cache Issues & Solutions

### **Issue 1: Cached Errors (422, 429, etc.)**

**Symptoms:**
- API returns empty results even though API is working
- Logs show "Cache HIT" but data is stale/empty
- Rate limit errors cached from previous failed attempts

**Root Cause:**
When an API call fails (422 invalid token, 429 rate limit), the error response gets cached. Subsequent requests return the cached error instead of retrying the API.

**Solution:**
1. **Clear the specific cache key:**
   ```bash
   curl -s "https://massive-colt-27827.upstash.io/del/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
     -H "Authorization: Bearer YOUR_UPSTASH_TOKEN"
   ```

2. **Clear all activity cache:**
   ```bash
   bash scripts/clear-buggy-cache.sh
   ```

3. **Prevent in future:** Add error handling to NOT cache failed API responses:
   ```typescript
   // ❌ DON'T cache errors
   if (apiResponse.error) {
     return { images: [], links: [] } // Don't cache this!
   }
   
   // ✅ Only cache successful responses
   const result = { images, links }
   await setCached(cacheKey, result, CacheTTL.LONG)
   ```

### **Issue 2: Cache Key Mismatch**

**Symptoms:**
- Cache clearing doesn't work
- Same data cached under multiple keys
- Logs show "Cache HIT with context" but you didn't pass context

**Root Cause:**
Cache key format differs between cache clearing endpoint and service layer.

**Example:**
```typescript
// Service creates key with context suffix
const ctxKey = options ? `:${tripType}:${context}` : ''
const cacheKey = `activity:${locationName}${ctxKey}:${activityName}`
// Result: "activity:Banff, Canada:::Lake Louise Gondola"

// Clearing endpoint uses different format
const cacheKey = `activity:${locationName}:${activityName}`
// Result: "activity:Banff, Canada:Lake Louise Gondola"

// These are DIFFERENT keys! Cache clearing fails!
```

**Solution:**
Ensure cache key logic is **identical** in both places:

```typescript
// ✅ CORRECT: Same logic in both service and clearing endpoint
const ctxKey = (tripType || context) 
  ? `:${(tripType || '').toLowerCase()}:${(context || '').toLowerCase().slice(0,50)}` 
  : ''
const cacheKey = CacheKeys.activityData(locationName + ctxKey, activityName)
```

### **Issue 3: Rate Limiting (Brave API)**

**Symptoms:**
- 429 "RATE_LIMITED" errors in logs
- Links not returned even though images work
- Intermittent failures

**Root Cause:**
Brave API has rate limits:
- **Free Plan:** 1 request per second
- **Paid Plan:** 20 requests per second

Making parallel requests (web search + image search) can exceed the limit.

**Solution:**
1. **Update rate limit in code:**
   ```typescript
   // apps/web/lib/services/braveSearchService.ts
   async function throttleBraveRPS(maxPerSec: number = 18) {
     // Set to 18 for paid plan (slightly under 20 to be safe)
     // Set to 1 for free plan
   ```

2. **Add delays between requests:**
   ```typescript
   // Sequential instead of parallel
   const images = await searchImages(query, 15)
   await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
   const links = await searchWeb(query, 5)
   ```

---

## 📊 Cache Key Patterns

### **Activity Cache Keys**

```
Format: activity:{locationName}[:{tripType}:{context}]:{activityName}

Examples:
- activity:Banff, Canada:Lake Louise Gondola
- activity:Banff, Canada:family:kid-friendly:Lake Louise Gondola
- activity:Golden:road-trip:scenic:Train to Golden
```

### **Location Cache Keys**

```
Format: location:{slug}

Examples:
- location:banff-canada
- location:lake-louise-canada
```

### **Brave Image Cache Keys**

```
Format: brave:image:{query}

Examples:
- brave:image:Lake Louise Gondola Banff, Canada
```

---

## 🔍 Debugging Cache Issues

### **Step 1: Check if cache exists**

```bash
curl -s "https://massive-colt-27827.upstash.io/keys/activity:*Lake*Louise*" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN" \
  | jq -r '.result[]'
```

### **Step 2: Inspect cache value**

```bash
curl -s "https://massive-colt-27827.upstash.io/get/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN" \
  | jq '.'
```

### **Step 3: Check cache TTL**

```bash
curl -s "https://massive-colt-27827.upstash.io/ttl/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN"
```

### **Step 4: Clear cache and retry**

```bash
# Clear specific key
curl -s "https://massive-colt-27827.upstash.io/del/activity:Banff,%20Canada:Lake%20Louise%20Gondola" \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN"

# Or clear all activity cache
bash scripts/clear-buggy-cache.sh
```

---

## 🚀 Best Practices

### **1. Cache Invalidation Pattern**

**ALWAYS invalidate Upstash cache FIRST, then Next.js cache:**

```typescript
// ✅ CORRECT ORDER
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

// 1. Invalidate Upstash cache (data source)
await deleteCached(CacheKeys.location(locationSlug))
await deleteCached(`${CacheKeys.location(locationSlug)}:related`)

// 2. Revalidate Next.js cache (page cache)
revalidatePath(`/locations/${locationSlug}`)
revalidatePath(`/locations/${locationSlug}/photos`)
```

### **2. Don't Cache Errors**

```typescript
// ❌ WRONG: Caches error responses
const result = await fetchFromAPI()
await setCached(cacheKey, result, CacheTTL.LONG)

// ✅ CORRECT: Only cache successful responses
const result = await fetchFromAPI()
if (result.success && result.data) {
  await setCached(cacheKey, result.data, CacheTTL.LONG)
}
```

### **3. Use Consistent Cache Keys**

```typescript
// ✅ Use CacheKeys helper for consistency
import { CacheKeys } from '@/lib/upstash'

const cacheKey = CacheKeys.activityData(locationName, activityName)
// Instead of manually constructing: `activity:${locationName}:${activityName}`
```

### **4. Set Appropriate TTLs**

```typescript
import { CacheTTL } from '@/lib/upstash'

// Long-lived data (24 hours)
await setCached(cacheKey, data, CacheTTL.LONG)

// Medium-lived data (1 hour)
await setCached(cacheKey, data, CacheTTL.MEDIUM)

// Short-lived data (5 minutes)
await setCached(cacheKey, data, CacheTTL.SHORT)
```

---

## 📚 Resources

- **Upstash Console:** https://console.upstash.com/
- **Upstash REST API Docs:** https://upstash.com/docs/redis/features/restapi
- **Upstash CLI Docs:** https://upstash.com/docs/redis/features/cli
- **TravelBlogr Cache Utils:** `apps/web/lib/upstash.ts`
- **Cache Clearing Script:** `scripts/clear-buggy-cache.sh`


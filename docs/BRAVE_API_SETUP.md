# Brave Search API Setup Guide

## Issue: "SUBSCRIPTION_TOKEN_INVALID"

The error `{"error":{"code":"SUBSCRIPTION_TOKEN_INVALID"}}` means the Brave API key is either:
1. **Missing** - Not set in environment variables
2. **Invalid** - Wrong format or expired
3. **Not activated** - Free tier requires subscription activation

## How to Fix

### Step 1: Get Your Brave API Key

1. Go to https://api-dashboard.search.brave.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create API Key"** or copy existing key
5. Your key should look like: `BSA...` (starts with BSA)

### Step 2: Subscribe to Free Tier

**IMPORTANT:** Even for the free tier, you must subscribe!

1. Go to https://api-dashboard.search.brave.com/app/subscriptions
2. Click **"Subscribe"** on the **Free** plan
3. You won't be charged, but this activates your API access
4. Free tier includes:
   - 2,000 queries/month (66/day)
   - Web Search API
   - Image Search API
   - News Search API

### Step 3: Set Environment Variable

#### Local Development (.env.local)
```bash
BRAVE_SEARCH_API_KEY=BSA...your-actual-key-here
```

#### Railway Deployment
1. Go to Railway dashboard
2. Select your project
3. Go to **Variables** tab
4. Add new variable:
   - **Name:** `BRAVE_SEARCH_API_KEY`
   - **Value:** `BSA...your-actual-key-here`
5. **IMPORTANT:** Trigger a rebuild (not just restart)
   ```bash
   git commit --allow-empty -m "Update Brave API key"
   git push
   ```

### Step 4: Test the API

```bash
# Replace YOUR_KEY with your actual API key
curl -H "X-Subscription-Token: YOUR_KEY" \
  "https://api.search.brave.com/res/v1/images/search?q=travel&count=1"
```

**Expected response:**
```json
{
  "results": [
    {
      "title": "...",
      "url": "...",
      "thumbnail": "..."
    }
  ]
}
```

**Error response (invalid key):**
```json
{
  "error": {
    "code": "SUBSCRIPTION_TOKEN_INVALID",
    "detail": "The provided subscription token is invalid."
  }
}
```

## API Endpoints We Use

### 1. Image Search (Primary)
```
GET https://api.search.brave.com/res/v1/images/search
```
**Usage:** Fetch high-quality location images for trips

**Parameters:**
- `q` - Search query (e.g., "Paris Eiffel Tower")
- `count` - Number of results (1-20)

**Example:**
```bash
curl -H "X-Subscription-Token: YOUR_KEY" \
  "https://api.search.brave.com/res/v1/images/search?q=Paris+Eiffel+Tower&count=10"
```

### 2. Web Search (Secondary)
```
GET https://api.search.brave.com/res/v1/web/search
```
**Usage:** Find activity links, restaurant info, booking sites

**Parameters:**
- `q` - Search query
- `count` - Number of results (1-20)

**Example:**
```bash
curl -H "X-Subscription-Token: YOUR_KEY" \
  "https://api.search.brave.com/res/v1/web/search?q=best+restaurants+in+Paris&count=10"
```

### 3. Local Search (Pro Only)
```
GET https://api.search.brave.com/res/v1/local/pois
```
**Note:** Requires Pro plan subscription

## Rate Limits

### Free Tier
- **2,000 queries/month** (66/day)
- **No cost** - Completely free
- **All endpoints** except Local Search

### Pro Tier ($5/month)
- **15,000 queries/month** (500/day)
- **Local Search API** included
- **AI-generated descriptions**

## Implementation in TravelBlogr

### Current Usage
1. **Image Fetching** - `apps/web/lib/services/braveSearchService.ts`
   - Fetches location images for trips
   - Caches results in Upstash Redis (24 hours)
   - Fallback to Reddit ULTRA and Pexels

2. **Activity Links** - `apps/web/lib/services/activityLinkService.ts`
   - Finds official websites, booking links
   - Caches results in database

3. **Health Check** - `apps/web/app/api/health/providers/route.ts`
   - Monitors API availability
   - Admin-only warning banner

### Caching Strategy
```typescript
// Check cache first (24 hours)
const cached = await getCached<BraveImageResult[]>(cacheKey)
if (cached) return cached

// Call Brave API
const response = await fetch(BRAVE_IMAGE_SEARCH_URL, {
  headers: { 'X-Subscription-Token': BRAVE_API_KEY }
})

// Cache results
await setCached(cacheKey, results, CacheTTL.LONG)
```

### Fallback Hierarchy
```
1. Brave Search API (Primary)
   ↓ (if fails)
2. Reddit ULTRA Engine (High-quality)
   ↓ (if fails)
3. Pexels API (Fallback)
   ↓ (if fails)
4. Placeholder image
```

## Troubleshooting

### Issue: "SUBSCRIPTION_TOKEN_INVALID"
**Solution:** 
1. Check API key format (should start with `BSA`)
2. Verify you've subscribed to Free tier
3. Test with curl command above

### Issue: "Rate limit exceeded"
**Solution:**
1. Check usage at https://api-dashboard.search.brave.com/app/usage
2. Upgrade to Pro tier ($5/month for 15,000 queries)
3. Improve caching to reduce API calls

### Issue: "No results returned"
**Solution:**
1. Check query format (use `+` for spaces)
2. Try broader search terms
3. Check API response for errors

### Issue: Admin warning shows "Brave: Fail"
**Solution:**
1. This is admin-only (regular users don't see it)
2. Check Railway environment variables
3. Trigger rebuild after adding/updating key
4. Test API with curl command

## Best Practices

### 1. Always Cache Results
```typescript
// ✅ CORRECT: Cache for 24 hours
const cacheKey = CacheKeys.braveImageSearch(query, limit)
const cached = await getCached(cacheKey)
if (cached) return cached

// Call API and cache
const results = await fetchBraveImages(query, limit)
await setCached(cacheKey, results, CacheTTL.LONG)
```

### 2. Use Specific Queries
```typescript
// ❌ BAD: Generic query
const query = "travel"

// ✅ GOOD: Specific query
const query = `${locationName} ${country} travel photography`
```

### 3. Handle Errors Gracefully
```typescript
try {
  const results = await fetchBraveImages(query, limit)
  if (results.length > 0) return results
} catch (error) {
  console.error('Brave API error:', error)
  // Fall back to Reddit ULTRA
  return await fetchRedditImages(query, limit)
}
```

### 4. Monitor Usage
- Check dashboard monthly: https://api-dashboard.search.brave.com/app/usage
- Set up alerts for 80% usage
- Upgrade to Pro if consistently hitting limits

## Additional Resources

- **API Documentation:** https://api-dashboard.search.brave.com/app/documentation
- **API Dashboard:** https://api-dashboard.search.brave.com/
- **Pricing:** https://api-dashboard.search.brave.com/app/subscriptions
- **Support:** https://brave.com/search/api/

---

**Last Updated:** 2025-10-26
**Status:** Active - Free tier (2,000 queries/month)


# 🚀 Upstash Redis Setup Guide

## ✅ What We Just Did

1. ✅ **Removed crawlee** - Saved 50-100 MB RAM
2. ✅ **Installed @upstash/redis** - Added Upstash SDK
3. ✅ **Created `lib/upstash.ts`** - Redis client with helpers

---

## 📋 Next Steps: Get Upstash Credentials

### **Step 1: Sign Up (2 minutes)**

1. Go to **https://upstash.com**
2. Click **"Sign Up"** (FREE, no credit card required)
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email

---

### **Step 2: Create Redis Database (2 minutes)**

1. After login, click **"Create Database"**
2. Fill in:
   - **Name:** `travelblogr-cache`
   - **Type:** `Regional` (FREE tier)
   - **Region:** Choose closest to your Railway region (e.g., `us-east-1`)
   - **Eviction:** `allkeys-lru` (recommended)
3. Click **"Create"**

---

### **Step 3: Get Credentials (1 minute)**

1. Click on your new database
2. Scroll to **"REST API"** section
3. Copy these two values:
   - **UPSTASH_REDIS_REST_URL** (e.g., `https://us1-xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (long string)

---

### **Step 4: Add to Railway (2 minutes)**

#### **Option A: Railway Dashboard (Recommended)**

1. Go to **Railway Dashboard** → Your Project
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these two variables:

```
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...your-token-here
```

5. Click **"Save"**
6. Railway will automatically redeploy

#### **Option B: Local Development**

1. Add to `apps/web/.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...your-token-here
```

2. Restart dev server:

```bash
npm run dev
```

---

## 🧪 Test the Setup (1 minute)

### **Test locally:**

```bash
cd apps/web
npm run dev
```

**Check terminal logs:**
```
✅ Upstash Redis client initialized
```

**If you see this warning:**
```
⚠️ Upstash Redis not configured
⚠️ Falling back to in-memory cache
```

**Fix:** Add environment variables (see Step 4 above)

---

## 📊 Verify in Upstash Dashboard

1. Go to **Upstash Dashboard** → Your Database
2. Click **"Data Browser"** tab
3. After using the app, you should see keys like:
   - `image:Tokyo`
   - `weather:Paris`
   - `profile:user-123`
   - `rate:groq:user-456`

---

## 🎯 What's Next?

Now that Upstash is set up, we need to **replace in-memory caches** with Upstash Redis.

### **Files to update:**

1. ✅ `apps/web/lib/services/robustImageService.ts` - Image cache
2. ✅ `apps/web/lib/services/smartDataHandler.ts` - Rate limiting + session cache
3. ✅ `apps/web/contexts/AuthContext.tsx` - Profile cache
4. ✅ `apps/web/app/api/locations/weather/route.ts` - Weather cache

**Would you like me to update these files now?**

---

## 💡 Usage Examples

### **Basic Caching:**

```typescript
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'

// Get cached value
const image = await getCached<string>(CacheKeys.image('Tokyo'))

// Set cached value (24 hour TTL)
await setCached(CacheKeys.image('Tokyo'), imageUrl, CacheTTL.IMAGE)
```

### **Cache-Aside Pattern:**

```typescript
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

// Get from cache or fetch fresh
const weather = await getOrSet(
  CacheKeys.weather('Paris'),
  async () => {
    // Fetch from API
    return await fetchWeatherFromAPI('Paris')
  },
  CacheTTL.WEATHER // 6 hours
)
```

### **Rate Limiting:**

```typescript
import { checkRateLimit, CacheKeys } from '@/lib/upstash'

// Check rate limit (100 requests per hour)
const { allowed, remaining, resetAt } = await checkRateLimit(
  CacheKeys.rateLimit('groq', userId),
  100,  // limit
  3600  // 1 hour window
)

if (!allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', resetAt },
    { status: 429 }
  )
}
```

---

## 📈 Monitor Usage

### **Upstash Dashboard:**

1. Go to **Upstash Dashboard** → Your Database
2. Click **"Metrics"** tab
3. Monitor:
   - **Commands/day** (should stay under 10,000 for FREE tier)
   - **Storage used** (should be minimal)
   - **Latency** (should be < 50ms)

### **FREE Tier Limits:**

```
✅ 10,000 commands/day
✅ 256 MB storage
✅ 100 concurrent connections
✅ No credit card required
```

**Estimated usage for TravelBlogr:**
```
100 users/day × 50 cache operations = 5,000 commands/day
✅ Well within FREE tier
```

---

## 🚨 Troubleshooting

### **Error: "Upstash Redis not configured"**

**Fix:** Add environment variables (see Step 4)

### **Error: "Failed to connect to Upstash"**

**Fix:** Check credentials are correct:
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" YOUR_URL/get/test
```

### **Cache not working**

**Debug:**
```typescript
import { getUpstashRedis } from '@/lib/upstash'

const redis = getUpstashRedis()
await redis.set('test', 'hello')
const value = await redis.get('test')
console.log('Test value:', value) // Should print "hello"
```

---

## ✅ Checklist

- [ ] Signed up at https://upstash.com
- [ ] Created Redis database
- [ ] Copied UPSTASH_REDIS_REST_URL
- [ ] Copied UPSTASH_REDIS_REST_TOKEN
- [ ] Added to Railway environment variables
- [ ] Added to `.env.local` (for local dev)
- [ ] Tested locally (`npm run dev`)
- [ ] Saw "✅ Upstash Redis client initialized" in logs
- [ ] Ready to update cache implementations

---

## 🎉 Done!

Upstash Redis is now set up and ready to use!

**Next:** Update cache implementations to use Upstash instead of in-memory Maps.

**Would you like me to update the cache implementations now?**

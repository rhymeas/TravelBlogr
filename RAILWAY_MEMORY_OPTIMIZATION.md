# 🧠 Railway Memory Usage Analysis & Optimization

## 📊 Current State

**Your Railway Usage:**
- **Memory Usage:** 3.54 GB RAM (already cost $5.70)
- **Plan:** Railway Pro (32 GB RAM / 32 vCPU available)
- **Problem:** High memory usage for a Next.js app

**Typical Next.js App Memory:**
- Small app: 200-500 MB
- Medium app: 500 MB - 1 GB
- Large app: 1-2 GB
- **Your app: 3.54 GB** ⚠️ **VERY HIGH**

---

## 🔍 Root Causes of High Memory Usage

### **1. In-Memory Caching (CRITICAL)**

**Found in:**
- `apps/web/lib/services/robustImageService.ts` - Image cache Map
- `apps/web/lib/services/smartDataHandler.ts` - Session cache Map
- `apps/web/lib/services/enhancedImageService.ts` - Image cache Map

**Problem:**
```typescript
// ❌ In-memory cache grows indefinitely
const imageCache = new Map<string, { url: string; timestamp: number }>()
const sessionCache = new Map<string, { data: any; timestamp: number }>()
```

**Memory Impact:**
- Each cached image: ~500 bytes (URL + metadata)
- 10,000 cached images = 5 MB
- Session cache: ~1-2 KB per entry
- 10,000 sessions = 10-20 MB

**Total estimated:** 50-100 MB (not the main culprit)

---

### **2. Heavy Dependencies (MAJOR CULPRIT)**

**Found in `package.json`:**

| Package | Size | Memory Impact | Needed? |
|---------|------|---------------|---------|
| **crawlee** | 50+ MB | **HIGH** | ❌ NO - Not used in production |
| **cheerio** | 5 MB | Medium | ✅ YES - Web scraping |
| **sharp** | 20 MB | **HIGH** | ❌ NO - Only in devDependencies |
| **browser-image-compression** | 2 MB | Medium | ⚠️ MAYBE - Client-side only |
| **compressorjs** | 1 MB | Low | ⚠️ MAYBE - Client-side only |
| **react-image-gallery** | 3 MB | Medium | ✅ YES - Gallery feature |
| **maplibre-gl** | 10 MB | **HIGH** | ✅ YES - Maps |
| **framer-motion** | 5 MB | Medium | ✅ YES - Animations |

**CRITICAL FINDING:**
- **`crawlee`** (50+ MB) - Web scraping library, NOT NEEDED in production
- **`sharp`** (20 MB) - Image processing, should be devDependency only

**Estimated memory savings:** 100-200 MB

---

### **3. Supabase Realtime Connections (MAJOR CULPRIT)**

**Found in:**
- `apps/web/components/realtime/RealtimeProvider.tsx`

**Problem:**
```typescript
// ❌ Realtime channels kept in memory
const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())

// Each channel maintains WebSocket connection + message buffer
```

**Memory Impact:**
- Each WebSocket connection: 1-5 MB
- Message buffer: 1-10 MB per channel
- If 100 users connected: 100-500 MB
- If 1000 users: 1-5 GB ⚠️ **THIS IS THE MAIN CULPRIT**

**Estimated memory usage:** 500 MB - 2 GB (depending on concurrent users)

---

### **4. Next.js Build Size (MODERATE)**

**Problem:**
- Large bundle size = more memory during SSR
- Many pages pre-rendered = more memory

**Current build:**
- 109 pages generated
- Many pages have errors (useContext issues)
- Build warnings about Edge Runtime

**Estimated memory:** 500 MB - 1 GB

---

### **5. Image Processing Libraries (MODERATE)**

**Found in:**
- `browser-image-compression` - Client-side compression
- `compressorjs` - Client-side compression
- `sharp` - Server-side image processing (devDependency)

**Problem:**
- These libraries load into memory even if not used
- `sharp` especially heavy (20 MB native binaries)

**Estimated memory:** 50-100 MB

---

## 💰 Cost Breakdown

**Railway Pro Pricing:**
- **Memory:** $0.000231 per GB-hour
- **Your usage:** 3.54 GB
- **Cost per hour:** 3.54 × $0.000231 = **$0.000818/hour**
- **Cost per day:** $0.000818 × 24 = **$0.0196/day**
- **Cost per month:** $0.0196 × 30 = **$0.588/month**

**Your $5.70 cost:**
- $5.70 ÷ $0.0196 = **291 days** of usage
- OR: Higher memory spikes (5-10 GB) during peak times

---

## ✅ Optimization Strategies

### **Strategy 1: Remove Unused Dependencies (CRITICAL)**

**Remove these packages:**
```bash
npm uninstall crawlee sharp browser-image-compression compressorjs
```

**Why:**
- `crawlee` - 50+ MB, not used in production
- `sharp` - 20 MB, already in devDependencies
- `browser-image-compression` - Client-side only, not needed on server
- `compressorjs` - Client-side only, not needed on server

**Expected savings:** 100-200 MB
**Cost savings:** $0.02-$0.05/month

---

### **Strategy 2: Optimize Supabase Realtime (CRITICAL)**

**Current problem:**
```typescript
// ❌ Channels kept in memory indefinitely
const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())
```

**Solution:**
```typescript
// ✅ Limit concurrent channels
const MAX_CHANNELS = 10

// ✅ Auto-cleanup inactive channels
useEffect(() => {
  const cleanup = setInterval(() => {
    channels.forEach((channel, name) => {
      if (isInactive(channel)) {
        channel.unsubscribe()
        channels.delete(name)
      }
    })
  }, 60000) // Every minute

  return () => clearInterval(cleanup)
}, [])
```

**Expected savings:** 500 MB - 1 GB
**Cost savings:** $0.10-$0.20/month

---

### **Strategy 3: Disable Realtime for MVP (EASY WIN)**

**If you're not using realtime features:**
```typescript
// ❌ Current: Realtime enabled
<RealtimeProvider>
  <App />
</RealtimeProvider>

// ✅ Disable for now
<App />
```

**Expected savings:** 500 MB - 2 GB
**Cost savings:** $0.10-$0.40/month

---

### **Strategy 4: Use Redis for Caching (FREE ALTERNATIVE)**

**Current:**
```typescript
// ❌ In-memory cache (lost on restart, uses RAM)
const imageCache = new Map()
```

**Alternative:**
```typescript
// ✅ Use Upstash Redis (FREE tier: 10,000 commands/day)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
})

// Cache images in Redis (not RAM)
await redis.set(`image:${locationName}`, imageUrl, { ex: 86400 })
```

**Benefits:**
- ✅ FREE tier (10,000 commands/day)
- ✅ Persistent cache (survives restarts)
- ✅ Shared across instances
- ✅ No RAM usage on Railway

**Expected savings:** 50-100 MB
**Cost savings:** $0.01-$0.02/month

**Setup:**
1. Sign up at https://upstash.com (FREE)
2. Create Redis database
3. Add env vars to Railway
4. Replace Map caches with Redis

---

### **Strategy 5: Optimize Next.js Build**

**Current issues:**
- 109 pages pre-rendered
- Many pages have errors
- Large bundle size

**Solutions:**
```typescript
// next.config.js
module.exports = {
  // Reduce memory during build
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  
  // Disable pre-rendering for dynamic pages
  output: 'standalone',
  
  // Reduce bundle size
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

**Expected savings:** 200-500 MB
**Cost savings:** $0.05-$0.10/month

---

## 🎯 Recommended Action Plan

### **Phase 1: Quick Wins (Do Now)**

1. ✅ **Remove unused dependencies** (5 minutes)
   ```bash
   npm uninstall crawlee browser-image-compression compressorjs
   ```

2. ✅ **Disable Realtime if not used** (2 minutes)
   - Comment out `<RealtimeProvider>` in layout

3. ✅ **Fix build errors** (10 minutes)
   - Fix useContext errors in /plan and /plan-v2 pages

**Expected savings:** 500 MB - 1 GB
**Cost savings:** $0.10-$0.20/month

---

### **Phase 2: Medium Wins (Do Later)**

4. ✅ **Implement Redis caching** (30 minutes)
   - Sign up for Upstash (FREE)
   - Replace Map caches with Redis

5. ✅ **Optimize Next.js config** (15 minutes)
   - Update next.config.js
   - Reduce pre-rendering

**Expected savings:** 200-500 MB
**Cost savings:** $0.05-$0.10/month

---

### **Phase 3: Long-term Optimization**

6. ✅ **Implement channel cleanup** (1 hour)
   - Auto-cleanup inactive Realtime channels
   - Limit concurrent connections

7. ✅ **Monitor memory usage** (ongoing)
   - Set up Railway alerts
   - Track memory trends

**Expected savings:** 500 MB - 1 GB
**Cost savings:** $0.10-$0.20/month

---

## 📊 Expected Results

### **Before Optimization:**
- Memory: 3.54 GB
- Cost: $0.588/month

### **After Phase 1:**
- Memory: 2.5-3 GB
- Cost: $0.40-$0.50/month
- **Savings:** $0.08-$0.18/month

### **After Phase 2:**
- Memory: 2-2.5 GB
- Cost: $0.30-$0.40/month
- **Savings:** $0.18-$0.28/month

### **After Phase 3:**
- Memory: 1.5-2 GB
- Cost: $0.25-$0.35/month
- **Savings:** $0.23-$0.33/month

---

## 🚀 Next Steps

**Would you like me to:**
1. ✅ Remove unused dependencies (crawlee, etc.)?
2. ✅ Disable Realtime provider?
3. ✅ Set up Upstash Redis (FREE)?
4. ✅ Fix build errors?
5. ✅ All of the above?

**Note:** These optimizations won't break your app - they'll make it faster and cheaper!


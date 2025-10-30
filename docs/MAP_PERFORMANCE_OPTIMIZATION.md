# 🚀 Map & Routing Performance Optimization Guide

## 📊 Current Performance Issues

### **Problem: Slow Map Loading**
- Multiple map libraries loaded (MapLibre, Leaflet, Mapbox shims)
- Heavy routing services (Valhalla, OSRM, ORS)
- Multiple API calls on page load
- Large bundle sizes for map components

### **Current Bundle Analysis:**
```
MapLibre GL: ~500KB
Leaflet: ~150KB
Turf.js: ~300KB
Routing Services: ~200KB
POI Services: ~150KB
---
TOTAL: ~1.3MB just for maps!
```

---

## ✅ Optimization Strategy

### **1. Code Splitting & Lazy Loading (CRITICAL)**

**Problem:** All map code loads upfront, even if user doesn't scroll to map

**Solution:** Dynamic imports with Next.js

```typescript
// ❌ BAD: Loads immediately
import { ScenicRouteSelector } from '@/components/maps/ScenicRouteSelector'

// ✅ GOOD: Loads only when needed
const ScenicRouteSelector = dynamic(
  () => import('@/components/maps/ScenicRouteSelector'),
  { 
    ssr: false,
    loading: () => <MapSkeleton />
  }
)
```

**Impact:** 
- Initial bundle: -500KB
- Time to Interactive: -2-3 seconds
- First Contentful Paint: Unchanged

---

### **2. Remove Unused Map Libraries**

**Current State:**
- MapLibre GL ✅ (KEEP - actively used)
- Leaflet ❌ (REMOVE - shimmed, not used)
- Mapbox GL ❌ (REMOVE - shimmed, replaced by MapLibre)
- react-map-gl ❌ (REMOVE - not used)

**Action:**
```bash
npm uninstall leaflet react-leaflet react-map-gl
```

**Impact:**
- Bundle size: -450KB
- Fewer shims needed
- Cleaner codebase

---

### **3. Optimize Routing Service Calls**

**Problem:** Multiple routing providers called sequentially

**Current Flow:**
```
User requests route
  → Check Valhalla
  → Fallback to OSRM
  → Fallback to ORS
  → Each tries multiple strategies
  → 5-10 API calls total!
```

**Optimized Flow:**
```
User requests route
  → Check Upstash cache (< 10ms) ✅
  → If miss: Single Valhalla call
  → Cache result for 30 days
  → 1 API call total!
```

**Implementation:**
```typescript
// Add Upstash caching to routing service
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

export async function getRoute(coords, profile, preference) {
  const cacheKey = CacheKeys.route(coords, profile, preference)
  
  return await getOrSet(
    cacheKey,
    async () => {
      // Only called on cache miss
      return await getValhallaRoute(coords, preference)
    },
    CacheTTL.ROUTE // 30 days
  )
}
```

**Impact:**
- Cache hit: < 10ms (vs 500-2000ms)
- 99% fewer API calls
- Instant route display

---

### **4. Preload Critical Map Data**

**Problem:** Map tiles load after JavaScript loads

**Solution:** Preconnect to tile servers

```html
<!-- Add to app/layout.tsx -->
<link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
<link rel="preconnect" href="https://b.basemaps.cartocdn.com" />
<link rel="preconnect" href="https://c.basemaps.cartocdn.com" />
<link rel="dns-prefetch" href="https://api.stadiamaps.com" />
```

**Impact:**
- Map tiles load 200-500ms faster
- Smoother initial render

---

### **5. Optimize POI Fetching**

**Problem:** POI service makes 8 API calls per route

**Current Layers:**
1. Database
2. OpenTripMap
3. Overpass API
4. WikiVoyage
5. Wikipedia
6. Wikimedia
7. Pexels/Unsplash
8. GROQ AI

**Optimization:**
```typescript
// Use Upstash cache for POI data
const pois = await getOrSet(
  CacheKeys.poi(locationName, travelType),
  async () => {
    // Only fetch if not cached
    return await fetchComprehensivePOIs(...)
  },
  CacheTTL.POI // 7 days
)
```

**Impact:**
- Cache hit: < 10ms (vs 2-5 seconds)
- 95% fewer API calls
- Instant POI display

---

### **6. Use Web Workers for Heavy Computations**

**Problem:** Route calculations block main thread

**Solution:** Offload to Web Worker

```typescript
// lib/workers/routeWorker.ts
self.addEventListener('message', async (e) => {
  const { coords, preference } = e.data
  const route = await calculateRoute(coords, preference)
  self.postMessage(route)
})

// Usage in component
const worker = new Worker('/workers/routeWorker.js')
worker.postMessage({ coords, preference })
worker.onmessage = (e) => setRoute(e.data)
```

**Impact:**
- UI stays responsive during calculations
- No janky scrolling
- Better perceived performance

---

### **7. Implement Progressive Loading**

**Strategy:**
1. Show map skeleton immediately
2. Load map library (500ms)
3. Render base map (200ms)
4. Load route data from cache (10ms)
5. Render route (100ms)
6. Load POIs from cache (10ms)
7. Render POI markers (50ms)

**Total:** ~870ms (vs 3-5 seconds currently)

---

### **8. Optimize MapLibre Configuration**

```typescript
// Reduce initial tile quality for faster load
const map = new maplibregl.Map({
  container: mapContainer.current,
  style: {
    version: 8,
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 18 // Reduce from 22 to 18
      }
    },
    layers: [...]
  },
  maxZoom: 16, // Limit zoom for faster rendering
  renderWorldCopies: false // Don't render duplicate worlds
})
```

**Impact:**
- Fewer tiles to load
- Faster initial render
- Smoother panning

---

## 📈 Expected Performance Improvements

### **Before Optimization:**
- Initial Load: 5-8 seconds
- Route Calculation: 2-5 seconds
- POI Loading: 2-5 seconds
- Total Time to Interactive: 9-18 seconds

### **After Optimization:**
- Initial Load: 1-2 seconds (lazy loading)
- Route Calculation: < 10ms (Upstash cache)
- POI Loading: < 10ms (Upstash cache)
- Total Time to Interactive: 1-2 seconds

**Improvement: 80-90% faster!**

---

## 🛠️ Implementation Priority

### **Phase 1: Quick Wins (1 hour)**
1. ✅ Add dynamic imports to map components
2. ✅ Add Upstash caching to routing service
3. ✅ Add preconnect links to layout
4. ✅ Remove unused map libraries

**Expected Impact:** 60-70% faster

### **Phase 2: Medium Effort (2-3 hours)**
1. ✅ Optimize MapLibre configuration
2. ✅ Implement progressive loading
3. ✅ Add loading skeletons
4. ✅ Optimize POI caching

**Expected Impact:** 80-85% faster

### **Phase 3: Advanced (4-6 hours)**
1. ⏳ Web Workers for route calculations
2. ⏳ Service Worker for offline maps
3. ⏳ IndexedDB for client-side caching
4. ⏳ Image lazy loading for POI markers

**Expected Impact:** 90-95% faster

---

## 📝 Monitoring & Metrics

### **Key Metrics to Track:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

### **Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest
- Vercel Analytics
- Custom performance tracking

---

## 🎯 Success Criteria

- ✅ Map loads in < 2 seconds
- ✅ Routes display in < 100ms (cached)
- ✅ POIs display in < 100ms (cached)
- ✅ No layout shift when map loads
- ✅ Smooth 60fps scrolling
- ✅ Works offline (Phase 3)



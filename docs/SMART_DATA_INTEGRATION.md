# Smart Data Integration Plan

## Overview

Integration plan for GROQ POI orchestration with `/plan` and `/blog` systems using smart data handling to avoid API overheat and storage bloat.

## Core Principles

1. **Cache First** - Always check cache before external APIs
2. **Small Batches** - Max 10 items per batch to avoid rate limits
3. **Progressive Loading** - Show cached data immediately, enhance progressively
4. **Compress Everything** - Store only essential data in database
5. **Deduplicate Aggressively** - Never fetch same data twice in same session

## Data Flow Architecture

```
User Request
    ↓
Session Cache (in-memory, 5min TTL)
    ↓ (miss)
Database Cache (7-30 days TTL)
    ↓ (miss)
External APIs (rate-limited, batched)
    ↓
GROQ Validation (optional, cached 3 days)
    ↓
Compress & Store
    ↓
Return to User
```

## Integration Points

### 1. `/plan` System Integration

**File:** `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts`

**Changes:**
```typescript
import { smartFetch, processBatch, loadProgressively } from '@/lib/services/smartDataHandler'
import { getComprehensivePOIs } from '@/lib/services/comprehensivePOIService'
import { generatePOISearchStrategy, validatePOIRelevance, identifyPOIGaps, fillPOIGaps } from '@/lib/services/groqPOIOrchestrator'

// STEP 1: Generate GROQ search strategy (cached 3 days)
const strategy = await smartFetch(
  `strategy_${from}_${to}_${travelType}`,
  'groqValidation',
  () => generatePOISearchStrategy({
    from, to, stops, travelType, budget, days, transportMode, interests
  }),
  { useServerClient: true }
)

// STEP 2: Fetch POIs in small batches (max 10 locations at a time)
const allPOIs = await processBatch(
  [from, ...stops, to],
  async (location) => {
    return await smartFetch(
      `pois_${location}_${travelType}`,
      'pois',
      () => getComprehensivePOIs({
        locationName: location,
        travelType,
        budget,
        limit: 20
      }, true),
      { useServerClient: true, apiName: 'opentripmap' }
    )
  },
  {
    batchSize: 5,  // Process 5 locations at a time
    delayMs: 1000, // 1 second delay between batches
    onProgress: (current, total) => {
      console.log(`📍 POI progress: ${current}/${total}`)
    }
  }
)

// STEP 3: GROQ validation (cached 3 days)
const validatedPOIs = await smartFetch(
  `validated_${from}_${to}_${travelType}`,
  'groqValidation',
  () => validatePOIRelevance(allPOIs.flat(), tripContext),
  { useServerClient: true, apiName: 'groq' }
)

// STEP 4: Identify and fill gaps (cached 1 day)
const gaps = await identifyPOIGaps(validatedPOIs, tripContext)
const filledPOIs = gaps.length > 0
  ? await smartFetch(
      `gapfill_${from}_${to}_${travelType}`,
      'groqGapFill',
      () => fillPOIGaps(gaps, tripContext),
      { useServerClient: true, apiName: 'groq' }
    )
  : []

// STEP 5: Compress and store
const compressedPOIs = compressArray(
  [...validatedPOIs, ...filledPOIs],
  50, // Max 50 POIs
  (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
)

// Store in trip_plan.plan_data (compressed)
structuredContext.pois = compressForStorage(compressedPOIs, 10)
```

### 2. `/blog` System Integration

**File:** `apps/web/lib/batch/application/use-cases/GenerateBlogPostsFromTripsUseCase.ts`

**Changes:**
```typescript
import { smartFetch, processBatch } from '@/lib/services/smartDataHandler'
import { enrichBlogPostDays } from '@/lib/services/blogEnrichmentService'

// STEP 1: Fetch trips in small batches
const trips = await processBatch(
  tripIds,
  async (tripId) => {
    return await supabase
      .from('trips')
      .select('*, posts(*), trip_plan(*)')
      .eq('id', tripId)
      .single()
  },
  {
    batchSize: 10,  // Process 10 trips at a time
    delayMs: 500,   // 500ms delay between batches
    onProgress: (current, total) => {
      console.log(`📚 Trip progress: ${current}/${total}`)
    }
  }
)

// STEP 2: Enrich blog posts with POIs (use cache)
const enrichedTrips = await processBatch(
  trips.map(t => t.data),
  async (trip) => {
    // Extract unique locations from trip
    const locations = [...new Set(
      trip.posts.map(p => p.location).filter(Boolean)
    )]
    
    // Fetch POIs for each location (cached)
    const locationPOIs = await processBatch(
      locations,
      async (location) => {
        return await smartFetch(
          `blog_pois_${location}`,
          'pois',
          () => enrichLocation(location, true),
          { useServerClient: true }
        )
      },
      {
        batchSize: 5,
        delayMs: 500
      }
    )
    
    return { ...trip, enrichedLocations: locationPOIs }
  },
  {
    batchSize: 5,  // Process 5 trips at a time
    delayMs: 1000
  }
)

// STEP 3: Generate blog posts with GROQ Batch API (50% cost savings)
const batchRequests = enrichedTrips.map(trip => ({
  custom_id: trip.id,
  method: 'POST',
  url: '/v1/chat/completions',
  body: {
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: buildBlogPrompt(trip) // Uses enriched POI data
    }]
  }
}))

// Submit to GROQ Batch API
const batchId = await groq.batches.create({
  input_file_id: uploadedFileId,
  endpoint: '/v1/chat/completions',
  completion_window: '24h'
})
```

### 3. Frontend Progressive Loading

**File:** `apps/web/app/plan/page.tsx`

**Changes:**
```typescript
import { loadProgressively } from '@/lib/services/smartDataHandler'

const [pois, setPOIs] = useState<ProgressiveData<POI>>({
  immediate: [],
  enhanced: [],
  validated: [],
  loading: true,
  progress: 0
})

useEffect(() => {
  loadProgressively(
    `plan_${from}_${to}`,
    {
      // STEP 1: Load cached POIs immediately
      immediate: async () => {
        const cached = await fetch('/api/pois/cached', {
          method: 'POST',
          body: JSON.stringify({ locations: [from, to] })
        }).then(r => r.json())
        return cached.pois || []
      },
      
      // STEP 2: Fetch from external APIs
      enhanced: async () => {
        const external = await fetch('/api/pois/fetch', {
          method: 'POST',
          body: JSON.stringify({ locations: [from, to], travelType })
        }).then(r => r.json())
        return external.pois || []
      },
      
      // STEP 3: GROQ validation
      validated: async () => {
        const validated = await fetch('/api/pois/validate', {
          method: 'POST',
          body: JSON.stringify({ pois: [...pois.immediate, ...pois.enhanced], tripContext })
        }).then(r => r.json())
        return validated.pois || []
      }
    },
    (data) => setPOIs(data)
  )
}, [from, to, travelType])

// UI shows progressive enhancement
return (
  <div>
    {pois.loading && <ProgressBar value={pois.progress} />}
    
    {/* Show immediate results */}
    <POIList pois={pois.immediate} label="Cached POIs" />
    
    {/* Show enhanced results */}
    {pois.enhanced.length > 0 && (
      <POIList pois={pois.enhanced} label="Discovered POIs" />
    )}
    
    {/* Show validated results */}
    {pois.validated.length > 0 && (
      <POIList pois={pois.validated} label="Recommended POIs" badge="GROQ Validated" />
    )}
  </div>
)
```

## API Routes

### 1. `/api/pois/cached` - Get Cached POIs

```typescript
// apps/web/app/api/pois/cached/route.ts
import { getFromDatabaseCache } from '@/lib/services/smartDataHandler'

export async function POST(request: NextRequest) {
  const { locations } = await request.json()
  
  const cachedPOIs = await Promise.all(
    locations.map(location =>
      getFromDatabaseCache({
        type: 'pois',
        key: location,
        useServerClient: true
      })
    )
  )
  
  return NextResponse.json({
    pois: cachedPOIs.filter(Boolean).flat()
  })
}
```

### 2. `/api/pois/fetch` - Fetch Fresh POIs

```typescript
// apps/web/app/api/pois/fetch/route.ts
import { smartFetch, processBatch } from '@/lib/services/smartDataHandler'
import { getComprehensivePOIs } from '@/lib/services/comprehensivePOIService'

export async function POST(request: NextRequest) {
  const { locations, travelType, budget } = await request.json()
  
  const pois = await processBatch(
    locations,
    async (location) => {
      return await smartFetch(
        `pois_${location}_${travelType}`,
        'pois',
        () => getComprehensivePOIs({
          locationName: location,
          travelType,
          budget,
          limit: 20
        }, true),
        { useServerClient: true, apiName: 'opentripmap' }
      )
    },
    {
      batchSize: 5,
      delayMs: 1000
    }
  )
  
  return NextResponse.json({ pois: pois.flat() })
}
```

### 3. `/api/pois/validate` - GROQ Validation

```typescript
// apps/web/app/api/pois/validate/route.ts
import { smartFetch } from '@/lib/services/smartDataHandler'
import { validatePOIRelevance } from '@/lib/services/groqPOIOrchestrator'

export async function POST(request: NextRequest) {
  const { pois, tripContext } = await request.json()
  
  const validated = await smartFetch(
    `validated_${tripContext.from}_${tripContext.to}_${tripContext.travelType}`,
    'groqValidation',
    () => validatePOIRelevance(pois, tripContext),
    { useServerClient: true, apiName: 'groq' }
  )
  
  return NextResponse.json({ pois: validated })
}
```

## Storage Optimization

### Database Schema Updates

```sql
-- Add compression metadata to external_api_cache
ALTER TABLE external_api_cache
ADD COLUMN compressed BOOLEAN DEFAULT FALSE,
ADD COLUMN original_size INTEGER,
ADD COLUMN compressed_size INTEGER;

-- Add index for cleanup queries
CREATE INDEX idx_cache_cleanup 
ON external_api_cache(updated_at, api_source);
```

### Automatic Cleanup Cron Job

```typescript
// apps/web/app/api/cron/cleanup-cache/route.ts
import { cleanupExpiredCache, getStorageStats } from '@/lib/services/smartDataHandler'

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get stats before cleanup
  const statsBefore = await getStorageStats(true)
  
  // Cleanup expired cache
  const deletedCount = await cleanupExpiredCache(true)
  
  // Get stats after cleanup
  const statsAfter = await getStorageStats(true)
  
  return NextResponse.json({
    success: true,
    deletedCount,
    sizeBefore: statsBefore.totalSize,
    sizeAfter: statsAfter.totalSize,
    savedBytes: statsBefore.totalSize - statsAfter.totalSize
  })
}
```

## Monitoring Dashboard

### Storage Metrics

```typescript
// apps/web/app/dashboard/admin/storage/page.tsx
import { getStorageStats } from '@/lib/services/smartDataHandler'

export default async function StoragePage() {
  const stats = await getStorageStats(true)
  
  return (
    <div>
      <h1>Storage Metrics</h1>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Total Size"
          value={formatBytes(stats.totalSize)}
          trend={stats.totalSize < 100 * 1024 * 1024 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Item Count"
          value={stats.itemCount}
        />
        <MetricCard
          title="Oldest Entry"
          value={formatDate(stats.oldestEntry)}
        />
      </div>
    </div>
  )
}
```

## Cost Projections

### Current System (No GROQ Orchestration)
- Storage: ~10MB (free tier)
- API Calls: ~1000/day (free tier)
- **Total: $0/month**

### With GROQ Orchestration (Smart Caching)
- Storage: ~50MB (still free tier)
- API Calls: ~500/day (50% reduction due to caching)
- GROQ Calls: ~100/day (cached 3 days)
- **Total: ~$3/month** (100 trips/day × $0.001/trip)

### At Scale (1000 trips/day)
- Storage: ~200MB (still free tier)
- API Calls: ~2000/day (80% cache hit rate)
- GROQ Calls: ~300/day (cached 3 days)
- **Total: ~$9/month** (1000 trips/day × $0.009/trip)

## Implementation Checklist

- [ ] Create `smartDataHandler.ts` service
- [ ] Add API routes: `/api/pois/cached`, `/api/pois/fetch`, `/api/pois/validate`
- [ ] Update `/plan` to use progressive loading
- [ ] Update `/blog` to use batch processing
- [ ] Add database schema updates
- [ ] Create cleanup cron job
- [ ] Build storage monitoring dashboard
- [ ] Test with 100 trips
- [ ] Monitor costs and cache hit rates
- [ ] Optimize based on metrics

## Success Metrics

- **Cache Hit Rate:** >80% (target: 90%)
- **API Calls Reduction:** >50% (target: 70%)
- **Storage Size:** <100MB (target: <50MB)
- **Response Time:** <2s for cached, <5s for fresh
- **Cost per Trip:** <$0.01 (target: <$0.005)


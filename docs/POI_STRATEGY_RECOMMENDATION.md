# POI Strategy Recommendation

## Executive Summary

Based on analysis of our existing system and requirements, here's the recommended POI discovery strategy that leverages GROQ as an intelligent orchestrator, not just a fallback.

## Current System Analysis

### ✅ What We Already Have

1. **Comprehensive Trip Data Service** (`comprehensiveTripDataService.ts`)
   - Already fetches POIs from multiple sources
   - Compresses data for AI processing
   - Formats for GROQ prompts

2. **Route POI Service** (`routePOIService.ts`)
   - Fetches POIs along route
   - Categorizes by experience type (quick stops, meal breaks, major attractions)
   - Enriches with detour time calculations

3. **GROQ AI Service** (`GroqAIService.ts`)
   - Already receives POI data in prompts
   - Generates contextual itineraries
   - Has retry logic and error handling

4. **POI Enrichment Service** (`poiEnrichmentService.ts`)
   - Estimates visit duration
   - Classifies micro-experiences
   - Suggests best time of day

### ⚠️ Current Gaps

1. **No GROQ fallback when external APIs fail**
2. **No travel type filtering** (business, leisure, adventure, etc.)
3. **No accommodation-specific discovery**
4. **No intelligent gap detection** (e.g., "missing overnight stop")
5. **No POI validation** (is this POI actually relevant for this trip?)

## Recommended Architecture

### **Three-Tier System**

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: DATA SOURCES                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Database │  │OpenTrip  │  │ Overpass │  │Foursquare│   │
│  │   POIs   │  │   Map    │  │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              TIER 2: GROQ INTELLIGENT LAYER                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  GROQ AI as Orchestrator & Validator               │     │
│  │  • Analyzes trip context (A→B→C, travel type)      │     │
│  │  • Validates POI relevance                         │     │
│  │  • Fills gaps (missing accommodations, meals)      │     │
│  │  • Ranks by contextual importance                  │     │
│  │  • Generates fallback suggestions when APIs fail   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                TIER 3: ENRICHED OUTPUT                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  POIs    │  │Accommoda-│  │  Meals   │  │Activities│   │
│  │ Ranked   │  │  tions   │  │ Planned  │  │ Suggested│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **GROQ's Role: Intelligent Orchestrator**

Instead of just being a fallback, GROQ should:

1. **Pre-Process Trip Context**
   ```typescript
   // GROQ analyzes the trip and generates search strategy
   const strategy = await groq.chat.completions.create({
     messages: [{
       role: 'user',
       content: `Analyze this trip and suggest POI search strategy:
       - Route: ${from} → ${stops.join(' → ')} → ${to}
       - Travel type: ${travelType}
       - Duration: ${days} days
       - Transport: ${transportMode}
       
       What types of POIs should we prioritize for each leg?
       What accommodations are needed?
       What are the critical gaps to fill?`
     }],
     model: 'llama-3.3-70b-versatile',
     response_format: { type: 'json_object' }
   })
   ```

2. **Validate & Filter POI Results**
   ```typescript
   // After fetching POIs from all sources, GROQ validates relevance
   const validated = await groq.chat.completions.create({
     messages: [{
       role: 'user',
       content: `Filter these ${pois.length} POIs for relevance:
       Trip context: ${travelType} trip, ${budget} budget
       POIs: ${JSON.stringify(pois)}
       
       Return only POIs that are:
       1. Appropriate for ${travelType} travelers
       2. Within ${budget} budget
       3. Logistically feasible given route and time
       4. Highly rated or culturally significant`
     }]
   })
   ```

3. **Fill Critical Gaps**
   ```typescript
   // GROQ identifies and fills missing content
   const gaps = await groq.chat.completions.create({
     messages: [{
       role: 'user',
       content: `Identify gaps in this trip plan:
       - Overnight stops: ${overnightStops.length}
       - Meal options: ${restaurants.length}
       - Activities: ${activities.length}
       
       For each gap, suggest specific POIs/accommodations.`
     }]
   })
   ```

## Implementation Plan

### **Phase 1: Enhance Comprehensive POI Service** (Week 1)

**File:** `apps/web/lib/services/comprehensivePOIService.ts`

**Changes:**
1. Add travel type parameter to all functions
2. Add GROQ pre-processing step
3. Add GROQ validation step
4. Add gap detection logic

**New Functions:**
```typescript
// GROQ analyzes trip context and generates search strategy
async function generatePOISearchStrategy(
  route: RouteInfo,
  travelType: TravelType,
  budget: Budget
): Promise<POISearchStrategy>

// GROQ validates POI relevance
async function validatePOIRelevance(
  pois: POI[],
  tripContext: TripContext
): Promise<POI[]>

// GROQ identifies and fills gaps
async function fillPOIGaps(
  currentPOIs: POI[],
  tripContext: TripContext
): Promise<POI[]>
```

### **Phase 2: Add Free Tourism APIs** (Week 1-2)

**New File:** `apps/web/lib/services/externalPOIProviders.ts`

**Providers to Add:**
1. **Foursquare Places API** - Restaurants, cafes, nightlife
2. **Yelp Fusion API** - Reviews, ratings, photos
3. **Wikidata** - Structured attraction data
4. **Nominatim** - Enhanced geocoding

**Implementation:**
```typescript
export async function fetchFromFoursquare(
  coordinates: { lat: number; lng: number },
  categories: string[],
  radius: number
): Promise<POI[]>

export async function fetchFromYelp(
  location: string,
  categories: string[],
  limit: number
): Promise<POI[]>

export async function fetchFromWikidata(
  location: string,
  types: string[]
): Promise<POI[]>
```

### **Phase 3: Travel Type Taxonomy** (Week 2)

**New File:** `apps/web/lib/types/travelTypes.ts`

**Define:**
```typescript
export type TravelType = 
  | 'road-trip'      // Scenic routes, viewpoints, roadside attractions
  | 'city-break'     // Museums, restaurants, nightlife, shopping
  | 'adventure'      // Hiking, outdoor activities, nature
  | 'cultural'       // Historical sites, museums, local experiences
  | 'nature'         // Parks, beaches, natural landmarks
  | 'beach'          // Coastal activities, water sports, resorts
  | 'family'         // Kid-friendly attractions, playgrounds, family restaurants
  | 'romantic'       // Fine dining, scenic spots, couples activities
  | 'business'       // Hotels, conference centers, business dining
  | 'backpacking'    // Hostels, budget eats, free attractions
  | 'luxury'         // High-end hotels, fine dining, exclusive experiences

export interface TravelTypeProfile {
  type: TravelType
  priorityCategories: POICategory[]
  budgetRange: [number, number]
  pacePreference: 'slow' | 'moderate' | 'fast'
  accommodationTypes: string[]
  mealPreferences: string[]
}

// Map travel types to POI priorities
export const TRAVEL_TYPE_PROFILES: Record<TravelType, TravelTypeProfile> = {
  'road-trip': {
    type: 'road-trip',
    priorityCategories: ['viewpoint', 'nature', 'roadside-attraction', 'diner'],
    budgetRange: [50, 150],
    pacePreference: 'moderate',
    accommodationTypes: ['motel', 'hotel', 'sleek'],
    mealPreferences: ['casual-dining', 'fast-food', 'local-spots']
  },
  // ... other profiles
}
```

### **Phase 4: Context-Aware POI Resolution** (Week 2-3)

**Update:** `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts`

**Changes:**
1. Add travel type to command
2. Pass travel type to POI services
3. Use GROQ for gap detection
4. Validate POI relevance with GROQ

**New Flow:**
```typescript
// 1. GROQ analyzes trip context
const strategy = await generatePOISearchStrategy(routeInfo, command.travelType, command.budget)

// 2. Fetch POIs from all sources based on strategy
const rawPOIs = await fetchPOIsFromAllSources(strategy)

// 3. GROQ validates and ranks POIs
const validatedPOIs = await validatePOIRelevance(rawPOIs, tripContext)

// 4. GROQ identifies gaps
const gaps = await identifyPOIGaps(validatedPOIs, tripContext)

// 5. GROQ fills gaps
const filledPOIs = await fillPOIGaps(validatedPOIs, gaps, tripContext)

// 6. Pass enriched POIs to main GROQ itinerary generation
const itinerary = await groqAIService.generateItinerary(context, filledPOIs)
```

### **Phase 5: Caching & Monitoring** (Week 3-4)

**New File:** `apps/web/lib/services/poiCacheService.ts`

**Features:**
1. Cache GROQ-validated POIs by location + travel type
2. Cache GROQ search strategies
3. Monitor API failure rates
4. Track GROQ usage and costs

**Implementation:**
```typescript
export async function getCachedPOIs(
  location: string,
  travelType: TravelType,
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<POI[] | null>

export async function cachePOIs(
  location: string,
  travelType: TravelType,
  pois: POI[]
): Promise<void>

export async function trackAPIFailure(
  provider: string,
  error: Error
): Promise<void>

export async function getAPIHealthMetrics(): Promise<APIHealthMetrics>
```

## Decision Points

### **1. When does GROQ get called?**

**Recommendation:** GROQ should be called at THREE stages:

1. **Pre-Processing (Always)** - Analyze trip context, generate search strategy
2. **Validation (Always)** - Filter and rank POI results
3. **Gap Filling (Conditional)** - Only when critical gaps detected

**Rationale:** 
- Pre-processing is cheap (small prompt, fast response)
- Validation ensures quality (worth the cost)
- Gap filling only when needed (cost-effective)

### **2. What's the GROQ usage pattern?**

**Recommendation:** Hybrid approach

1. **One comprehensive analysis per trip** (pre-processing)
2. **Individual validation per leg** (if legs have different contexts)
3. **Batch gap filling** (one call for all gaps)

**Rationale:**
- Comprehensive analysis gives global context
- Per-leg validation handles different travel types per leg
- Batch gap filling is more efficient than individual calls

### **3. How do you handle GROQ latency?**

**Recommendation:** Progressive enhancement

1. **Show database POIs immediately** (instant)
2. **Stream external API results** (1-3 seconds)
3. **Enhance with GROQ validation** (3-5 seconds)
4. **Fill gaps with GROQ** (5-8 seconds)

**Implementation:**
```typescript
// Progressive loading
const [pois, setPOIs] = useState<POI[]>([])
const [loading, setLoading] = useState(true)

// 1. Load database POIs (instant)
const dbPOIs = await fetchDatabasePOIs()
setPOIs(dbPOIs)

// 2. Load external APIs (parallel)
const externalPOIs = await Promise.all([
  fetchOpenTripMap(),
  fetchOverpass(),
  fetchFoursquare()
])
setPOIs([...dbPOIs, ...externalPOIs.flat()])

// 3. GROQ validation (background)
const validated = await validateWithGROQ([...dbPOIs, ...externalPOIs.flat()])
setPOIs(validated)

// 4. GROQ gap filling (background)
const filled = await fillGapsWithGROQ(validated)
setPOIs(filled)
setLoading(false)
```

### **4. What's the caching strategy?**

**Recommendation:** Multi-level caching

1. **Database POIs** - Permanent (until manually updated)
2. **External API results** - 7 days (locations don't change often)
3. **GROQ validations** - 3 days (travel trends change)
4. **GROQ gap fills** - 1 day (highly contextual)

**Implementation:**
```typescript
// Cache key structure
const cacheKey = {
  location: 'rome',
  travelType: 'cultural',
  budget: 'moderate',
  timestamp: Date.now()
}

// Cache expiration logic
const isCacheValid = (cached: CachedPOIs) => {
  const age = Date.now() - cached.timestamp
  const maxAge = {
    database: Infinity,
    external: 7 * 24 * 60 * 60 * 1000,
    groqValidation: 3 * 24 * 60 * 60 * 1000,
    groqGapFill: 1 * 24 * 60 * 60 * 1000
  }
  return age < maxAge[cached.source]
}
```

## Cost Analysis

### **Current System (No GROQ Orchestration)**
- OpenTripMap: FREE (1000 req/day)
- Overpass: FREE (rate-limited)
- Database: FREE (our data)
- **Total: $0/month**

### **Recommended System (GROQ Orchestration)**
- External APIs: FREE (same as above)
- GROQ Pre-Processing: ~$0.001/trip (small prompt)
- GROQ Validation: ~$0.003/trip (medium prompt)
- GROQ Gap Filling: ~$0.005/trip (large prompt)
- **Total: ~$0.009/trip**

**For 1000 trips/month:** ~$9/month
**For 10,000 trips/month:** ~$90/month

**ROI:** 
- Better POI relevance → Higher user satisfaction
- Fewer API failures → Better reliability
- Intelligent gap filling → More complete itineraries
- **Worth the cost!**

## Next Steps

1. **Week 1:** Implement GROQ pre-processing and validation
2. **Week 2:** Add Foursquare and Yelp APIs
3. **Week 3:** Implement travel type taxonomy
4. **Week 4:** Add caching and monitoring
5. **Week 5:** Test with real trips, gather metrics
6. **Week 6:** Optimize based on data

## Success Metrics

Track these KPIs:

1. **POI Coverage Rate** - % of trips with sufficient POIs for each leg
2. **GROQ Fallback Rate** - How often GROQ fills gaps
3. **API Failure Rate** - How often external APIs fail
4. **User Satisfaction** - Ratings on POI relevance
5. **Cost per Trip** - GROQ usage costs
6. **Cache Hit Rate** - % of POIs served from cache

**Target Goals:**
- POI Coverage: >95%
- GROQ Fallback: <20%
- API Failure: <5%
- User Satisfaction: >4.5/5
- Cost per Trip: <$0.01
- Cache Hit Rate: >70%


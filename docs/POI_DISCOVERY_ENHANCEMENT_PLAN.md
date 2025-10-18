# 🗺️ Route-Based POI Discovery System - Enhancement Plan

**Status:** Planning Phase  
**Goal:** Enhance current POI system with intelligent route-based discovery while keeping everything intact  
**Approach:** Phased implementation with backward compatibility

---

## 📊 Current System Analysis

### ✅ What We Have (Keep Intact!)

1. **Routing System** (`apps/web/lib/services/routingService.ts`)
   - OpenRouteService (primary) - 2,000 requests/day
   - OSRM Demo Server (fallback) - Unlimited
   - Database caching for routes
   - Returns full route geometry (GeoJSON LineString)

2. **POI Fetching** (`apps/web/lib/services/routePOIService.ts`)
   - OpenTripMap API integration
   - Route sampling every 50km
   - POI search within 10km radius
   - Deduplication and ranking by rating
   - Categories: interesting_places, tourist_facilities, natural, foods

3. **Location Discovery** (`apps/web/lib/itinerary/infrastructure/services/LocationDiscoveryService.ts`)
   - Overpass API for nature/parks
   - OpenTripMap for activities
   - Database location suggestions

4. **Trip Generation** (`apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts`)
   - Groq AI (Llama 3.3 70B) for itinerary generation
   - Database caching for itineraries
   - Fetches POIs along route after routing
   - Stores in `structuredContext.poisAlongRoute`

5. **UI Components**
   - `RoutePoiSection.tsx` - Displays POIs along route
   - `HorizontalActivityCards.tsx` - Swipable POI cards
   - `ItineraryModal.tsx` - Main trip planning interface

### ⚠️ Current Limitations

1. **No Time-Based Filtering**
   - POIs not filtered by daily driving time limits
   - No consideration of visit duration
   - No detour time calculation

2. **No User Interest Matching**
   - POIs not ranked by user interests
   - No personalization based on trip preferences
   - Generic category filtering only

3. **No Route Segmentation**
   - POIs not grouped by day/segment
   - No overnight stop suggestions
   - No "quick stop" vs "extended visit" classification

4. **No Detour Optimization**
   - POIs shown even if far from route
   - No calculation of actual detour time
   - No "worth the detour" scoring

5. **Limited POI Metadata**
   - No visit duration estimates
   - No opening hours
   - No seasonal availability
   - No current events/closures

---

## 🎯 Enhancement Goals

### Phase 1: Smart Route Segmentation (Week 1)
**Goal:** Break routes into daily segments based on driving time limits

### Phase 2: Time-Aware POI Filtering (Week 2)
**Goal:** Filter POIs by detour time and visit duration

### Phase 3: Interest-Based Ranking (Week 3)
**Goal:** Rank POIs by user interests and relevance

### Phase 4: Micro-Experience Categories (Week 4)
**Goal:** Classify POIs by visit type (quick stop, food break, cultural immersion)

### Phase 5: AI-Powered Optimization (Week 5)
**Goal:** Use Groq AI to optimize POI selection and sequencing

---

## 📋 Implementation Plan

### **PHASE 1: Smart Route Segmentation** 🟢 READY TO START

**Objective:** Break routes into daily segments based on driving time limits

**Files to Create:**
- `apps/web/lib/services/routeSegmentationService.ts`

**Files to Modify:**
- `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts` (add segmentation)
- `apps/web/app/api/routing/get-route/route.ts` (return segments)

**New Data Structures:**
```typescript
interface RouteSegment {
  day: number
  startLocation: {
    coordinates: [number, number]
    name: string
    estimatedDepartureTime: string
  }
  endLocation: {
    coordinates: [number, number]
    name: string
    estimatedArrivalTime: string
  }
  geometry: number[][] // Segment geometry
  drivingTimeHours: number
  distanceKm: number
  recommendedPOIs: RoutePOI[]
}

interface SegmentationParams {
  routeGeometry: number[][]
  totalDistanceKm: number
  totalDurationHours: number
  maxDrivingHoursPerDay: number // Default: 4-6 hours
  startDate: string
  locations: Array<{ name: string; coordinates: [number, number] }>
}
```

**Implementation Steps:**

1. **Create `routeSegmentationService.ts`:**
   ```typescript
   export function segmentRouteByDrivingTime(
     params: SegmentationParams
   ): RouteSegment[]
   
   export function calculateOvernightStops(
     segments: RouteSegment[]
   ): OvernightStop[]
   
   export function estimateArrivalTimes(
     segments: RouteSegment[],
     startTime: string
   ): RouteSegment[]
   ```

2. **Integrate into `GenerateItineraryUseCase.ts`:**
   - After route calculation, segment the route
   - Store segments in `structuredContext.routeSegments`
   - Pass segments to POI fetching

3. **Update POI fetching to use segments:**
   - Fetch POIs per segment (not entire route)
   - Associate POIs with specific days
   - Filter by segment geometry

**Testing:**
- [ ] Test with 2-location trip (no segmentation needed)
- [ ] Test with 1000km trip (should create 2-3 segments)
- [ ] Test with custom `maxDrivingHoursPerDay`
- [ ] Verify segments don't overlap
- [ ] Verify total distance matches route distance

**Backward Compatibility:**
- ✅ Existing POI fetching still works
- ✅ No breaking changes to API
- ✅ Segments are optional (only if `maxDrivingHoursPerDay` provided)

---

### **PHASE 2: Time-Aware POI Filtering** 🟡 AFTER PHASE 1

**Objective:** Filter POIs by detour time and visit duration

**Files to Create:**
- `apps/web/lib/services/detourCalculationService.ts`
- `apps/web/lib/services/poiEnrichmentService.ts`

**Files to Modify:**
- `apps/web/lib/services/routePOIService.ts` (add detour calculation)
- `apps/web/components/itinerary/RoutePoiSection.tsx` (show detour time)

**New Data Structures:**
```typescript
interface EnrichedPOI extends RoutePOI {
  detourTimeMinutes: number // Actual detour time from route
  visitDurationMinutes: number // Estimated visit time
  category: POICategory // Enhanced categories
  worthTheDetour: boolean // Detour < 15min OR rating > 4.5
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'
}

type POICategory = 
  | 'quick-stop' // 15-30 min (scenic overlook, photo op)
  | 'food-break' // 30-60 min (restaurant, cafe)
  | 'stretch-break' // 45-90 min (short hike, museum)
  | 'cultural-immersion' // 2-3 hours (festival, workshop)
  | 'overnight-experience' // 4+ hours (city exploration)
```

**Implementation Steps:**

1. **Create `detourCalculationService.ts`:**
   ```typescript
   export async function calculateDetourTime(
     routeGeometry: number[][],
     poiCoordinates: [number, number],
     transportMode: string
   ): Promise<number> // Returns detour time in minutes
   
   export function isWorthTheDetour(
     detourMinutes: number,
     poiRating: number,
     userInterests: string[]
   ): boolean
   ```

2. **Create `poiEnrichmentService.ts`:**
   ```typescript
   export async function enrichPOIWithMetadata(
     poi: RoutePOI
   ): Promise<EnrichedPOI>
   
   export function estimateVisitDuration(
     poiCategory: string,
     poiKinds: string
   ): number // Returns minutes
   
   export function categorizePOI(
     visitDuration: number,
     poiKinds: string
   ): POICategory
   ```

3. **Update `routePOIService.ts`:**
   - Call enrichment service for each POI
   - Filter by `maxDetourMinutes` parameter
   - Sort by `worthTheDetour` score

4. **Update UI to show detour info:**
   - "15 min detour" badge
   - "Quick stop (30 min)" label
   - "Worth the detour!" indicator

**Testing:**
- [ ] Test detour calculation accuracy
- [ ] Test visit duration estimates
- [ ] Test "worth the detour" scoring
- [ ] Verify performance (caching needed?)

**Backward Compatibility:**
- ✅ Enrichment is optional
- ✅ Falls back to basic POI data if enrichment fails
- ✅ No breaking changes to existing POI structure

---

### **PHASE 3: Interest-Based Ranking** 🟡 AFTER PHASE 2

**Objective:** Rank POIs by user interests and relevance

**Files to Create:**
- `apps/web/lib/services/poiRankingService.ts`

**Files to Modify:**
- `apps/web/lib/services/routePOIService.ts` (add ranking)
- `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts` (pass interests)

**New Data Structures:**
```typescript
interface POIRelevanceScore {
  poi: EnrichedPOI
  score: number // 0-1
  breakdown: {
    interestMatch: number // 0-1
    ratingScore: number // 0-1
    detourPenalty: number // 0-1
    timeSlotBonus: number // 0-1
  }
}

interface UserInterestProfile {
  interests: string[] // ['nature', 'food', 'history']
  pace: 'relaxed' | 'moderate' | 'packed'
  budget: 'budget' | 'moderate' | 'luxury'
  visitDurationPreference: 'quick' | 'moderate' | 'extended'
}
```

**Implementation Steps:**

1. **Create `poiRankingService.ts`:**
   ```typescript
   export function calculateRelevanceScore(
     poi: EnrichedPOI,
     userProfile: UserInterestProfile,
     currentTime: string
   ): POIRelevanceScore
   
   export function rankPOIs(
     pois: EnrichedPOI[],
     userProfile: UserInterestProfile
   ): POIRelevanceScore[]
   
   export function filterByPace(
     pois: POIRelevanceScore[],
     pace: 'relaxed' | 'moderate' | 'packed'
   ): POIRelevanceScore[]
   ```

2. **Scoring Algorithm:**
   ```typescript
   score = (
     interestMatch * 0.4 +      // 40% weight
     ratingScore * 0.3 +         // 30% weight
     (1 - detourPenalty) * 0.2 + // 20% weight
     timeSlotBonus * 0.1         // 10% weight
   )
   
   // Interest match: Jaccard similarity
   interestMatch = intersection(poi.kinds, user.interests) / 
                   union(poi.kinds, user.interests)
   
   // Rating score: Normalized 0-1
   ratingScore = poi.rating / 5
   
   // Detour penalty: Exponential decay
   detourPenalty = 1 - exp(-detourMinutes / 30)
   
   // Time slot bonus: Match current time
   timeSlotBonus = poi.timeSlot === currentTimeSlot ? 1 : 0
   ```

3. **Update trip generation:**
   - Pass user interests to POI fetching
   - Rank POIs before displaying
   - Show top 20 by relevance score

**Testing:**
- [ ] Test interest matching accuracy
- [ ] Test scoring algorithm fairness
- [ ] Test with different user profiles
- [ ] Verify performance with 100+ POIs

**Backward Compatibility:**
- ✅ Ranking is optional
- ✅ Falls back to rating-only sorting
- ✅ No breaking changes

---

### **PHASE 4: Micro-Experience Categories** 🟡 AFTER PHASE 3

**Objective:** Classify POIs by visit type and enhance discovery

**Files to Create:**
- `apps/web/lib/services/microExperienceService.ts`
- `apps/web/components/itinerary/MicroExperienceCard.tsx`

**Files to Modify:**
- `apps/web/components/itinerary/RoutePoiSection.tsx` (add category tabs)
- `apps/web/components/ui/HorizontalActivityCards.tsx` (add micro-experience styling)

**New Data Structures:**
```typescript
interface MicroExperience {
  poi: EnrichedPOI
  category: MicroExperienceCategory
  icon: string
  color: string
  tagline: string // "Perfect photo op" | "Local favorite" | "Hidden gem"
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'
  seasonalAvailability: 'year-round' | 'summer' | 'winter' | 'spring' | 'fall'
  crowdLevel: 'quiet' | 'moderate' | 'busy'
}

type MicroExperienceCategory =
  | 'scenic-overlook'    // 15-30 min, photo opportunities
  | 'roadside-attraction' // 15-30 min, quirky stops
  | 'local-diner'        // 30-60 min, authentic food
  | 'farmers-market'     // 30-60 min, local products
  | 'short-hike'         // 45-90 min, nature walks
  | 'historic-site'      // 45-90 min, cultural learning
  | 'quirky-museum'      // 45-90 min, unique experiences
  | 'artisan-workshop'   // 2-3 hours, hands-on activities
  | 'local-festival'     // 2-3 hours, cultural immersion
  | 'guided-tour'        // 2-3 hours, in-depth exploration
```

**Implementation Steps:**

1. **Create `microExperienceService.ts`:**
   ```typescript
   export function classifyMicroExperience(
     poi: EnrichedPOI
   ): MicroExperience

   export function generateTagline(
     category: MicroExperienceCategory,
     rating: number
   ): string

   export function estimateCrowdLevel(
     poi: EnrichedPOI,
     currentDate: Date
   ): 'quiet' | 'moderate' | 'busy'
   ```

2. **Create `MicroExperienceCard.tsx`:**
   - Compact card design
   - Category icon and color
   - Tagline and best time
   - "Add to trip" button

3. **Update `RoutePoiSection.tsx`:**
   - Add category filter tabs
   - Group POIs by micro-experience type
   - Show category-specific icons

4. **Category Mapping:**
   ```typescript
   const categoryMapping = {
     'scenic-overlook': {
       icon: '🏞️',
       color: 'bg-blue-500',
       keywords: ['viewpoint', 'overlook', 'scenic', 'vista']
     },
     'local-diner': {
       icon: '🍽️',
       color: 'bg-orange-500',
       keywords: ['restaurant', 'diner', 'cafe', 'bistro']
     },
     // ... more categories
   }
   ```

**Testing:**
- [ ] Test category classification accuracy
- [ ] Test tagline generation
- [ ] Test crowd level estimation
- [ ] Verify UI responsiveness

**Backward Compatibility:**
- ✅ Micro-experiences are optional enhancement
- ✅ Falls back to basic POI display
- ✅ No breaking changes

---

### **PHASE 5: AI-Powered Optimization** 🔴 FINAL PHASE

**Objective:** Use Groq AI to optimize POI selection and sequencing

**Files to Create:**
- `apps/web/lib/services/aiPOIOptimizerService.ts`

**Files to Modify:**
- `apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts` (add AI optimization)
- `apps/web/lib/itinerary/application/services/GroqAIService.ts` (add POI optimization prompt)

**New Data Structures:**
```typescript
interface OptimizedPOISequence {
  day: number
  segment: RouteSegment
  recommendedPOIs: Array<{
    poi: MicroExperience
    suggestedTime: string // "10:30 AM"
    reason: string // "Perfect morning light for photos"
    alternativePOIs: MicroExperience[] // If this is closed/busy
  }>
  totalDetourTime: number
  totalVisitTime: number
  estimatedArrivalAtDestination: string
}

interface AIOptimizationPrompt {
  routeSegment: RouteSegment
  availablePOIs: MicroExperience[]
  userProfile: UserInterestProfile
  constraints: {
    maxDetourMinutes: number
    maxTotalStopTime: number
    mustArriveBy: string
  }
}
```

**Implementation Steps:**

1. **Create `aiPOIOptimizerService.ts`:**
   ```typescript
   export async function optimizePOISequence(
     prompt: AIOptimizationPrompt
   ): Promise<OptimizedPOISequence>

   export function generateOptimizationPrompt(
     segment: RouteSegment,
     pois: MicroExperience[],
     userProfile: UserInterestProfile
   ): string
   ```

2. **Groq AI Prompt Template:**
   ```
   You are a travel route optimizer. Given this road trip segment:

   Route: {startCity} to {endCity}
   Driving time: {drivingHours} hours
   Departure: {departureTime}
   Must arrive by: {arrivalDeadline}

   User preferences:
   - Interests: {interests}
   - Pace: {pace}
   - Max detour: {maxDetour} minutes

   Available POIs along route:
   {poiList with categories, detour times, visit durations}

   Select 3-5 POIs that:
   1. Match user interests
   2. Fit within time constraints
   3. Create a balanced experience (mix of quick stops and longer visits)
   4. Minimize backtracking
   5. Consider best time of day for each POI

   Return JSON with:
   - Selected POIs in optimal sequence
   - Suggested arrival time at each
   - Reason for selection
   - Alternative POIs if primary is closed
   ```

3. **Integration:**
   - Call AI optimizer after POI ranking
   - Store optimized sequence in `structuredContext`
   - Display in UI with suggested times

4. **Fallback Strategy:**
   - If AI fails, use rule-based optimization
   - Cache AI responses for similar routes
   - Rate limit: 1 optimization per segment

**Testing:**
- [ ] Test AI prompt quality
- [ ] Test with various user profiles
- [ ] Test fallback when AI unavailable
- [ ] Verify time calculations accuracy
- [ ] Test caching effectiveness

**Backward Compatibility:**
- ✅ AI optimization is optional
- ✅ Falls back to ranked POI list
- ✅ No breaking changes

---

## 🔧 Technical Stack (Using Existing Infrastructure)

### APIs (Already Integrated)
- ✅ **OpenTripMap** - POI data (5,000 requests/day free)
- ✅ **OpenRouteService** - Routing (2,000 requests/day free)
- ✅ **OSRM** - Fallback routing (unlimited)
- ✅ **Overpass API** - Nature/parks data (unlimited)
- ✅ **Groq AI** - Llama 3.3 70B (fast, cheap)

### Database (Supabase)
- ✅ **route_cache** - Cached routes
- ✅ **cached_itineraries** - Cached trip plans
- 🆕 **poi_cache** - Cache enriched POI data (NEW)
- 🆕 **micro_experiences** - Curated micro-experiences (NEW)

### Services (Existing)
- ✅ `routingService.ts` - Route calculation
- ✅ `routePOIService.ts` - POI fetching
- ✅ `locationDataService.ts` - Location enrichment
- ✅ `GroqAIService.ts` - AI integration

### Services (New)
- 🆕 `routeSegmentationService.ts` - Phase 1
- 🆕 `detourCalculationService.ts` - Phase 2
- 🆕 `poiEnrichmentService.ts` - Phase 2
- 🆕 `poiRankingService.ts` - Phase 3
- 🆕 `microExperienceService.ts` - Phase 4
- 🆕 `aiPOIOptimizerService.ts` - Phase 5

---

## 📊 Implementation Timeline

### Week 1: Phase 1 - Route Segmentation
- **Day 1-2:** Create `routeSegmentationService.ts`
- **Day 3-4:** Integrate into `GenerateItineraryUseCase.ts`
- **Day 5:** Testing and bug fixes

### Week 2: Phase 2 - Time-Aware Filtering
- **Day 1-2:** Create `detourCalculationService.ts`
- **Day 3-4:** Create `poiEnrichmentService.ts`
- **Day 5:** Update UI to show detour info

### Week 3: Phase 3 - Interest-Based Ranking
- **Day 1-2:** Create `poiRankingService.ts`
- **Day 3-4:** Implement scoring algorithm
- **Day 5:** Testing with various user profiles

### Week 4: Phase 4 - Micro-Experience Categories
- **Day 1-2:** Create `microExperienceService.ts`
- **Day 3-4:** Create `MicroExperienceCard.tsx`
- **Day 5:** Update `RoutePoiSection.tsx`

### Week 5: Phase 5 - AI Optimization
- **Day 1-2:** Create `aiPOIOptimizerService.ts`
- **Day 3-4:** Integrate with Groq AI
- **Day 5:** Testing and optimization

---

## ✅ Success Criteria

### Phase 1
- [ ] Routes segmented by daily driving time
- [ ] Overnight stops suggested
- [ ] POIs grouped by day
- [ ] No breaking changes to existing system

### Phase 2
- [ ] Detour time calculated for each POI
- [ ] Visit duration estimated
- [ ] "Worth the detour" scoring works
- [ ] UI shows detour info

### Phase 3
- [ ] POIs ranked by user interests
- [ ] Relevance score calculated
- [ ] Top 20 POIs shown
- [ ] Performance acceptable (< 2s)

### Phase 4
- [ ] POIs classified into micro-experiences
- [ ] Category filtering works
- [ ] Taglines generated
- [ ] UI shows category-specific styling

### Phase 5
- [ ] AI optimization generates valid sequences
- [ ] Suggested times calculated
- [ ] Fallback works when AI unavailable
- [ ] Caching reduces API calls

---

## 🚀 Next Steps

### Immediate Actions (This Week)
1. **Review this plan** - Get feedback from team
2. **Set up database tables** - Create `poi_cache` and `micro_experiences`
3. **Start Phase 1** - Create `routeSegmentationService.ts`

### Questions to Answer
- [ ] What's the ideal `maxDrivingHoursPerDay`? (4-6 hours?)
- [ ] Should we cache enriched POI data? (Yes, in Supabase)
- [ ] How many POIs to show per segment? (5-10?)
- [ ] Should AI optimization be opt-in or default? (Opt-in for Pro mode)

---

## 📝 Notes

- **Keep current system intact** - All enhancements are additive
- **Backward compatibility** - Existing trips still work
- **Performance first** - Cache aggressively, optimize queries
- **User experience** - Show loading states, fallback gracefully
- **Cost awareness** - Monitor API usage, implement rate limiting



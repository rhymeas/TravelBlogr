# 🎯 POI Discovery Enhancement - Implementation Batches

**Goal:** Implement route-based POI discovery in small, testable batches  
**Approach:** Each batch is independently deployable and adds value

---

## 📦 BATCH 1: Route Segmentation Foundation (3-4 hours)

### Objective
Break routes into daily segments based on driving time limits

### Files to Create
1. `apps/web/lib/services/routeSegmentationService.ts` (150 lines)

### Implementation Steps

**Step 1.1: Create Service File** (30 min)
```typescript
// apps/web/lib/services/routeSegmentationService.ts

export interface RouteSegment {
  day: number
  startLocation: { coordinates: [number, number]; name: string }
  endLocation: { coordinates: [number, number]; name: string }
  geometry: number[][]
  drivingTimeHours: number
  distanceKm: number
  estimatedDepartureTime: string
  estimatedArrivalTime: string
}

export interface SegmentationParams {
  routeGeometry: number[][]
  totalDistanceKm: number
  totalDurationHours: number
  maxDrivingHoursPerDay: number
  startDate: string
  locations: Array<{ name: string; coordinates: [number, number] }>
}

export function segmentRouteByDrivingTime(
  params: SegmentationParams
): RouteSegment[] {
  // Implementation
}
```

**Step 1.2: Implement Segmentation Logic** (1 hour)
- Calculate cumulative distance along route
- Split at `maxDrivingHoursPerDay` intervals
- Extract geometry for each segment
- Calculate times for each segment

**Step 1.3: Add Tests** (30 min)
- Test with 2-location trip (no segmentation)
- Test with 1000km trip (2-3 segments)
- Test with custom driving hours

**Step 1.4: Integrate into Trip Generation** (1 hour)
```typescript
// apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts

// After route calculation (line ~240)
if (command.maxTravelHoursPerDay) {
  const { segmentRouteByDrivingTime } = await import('../../../services/routeSegmentationService')
  const segments = segmentRouteByDrivingTime({
    routeGeometry: route.geometry,
    totalDistanceKm: route.distanceKm,
    totalDurationHours: route.durationHours,
    maxDrivingHoursPerDay: command.maxTravelHoursPerDay,
    startDate: command.startDate,
    locations: locationsData
  })
  structuredContext.routeSegments = segments
}
```

**Step 1.5: Update API Response** (30 min)
- Add `routeSegments` to API response
- Update TypeScript types
- Test API endpoint

### Testing Checklist
- [ ] Segments don't overlap
- [ ] Total distance matches route distance
- [ ] Times calculated correctly
- [ ] Works with 2, 3, 5+ locations
- [ ] Backward compatible (no segments if param not provided)

### Deployment
- ✅ No breaking changes
- ✅ Feature flag: Only active if `maxTravelHoursPerDay` provided
- ✅ Can deploy independently

---

## 📦 BATCH 2: Detour Time Calculation (2-3 hours)

### Objective
Calculate actual detour time for each POI using routing API

### Files to Create
1. `apps/web/lib/services/detourCalculationService.ts` (100 lines)

### Implementation Steps

**Step 2.1: Create Service File** (30 min)
```typescript
// apps/web/lib/services/detourCalculationService.ts

export interface DetourCalculation {
  poiCoordinates: [number, number]
  detourTimeMinutes: number
  detourDistanceKm: number
  worthTheDetour: boolean
}

export async function calculateDetourTime(
  routeGeometry: number[][],
  poiCoordinates: [number, number],
  transportMode: string
): Promise<number> {
  // 1. Find closest point on route to POI
  // 2. Calculate route: closestPoint -> POI -> nextPoint
  // 3. Compare with direct route: closestPoint -> nextPoint
  // 4. Return difference in minutes
}
```

**Step 2.2: Implement Closest Point Algorithm** (45 min)
- Use Haversine distance to find closest route point
- Handle edge cases (POI at start/end of route)

**Step 2.3: Implement Detour Routing** (1 hour)
- Call routing API for detour route
- Cache results to avoid duplicate calls
- Handle API failures gracefully

**Step 2.4: Add "Worth the Detour" Logic** (30 min)
```typescript
export function isWorthTheDetour(
  detourMinutes: number,
  poiRating: number,
  userInterests: string[],
  poiKinds: string
): boolean {
  // Quick detours always worth it
  if (detourMinutes < 10) return true
  
  // High-rated POIs worth longer detours
  if (poiRating >= 4.5 && detourMinutes < 20) return true
  
  // Interest match makes it worth it
  const interestMatch = userInterests.some(i => poiKinds.includes(i))
  if (interestMatch && detourMinutes < 15) return true
  
  return false
}
```

**Step 2.5: Integrate into POI Fetching** (30 min)
```typescript
// apps/web/lib/services/routePOIService.ts

// After fetching POIs
for (const poi of pois) {
  poi.detourTimeMinutes = await calculateDetourTime(
    routeGeometry,
    [poi.longitude, poi.latitude],
    transportMode
  )
  poi.worthTheDetour = isWorthTheDetour(
    poi.detourTimeMinutes,
    poi.rating,
    userInterests,
    poi.kinds
  )
}
```

### Testing Checklist
- [ ] Detour time accurate (within 10%)
- [ ] Caching works (no duplicate API calls)
- [ ] Handles API failures gracefully
- [ ] "Worth the detour" logic makes sense
- [ ] Performance acceptable (< 3s for 20 POIs)

### Deployment
- ✅ No breaking changes
- ✅ Detour calculation is optional
- ✅ Falls back to distance-based filtering if calculation fails

---

## 📦 BATCH 3: POI Enrichment & Visit Duration (2 hours)

### Objective
Estimate visit duration and classify POIs by experience type

### Files to Create
1. `apps/web/lib/services/poiEnrichmentService.ts` (120 lines)

### Implementation Steps

**Step 3.1: Create Service File** (30 min)
```typescript
// apps/web/lib/services/poiEnrichmentService.ts

export interface EnrichedPOI extends RoutePOI {
  visitDurationMinutes: number
  category: POICategory
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'
  detourTimeMinutes?: number
  worthTheDetour?: boolean
}

export type POICategory = 
  | 'quick-stop'
  | 'food-break'
  | 'stretch-break'
  | 'cultural-immersion'

export function estimateVisitDuration(
  poiKinds: string,
  poiCategory: string
): number {
  // Mapping of POI types to visit durations
}
```

**Step 3.2: Implement Visit Duration Logic** (45 min)
```typescript
const durationMapping = {
  // Quick stops (15-30 min)
  'viewpoint': 20,
  'monument': 25,
  'photo_spot': 15,
  
  // Food breaks (30-60 min)
  'restaurant': 60,
  'cafe': 30,
  'food_market': 45,
  
  // Stretch breaks (45-90 min)
  'museum': 75,
  'park': 60,
  'historic_site': 90,
  
  // Cultural immersion (2-3 hours)
  'festival': 180,
  'workshop': 150,
  'guided_tour': 120
}
```

**Step 3.3: Implement Category Classification** (30 min)
```typescript
export function categorizePOI(
  visitDuration: number,
  poiKinds: string
): POICategory {
  if (visitDuration <= 30) return 'quick-stop'
  if (visitDuration <= 60 && poiKinds.includes('food')) return 'food-break'
  if (visitDuration <= 90) return 'stretch-break'
  return 'cultural-immersion'
}
```

**Step 3.4: Implement Time Slot Logic** (15 min)
```typescript
export function suggestTimeSlot(
  poiKinds: string,
  category: POICategory
): 'morning' | 'afternoon' | 'evening' | 'anytime' {
  if (poiKinds.includes('museum')) return 'morning'
  if (poiKinds.includes('restaurant')) return 'evening'
  if (poiKinds.includes('viewpoint')) return 'afternoon'
  return 'anytime'
}
```

**Step 3.5: Integrate into POI Fetching** (30 min)
```typescript
// apps/web/lib/services/routePOIService.ts

export async function enrichPOI(poi: RoutePOI): Promise<EnrichedPOI> {
  const visitDuration = estimateVisitDuration(poi.kinds, poi.category)
  const category = categorizePOI(visitDuration, poi.kinds)
  const timeSlot = suggestTimeSlot(poi.kinds, category)
  
  return {
    ...poi,
    visitDurationMinutes: visitDuration,
    category,
    timeSlot
  }
}
```

### Testing Checklist
- [ ] Visit durations reasonable
- [ ] Categories make sense
- [ ] Time slots appropriate
- [ ] Works with various POI types
- [ ] Performance acceptable

### Deployment
- ✅ No breaking changes
- ✅ Enrichment is optional
- ✅ Falls back to basic POI data if enrichment fails

---

## 📦 BATCH 4: Interest-Based Ranking (2-3 hours)

### Objective
Rank POIs by user interests and relevance

### Files to Create
1. `apps/web/lib/services/poiRankingService.ts` (150 lines)

### Implementation Steps

**Step 4.1: Create Service File** (30 min)
```typescript
// apps/web/lib/services/poiRankingService.ts

export interface POIRelevanceScore {
  poi: EnrichedPOI
  score: number // 0-1
  breakdown: {
    interestMatch: number
    ratingScore: number
    detourPenalty: number
    timeSlotBonus: number
  }
}

export interface UserInterestProfile {
  interests: string[]
  pace: 'relaxed' | 'moderate' | 'packed'
  budget: 'budget' | 'moderate' | 'luxury'
}
```

**Step 4.2: Implement Scoring Algorithm** (1 hour)
```typescript
export function calculateRelevanceScore(
  poi: EnrichedPOI,
  userProfile: UserInterestProfile,
  currentTime?: string
): POIRelevanceScore {
  // Interest match (Jaccard similarity)
  const poiKeywords = poi.kinds.split(',')
  const intersection = userProfile.interests.filter(i => 
    poiKeywords.some(k => k.includes(i))
  ).length
  const union = new Set([...userProfile.interests, ...poiKeywords]).size
  const interestMatch = intersection / union
  
  // Rating score (normalized)
  const ratingScore = (poi.rating || 0) / 5
  
  // Detour penalty (exponential decay)
  const detourPenalty = poi.detourTimeMinutes 
    ? 1 - Math.exp(-poi.detourTimeMinutes / 30)
    : 0
  
  // Time slot bonus
  const currentHour = currentTime ? new Date(currentTime).getHours() : 12
  const timeSlotBonus = matchesTimeSlot(poi.timeSlot, currentHour) ? 1 : 0
  
  // Weighted score
  const score = (
    interestMatch * 0.4 +
    ratingScore * 0.3 +
    (1 - detourPenalty) * 0.2 +
    timeSlotBonus * 0.1
  )
  
  return {
    poi,
    score,
    breakdown: { interestMatch, ratingScore, detourPenalty, timeSlotBonus }
  }
}
```

**Step 4.3: Implement Ranking Function** (30 min)
```typescript
export function rankPOIs(
  pois: EnrichedPOI[],
  userProfile: UserInterestProfile
): POIRelevanceScore[] {
  return pois
    .map(poi => calculateRelevanceScore(poi, userProfile))
    .sort((a, b) => b.score - a.score)
}
```

**Step 4.4: Integrate into Trip Generation** (1 hour)
```typescript
// apps/web/lib/itinerary/application/use-cases/GenerateItineraryUseCase.ts

const userProfile: UserInterestProfile = {
  interests: command.interests || [],
  pace: 'moderate',
  budget: command.budget || 'moderate'
}

const rankedPOIs = rankPOIs(enrichedPOIs, userProfile)
const topPOIs = rankedPOIs.slice(0, 20)
```

### Testing Checklist
- [ ] Scoring algorithm fair
- [ ] Interest matching works
- [ ] Ranking makes sense
- [ ] Performance acceptable (< 1s for 100 POIs)
- [ ] Works with empty interests

### Deployment
- ✅ No breaking changes
- ✅ Ranking is optional
- ✅ Falls back to rating-only sorting

---

## 📦 BATCH 5: UI Enhancements (3-4 hours)

### Objective
Update UI to show enriched POI data

### Files to Modify
1. `apps/web/components/itinerary/RoutePoiSection.tsx`
2. `apps/web/components/ui/HorizontalActivityCards.tsx`

### Implementation Steps

**Step 5.1: Add Detour Time Badge** (30 min)
```typescript
// RoutePoiSection.tsx

<div className="flex items-center gap-2 text-xs">
  {poi.detourTimeMinutes && (
    <Badge variant="outline" className="bg-blue-50">
      {poi.detourTimeMinutes} min detour
    </Badge>
  )}
  {poi.worthTheDetour && (
    <Badge variant="default" className="bg-teal-500">
      Worth it! ⭐
    </Badge>
  )}
</div>
```

**Step 5.2: Add Visit Duration** (30 min)
```typescript
<div className="flex items-center gap-1">
  <Clock className="h-3 w-3" />
  <span>{poi.visitDurationMinutes} min visit</span>
</div>
```

**Step 5.3: Add Category Icons** (1 hour)
```typescript
const categoryIcons = {
  'quick-stop': '📸',
  'food-break': '🍽️',
  'stretch-break': '🚶',
  'cultural-immersion': '🎭'
}

<div className="flex items-center gap-2">
  <span className="text-2xl">{categoryIcons[poi.category]}</span>
  <span className="text-xs font-medium capitalize">
    {poi.category.replace('-', ' ')}
  </span>
</div>
```

**Step 5.4: Add Time Slot Indicator** (30 min)
```typescript
{poi.timeSlot !== 'anytime' && (
  <Badge variant="secondary">
    Best: {poi.timeSlot}
  </Badge>
)}
```

**Step 5.5: Update HorizontalActivityCards** (1 hour)
- Add detour time to card
- Add visit duration
- Add category badge
- Add "worth the detour" indicator

### Testing Checklist
- [ ] UI shows all new fields
- [ ] Badges styled correctly
- [ ] Icons display properly
- [ ] Responsive on mobile
- [ ] No layout shift

### Deployment
- ✅ Graceful degradation (works without enriched data)
- ✅ No breaking changes

---

## 🎯 Deployment Strategy

### Batch 1 → Production
- Deploy route segmentation
- Monitor performance
- Gather user feedback

### Batch 2 → Production
- Deploy detour calculation
- Monitor API usage
- Optimize caching

### Batch 3 → Production
- Deploy POI enrichment
- Verify visit durations
- Adjust mappings based on feedback

### Batch 4 → Production
- Deploy interest-based ranking
- A/B test scoring algorithm
- Tune weights based on user engagement

### Batch 5 → Production
- Deploy UI enhancements
- Monitor user interactions
- Iterate on design

---

## ✅ Success Metrics

### Batch 1
- [ ] 90%+ of routes segmented correctly
- [ ] No performance degradation
- [ ] Zero breaking changes

### Batch 2
- [ ] Detour times within 10% accuracy
- [ ] < 3s to calculate detours for 20 POIs
- [ ] 80%+ cache hit rate

### Batch 3
- [ ] Visit durations reasonable (user survey)
- [ ] Categories make sense (user survey)
- [ ] < 1s to enrich 50 POIs

### Batch 4
- [ ] Ranked POIs more relevant (A/B test)
- [ ] 20%+ increase in POI engagement
- [ ] < 1s to rank 100 POIs

### Batch 5
- [ ] UI loads in < 2s
- [ ] No layout shift
- [ ] Mobile responsive



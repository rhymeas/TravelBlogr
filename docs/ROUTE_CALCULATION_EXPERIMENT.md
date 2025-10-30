# Route Calculation Strategy Experiment

**Date Started:** 2025-01-27  
**Status:** 🧪 ITERATION 1 - TESTING IN PROGRESS  
**Purpose:** Find the most efficient and accurate route calculation approach for TravelBlogr

---

## 🎯 Experiment Overview

### Objective
Test different route calculation approaches to determine which method provides:
1. **Most accurate routes** - Routes that make sense geographically
2. **Best performance** - Fast response times with minimal API calls
3. **Highest quality** - Routes that match user expectations for each route type

### Hypothesis
Different route types (Fastest, Shortest, Scenic) require different optimization strategies, and the effectiveness varies by:
- Geographic region (mountains, coast, desert, etc.)
- Number of waypoints (2-point vs 3-point routes)
- Distance (short vs long routes)
- Road infrastructure (developed vs developing countries)

---

## 🧪 Testing Methodology

### Test Cases (Iteration 1)
**5 diverse global locations × 3 route types = 15 total route calculations**

#### Test Case 1: European Alps Road Trip 🏔️
- **Route:** Munich → Innsbruck → Zurich
- **Type:** Mountain route (3 points)
- **Distance:** ~400-500 km
- **Challenge:** Mountain passes, scenic routes, multiple countries

#### Test Case 2: California Coast 🌊
- **Route:** San Francisco → Monterey
- **Type:** Coastal route (2 points)
- **Distance:** ~180-200 km
- **Challenge:** Coastal highways, scenic options (Highway 1 vs 101)

#### Test Case 3: Australian Outback 🏜️
- **Route:** Sydney → Canberra → Melbourne
- **Type:** Desert/inland route (3 points)
- **Distance:** ~900-1000 km
- **Challenge:** Long distances, limited road options

#### Test Case 4: Japan Scenic Route 🗾
- **Route:** Tokyo → Mount Fuji → Kyoto
- **Type:** Island route (3 points)
- **Distance:** ~500-600 km
- **Challenge:** Dense road network, toll roads, scenic mountain routes

#### Test Case 5: South African Garden Route 🦁
- **Route:** Cape Town → Knysna → Port Elizabeth
- **Type:** Safari/coastal route (3 points)
- **Distance:** ~700-800 km
- **Challenge:** Coastal scenic route, wildlife areas

### Route Types Tested

#### 1. Fastest Route ⚡
- **Goal:** Minimize travel time
- **Expected:** Major highways, toll roads, direct paths
- **API Preference:** `fastest`
- **Use Case:** Business travel, time-sensitive trips

#### 2. Shortest Route 📏
- **Goal:** Minimize distance
- **Expected:** Most direct path, may use smaller roads
- **API Preference:** `shortest`
- **Use Case:** Fuel efficiency, budget travel

#### 3. Scenic Route 🏞️
- **Goal:** Maximize experience and views
- **Expected:** Avoid highways, use scenic byways, coastal/mountain roads
- **API Preference:** `scenic` (with avoid_features: highways)
- **Use Case:** Leisure travel, photography, sightseeing

---

## 📊 Rating System

### User Rating Scale
- **✓✓ Excellent** - Route is perfect, exactly what I'd expect for this route type
- **✓ Good** - Route is acceptable, mostly correct with minor issues
- **✗ Poor** - Route is wrong, doesn't match expectations, or has major issues

### Evaluation Criteria

**For Fastest Routes:**
- Uses major highways and toll roads
- Minimizes travel time effectively
- Avoids unnecessary detours
- Realistic time estimates

**For Shortest Routes:**
- Takes most direct path
- Distance is noticeably shorter than fastest
- Route makes geographic sense
- Doesn't sacrifice too much time for small distance savings

**For Scenic Routes:**
- Avoids major highways when possible
- Uses coastal/mountain/scenic roads
- Route is noticeably different from fastest
- Worth the extra time for the views

---

## 🔧 Technical Implementation

### Current Routing Service
**File:** `apps/web/lib/services/routingService.ts`

**Providers:**
1. **OpenRouteService (Primary)**
   - Free tier: 2,000 requests/day
   - Supports: fastest, shortest, recommended, scenic
   - Requires API key
   - Best for: Detailed route preferences

2. **OSRM Demo Server (Fallback)**
   - Unlimited requests
   - No API key required
   - Supports: driving, cycling, foot
   - Best for: Basic routing, alternatives

**Current Strategy:**
```typescript
export async function getRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile = 'driving-car',
  preference?: 'fastest' | 'shortest' | 'recommended' | 'scenic' | 'longest'
): Promise<RouteResult>
```

**Caching:**
- Routes cached in database by coordinates + profile + preference
- Cache key: `${profile}:${preference}:${coordStr}`
- Reduces API calls for repeated routes

---

## 📈 Expected Outcomes

### Success Metrics
1. **Accuracy Rate:** % of routes rated "Excellent" or "Good"
2. **Route Type Differentiation:** How different are fastest/shortest/scenic routes?
3. **Performance:** Average response time per route type
4. **Provider Reliability:** Success rate for OpenRouteService vs OSRM

### Key Questions to Answer
1. Does OpenRouteService "scenic" preference actually avoid highways?
2. Is there a significant difference between fastest and shortest routes?
3. Do OSRM alternatives provide better scenic routes than ORS scenic?
4. Which route type is most reliable across different regions?
5. Should we implement custom scenic route logic?

---

## 🎯 Next Steps After Iteration 1

### If Results Show:

**High Accuracy (>80% Excellent/Good):**
- ✅ Current implementation is good
- Document best practices
- Add to production with confidence

**Medium Accuracy (50-80%):**
- 🔄 Iterate with refined strategies
- Test alternative providers
- Consider hybrid approaches

**Low Accuracy (<50%):**
- ❌ Current approach needs major changes
- Research alternative routing APIs
- Consider custom route optimization logic

### Potential Improvements
1. **Custom Scenic Route Logic:**
   - Fetch multiple route alternatives
   - Score routes based on proximity to scenic POIs
   - Avoid highways manually
   - Prioritize coastal/mountain roads

2. **Hybrid Provider Strategy:**
   - Use ORS for fastest/shortest
   - Use OSRM alternatives for scenic
   - Combine multiple providers for best results

3. **Machine Learning Approach:**
   - Train model on user-rated routes
   - Learn what makes a "good" scenic route
   - Predict route quality before showing to user

4. **POI-Based Routing:**
   - Integrate scenic POIs into route calculation
   - Suggest detours to viewpoints
   - Optimize route to pass through interesting locations

---

## 📝 Test Results Template

### Test Case: [Name]
**Date:** [Date]  
**Tester:** [Name]  
**Location:** [Route Description]

#### Fastest Route
- **Distance:** X km
- **Duration:** X hours X minutes
- **Provider:** OpenRouteService / OSRM
- **Rating:** Excellent / Good / Poor
- **Notes:** [Observations]

#### Shortest Route
- **Distance:** X km
- **Duration:** X hours X minutes
- **Provider:** OpenRouteService / OSRM
- **Rating:** Excellent / Good / Poor
- **Notes:** [Observations]

#### Scenic Route
- **Distance:** X km
- **Duration:** X hours X minutes
- **Provider:** OpenRouteService / OSRM
- **Rating:** Excellent / Good / Poor
- **Notes:** [Observations]

#### Overall Observations
- [Key findings]
- [Issues encountered]
- [Suggestions for improvement]

---

## 🔍 Analysis Framework

### Pattern Analysis
After completing all 5 test cases (15 routes total), analyze:

1. **Route Type Performance:**
   - Which route type has highest accuracy?
   - Which route type has most consistent results?
   - Are there route types that fail in certain regions?

2. **Geographic Patterns:**
   - Do mountain routes work better with certain providers?
   - Are coastal routes more accurate than inland?
   - Do international routes have issues?

3. **Provider Comparison:**
   - OpenRouteService vs OSRM success rates
   - Which provider is better for which route type?
   - Are fallbacks working correctly?

4. **Distance Impact:**
   - Do longer routes have lower accuracy?
   - Is there a sweet spot for route length?
   - Do 2-point routes work better than 3-point?

### Recommendations Template
Based on analysis, provide:

1. **Keep:** What's working well
2. **Improve:** What needs refinement
3. **Change:** What needs major changes
4. **Add:** New features or approaches to implement

---

## 📚 Documentation References

### Related Files
- **Routing Service:** `apps/web/lib/services/routingService.ts`
- **Route API:** `apps/web/app/api/routing/get-route/route.ts`
- **Transport API:** `apps/web/app/api/transport/route.ts`
- **Test Page:** `apps/web/app/test/route-strategies/page.tsx`

### Related Documentation
- **Brave API Optimization:** `docs/BRAVE_QUERY_FINAL_STRATEGY.md`
- **Codebase Rules:** `.augment/rules/imported/rules.md`

---

## 🎓 For Future Developers

### How to Run Tests
1. Navigate to `/test/route-strategies` in admin dashboard
2. Select a test case from the 5 predefined options
3. Click "Test All 3 Route Types"
4. Wait for all 3 routes to calculate
5. Rate each route (Excellent/Good/Poor)
6. Click "Save Ratings" to log results
7. Repeat for all 5 test cases
8. Click "View Analysis" to see patterns

### How to Add New Test Cases
Edit `apps/web/app/test/route-strategies/page.tsx`:

```typescript
const testCases: RouteTestCase[] = [
  // ... existing cases
  {
    id: 'your-test-id',
    name: 'Your Test Name',
    category: '🌍 Your Category',
    description: 'Point A → Point B → Point C',
    points: [
      { name: 'Point A', latitude: XX.XXXX, longitude: XX.XXXX },
      { name: 'Point B', latitude: XX.XXXX, longitude: XX.XXXX },
      { name: 'Point C', latitude: XX.XXXX, longitude: XX.XXXX }
    ]
  }
]
```

### How to Modify Route Types
Edit `apps/web/lib/services/routingService.ts`:

```typescript
// Add new preference type
export type RoutePreference = 'fastest' | 'shortest' | 'scenic' | 'your-new-type'

// Implement logic in getRoute() function
if (preference === 'your-new-type') {
  // Your custom logic here
}
```

---

**Status:** 🧪 READY FOR TESTING  
**Next Action:** Run all 5 test cases and collect user ratings  
**Expected Duration:** 30-45 minutes for complete iteration


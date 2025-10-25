# Next Optimization Opportunities (Phase 2)

## Quick Wins (5-10 minutes each)

### 1. Headline Caching 🎯
**File**: `apps/web/app/api/groq/generate-headline/route.ts`

**Current**: Generates headline fresh every time
**Optimization**: Cache headlines for same route + duration + tripType

```typescript
// Add at top of POST handler
const cacheKey = `headline:${destinations.join(',')}:${duration}:${tripType}`
const cached = await getCached(cacheKey)
if (cached) {
  console.log('✅ Headline cache HIT')
  return NextResponse.json(cached)
}

// ... generate headline ...

// Cache for 30 days
await setCached(cacheKey, result, CacheTTL.LONG)
return NextResponse.json(result)
```

**Savings**: 50-70% for repeat routes

---

### 2. Sequential Image Fetching 🎯
**File**: `apps/web/app/api/images/discover/route.ts`

**Current**: Fetches from ALL sources in parallel
```typescript
const [brave, reddit, pexels] = await Promise.all([
  braveSearch(...),
  redditSearch(...),
  pexelsSearch(...)
])
```

**Optimization**: Fetch sequentially, stop when enough
```typescript
const brave = await braveSearch(...)
if (brave.length >= 10) return brave

const reddit = await redditSearch(...)
if (brave.length + reddit.length >= 10) return [...brave, ...reddit]

const pexels = await pexelsSearch(...)
return [...brave, ...reddit, ...pexels]
```

**Savings**: 60-70% image API calls

---

### 3. POI Filtering by Trip Type 🎯
**File**: `apps/web/lib/services/tripDataCompressor.ts`

**Current**: Sends ALL POIs to AI
**Optimization**: Filter POIs by trip type before sending

```typescript
function filterPOIsByTripType(pois: any[], tripType: string): any[] {
  const typeFilters: Record<string, string[]> = {
    'adventure': ['hiking', 'climbing', 'water_sports', 'outdoor'],
    'luxury': ['restaurants', 'hotels', 'spas', 'shopping'],
    'family': ['parks', 'museums', 'attractions', 'playgrounds'],
    'city': ['landmarks', 'museums', 'restaurants', 'nightlife'],
    'wellness': ['spas', 'yoga', 'meditation', 'nature']
  }
  
  const categories = typeFilters[tripType] || []
  return pois.filter(p => 
    categories.some(cat => p.category?.toLowerCase().includes(cat))
  ).slice(0, 20) // Top 20 only
}
```

**Savings**: 30-50% data tokens

---

### 4. Activity Description Caching 🎯
**File**: `apps/web/app/api/groq/activity-description/route.ts`

**Current**: Generates description fresh every time
**Optimization**: Cache descriptions for same activity + location

```typescript
const cacheKey = `activity:${activityName}:${location}:${tripType}`
const cached = await getCached(cacheKey)
if (cached) return NextResponse.json(cached)

// ... generate description ...

await setCached(cacheKey, result, CacheTTL.MEDIUM) // 7 days
return NextResponse.json(result)
```

**Savings**: 40-60% for repeat activities

---

## Medium Effort (15-30 minutes each)

### 5. Batch Headline Generation
**Opportunity**: Generate headlines for multiple trips in one API call

```typescript
// Instead of:
for (const trip of trips) {
  const headline = await generateHeadline(trip)
}

// Do:
const headlines = await generateHeadlinesBatch(trips)
```

**Savings**: 80% API calls for bulk operations

---

### 6. Batch Activity Descriptions
**Opportunity**: Generate descriptions for all activities in one call

```typescript
const descriptions = await generateActivityDescriptionsBatch(activities)
```

**Savings**: 70% API calls

---

### 7. Smart Data Compression
**Opportunity**: Compress POI data more aggressively

```typescript
// Current: Send full POI objects
// Optimized: Send only essential fields
{
  name: "Eiffel Tower",
  category: "landmark",
  distance: "2.5km",
  detourTime: "15min"
}
```

**Savings**: 40% data tokens

---

## Advanced Optimizations (1-2 hours each)

### 8. Function Calling for Real-Time Data
**Opportunity**: Use Groq function calling to fetch data on-demand

```typescript
const functions = [
  {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: { location: string, date: string }
  },
  {
    name: 'get_pois',
    description: 'Get POIs for a location',
    parameters: { location: string, category: string }
  }
]

const response = await groq.chat.completions.create({
  functions,
  function_call: 'auto',
  // ...
})
```

**Savings**: 50% data tokens (fetch only what's needed)

---

### 9. Streaming Responses
**Opportunity**: Stream itinerary generation for faster perceived speed

```typescript
const stream = await groq.chat.completions.create({
  stream: true,
  // ...
})

for await (const chunk of stream) {
  // Send to client immediately
  res.write(chunk)
}
```

**Savings**: 0% tokens, but 50% faster perceived speed

---

### 10. Multi-Language Batch Processing
**Opportunity**: Generate content in multiple languages in one call

```typescript
const prompt = `Generate itinerary in English, Spanish, French:
${itinerary}`

const response = await groq.chat.completions.create({
  // ...
})
```

**Savings**: 60% API calls for multi-language support

---

## Monitoring & Metrics

### Track These Metrics
```typescript
// In each API call
const metrics = {
  modelUsed: 'llama-3.3-70b-versatile',
  tokensUsed: response.usage.total_tokens,
  cacheHit: cached ? true : false,
  duration: Date.now() - startTime,
  tripDays: context.totalDays,
  routeKm: context.routeDistance
}

// Log to analytics
console.log(`[METRICS] ${JSON.stringify(metrics)}`)
```

### Expected Improvements
- **Tokens**: 40-50% reduction
- **Speed**: 50-60% faster
- **Cost**: 50-60% cheaper
- **Quality**: Same or better (more deterministic)

---

## Implementation Priority

1. **Phase 1** (DONE): Model selection, token reduction, skip short trips
2. **Phase 2** (NEXT): Headline caching, image fetching, POI filtering
3. **Phase 3**: Batch operations, function calling
4. **Phase 4**: Streaming, multi-language support

---

## Testing Checklist

Before deploying each optimization:
- [ ] Run type-check: `npm run type-check`
- [ ] Test with sample trip (Rio → Buenos Aires, 10 days)
- [ ] Verify all 10 days generated
- [ ] Check token usage in logs
- [ ] Verify cache hits working
- [ ] Monitor for 15 minutes post-deploy


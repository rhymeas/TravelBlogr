# 🎯 plan Planner: Technology Decision Matrix

## Executive Decision Summary

| Component | Recommended Choice | Alternative | Rationale |
|-----------|-------------------|-------------|-----------|
| **Routing Engine** | OSRM (self-hosted) | Mapbox Directions API | Free, unlimited, good quality |
| **AI/LLM** | OpenAI GPT-3.5-turbo | Claude Haiku / Llama 3 | Best cost/quality ratio |
| **Optimization** | Custom nearest-neighbor | Google OR-Tools | Simple, fast enough for <50 items |
| **Database** | Supabase (existing) | PostgreSQL + PostGIS | Already integrated |
| **Caching** | Supabase tables | Redis | Simpler, no new infrastructure |
| **Frontend** | Next.js (existing) | Separate React app | Consistency |

---

## Detailed Comparison

### 1. Routing Engine

#### Option A: OpenTripPlanner (OTP) ⭐ **RECOMMENDED**
**Pros**:
- ✅ Multi-modal (walk, bike, transit, car)
- ✅ GTFS support (real public transit data)
- ✅ Free, open-source
- ✅ Self-hosted (no API limits)
- ✅ Active community

**Cons**:
- ❌ Requires Docker setup
- ❌ Need to download OSM data (~1GB per region)
- ❌ Memory intensive (2-4GB RAM)

**Setup**:
```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/graphs:/var/otp/graphs \
  opentripplanner/opentripplanner:latest \
  --build --serve /var/otp/graphs
```

**Cost**: $0 (self-hosted) or ~$20/month (VPS)

---

#### Option B: OSRM (Open Source Routing Machine) ⭐ **BEST FOR MVP**
**Pros**:
- ✅ Extremely fast (<10ms response)
- ✅ Easy Docker setup
- ✅ Low memory footprint
- ✅ Free, open-source
- ✅ Great for car/bike/walk routing

**Cons**:
- ❌ No public transit support
- ❌ Single-mode only (need multiple instances)

**Setup**:
```bash
# Download OSM data
wget http://download.geofabrik.de/asia/japan-latest.osm.pbf

# Process data
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/japan-latest.osm.pbf
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-contract /data/japan-latest.osrm

# Run server
docker run -d -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/japan-latest.osrm
```

**Cost**: $0 (self-hosted) or ~$10/month (VPS)

---

#### Option C: Mapbox Directions API
**Pros**:
- ✅ No setup required
- ✅ High quality routes
- ✅ Traffic data included
- ✅ Multi-modal support

**Cons**:
- ❌ Costs money after free tier
- ❌ 100k requests/month free (then $0.50/1k)
- ❌ Requires API key management

**Cost**: $0-$500/month depending on usage

---

#### Option D: Google Maps Directions API
**Pros**:
- ✅ Best quality data
- ✅ Real-time traffic
- ✅ Comprehensive transit data

**Cons**:
- ❌ Expensive ($5/1k requests)
- ❌ Requires billing account
- ❌ Complex pricing

**Cost**: $500-$5000/month

---

### 2. AI/LLM Provider

#### Option A: OpenAI GPT-3.5-turbo ⭐ **RECOMMENDED**
**Pros**:
- ✅ Fast (2-5 seconds)
- ✅ Good quality
- ✅ JSON mode support
- ✅ Reliable API

**Cons**:
- ❌ Costs money ($0.0015/1k tokens)
- ❌ Requires API key

**Cost per plan**: ~$0.05-$0.15
**Monthly cost (1000 itineraries)**: ~$100

---

#### Option B: Anthropic Claude Haiku
**Pros**:
- ✅ Very cheap ($0.25/1M input tokens)
- ✅ Good reasoning
- ✅ Long context window

**Cons**:
- ❌ Slower than GPT-3.5
- ❌ Less popular (fewer examples)

**Cost per plan**: ~$0.02-$0.08
**Monthly cost (1000 itineraries)**: ~$50

---

#### Option C: Self-hosted Llama 3 (70B)
**Pros**:
- ✅ Free after setup
- ✅ No API limits
- ✅ Data privacy

**Cons**:
- ❌ Requires GPU ($500-$1000/month)
- ❌ Complex setup
- ❌ Slower inference
- ❌ Lower quality than GPT-4

**Cost**: $500-$1000/month (GPU server)

---

#### Option D: Groq API (Llama 3)
**Pros**:
- ✅ Extremely fast (300 tokens/sec)
- ✅ Free tier available
- ✅ Good quality

**Cons**:
- ❌ Rate limits on free tier
- ❌ Less reliable than OpenAI

**Cost**: $0-$200/month

---

### 3. Optimization Algorithm

#### Option A: Custom Nearest-Neighbor ⭐ **RECOMMENDED FOR MVP**
**Pros**:
- ✅ Simple to implement
- ✅ Fast (<1 second for 50 items)
- ✅ Good enough for most cases
- ✅ No dependencies

**Cons**:
- ❌ Not optimal (70-80% of optimal)
- ❌ Doesn't handle complex constraints

**Code**:
```typescript
function nearestNeighbor(items: Item[], start: Location): Item[] {
  const result = []
  let current = start
  const remaining = [...items]

  while (remaining.length > 0) {
    // Find nearest unvisited item
    const nearest = remaining.reduce((closest, item) => {
      const dist = distance(current, item.location)
      return dist < distance(current, closest.location) ? item : closest
    })

    result.push(nearest)
    current = nearest.location
    remaining.splice(remaining.indexOf(nearest), 1)
  }

  return result
}
```

---

#### Option B: Google OR-Tools
**Pros**:
- ✅ Optimal solutions
- ✅ Handles complex constraints
- ✅ Free, open-source

**Cons**:
- ❌ Requires Python backend
- ❌ Slower (5-30 seconds)
- ❌ Complex setup

**Use case**: For premium users or complex multi-day itineraries

---

#### Option C: 2-opt Improvement
**Pros**:
- ✅ Better than nearest-neighbor
- ✅ Still fast
- ✅ Easy to implement

**Cons**:
- ❌ Still not optimal
- ❌ More complex than nearest-neighbor

**Recommendation**: Use for v2 after MVP

---

### 4. Caching Strategy

#### Option A: Supabase Tables ⭐ **RECOMMENDED**
**Pros**:
- ✅ Already integrated
- ✅ Persistent
- ✅ RLS policies
- ✅ No new infrastructure

**Cons**:
- ❌ Slower than Redis (50-100ms)
- ❌ Limited query performance

**Tables**:
- `routing_cache` (routes between points)
- `ai_generation_logs` (AI responses)

---

#### Option B: Redis
**Pros**:
- ✅ Very fast (<5ms)
- ✅ TTL support
- ✅ Industry standard

**Cons**:
- ❌ New infrastructure
- ❌ Costs money ($10-$50/month)
- ❌ More complexity

**Recommendation**: Add in v2 if performance becomes issue

---

## Final Recommendations

### MVP (Week 1-2)
1. **Routing**: OSRM (self-hosted Docker)
2. **AI**: OpenAI GPT-3.5-turbo
3. **Optimization**: Nearest-neighbor
4. **Caching**: Supabase tables
5. **Budget**: ~$100/month

### Production (Month 2-3)
1. **Routing**: OSRM + OpenTripPlanner (for transit)
2. **AI**: OpenAI GPT-3.5 + Claude Haiku (fallback)
3. **Optimization**: 2-opt improvement
4. **Caching**: Redis + Supabase
5. **Budget**: ~$300/month

### Scale (6+ months)
1. **Routing**: Multi-region OSRM cluster
2. **AI**: Self-hosted Llama 3 + OpenAI (fallback)
3. **Optimization**: Google OR-Tools for premium
4. **Caching**: Redis cluster
5. **Budget**: ~$1000/month

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI costs exceed budget | Medium | High | Rate limiting, caching, cheaper models |
| Routing quality poor | Low | Medium | Fallback to Mapbox API |
| Performance issues | Medium | Medium | Caching, background jobs |
| User adoption low | Medium | High | Better UX, templates, examples |
| Data quality issues | High | Medium | Manual curation, user feedback |

---

## Success Criteria

### Week 2 (MVP)
- [ ] Generate basic 3-day plan in <10 seconds
- [ ] Route optimization works for 10 items
- [ ] Caching reduces repeat requests by 80%
- [ ] Cost per plan < $0.20

### Month 3 (Production)
- [ ] 100+ itineraries generated
- [ ] User satisfaction > 4/5 stars
- [ ] 50%+ of generated itineraries are used
- [ ] Cost per plan < $0.10

### Month 6 (Scale)
- [ ] 1000+ itineraries/month
- [ ] Multi-city support
- [ ] Real-time transit updates
- [ ] Export to PDF/Google Maps
- [ ] Cost per plan < $0.05

---

## Next Steps

1. ✅ Review this decision matrix
2. ✅ Get approval on technology choices
3. ✅ Set up OSRM Docker container
4. ✅ Get OpenAI API key
5. ✅ Run database migrations
6. ✅ Implement MVP (follow IMPLEMENTATION_GUIDE.md)
7. ✅ Test with 10 beta users
8. ✅ Iterate based on feedback
9. ✅ Launch to all users
10. ✅ Monitor costs and performance


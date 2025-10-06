# 🗺️ AI-Powered Itinerary Planner Integration Plan

## Executive Summary

**Goal**: Integrate intelligent, AI-powered itinerary planning into TravelBlogr that:
- Leverages existing location/activity/restaurant data
- Uses open-source routing tools (OpenTripPlanner, OSM)
- Provides AI-powered recommendations (LLM-based)
- Offers both CMS backend management and user-facing features
- Remains cost-effective with free/self-hosted options

---

## 📊 Current State Analysis

### ✅ What We Have
1. **Database Schema**:
   - `trip_itinerary` table (basic structure)
   - `locations`, `activities`, `restaurants` with rich data
   - `trip_expenses`, `trip_collaborators`
   - User authentication & RLS policies

2. **Data Sources**:
   - OpenStreetMap (activities, restaurants)
   - WikiVoyage (travel guides)
   - Wikimedia (images)
   - Open-Meteo (weather)
   - GeoNames (location metadata)

3. **Frontend Components**:
   - Basic `TripPlanner` component (drag-drop)
   - Location detail pages
   - Activity/restaurant listings

4. **APIs**:
   - `/api/locations/*` - Location data
   - `/api/admin/auto-fill` - Auto-populate location data
   - `/api/trips/*` - Trip management

### ❌ What We Need
1. **Routing Engine**: Multi-modal route planning
2. **AI Layer**: Intelligent recommendations & optimization
3. **Optimization Algorithm**: TSP/orienteering for visit order
4. **Template System**: Pre-built itineraries
5. **Real-time Updates**: Transit, weather, closures
6. **Export/Share**: PDF, JSON, embeddable widgets

---

## 🏗️ Architecture Design

### **3-Layer Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Planner │  │ CMS Backend  │  │ Public Share │      │
│  │   Interface  │  │   (Admin)    │  │    Widget    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Generator │  │  Optimizer   │  │ Route Planner│      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OpenTrip     │  │  Supabase    │  │  LLM API     │      │
│  │  Planner     │  │  Database    │  │ (OpenAI/etc) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Phases

### **Phase 1: Foundation** (Week 1-2)

#### 1.1 Database Schema
- ✅ Run `itinerary-planner-schema.sql`
- Add new tables: `itinerary_templates`, `routing_cache`, `ai_generation_logs`
- Extend `trip_itinerary` with routing/AI fields

#### 1.2 Core Services Setup
```typescript
// packages/core/application/services/ItineraryService.ts
interface ItineraryService {
  generateItinerary(params: GenerateParams): Promise<Itinerary>
  optimizeRoute(items: ItineraryItem[]): Promise<ItineraryItem[]>
  calculateTravelTime(from: Location, to: Location, mode: TransportMode): Promise<Duration>
}
```

#### 1.3 Routing Integration
**Option A: Self-hosted OpenTripPlanner** (Recommended)
- Docker container with OSM data
- GTFS feeds for public transit
- REST API for route queries

**Option B: External APIs** (Fallback)
- Mapbox Directions API (free tier: 100k requests/month)
- OSRM (open-source routing, self-hostable)

---

### **Phase 2: AI Integration** (Week 3-4)

#### 2.1 AI Recommendation Engine
```typescript
// services/ai-planner/AIItineraryGenerator.ts
class AIItineraryGenerator {
  async generate(params: {
    location: Location
    duration: number // days
    budget: BudgetLevel
    interests: string[]
    pace: 'relaxed' | 'moderate' | 'fast'
  }): Promise<Itinerary> {
    // 1. Fetch relevant activities/restaurants from DB
    const activities = await this.fetchActivities(params)
    
    // 2. Build LLM prompt with constraints
    const prompt = this.buildPrompt(activities, params)
    
    // 3. Call LLM (OpenAI/Claude/local)
    const aiResponse = await this.callLLM(prompt)
    
    // 4. Parse & validate response
    const itinerary = this.parseAIResponse(aiResponse)
    
    // 5. Optimize routes
    return await this.optimizeRoutes(itinerary)
  }
}
```

#### 2.2 LLM Provider Options
**Free/Cheap Options**:
1. **OpenAI GPT-3.5-turbo**: $0.0015/1K tokens (~$0.10 per itinerary)
2. **Anthropic Claude Haiku**: $0.25/1M tokens
3. **Self-hosted Llama 3**: Free (requires GPU)
4. **Groq API**: Free tier available

**Prompt Engineering**:
```typescript
const ITINERARY_PROMPT = `
You are a travel planning expert. Generate a ${duration}-day itinerary for ${location}.

Available Activities:
${activities.map(a => `- ${a.name}: ${a.description} (${a.duration}, ${a.cost})`).join('\n')}

Constraints:
- Budget: ${budget}
- Interests: ${interests.join(', ')}
- Pace: ${pace}
- Must include meals and rest time
- Optimize for minimal travel time

Output Format (JSON):
{
  "days": [
    {
      "day": 1,
      "items": [
        {"time": "09:00", "activity_id": "...", "duration": 2, "notes": "..."}
      ]
    }
  ]
}
`
```

---

### **Phase 3: Optimization Algorithms** (Week 5)

#### 3.1 Route Optimization (TSP Variant)
```typescript
// services/optimization/RouteOptimizer.ts
class RouteOptimizer {
  /**
   * Optimize visit order using nearest-neighbor heuristic
   * For small sets (<20 items), can use exact algorithms
   */
  async optimizeVisitOrder(
    items: ItineraryItem[],
    startLocation: Coordinates,
    constraints: TimeConstraints
  ): Promise<ItineraryItem[]> {
    // 1. Build distance matrix
    const matrix = await this.buildDistanceMatrix(items)
    
    // 2. Apply nearest-neighbor or 2-opt
    const optimizedOrder = this.nearestNeighbor(matrix, startLocation)
    
    // 3. Validate time constraints
    return this.validateTimeConstraints(optimizedOrder, constraints)
  }
  
  private async buildDistanceMatrix(items: ItineraryItem[]): Promise<number[][]> {
    // Check cache first
    const cached = await this.routingCache.get(items)
    if (cached) return cached
    
    // Calculate all pairwise distances
    const matrix = []
    for (const from of items) {
      const row = []
      for (const to of items) {
        const route = await this.routingService.getRoute(from, to)
        row.push(route.duration)
      }
      matrix.push(row)
    }
    
    // Cache for 7 days
    await this.routingCache.set(items, matrix, { ttl: 7 * 24 * 60 * 60 })
    return matrix
  }
}
```

#### 3.2 Time Budget Allocation
```typescript
// Allocate time across days considering:
// - Activity durations
// - Travel time between locations
// - Meal breaks (1-1.5 hours)
// - Rest periods
// - Opening hours constraints
```

---

### **Phase 4: CMS Backend** (Week 6)

#### 4.1 Admin Interface
**Features**:
- Create/edit itinerary templates
- Approve AI-generated itineraries
- Manage routing cache
- View analytics (popular routes, generation stats)

**Pages**:
```
/admin/itineraries
  ├── /templates          # Pre-built templates
  ├── /ai-generated       # Review AI suggestions
  ├── /analytics          # Usage stats
  └── /settings           # AI model config, API keys
```

#### 4.2 Template Builder
```typescript
// apps/web/app/admin/itineraries/templates/new/page.tsx
<TemplateBuilder
  location={location}
  onSave={async (template) => {
    await supabase.from('itinerary_templates').insert(template)
  }}
/>
```

---

### **Phase 5: User-Facing Features** (Week 7-8)

#### 5.1 Itinerary Generator UI
```typescript
// apps/web/app/trips/[tripId]/generate/page.tsx
<ItineraryGenerator
  trip={trip}
  onGenerate={async (params) => {
    const result = await fetch('/api/itineraries/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return result.json()
  }}
/>
```

**User Flow**:
1. Select location(s)
2. Set duration, budget, interests
3. AI generates 3 options
4. User picks one or customizes
5. Drag-drop to refine
6. Save & share

#### 5.2 Smart Suggestions
```typescript
// Real-time suggestions as user builds itinerary
<SmartSuggestions
  currentItinerary={itinerary}
  suggestions={[
    {
      type: 'nearby_activity',
      item: activity,
      reason: 'Only 5 min walk from your 2pm activity'
    },
    {
      type: 'meal_time',
      reason: 'You have a 3-hour gap - add lunch?'
    }
  ]}
/>
```

---

## 🔧 Technical Implementation Details

### **API Endpoints**

```typescript
// POST /api/itineraries/generate
// Generate AI-powered itinerary
{
  "location_id": "uuid",
  "duration_days": 3,
  "budget": "moderate",
  "interests": ["museums", "food"],
  "pace": "moderate"
}

// POST /api/itineraries/optimize
// Optimize existing itinerary
{
  "trip_id": "uuid",
  "optimization_type": "route" | "time" | "cost"
}

// GET /api/itineraries/templates
// Get pre-built templates
?location_id=uuid&duration=3&budget=moderate

// POST /api/routing/calculate
// Calculate route between points
{
  "from": {"lat": 35.6762, "lng": 139.6503},
  "to": {"lat": 35.6812, "lng": 139.7671},
  "mode": "transit" | "walk" | "car"
}
```

### **Background Jobs**

```typescript
// services/workers/itinerary-optimizer.ts
// Process optimization queue
setInterval(async () => {
  const pending = await supabase
    .from('itinerary_optimization_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10)
  
  for (const job of pending) {
    await processOptimization(job)
  }
}, 60000) // Every minute
```

---

## 💰 Cost Analysis

### **Free Tier Usage** (0-1000 users)
- **OpenTripPlanner**: Self-hosted (Docker) - $0
- **OSM Data**: Free
- **LLM (GPT-3.5)**: ~$100/month (1000 generations)
- **Supabase**: Free tier (500MB DB, 2GB bandwidth)
- **Total**: ~$100/month

### **Paid Tier** (1000-10000 users)
- **OpenTripPlanner**: Same (scales well)
- **LLM**: ~$500/month
- **Supabase**: Pro ($25/month)
- **CDN**: Cloudflare (free)
- **Total**: ~$525/month

---

## 📊 Success Metrics

1. **Generation Quality**:
   - User satisfaction score (1-5 stars)
   - Itinerary completion rate
   - Edit frequency (lower = better AI)

2. **Performance**:
   - Generation time < 10 seconds
   - Route optimization < 5 seconds
   - Cache hit rate > 80%

3. **Adoption**:
   - % of trips using AI generation
   - Template usage vs custom
   - Share/export rate

---

## 🚀 Quick Start (MVP)

**Week 1-2 MVP Features**:
1. ✅ Database schema
2. ✅ Basic AI generation (OpenAI API)
3. ✅ Simple route optimization (nearest-neighbor)
4. ✅ User interface for generation
5. ✅ Export to PDF

**Deferred to v2**:
- Real-time transit updates
- Multi-city itineraries
- Collaborative planning
- Mobile app integration
- Booking integrations

---

## 🔐 Security & Privacy

1. **API Keys**: Store in environment variables, never expose
2. **Rate Limiting**: 10 generations/hour per user
3. **Data Privacy**: User itineraries are private by default
4. **RLS Policies**: Enforce at database level
5. **Input Validation**: Sanitize all user inputs

---

## 📚 Next Steps

1. **Review & Approve** this plan
2. **Run database migrations** (`itinerary-planner-schema.sql`)
3. **Set up OpenTripPlanner** (Docker)
4. **Implement AI service** (start with OpenAI)
5. **Build MVP UI** (generation form + results)
6. **Test with real users** (beta group)
7. **Iterate based on feedback**

---

## 📖 References

- [OpenTripPlanner Docs](https://docs.opentripplanner.org/)
- [OpenAI API](https://platform.openai.com/docs)
- [OSRM Routing](http://project-osrm.org/)
- [Traveling Salesman Problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem)


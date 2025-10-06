# 🛠️ Itinerary Planner Implementation Guide

## Quick Start: Build MVP in 2 Weeks

This guide provides step-by-step instructions to implement the AI-powered itinerary planner.

---

## Week 1: Backend Foundation

### Day 1-2: Database Setup

**1. Run Schema Migration**
```bash
# Connect to Supabase
psql $DATABASE_URL

# Run the schema
\i docs/architecture/itinerary-planner-schema.sql

# Verify tables created
\dt itinerary_*
```

**2. Seed Sample Data**
```sql
-- Add sample template for testing
INSERT INTO itinerary_templates (
    location_id,
    name,
    duration_days,
    budget_level,
    template_data
) VALUES (
    (SELECT id FROM locations WHERE slug = 'tokyo'),
    'Tokyo Weekend Getaway',
    2,
    'moderate',
    '{"days": [{"day": 1, "items": []}]}'::jsonb
);
```

### Day 3-4: Core Services

**1. Create Routing Service**
```typescript
// services/routing/RoutingService.ts
import { createClient } from '@supabase/supabase-js'

export interface RouteRequest {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  mode: 'walk' | 'transit' | 'car' | 'bike'
}

export interface RouteResult {
  duration: number // minutes
  distance: number // meters
  steps: RouteStep[]
  polyline?: string
}

export class RoutingService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async getRoute(request: RouteRequest): Promise<RouteResult> {
    // 1. Check cache first
    const cached = await this.getCachedRoute(request)
    if (cached) return cached

    // 2. Call routing API (OSRM or Mapbox)
    const route = await this.fetchRoute(request)

    // 3. Cache result
    await this.cacheRoute(request, route)

    return route
  }

  private async getCachedRoute(request: RouteRequest): Promise<RouteResult | null> {
    const { data } = await this.supabase
      .from('routing_cache')
      .select('*')
      .eq('origin_lat', request.from.lat)
      .eq('origin_lng', request.from.lng)
      .eq('destination_lat', request.to.lat)
      .eq('destination_lng', request.to.lng)
      .eq('transport_mode', request.mode)
      .gt('expires_at', new Date().toISOString())
      .single()

    return data ? data.route_data as RouteResult : null
  }

  private async fetchRoute(request: RouteRequest): Promise<RouteResult> {
    // Option 1: OSRM (free, self-hosted)
    if (process.env.OSRM_URL) {
      return this.fetchOSRMRoute(request)
    }

    // Option 2: Mapbox (free tier: 100k/month)
    if (process.env.MAPBOX_ACCESS_TOKEN) {
      return this.fetchMapboxRoute(request)
    }

    // Fallback: Simple distance calculation
    return this.calculateSimpleRoute(request)
  }

  private async fetchOSRMRoute(request: RouteRequest): Promise<RouteResult> {
    const url = `${process.env.OSRM_URL}/route/v1/${request.mode}/${request.from.lng},${request.from.lat};${request.to.lng},${request.to.lat}?overview=full&steps=true`
    
    const response = await fetch(url)
    const data = await response.json()
    
    const route = data.routes[0]
    return {
      duration: Math.round(route.duration / 60), // seconds to minutes
      distance: Math.round(route.distance),
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration
      })),
      polyline: route.geometry
    }
  }

  private calculateSimpleRoute(request: RouteRequest): RouteResult {
    // Haversine formula for distance
    const R = 6371e3 // Earth radius in meters
    const φ1 = request.from.lat * Math.PI / 180
    const φ2 = request.to.lat * Math.PI / 180
    const Δφ = (request.to.lat - request.from.lat) * Math.PI / 180
    const Δλ = (request.to.lng - request.from.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    // Estimate duration based on mode
    const speeds = {
      walk: 5, // km/h
      bike: 15,
      car: 40,
      transit: 25
    }
    const duration = (distance / 1000) / speeds[request.mode] * 60

    return {
      duration: Math.round(duration),
      distance: Math.round(distance),
      steps: []
    }
  }
}
```

**2. Create AI Generator Service**
```typescript
// services/ai-planner/AIItineraryGenerator.ts
import OpenAI from 'openai'

export interface GenerateParams {
  locationId: string
  durationDays: number
  budget: 'budget' | 'moderate' | 'luxury'
  interests: string[]
  pace: 'relaxed' | 'moderate' | 'fast'
}

export class AIItineraryGenerator {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  async generate(params: GenerateParams): Promise<any> {
    // 1. Fetch location data
    const location = await this.fetchLocation(params.locationId)
    const activities = await this.fetchActivities(params.locationId, params.interests)
    const restaurants = await this.fetchRestaurants(params.locationId)

    // 2. Build prompt
    const prompt = this.buildPrompt(location, activities, restaurants, params)

    // 3. Call OpenAI
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Generate detailed, realistic itineraries in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    // 4. Parse response
    const itinerary = JSON.parse(response.choices[0].message.content!)

    // 5. Log generation
    await this.logGeneration(params, response)

    return itinerary
  }

  private buildPrompt(location: any, activities: any[], restaurants: any[], params: GenerateParams): string {
    return `
Generate a ${params.durationDays}-day itinerary for ${location.name}.

LOCATION INFO:
- Best time to visit: ${location.best_time_to_visit}
- Budget level: ${params.budget}
- Timezone: ${location.timezone}

AVAILABLE ACTIVITIES (${activities.length}):
${activities.slice(0, 20).map(a => `
- ${a.name} (${a.category})
  Description: ${a.description}
  Duration: ${a.duration || '1-2 hours'}
  Cost: ${a.price_info || 'Free'}
  Location: ${a.address || 'N/A'}
`).join('\n')}

RESTAURANTS (${restaurants.length}):
${restaurants.slice(0, 10).map(r => `
- ${r.name} (${r.cuisine_type})
  Price: ${r.price_range}
  Rating: ${r.rating || 'N/A'}
`).join('\n')}

CONSTRAINTS:
- Duration: ${params.durationDays} days
- Budget: ${params.budget}
- Interests: ${params.interests.join(', ')}
- Pace: ${params.pace}
- Include breakfast, lunch, dinner each day
- Balance indoor/outdoor activities
- Consider travel time between locations
- Start days at 9 AM, end by 9 PM
- Include rest breaks

OUTPUT FORMAT (JSON):
{
  "title": "Itinerary title",
  "summary": "Brief overview",
  "days": [
    {
      "day": 1,
      "title": "Day theme",
      "items": [
        {
          "time": "09:00",
          "title": "Activity name",
          "type": "activity|meal|transport",
          "activity_id": "uuid or null",
          "restaurant_id": "uuid or null",
          "duration": 2,
          "description": "What to do/expect",
          "cost": 50,
          "notes": "Tips or recommendations"
        }
      ]
    }
  ],
  "total_estimated_cost": 500,
  "tips": ["Tip 1", "Tip 2"]
}

Generate a realistic, well-paced itinerary that maximizes the experience while respecting the constraints.
`
  }
}
```

### Day 5: API Endpoints

**Create Generation Endpoint**
```typescript
// apps/web/app/api/itineraries/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AIItineraryGenerator } from '@/services/ai-planner/AIItineraryGenerator'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationId, durationDays, budget, interests, pace } = body

    // Validate
    if (!locationId || !durationDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate
    const generator = new AIItineraryGenerator()
    const itinerary = await generator.generate({
      locationId,
      durationDays,
      budget: budget || 'moderate',
      interests: interests || [],
      pace: pace || 'moderate'
    })

    return NextResponse.json({
      success: true,
      data: itinerary
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    )
  }
}
```

---

## Week 2: Frontend & Polish

### Day 6-7: Generator UI

**Create Generator Page**
```typescript
// apps/web/app/trips/[tripId]/generate/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

export default function GeneratePage({ params }: { params: { tripId: string } }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [params, setParams] = useState({
    durationDays: 3,
    budget: 'moderate',
    interests: [],
    pace: 'moderate'
  })

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      const data = await response.json()
      setResult(data.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Itinerary</h1>

      {/* Configuration Form */}
      <div className="space-y-4 mb-8">
        <div>
          <label>Duration (days)</label>
          <Select
            value={params.durationDays}
            onChange={(e) => setParams({ ...params, durationDays: parseInt(e.target.value) })}
          >
            {[1, 2, 3, 5, 7, 10, 14].map(d => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </Select>
        </div>

        <div>
          <label>Budget Level</label>
          <Select
            value={params.budget}
            onChange={(e) => setParams({ ...params, budget: e.target.value })}
          >
            <option value="budget">Budget</option>
            <option value="moderate">Moderate</option>
            <option value="luxury">Luxury</option>
          </Select>
        </div>

        <div>
          <label>Interests</label>
          <div className="flex flex-wrap gap-2">
            {['museums', 'food', 'nature', 'shopping', 'nightlife', 'history'].map(interest => (
              <Badge
                key={interest}
                onClick={() => {
                  const newInterests = params.interests.includes(interest)
                    ? params.interests.filter(i => i !== interest)
                    : [...params.interests, interest]
                  setParams({ ...params, interests: newInterests })
                }}
                className={params.interests.includes(interest) ? 'bg-blue-500' : 'bg-gray-200'}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Itinerary'}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <ItineraryPreview itinerary={result} />
      )}
    </div>
  )
}
```

### Day 8-10: Testing & Refinement

**Test Cases**:
1. Generate 3-day Tokyo itinerary
2. Generate 7-day Paris itinerary with "museums" interest
3. Generate budget vs luxury comparison
4. Test route optimization
5. Test caching (should be faster 2nd time)

---

## Deployment Checklist

- [ ] Database migrations run
- [ ] Environment variables set (OPENAI_API_KEY, etc.)
- [ ] OSRM/routing service deployed (Docker)
- [ ] API endpoints tested
- [ ] Frontend deployed
- [ ] Monitoring set up (Sentry, LogRocket)
- [ ] Rate limiting configured
- [ ] Documentation updated

---

## Cost Optimization Tips

1. **Cache aggressively**: Routes, AI responses
2. **Use GPT-3.5 instead of GPT-4**: 10x cheaper
3. **Batch requests**: Generate multiple options in one call
4. **Self-host routing**: OSRM in Docker
5. **Lazy load**: Only generate when user requests

---

## Next: Advanced Features (v2)

- Real-time transit updates
- Multi-city itineraries
- Collaborative editing
- Booking integrations (Booking.com API)
- Mobile app (React Native)
- Offline mode


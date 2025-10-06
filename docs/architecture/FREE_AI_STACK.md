# 🆓 Free AI Stack for Itinerary Planning

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│  "3-day Tokyo trip, temples & food, moderate budget"        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              VECTOR SEARCH (Qdrant - FREE)                   │
│  Retrieve relevant activities/restaurants from embeddings    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           LLM GENERATION (Groq/HF - FREE)                    │
│  Generate itinerary using retrieved context                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CACHE (Supabase - FREE)                         │
│  Store generated itineraries for reuse                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: MVP (100% Free) 🆓

### **Stack**
1. **LLM**: Groq API (Llama 3.1 8B) - FREE tier
2. **Vector DB**: Qdrant Cloud - FREE tier (1GB)
3. **Embeddings**: Hugging Face Inference API - FREE
4. **Cache**: Supabase (existing)

### **Cost**: $0/month for first 1000 users

---

## Setup Guide

### 1. Qdrant Vector Database (FREE)

**Sign up**: https://cloud.qdrant.io/

```bash
# Free tier: 1GB storage, unlimited requests
# Perfect for storing embeddings of all your activities/restaurants
```

**Initialize Qdrant**:
```typescript
// lib/vector/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest'

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!, // https://xxx.cloud.qdrant.io
  apiKey: process.env.QDRANT_API_KEY!
})

// Create collection for activities
export async function initializeCollections() {
  await qdrant.createCollection('activities', {
    vectors: {
      size: 384, // all-MiniLM-L6-v2 embedding size
      distance: 'Cosine'
    }
  })

  await qdrant.createCollection('restaurants', {
    vectors: {
      size: 384,
      distance: 'Cosine'
    }
  })
}
```

---

### 2. Embeddings (FREE via Hugging Face)

```typescript
// lib/embeddings/huggingface.ts
export class HuggingFaceEmbeddings {
  private apiKey = process.env.HF_API_KEY!
  private model = 'sentence-transformers/all-MiniLM-L6-v2' // Fast & free!

  async embed(text: string): Promise<number[]> {
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    )

    const embedding = await response.json()
    return embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Batch for efficiency
    const response = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: texts })
      }
    )

    return await response.json()
  }
}
```

---

### 3. Index Your Data (One-time Setup)

```typescript
// scripts/index-activities.ts
import { createClient } from '@supabase/supabase-js'
import { qdrant } from '@/lib/vector/qdrant'
import { HuggingFaceEmbeddings } from '@/lib/embeddings/huggingface'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const embeddings = new HuggingFaceEmbeddings()

async function indexActivities() {
  console.log('📊 Fetching activities from Supabase...')
  
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .limit(1000)

  if (!activities) return

  console.log(`🔄 Indexing ${activities.length} activities...`)

  // Batch process (50 at a time to avoid rate limits)
  const batchSize = 50
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize)
    
    // Create text representations
    const texts = batch.map(a => 
      `${a.name}. ${a.description}. Category: ${a.category}. ${a.address || ''}`
    )

    // Generate embeddings
    const vectors = await embeddings.embedBatch(texts)

    // Upload to Qdrant
    await qdrant.upsert('activities', {
      points: batch.map((activity, idx) => ({
        id: activity.id,
        vector: vectors[idx],
        payload: {
          id: activity.id,
          name: activity.name,
          description: activity.description,
          category: activity.category,
          location_id: activity.location_id,
          rating: activity.rating,
          duration: activity.duration,
          price_info: activity.price_info
        }
      }))
    })

    console.log(`✅ Indexed batch ${i / batchSize + 1}`)
    
    // Rate limit: wait 1 second between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('🎉 Indexing complete!')
}

// Run: npx tsx scripts/index-activities.ts
indexActivities()
```

---

### 4. Semantic Search

```typescript
// lib/search/semantic-search.ts
import { qdrant } from '@/lib/vector/qdrant'
import { HuggingFaceEmbeddings } from '@/lib/embeddings/huggingface'

export class SemanticSearch {
  private embeddings = new HuggingFaceEmbeddings()

  async searchActivities(
    query: string,
    locationId: string,
    limit: number = 10
  ) {
    // 1. Generate query embedding
    const queryVector = await this.embeddings.embed(query)

    // 2. Search Qdrant
    const results = await qdrant.search('activities', {
      vector: queryVector,
      limit,
      filter: {
        must: [
          {
            key: 'location_id',
            match: { value: locationId }
          }
        ]
      }
    })

    return results.map(r => ({
      ...r.payload,
      score: r.score
    }))
  }

  async searchRestaurants(
    query: string,
    locationId: string,
    limit: number = 5
  ) {
    const queryVector = await this.embeddings.embed(query)

    const results = await qdrant.search('restaurants', {
      vector: queryVector,
      limit,
      filter: {
        must: [
          {
            key: 'location_id',
            match: { value: locationId }
          }
        ]
      }
    })

    return results.map(r => ({
      ...r.payload,
      score: r.score
    }))
  }
}
```

---

### 5. LLM Generation (FREE via Groq)

```typescript
// lib/ai/groq-generator.ts
import Groq from 'groq-sdk'
import { SemanticSearch } from '@/lib/search/semantic-search'

export class GroqItineraryGenerator {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY! // FREE tier!
  })
  private search = new SemanticSearch()

  async generate(params: {
    locationId: string
    locationName: string
    days: number
    interests: string[]
    budget: string
  }) {
    // 1. Retrieve relevant activities using vector search
    const interestQuery = params.interests.join(' ')
    const activities = await this.search.searchActivities(
      interestQuery,
      params.locationId,
      20
    )

    const restaurants = await this.search.searchRestaurants(
      `${params.budget} ${interestQuery}`,
      params.locationId,
      10
    )

    // 2. Build optimized prompt
    const prompt = this.buildPrompt(params, activities, restaurants)

    // 3. Call Groq (FAST & FREE!)
    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning expert. Generate realistic, well-paced itineraries in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant', // FREE!
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content!)
  }

  private buildPrompt(params: any, activities: any[], restaurants: any[]) {
    return `Generate a ${params.days}-day itinerary for ${params.locationName}.

RELEVANT ACTIVITIES (semantic search results):
${activities.slice(0, 15).map((a, i) => `
${i + 1}. ${a.name} (relevance: ${(a.score * 100).toFixed(0)}%)
   ${a.description}
   Duration: ${a.duration || '1-2 hours'}
   Cost: ${a.price_info || 'Free'}
`).join('\n')}

RESTAURANTS:
${restaurants.slice(0, 8).map((r, i) => `
${i + 1}. ${r.name} (${r.cuisine_type})
   Price: ${r.price_range}
   Rating: ${r.rating || 'N/A'}
`).join('\n')}

CONSTRAINTS:
- Duration: ${params.days} days
- Budget: ${params.budget}
- Interests: ${params.interests.join(', ')}
- Start at 9 AM, end by 9 PM each day
- Include breakfast, lunch, dinner
- Balance activities (don't overpack)
- Consider travel time between locations

OUTPUT (JSON):
{
  "title": "Itinerary title",
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "09:00",
          "title": "Activity name",
          "type": "activity|meal|transport",
          "duration": 2,
          "description": "Brief description",
          "cost_estimate": 50
        }
      ]
    }
  ],
  "total_cost": 500,
  "tips": ["Tip 1", "Tip 2"]
}

Generate a realistic itinerary using ONLY the activities and restaurants listed above.`
  }
}
```

---

### 6. API Endpoint with Caching

```typescript
// app/api/itineraries/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GroqItineraryGenerator } from '@/lib/ai/groq-generator'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationId, days, interests, budget } = body

    // 1. Check cache first
    const cacheKey = `${locationId}-${days}-${interests.sort().join(',')}-${budget}`
    const { data: cached } = await supabase
      .from('ai_generation_logs')
      .select('result_data')
      .eq('prompt', cacheKey)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (cached?.result_data) {
      console.log('✅ Cache hit!')
      return NextResponse.json({
        success: true,
        data: cached.result_data,
        cached: true
      })
    }

    // 2. Generate new itinerary
    const generator = new GroqItineraryGenerator()
    const startTime = Date.now()
    
    const itinerary = await generator.generate({
      locationId,
      locationName: body.locationName,
      days,
      interests,
      budget
    })

    const generationTime = Date.now() - startTime

    // 3. Cache result
    await supabase.from('ai_generation_logs').insert({
      prompt: cacheKey,
      constraints: { locationId, days, interests, budget },
      model_used: 'groq-llama-3.1-8b',
      generation_time_ms: generationTime,
      result_data: itinerary
    })

    console.log(`✅ Generated in ${generationTime}ms`)

    return NextResponse.json({
      success: true,
      data: itinerary,
      cached: false,
      generationTime
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

## Cost Analysis

### **Phase 1: MVP (0-1000 users)**
- **Groq API**: FREE (14,400 requests/day)
- **Qdrant Cloud**: FREE (1GB storage)
- **Hugging Face**: FREE (30k requests/month)
- **Supabase**: FREE (existing)
- **Total**: **$0/month**

### **Phase 2: Growth (1000-10000 users)**
- **Groq API**: Still FREE or $0.05-$0.10 per 1M tokens
- **Qdrant Cloud**: $25/month (4GB)
- **Hugging Face**: FREE (or self-host embeddings)
- **Supabase**: $25/month (Pro)
- **Total**: **$50-$75/month**

### **Phase 3: Scale (10000+ users)**
- **Self-hosted Llama 3.1 8B**: $100-$200/month (GPU)
- **Self-hosted Qdrant**: $20/month (VPS)
- **Self-hosted embeddings**: $0 (CPU)
- **Supabase**: $25/month
- **Total**: **$145-$245/month**

---

## Performance Benchmarks

| Operation | Time | Cost |
|-----------|------|------|
| Semantic search | 50-100ms | $0 |
| LLM generation (Groq) | 1-2 sec | $0 |
| Cache hit | 50ms | $0 |
| **Total (first time)** | **1-2 sec** | **$0** |
| **Total (cached)** | **50ms** | **$0** |

---

## Next Steps

1. ✅ Sign up for Groq API (free)
2. ✅ Sign up for Qdrant Cloud (free)
3. ✅ Get Hugging Face API key (free)
4. ✅ Run indexing script
5. ✅ Test generation endpoint
6. ✅ Deploy!

**Everything is FREE until you hit scale!** 🎉


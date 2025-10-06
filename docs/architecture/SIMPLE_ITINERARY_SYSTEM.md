# 🚀 Simple, Fast, Free Itinerary System

## Core Concept: Rule-Based Intelligence + Your Existing Data

**User Input**:
```
From: Tokyo
To: Kyoto
Dates: May 15-20 (5 days)
Interests: temples, food, nature
Budget: moderate
```

**System Output**:
```
Day 1 (Tokyo): Senso-ji Temple → Tsukiji Market → Imperial Palace
Day 2 (Tokyo): Shibuya → Harajuku → Shinjuku
Day 3 (Travel): Tokyo → Mt. Fuji (stop) → Kyoto (4 hours)
Day 4 (Kyoto): Fushimi Inari → Gion District → Kiyomizu-dera
Day 5 (Kyoto): Arashiyama Bamboo → Nijo Castle → Departure
```

---

## 🎯 **Algorithm: No AI Needed!**

### **Step 1: Route Planning (Free)**
Use **OpenStreetMap Nominatim** (free geocoding) + simple distance calculation:

```typescript
// services/itinerary/SimpleRoutePlanner.ts
export class SimpleRoutePlanner {
  async planRoute(from: string, to: string, days: number) {
    // 1. Get coordinates for start/end
    const startCoords = await this.geocode(from)
    const endCoords = await this.geocode(to)
    
    // 2. Calculate distance
    const distance = this.haversineDistance(startCoords, endCoords)
    
    // 3. Find interesting stops along the way
    const stops = await this.findStopsAlongRoute(startCoords, endCoords, days)
    
    // 4. Allocate days
    return this.allocateDays(from, to, stops, days)
  }

  private async findStopsAlongRoute(start: Coords, end: Coords, days: number) {
    // Query YOUR database for locations between start and end
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .gte('latitude', Math.min(start.lat, end.lat) - 1)
      .lte('latitude', Math.max(start.lat, end.lat) + 1)
      .gte('longitude', Math.min(start.lng, end.lng) - 1)
      .lte('longitude', Math.max(start.lng, end.lng) + 1)
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(10)

    // Calculate which locations are actually "on the way"
    return locations.filter(loc => {
      const detour = this.calculateDetour(start, end, {
        lat: loc.latitude,
        lng: loc.longitude
      })
      return detour < 50 // Less than 50km detour
    })
  }

  private allocateDays(from: string, to: string, stops: Location[], totalDays: number) {
    const distance = this.totalDistance([from, ...stops, to])
    const travelDays = Math.ceil(distance / 300) // 300km per day max
    const stayDays = totalDays - travelDays

    // Allocate days based on location ratings and size
    const allocation = []
    
    // Start location
    allocation.push({
      location: from,
      days: Math.max(1, Math.floor(stayDays * 0.4))
    })

    // Stops
    stops.forEach(stop => {
      allocation.push({
        location: stop.name,
        days: 1 // One day per stop
      })
    })

    // End location
    allocation.push({
      location: to,
      days: Math.max(1, Math.floor(stayDays * 0.4))
    })

    return allocation
  }
}
```

---

### **Step 2: Daily Activities (Rule-Based)**

```typescript
// services/itinerary/ActivitySelector.ts
export class ActivitySelector {
  async selectActivities(
    locationId: string,
    interests: string[],
    budget: string,
    timeAvailable: number // hours
  ) {
    // 1. Fetch activities from YOUR database
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('location_id', locationId)
      .order('rating', { ascending: false })
      .limit(50)

    // 2. Filter by interests
    let filtered = activities
    if (interests.length > 0) {
      filtered = activities.filter(a => 
        interests.some(interest => 
          a.category?.toLowerCase().includes(interest.toLowerCase()) ||
          a.description?.toLowerCase().includes(interest.toLowerCase())
        )
      )
    }

    // 3. Filter by budget
    filtered = this.filterByBudget(filtered, budget)

    // 4. Select optimal set using greedy algorithm
    return this.greedySelection(filtered, timeAvailable)
  }

  private greedySelection(activities: Activity[], hoursAvailable: number) {
    const selected = []
    let timeUsed = 0

    // Sort by rating/duration ratio (value per hour)
    const sorted = activities.sort((a, b) => {
      const valueA = (a.rating || 4) / this.estimateDuration(a)
      const valueB = (b.rating || 4) / this.estimateDuration(b)
      return valueB - valueA
    })

    for (const activity of sorted) {
      const duration = this.estimateDuration(activity)
      if (timeUsed + duration <= hoursAvailable) {
        selected.push({
          ...activity,
          estimatedDuration: duration
        })
        timeUsed += duration
      }
    }

    return selected
  }

  private estimateDuration(activity: Activity): number {
    // Parse duration string or use defaults
    if (activity.duration) {
      const match = activity.duration.match(/(\d+)/)
      if (match) return parseInt(match[1])
    }

    // Default durations by category
    const defaults = {
      museum: 2,
      viewpoint: 0.5,
      park: 1.5,
      attraction: 2,
      restaurant: 1.5
    }

    return defaults[activity.category] || 2
  }
}
```

---

### **Step 3: Meal Planning (Simple)**

```typescript
// services/itinerary/MealPlanner.ts
export class MealPlanner {
  async planMeals(locationId: string, budget: string, days: number) {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .eq('location_id', locationId)
      .order('rating', { ascending: false })
      .limit(20)

    const filtered = this.filterByBudget(restaurants, budget)

    // Select 3 meals per day
    const meals = []
    for (let day = 1; day <= days; day++) {
      meals.push({
        day,
        breakfast: this.selectMeal(filtered, 'breakfast'),
        lunch: this.selectMeal(filtered, 'lunch'),
        dinner: this.selectMeal(filtered, 'dinner')
      })
    }

    return meals
  }

  private selectMeal(restaurants: Restaurant[], mealType: string) {
    // Simple random selection from top-rated
    const suitable = restaurants.filter(r => {
      const cuisines = ['cafe', 'breakfast'] // for breakfast
      if (mealType === 'lunch') cuisines.push('casual', 'fast')
      if (mealType === 'dinner') cuisines.push('fine dining', 'traditional')
      
      return cuisines.some(c => 
        r.cuisine_type?.toLowerCase().includes(c)
      )
    })

    return suitable[Math.floor(Math.random() * Math.min(5, suitable.length))]
  }
}
```

---

## 🆓 **Free "AI" Options (If You Really Want AI)**

### **Option 1: Ollama (100% Free, Local)** ⭐ **BEST**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download Llama 3.2 (3B model - fast!)
ollama pull llama3.2:3b

# Run locally
ollama serve
```

```typescript
// services/ai/OllamaService.ts
export class OllamaService {
  async generateSuggestions(context: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: context,
        stream: false
      })
    })
    
    const data = await response.json()
    return data.response
  }
}
```

**Pros**:
- ✅ 100% free
- ✅ Fast (2-3 seconds on CPU)
- ✅ No API keys
- ✅ Privacy

**Cons**:
- ❌ Requires server with 8GB RAM
- ❌ Quality lower than GPT-4

---

### **Option 2: Groq API (Free Tier)** ⭐ **FASTEST**

```typescript
// services/ai/GroqService.ts
import Groq from 'groq-sdk'

export class GroqService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY // Free tier!
  })

  async generate(prompt: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // FREE!
      temperature: 0.7,
      max_tokens: 1024
    })

    return completion.choices[0].message.content
  }
}
```

**Pros**:
- ✅ FREE tier (generous limits)
- ✅ SUPER FAST (300 tokens/sec)
- ✅ Good quality
- ✅ No setup

**Cons**:
- ❌ Rate limits (30 requests/min free)
- ❌ Requires API key

**Cost**: $0 for free tier, then $0.05-$0.10 per 1M tokens

---

### **Option 3: Hugging Face Inference API (Free)**

```typescript
// services/ai/HuggingFaceService.ts
export class HuggingFaceService {
  async generate(prompt: string): Promise<string> {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    )

    const data = await response.json()
    return data[0].generated_text
  }
}
```

**Pros**:
- ✅ Free tier available
- ✅ Many models to choose from
- ✅ No setup

**Cons**:
- ❌ Slower (cold starts)
- ❌ Rate limits

---

## 🎯 **Recommended Approach: Hybrid**

### **90% Rule-Based + 10% AI**

```typescript
// services/itinerary/HybridItineraryGenerator.ts
export class HybridItineraryGenerator {
  async generate(params: ItineraryParams) {
    // 1. RULE-BASED: Plan route and allocate days (FAST, FREE)
    const route = await this.routePlanner.planRoute(
      params.from,
      params.to,
      params.days
    )

    // 2. RULE-BASED: Select activities for each location (FAST, FREE)
    const itinerary = []
    for (const stop of route) {
      const activities = await this.activitySelector.selectActivities(
        stop.locationId,
        params.interests,
        params.budget,
        stop.days * 8 // 8 hours per day
      )

      const meals = await this.mealPlanner.planMeals(
        stop.locationId,
        params.budget,
        stop.days
      )

      itinerary.push({
        location: stop.location,
        days: stop.days,
        activities,
        meals
      })
    }

    // 3. AI (OPTIONAL): Add descriptions and tips (SLOW, COSTS MONEY)
    if (params.useAI) {
      itinerary = await this.enhanceWithAI(itinerary)
    }

    return itinerary
  }

  private async enhanceWithAI(itinerary: any) {
    // Use Groq (free) or Ollama (local) for descriptions
    const groq = new GroqService()
    
    for (const day of itinerary) {
      const prompt = `Write a brief, engaging description for this day:
Location: ${day.location}
Activities: ${day.activities.map(a => a.name).join(', ')}

Keep it under 50 words.`

      day.description = await groq.generate(prompt)
    }

    return itinerary
  }
}
```

---

## 💰 **Cost Comparison**

| Approach | Cost per Itinerary | Speed | Quality |
|----------|-------------------|-------|---------|
| **Rule-Based Only** | $0 | <1 sec | Good |
| **Rule-Based + Ollama** | $0 | 2-3 sec | Great |
| **Rule-Based + Groq** | $0 (free tier) | 1-2 sec | Great |
| **Rule-Based + OpenAI** | $0.05-$0.15 | 3-5 sec | Excellent |

---

## 🚀 **What You're Missing**

Your original question covered:
- ✅ Travel from A to B
- ✅ Dates and duration
- ✅ Travel time between
- ✅ Stops and highlights along the way

**Additional features to consider**:

1. **Weather Integration** (you already have this!)
   - Suggest indoor activities on rainy days
   - Warn about extreme weather

2. **Opening Hours**
   - Don't suggest closed attractions
   - Optimize visit times

3. **User Preferences**
   - Save past preferences
   - Learn from completed trips

4. **Budget Tracking**
   - Estimate total cost
   - Track actual spending

5. **Booking Links**
   - Link to booking.com, Airbnb
   - Restaurant reservations

6. **Export Options**
   - PDF download
   - Google Maps export
   - Share link

7. **Offline Mode**
   - Download itinerary
   - Works without internet

---

## ✅ **Final Recommendation**

**For MVP (Week 1)**:
1. ✅ Use **rule-based system** (100% free, instant)
2. ✅ Leverage YOUR existing database (activities, restaurants)
3. ✅ Add **Groq API** for optional AI descriptions (free tier)
4. ✅ Total cost: **$0/month**

**For Production (Month 2)**:
1. ✅ Keep rule-based core
2. ✅ Add **Ollama** for self-hosted AI (free)
3. ✅ Use Groq as fallback
4. ✅ Total cost: **$0-$20/month** (server only)

**No expensive OpenAI needed!** 🎉


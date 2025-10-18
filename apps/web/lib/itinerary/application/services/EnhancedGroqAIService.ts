/**
 * Enhanced Groq AI Service with Pro Mode Support
 * Supports reasoning models for advanced trip planning
 */

import Groq from 'groq-sdk'
import { AIGenerationContext, AIGenerationResult } from './GroqAIService'

export class EnhancedGroqAIService {
  private groq: Groq

  constructor() {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }
    this.groq = new Groq({ apiKey })
  }

  /**
   * Generate itinerary with Pro mode (reasoning model)
   */
  async generateWithProMode(
    context: AIGenerationContext & { transportMode?: string },
    startDate: string
  ): Promise<AIGenerationResult> {
    console.log('🚀 Pro Mode: Using Llama 3.3 70B reasoning model...')

    const prompt = this.buildEnhancedPrompt(context, startDate)
    const startTime = Date.now()

    try {
      // Select reasoning-capable model for Pro mode
      // Default to a known-good Groq model
      let model = process.env.GROQ_REASONING_MODEL || 'llama-3.3-70b-versatile'
      const effort = process.env.GROQ_REASONING_EFFORT || ''
      const isGptOss = model.startsWith('openai/gpt-oss')
      const isQwen = model.startsWith('qwen/')
      // Guard against org-blocked or invalid models in Groq
      const blockedPrefixes = ['openai/gpt-oss']
      const invalidModels = ['qwen/qwen3-32b']
      if (blockedPrefixes.some(p => model.startsWith(p)) || invalidModels.includes(model)) {
        console.warn(`⚠️ Pro Mode model "${model}" is blocked/invalid. Overriding to llama-3.3-70b-versatile.`)
        model = 'llama-3.3-70b-versatile'
      }

      const messages = [
        {
          role: 'system' as const,
          content: `You are an expert travel planner with advanced reasoning capabilities.

CRITICAL: You MUST output ONLY valid JSON. No explanations, no markdown, no code blocks.

Your task is to create a detailed, optimized travel itinerary by:
1. Analyzing the route, distances, and transportation mode
2. Calculating realistic travel times based on the chosen transport mode
3. Balancing travel days with exploration time
4. Considering the user's interests, budget, and preferences
5. Providing detailed, actionable recommendations

Output Schema (STRICT JSON):
{
  "title": "string - Creative trip title",
  "summary": "string - 2-3 sentence overview",
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "location": "string - City/location name",
      "type": "stay" | "travel",
      "didYouKnow": "string - One interesting fact about this location (for stay days)",
      "items": [
        {
          "time": "HH:MM - 24h format",
          "title": "string - Activity/meal/travel/accommodation name",
          "type": "activity" | "meal" | "travel" | "stay",
          "duration": number - hours as decimal,
          "description": "string - Detailed description",
          "costEstimate": number - USD,
          "from": "string - ONLY for travel items",
          "to": "string - ONLY for travel items",
          "mode": "string - ONLY for travel items (car/train/bike/flight)",
          "distance": "string - ONLY for travel items (e.g., '120 km')",
          "accommodationType": "string - ONLY for stay items (hotel/hostel/guesthouse/airbnb)",
          "reason": "string - ONLY for stay items (why stop here)"
        }
      ]
    }
  ],
  "totalCostEstimate": number - Total USD,
  "tips": ["string - Practical travel tips"]
}

Rules:
- Each day must have 4-8 items
- Travel items must include from, to, mode, distance
- Activity items must have realistic durations
- Meal items should be at appropriate times (breakfast 7-9am, lunch 12-2pm, dinner 6-9pm)
- Stay items (overnight accommodations) must include accommodationType and reason
- For long trips (>8 hours travel), include stay items for overnight stops
- Cost estimates must be realistic for the budget level
- Tips should be specific and actionable
- For "stay" days, include ONE interesting "didYouKnow" fact (history, culture, or fun fact)
- Keep facts concise (1-2 sentences) and surprising/educational`
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ]

      const params: any = {
        messages,
        model,
        temperature: 0.6,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      }

      // Configure reasoning controls per model family
      if (isGptOss) {
        // GPT-OSS uses include_reasoning + effort (low|medium|high)
        params.include_reasoning = false // never expose chain-of-thought
        if (effort) params.reasoning_effort = effort
      } else if (isQwen) {
        // Qwen uses reasoning_format + effort (none|default)
        params.reasoning_format = 'hidden' // suppress chain-of-thought
        if (effort) params.reasoning_effort = effort
      }

      console.log(`🚀 Pro Mode: Using reasoning model: ${model}${effort ? ` (effort=${effort})` : ''}`)
      let completion
      try {
        completion = await this.groq.chat.completions.create(params)
      } catch (primaryErr: any) {
        // If configured model fails, fallback to a stable default once
        const fallbackModel = 'llama-3.3-70b-versatile'
        if (model !== fallbackModel) {
          console.warn(`⚠️ Pro Mode primary model failed (${model}). Falling back to ${fallbackModel}.`, primaryErr?.message || primaryErr)
          model = fallbackModel
          params.model = model
          completion = await this.groq.chat.completions.create(params)
        } else {
          throw primaryErr
        }
      }

      const generationTime = Date.now() - startTime
      console.log(`✅ Pro Mode completed in ${generationTime}ms`)

      const rawContent = completion.choices[0].message.content || '{}'
      const result = JSON.parse(rawContent)

      // Validate and enhance result
      return this.validateAndEnhanceResult(result, context)

    } catch (error) {
      console.error('❌ Pro Mode error:', error)
      throw new Error(`Pro Mode generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build enhanced prompt with all context and transportation details
   */
  private buildEnhancedPrompt(
    context: AIGenerationContext & { transportMode?: string },
    startDate: string
  ): string {
    const transportMode = context.transportMode || 'car'
    const interests = context.interests.length > 0
      ? context.interests.join(', ')
      : 'general sightseeing'

    // Calculate average speed for transport mode
    const speedMap: Record<string, number> = {
      car: 80,
      train: 100,
      bike: 20,
      flight: 500,
      mixed: 80
    }
    const avgSpeed = speedMap[transportMode] || 80

    return `Create a ${context.totalDays}-day travel itinerary with Pro-level detail and reasoning.

═══════════════════════════════════════════════════════════════
ROUTE & LOGISTICS
═══════════════════════════════════════════════════════════════
Origin: ${context.fromLocation}
Destination: ${context.toLocation}
Intermediate Stops: ${context.stops.length > 0 ? context.stops.join(' → ') : 'Direct route'}
Total Distance: ${Math.round(context.routeDistance)} km
Estimated Travel Time: ${context.routeDuration.toFixed(1)} hours
Transport Mode: ${transportMode.toUpperCase()} (avg speed: ${avgSpeed} km/h)
Start Date: ${startDate}
Trip Duration: ${context.totalDays} days

${(context as any).structuredContext?.routing ? `
REAL ROUTE METRICS (precomputed)
- Provider: ${(context as any).structuredContext.routing.provider || 'n/a'}
- Distance: ${((context as any).structuredContext.routing.distanceKm ?? context.routeDistance).toFixed(1)} km
- Duration: ${((context as any).structuredContext.routing.durationHours ?? context.routeDuration).toFixed(1)} hours
` : ''}

${(context as any).structuredContext?.aiFormattedData ? `
═══════════════════════════════════════════════════════════════
🎯 COMPREHENSIVE TRIP DATA (Multi-Source, Compressed)
═══════════════════════════════════════════════════════════════
${(context as any).structuredContext.aiFormattedData}

⚠️ CRITICAL: Use ONLY the data above - do not hallucinate new locations!
` : ''}

═══════════════════════════════════════════════════════════════
TRAVELER PREFERENCES
═══════════════════════════════════════════════════════════════
Budget Level: ${context.budget.toUpperCase()}
Primary Interests: ${interests}
${context.maxTravelHoursPerDay ? `Max Travel Hours/Day: ${context.maxTravelHoursPerDay}h (user preference)` : 'No travel time restrictions'}

${(context as any).structuredContext?.poisByLocation ? `
POINTS OF INTEREST (pre-fetched - LEGACY)
${Object.entries((context as any).structuredContext.poisByLocation).map(([name, pois]: any) => `• ${name}: ${pois.slice(0,6).map((p: any)=>p.name).join(', ')}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════
AVAILABLE ATTRACTIONS & DINING (DATABASE RESOURCES)
═══════════════════════════════════════════════════════════════
${context.locationsData.map(loc => {
  const hasCompleteData = (loc as any).hasCompleteData
  const dataStatus = hasCompleteData ? '✅ COMPLETE DATA' : '⚠️ LIMITED DATA'
  return `
📍 ${loc.name.toUpperCase()} ${dataStatus}
   ${(loc as any).latitude && (loc as any).longitude ? `Coordinates: ${(loc as any).latitude}, ${(loc as any).longitude}` : ''}
   ${(loc as any).featuredImage ? `Featured Image: Available in database` : ''}

   Top Activities (${loc.activities.length} in database):
   ${loc.activities.slice(0, 8).map((a, i) => `${i + 1}. ${a.name}${a.description ? ` - ${a.description.substring(0, 60)}...` : ''}`).join('\n   ')}

   Dining Options (${loc.restaurants.length} in database):
   ${loc.restaurants.slice(0, 5).map((r, i) => `${i + 1}. ${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n   ')}
`
}).join('\n')}

⚠️ CRITICAL: DATA USAGE RULES (MANDATORY)
🚫 ABSOLUTELY FORBIDDEN:
- DO NOT invent or hallucinate activities/restaurants
- DO NOT use generic names like "Local Restaurant", "City Tour"
- DO NOT create fictional names
- DO NOT use activities/restaurants not listed above

✅ MANDATORY RULES:
- ONLY use activities and restaurants listed above from our database
- Use EXACT names as provided (copy-paste from above list)
- For ✅ COMPLETE DATA locations: Use ONLY provided activities/restaurants
- For ⚠️ LIMITED DATA locations: Use what's available, plan shorter stays
- Prioritize ✅ COMPLETE DATA locations for longer stays

═══════════════════════════════════════════════════════════════
TRANSPORTATION STRATEGY FOR ${transportMode.toUpperCase()}
═══════════════════════════════════════════════════════════════
${this.getTransportStrategy(transportMode, context)}

═══════════════════════════════════════════════════════════════
🏨 OVERNIGHT STOPS & ACCOMMODATION PLANNING
═══════════════════════════════════════════════════════════════
CRITICAL: For trips with ${Math.round(context.routeDuration)} hours of travel time, you MUST plan realistic overnight stops.

📋 OVERNIGHT STOP RULES:
1. **Max travel per day**:
   - Car/Bus: 6-8 hours (480-640 km)
   - Bike: 4-6 hours (80-120 km)
   - Train: 8-10 hours (800-1000 km)
   - Mixed: 6-8 hours average

2. **Suggest intermediate cities/towns** along the route where travelers should stay overnight
   - Use real cities/towns between ${context.fromLocation} and ${context.toLocation}
   - Consider major highways and common travel routes
   - Suggest cities with good accommodation options

3. **Include "stay" items** with:
   - Location name (real city/town along the route)
   - Accommodation type (hotel, hostel, guesthouse, Airbnb)
   - Budget-appropriate suggestions (${context.budget} budget)
   - Brief reason why this is a good overnight stop

4. **Balance travel days**:
   - Don't make travelers drive/ride 12+ hours in one day
   - Suggest rest stops every 2-3 hours of continuous travel
   - Allow time for meals and breaks

5. **POI Integration**:
   - If POIs are available along the route, suggest overnight stops near interesting POIs
   - This allows travelers to explore attractions without rushing
   - Example: "Stay in [City] to visit [POI] in the evening/morning"

Example for ${Math.round(context.routeDistance)} km trip:
${context.routeDuration > 8 ? `
⚠️ This trip requires ${Math.ceil(context.routeDuration / 8)} overnight stops!
Suggested breakdown:
- Day 1: ${context.fromLocation} → [Intermediate City 1] (${Math.round(context.routeDistance / (Math.ceil(context.routeDuration / 8) + 1))} km, ~6-8 hours) → Stay overnight
${Math.ceil(context.routeDuration / 8) > 1 ? `- Day 2: [Intermediate City 1] → [Intermediate City 2] (${Math.round(context.routeDistance / (Math.ceil(context.routeDuration / 8) + 1))} km, ~6-8 hours) → Stay overnight` : ''}
- Final Day: [Last Stop] → ${context.toLocation} (remaining distance)
` : `✅ This trip can be completed in 1-2 days with proper rest stops.`}

═══════════════════════════════════════════════════════════════
PRO PLANNER REQUIREMENTS
═══════════════════════════════════════════════════════════════
1. REALISTIC SCHEDULING: Daily itineraries from 7am-10pm with proper pacing

2. DESTINATION COVERAGE (CRITICAL):
   - MUST include activity days at BOTH origin (${context.fromLocation}) AND destination (${context.toLocation})
   - Do NOT end the trip with just a travel day to ${context.toLocation}
   - Final destination MUST have at least 1-2 days of activities/exploration
   - Example structure: Paris (2 days) → Travel → Dijon (1 day) → Travel → Berlin (2 days)

3. TRAVEL SEGMENTS WITH INTERMEDIATE STOPS (CRITICAL):
   For ANY travel segment longer than 3-4 hours:
   - Break the journey into realistic segments with waypoint stops
   - Suggest intermediate towns/cities for rest, meals, or overnight stays
   - Example: Paris → Lyon by bike (450km, ~18h total):
     * Day 1: Paris → Fontainebleau (80km, 4h) - Lunch stop
     * Day 1: Fontainebleau → Sens (85km, 4h) - Overnight
     * Day 2: Sens → Auxerre (60km, 3h) - Lunch stop
     * Day 2: Auxerre → Lyon (225km, 11h) - Split into more segments

   Each travel item must include:
   - Exact from/to locations (including intermediate waypoints)
   - Transport mode (${transportMode})
   - Distance in km
   - Duration in hours (realistic for ${transportMode})
   - Cost estimate (fuel/tickets/tolls)
   - Suggested activities/meals at waypoint stops

4. WAYPOINT SELECTION CRITERIA:
   - Choose towns/cities along the actual route (not detours)
   - Prioritize places with dining, accommodation, and attractions
   - Space waypoints every 3-4 hours of travel time
   - For bike: Every 60-80km (3-4 hours at 20km/h)
   - For car: Every 200-300km (2.5-4 hours at 80km/h)
   - For train: Major stations with connections

5. ACTIVITY OPTIMIZATION: Select activities from the provided list that match interests: ${interests}

6. MEAL PLANNING: Include 3 meals/day at appropriate times using provided restaurants
   - Meals at waypoint stops should be realistic (towns along route)

7. BUDGET ADHERENCE: All costs must align with ${context.budget} budget level

8. PRACTICAL TIPS: Provide 5-8 actionable tips specific to ${transportMode} travel

9. ROUTE OPTIMIZATION: Minimize backtracking, suggest logical flow between locations

═══════════════════════════════════════════════════════════════
JSON STRUCTURE FOR TRAVEL ITEMS WITH WAYPOINTS
═══════════════════════════════════════════════════════════════
For travel segments longer than 3-4 hours, use this structure:

{
  "type": "travel",
  "title": "Bike to [Destination]",
  "from": "Paris",
  "to": "Lyon",
  "mode": "${transportMode}",
  "distance": "450km",
  "duration": "18h total",
  "costEstimate": 50,
  "description": "Scenic bike route through French countryside",
  "waypoints": [
    {
      "name": "Fontainebleau",
      "location": "Fontainebleau, France",
      "activity": "Lunch at local bistro + visit Château",
      "duration": "2h stop"
    },
    {
      "name": "Sens",
      "location": "Sens, France",
      "activity": "Dinner + overnight stay",
      "duration": "Overnight"
    },
    {
      "name": "Auxerre",
      "location": "Auxerre, France",
      "activity": "Lunch break + explore old town",
      "duration": "1.5h stop"
    }
  ]
}

For short travel (<3h), omit the waypoints array.

Return ONLY the JSON itinerary. No explanations, no markdown formatting.`
  }

  /**
   * Get transport-specific strategy and recommendations
   */
  private getTransportStrategy(mode: string, context: AIGenerationContext): string {
    const strategies: Record<string, string> = {
      car: `- Plan scenic routes and roadside attractions
- MANDATORY: Break journeys >4h into segments with intermediate town stops
- Include parking information and costs at each stop
- Suggest rest stops every 200-300km (2.5-4 hours)
- Recommend lunch/dinner stops in towns along the route
- Consider fuel costs (~$0.15/km)
- Recommend departure times to avoid traffic`,

      train: `- Focus on train stations and nearby attractions
- MANDATORY: For multi-leg journeys, suggest intermediate station stops
- Include station-to-attraction transport
- Suggest booking advance tickets for savings
- Plan around train schedules (typically hourly)
- Recommend seat reservations for long journeys
- Consider layover activities at major stations`,

      bike: `- Plan routes with bike-friendly paths and dedicated lanes
- MANDATORY: Break journeys into 60-80km segments (3-4 hours cycling)
- Include rest stops every 15-20km for water/snacks
- Suggest lunch stops in towns along the route (every 60-80km)
- Plan overnight stops for multi-day rides
- Suggest accommodations with bike storage
- Consider elevation changes and difficulty
- Recommend early starts (7-8am) to avoid heat/traffic
- Include bike repair shops along route`,

      flight: `- Minimize inter-city flights (focus on exploration)
- Include airport transfer times (2-3h before flight)
- Suggest booking flights in advance
- Plan activities near airports on travel days
- Consider baggage allowances and costs`,

      mixed: `- Optimize transport mode per segment
- Use trains for medium distances (100-500km)
- Use flights for long distances (>500km)
- Use bikes/cars for scenic routes <200km
- Use local transport within cities
- MANDATORY: Break long segments with intermediate stops
- Provide cost comparison for each segment`
    }

    return strategies[mode] || strategies.car
  }

  /**
   * Validate and enhance the AI result
   */
  private validateAndEnhanceResult(
    result: any,
    context: AIGenerationContext & { transportMode?: string }
  ): AIGenerationResult {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid AI response structure')
    }

    if (!result.days || !Array.isArray(result.days)) {
      throw new Error('Missing or invalid days array')
    }

    // Ensure all required fields
    if (!result.title) {
      result.title = `${context.totalDays}-Day Journey: ${context.fromLocation} to ${context.toLocation}`
    }
    if (!result.summary) {
      result.summary = `An optimized ${context.totalDays}-day itinerary by ${context.transportMode || 'car'}`
    }
    if (!result.totalCostEstimate) {
      result.totalCostEstimate = result.days.reduce((sum: number, day: any) => 
        sum + (day.items?.reduce((daySum: number, item: any) => daySum + (item.costEstimate || 0), 0) || 0), 0
      )
    }
    if (!result.tips || !Array.isArray(result.tips)) {
      result.tips = []
    }

    // Enhance travel items with transport mode
    result.days.forEach((day: any) => {
      if (day.items) {
        day.items.forEach((item: any) => {
          if (item.type === 'travel' && !item.mode) {
            item.mode = context.transportMode || 'car'
          }
        })
      }
    })

    console.log(`✅ Validated Pro Mode plan: ${result.days.length} days, ${result.days.reduce((sum: number, d: any) => sum + (d.items?.length || 0), 0)} items`)

    return result as AIGenerationResult
  }
}


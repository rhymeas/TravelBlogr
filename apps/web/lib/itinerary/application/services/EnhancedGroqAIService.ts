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
      // Use Llama 3.3 70B for advanced reasoning (available on Groq)
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
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
      "items": [
        {
          "time": "HH:MM - 24h format",
          "title": "string - Activity/meal/travel name",
          "type": "activity" | "meal" | "travel",
          "duration": number - hours as decimal,
          "description": "string - Detailed description",
          "costEstimate": number - USD,
          "from": "string - ONLY for travel items",
          "to": "string - ONLY for travel items",
          "mode": "string - ONLY for travel items (car/train/bike/flight)",
          "distance": "string - ONLY for travel items (e.g., '120 km')"
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
- Cost estimates must be realistic for the budget level
- Tips should be specific and actionable`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Llama 3.3 70B - best available reasoning model
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      })

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

═══════════════════════════════════════════════════════════════
TRAVELER PREFERENCES
═══════════════════════════════════════════════════════════════
Budget Level: ${context.budget.toUpperCase()}
Primary Interests: ${interests}
${context.maxTravelHoursPerDay ? `Max Travel Hours/Day: ${context.maxTravelHoursPerDay}h (user preference)` : 'No travel time restrictions'}

═══════════════════════════════════════════════════════════════
AVAILABLE ATTRACTIONS & DINING
═══════════════════════════════════════════════════════════════
${context.locationsData.map(loc => `
📍 ${loc.name.toUpperCase()}
   Top Activities (${loc.activities.length} total):
   ${loc.activities.slice(0, 8).map((a, i) => `${i + 1}. ${a.name}${a.description ? ` - ${a.description.substring(0, 60)}...` : ''}`).join('\n   ')}

   Dining Options (${loc.restaurants.length} total):
   ${loc.restaurants.slice(0, 5).map((r, i) => `${i + 1}. ${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n   ')}
`).join('\n')}

═══════════════════════════════════════════════════════════════
TRANSPORTATION STRATEGY FOR ${transportMode.toUpperCase()}
═══════════════════════════════════════════════════════════════
${this.getTransportStrategy(transportMode, context)}

═══════════════════════════════════════════════════════════════
PRO PLANNER REQUIREMENTS
═══════════════════════════════════════════════════════════════
1. REALISTIC SCHEDULING: Daily itineraries from 7am-10pm with proper pacing
2. DETAILED TRAVEL SEGMENTS: Every travel item must include:
   - Exact from/to locations
   - Transport mode (${transportMode})
   - Distance in km
   - Duration in hours (realistic for ${transportMode})
   - Cost estimate (fuel/tickets/tolls)
3. ACTIVITY OPTIMIZATION: Select activities from the provided list that match interests: ${interests}
4. MEAL PLANNING: Include 3 meals/day at appropriate times using provided restaurants
5. BUDGET ADHERENCE: All costs must align with ${context.budget} budget level
6. PRACTICAL TIPS: Provide 5-8 actionable tips specific to ${transportMode} travel
7. ROUTE OPTIMIZATION: Minimize backtracking, suggest logical flow between locations

Return ONLY the JSON itinerary. No explanations, no markdown formatting.`
  }

  /**
   * Get transport-specific strategy and recommendations
   */
  private getTransportStrategy(mode: string, context: AIGenerationContext): string {
    const strategies: Record<string, string> = {
      car: `- Plan scenic routes and roadside attractions
- Include parking information and costs
- Suggest rest stops every 2-3 hours
- Consider fuel costs (~$0.15/km)
- Recommend departure times to avoid traffic`,

      train: `- Focus on train stations and nearby attractions
- Include station-to-attraction transport
- Suggest booking advance tickets for savings
- Plan around train schedules (typically hourly)
- Recommend seat reservations for long journeys`,

      bike: `- Plan routes with bike-friendly paths
- Include rest stops every 15-20km
- Suggest accommodations with bike storage
- Consider elevation changes and difficulty
- Recommend early starts to avoid heat/traffic`,

      flight: `- Minimize inter-city flights (focus on exploration)
- Include airport transfer times (2-3h before flight)
- Suggest booking flights in advance
- Plan activities near airports on travel days
- Consider baggage allowances and costs`,

      mixed: `- Optimize transport mode per segment
- Use trains for medium distances (100-500km)
- Use flights for long distances (>500km)
- Use local transport within cities
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


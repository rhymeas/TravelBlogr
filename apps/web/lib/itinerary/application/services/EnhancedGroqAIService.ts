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
    console.log('🚀 Pro Mode: Using DeepSeek-R1 reasoning model...')
    
    const prompt = this.buildEnhancedPrompt(context, startDate)
    const startTime = Date.now()

    try {
      // Use DeepSeek-R1 for reasoning (available on Groq)
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert travel planner with deep reasoning capabilities. 
            
Analyze the trip requirements carefully and create an optimized itinerary that:
1. Considers realistic travel times and transportation modes
2. Balances travel days with exploration days
3. Suggests optimal routes and stops
4. Provides detailed transportation information
5. Includes cost estimates and practical tips

Output MUST be valid JSON following this exact schema:
{
  "title": "string",
  "summary": "string",
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "location": "string",
      "type": "stay" | "travel",
      "items": [
        {
          "time": "HH:MM",
          "title": "string",
          "type": "activity" | "meal" | "travel",
          "duration": number (hours),
          "description": "string",
          "costEstimate": number,
          "from": "string" (for travel items),
          "to": "string" (for travel items),
          "mode": "string" (for travel items),
          "distance": "string" (for travel items)
        }
      ]
    }
  ],
  "totalCostEstimate": number,
  "tips": ["string"]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'deepseek-r1-distill-llama-70b', // Reasoning model
        temperature: 0.6,
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
   * Build enhanced prompt with transportation details
   */
  private buildEnhancedPrompt(
    context: AIGenerationContext & { transportMode?: string },
    startDate: string
  ): string {
    const transportMode = context.transportMode || 'car'
    const interests = context.interests.length > 0 
      ? context.interests.join(', ') 
      : 'general sightseeing'

    return `Create a detailed ${context.totalDays}-day travel itinerary with enhanced transportation analysis.

**Route Information:**
- From: ${context.fromLocation}
- To: ${context.toLocation}
- Stops: ${context.stops.length > 0 ? context.stops.join(', ') : 'None'}
- Total Distance: ${context.routeDistance} km
- Estimated Travel Time: ${context.routeDuration} hours
- Transport Mode: ${transportMode}
- Start Date: ${startDate}

**Travel Preferences:**
- Budget: ${context.budget}
- Interests: ${interests}
${context.maxTravelHoursPerDay ? `- Max Travel Hours/Day: ${context.maxTravelHoursPerDay}h` : ''}

**Transportation Analysis Required:**
For ${transportMode} travel, provide:
1. Realistic travel times between locations
2. Suggested departure/arrival times
3. Rest stops or breaks for long journeys
4. Alternative transport options if beneficial
5. Cost estimates for transportation
6. Booking recommendations (if applicable)

**Available Activities & Restaurants:**
${context.locationsData.map(loc => `
${loc.name}:
- Activities: ${loc.activities.slice(0, 5).map(a => a.name).join(', ')}
- Restaurants: ${loc.restaurants.slice(0, 3).map(r => r.name).join(', ')}
`).join('\n')}

**Requirements:**
1. Create realistic daily schedules (8am-10pm)
2. Include specific travel segments with from/to/mode/duration/distance
3. Balance travel days with exploration days
4. Provide cost estimates for all items
5. Add practical tips for ${transportMode} travel
6. Consider ${context.budget} budget constraints
7. Focus on ${interests}

Return a complete JSON itinerary following the schema provided.`
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


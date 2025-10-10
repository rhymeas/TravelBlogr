/**
 * Application Service: GroqAIService
 * Handles AI-powered plan generation using Groq
 */

import Groq from 'groq-sdk'
// import { planDay } from '../../domain/entities/plan' // Not yet implemented
type planDay = any

export interface AIGenerationContext {
  fromLocation: string
  toLocation: string
  totalDays: number
  routeDistance: number
  routeDuration: number
  stops: string[]
  interests: string[]
  budget: 'budget' | 'moderate' | 'luxury'
  maxTravelHoursPerDay?: number // User preference for max travel time per day
  locationsData: Array<{
    name: string
    slug: string
    activities: any[]
    restaurants: any[]
  }>
}

export interface AIGenerationResult {
  title: string
  summary: string
  days: planDay[]
  totalCostEstimate: number
  tips: string[]
}

export class GroqAIService {
  private groq: Groq

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set')
    }
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  /**
   * Generate plan using Groq AI with retry logic
   */
  async generateplan(
    context: AIGenerationContext,
    startDate: string
  ): Promise<AIGenerationResult> {
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Calling Groq AI (attempt ${attempt}/${maxRetries})...`)
        return await this.attemptGeneration(context, startDate)
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️  Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')

        if (attempt < maxRetries) {
          console.log(`🔄 Retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        }
      }
    }

    throw lastError || new Error('Failed to generate plan after retries')
  }

  /**
   * Single attempt to generate plan
   */
  private async attemptGeneration(
    context: AIGenerationContext,
    startDate: string
  ): Promise<AIGenerationResult> {
    const prompt = this.buildPrompt(context, startDate)
    const startTime = Date.now()

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert travel planner. Create realistic, well-paced day-by-day itineraries using ONLY the provided activities and restaurants.

CRITICAL JSON FORMATTING RULES:
1. Output MUST be a valid JSON object (not an array)
2. All times MUST be strings in "HH:MM" format (e.g., "09:00", "14:30")
3. All numbers MUST be valid integers or floats (no commas in numbers)
4. All strings MUST be properly escaped
5. Follow the EXACT schema provided - do not add or remove fields
6. Ensure all brackets and braces are properly closed

Be specific with times and durations. Consider travel time between activities.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Using better model for complex JSON
        temperature: 0.5, // Lower temperature for more consistent formatting
        max_tokens: 4000, // More tokens for longer trips
        response_format: { type: 'json_object' }
      })

      const generationTime = Date.now() - startTime
      console.log(`✅ Groq AI responded in ${generationTime}ms`)

      const rawContent = completion.choices[0].message.content || '{}'
      console.log(`📝 AI Response (first 500 chars):`, rawContent.substring(0, 500))

      // Try to parse JSON
      let result: any
      try {
        result = JSON.parse(rawContent)
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError)
        console.error('Raw content:', rawContent.substring(0, 1000))
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`)
      }

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('AI response is not a valid object')
      }

      if (Array.isArray(result)) {
        throw new Error('AI response is an array, expected an object. The AI must return {title, summary, days, ...} not [...]')
      }

      if (!result.days || !Array.isArray(result.days)) {
        console.error('❌ Invalid AI response structure:', result)
        throw new Error('Invalid AI response: missing or invalid "days" array')
      }

      if (result.days.length === 0) {
        throw new Error('AI response has empty days array')
      }

      // Validate and fix each day
      result.days.forEach((day: any, index: number) => {
        if (!day.items || !Array.isArray(day.items)) {
          console.warn(`⚠️  Day ${index + 1} missing items array, adding empty array`)
          day.items = []
        }

        // Validate time format in items
        day.items.forEach((item: any, itemIndex: number) => {
          if (item.time && typeof item.time !== 'string') {
            console.warn(`⚠️  Day ${index + 1}, Item ${itemIndex + 1}: Converting time to string`)
            item.time = String(item.time)
          }
        })
      })

      // Ensure required fields exist
      if (!result.title) result.title = `Trip from ${context.fromLocation} to ${context.toLocation}`
      if (!result.summary) result.summary = `A ${context.totalDays}-day journey`
      if (!result.totalCostEstimate) result.totalCostEstimate = 0
      if (!result.tips || !Array.isArray(result.tips)) result.tips = []

      console.log(`✅ Validated plan: ${result.days.length} days, ${result.days.reduce((sum: number, d: any) => sum + (d.items?.length || 0), 0)} items`)

      return result as AIGenerationResult

    } catch (error) {
      console.error('❌ Groq AI error:', error)

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('json_validate_failed')) {
          throw new Error('AI generated invalid JSON format. This usually happens with very long trips. Try reducing the number of days or simplifying your request.')
        }
        throw new Error(`AI generation failed: ${error.message}`)
      }

      throw new Error('AI generation failed: Unknown error')
    }
  }

  /**
   * Build optimized prompt for Groq
   */
  private buildPrompt(context: AIGenerationContext, startDate: string): string {
    const interests = context.interests.length > 0 
      ? context.interests.join(', ') 
      : 'general sightseeing'

    return `Create a ${context.totalDays}-day travel plan from ${context.fromLocation} to ${context.toLocation}.

ROUTE INFORMATION:
- Distance: ${Math.round(context.routeDistance)} km
- Travel time: ${Math.round(context.routeDuration)} hours
- Stops along the way: ${context.stops.join(', ') || 'none'}

IMPORTANT: The itinerary MUST include activities in BOTH ${context.fromLocation} AND ${context.toLocation}.
- Start in ${context.fromLocation} with activities there
- Travel to ${context.toLocation} (allocate travel days as needed)
- END with activities in ${context.toLocation} - this is the final destination!
- Do NOT end the trip with just "traveling to ${context.toLocation}" - include actual activities there!

AVAILABLE LOCATIONS & ACTIVITIES:
${context.locationsData.map((loc, i) => `
${i + 1}. ${loc.name}
   
   Top Activities (${loc.activities.length}):
   ${loc.activities.slice(0, 8).map((a: any, idx: number) => 
     `${idx + 1}. ${a.name}
        ${a.description ? a.description.substring(0, 100) : 'Explore this attraction'}
        Duration: ${a.duration || '1-2 hours'} | Cost: ${a.price_info || 'Varies'}`
   ).join('\n   ')}
   
   Top Restaurants (${loc.restaurants.length}):
   ${loc.restaurants.slice(0, 5).map((r: any, idx: number) => 
     `${idx + 1}. ${r.name} - ${r.cuisine_type || 'Restaurant'} (${r.price_range || '$$'})`
   ).join('\n   ')}
`).join('\n')}

REQUIREMENTS:
- Total days: ${context.totalDays}
- Start date: ${startDate}
- Interests: ${interests}
- Budget: ${context.budget}
- Daily schedule: 9 AM - 8 PM
- Include 3 meals per day (breakfast, lunch, dinner)
- Balance activities (don't overpack - max 3-4 activities per day)
- Consider travel time between locations
- Use ONLY activities and restaurants listed above
- Be realistic with timing and distances
- CRITICAL: The final destination is ${context.toLocation} - the last day(s) MUST include activities in ${context.toLocation}, not just travel!
- Allocate at least 1 full day for exploring ${context.toLocation} with actual activities and restaurants

TRAVEL PACING RULES:
${context.maxTravelHoursPerDay ? `- Maximum travel time per day: ${context.maxTravelHoursPerDay} hours
- If a segment requires more than ${context.maxTravelHoursPerDay} hours of travel, split it across multiple days
- Suggest interesting stops along the way to break up long journeys
- NEVER schedule more than ${context.maxTravelHoursPerDay} hours of continuous travel in a single day` : `- Keep travel segments under 4 hours per day when possible
- For journeys over 4 hours, suggest breaking them into multiple days with stops
- Suggest creative stops along the route (scenic towns, attractions, viewpoints)`}
- When suggesting stops, use locations from the available list above if they're on the route
- If no database locations are on the route, mention "Consider stopping at [interesting place name] along the way" in the day's description

OUTPUT SCHEMA - MUST BE VALID JSON OBJECT (not array):
{
  "title": "Engaging trip title",
  "summary": "Brief 2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "location": "Location name from list above",
      "locationMetadata": {
        "name": "Full location name",
        "country": "Country name",
        "region": "State/Province/Region (or subregion like 'South-Eastern Asia' for small countries)",
        "continent": "Continent name (Asia, Europe, Africa, North America, South America, Oceania, Antarctica)"
      },
      "type": "stay",
      "items": [
        {
          "time": "09:00",
          "title": "Activity or restaurant name (MUST match list above)",
          "type": "activity",
          "duration": 2,
          "description": "What to expect, why it's interesting",
          "costEstimate": 50
        },
        {
          "time": "12:00",
          "title": "Restaurant name",
          "type": "meal",
          "duration": 1,
          "description": "Meal description",
          "costEstimate": 30
        }
      ]
    },
    {
      "day": 2,
      "date": "Next day date",
      "location": "Next location name",
      "locationMetadata": {
        "name": "Full location name",
        "country": "Country name",
        "region": "State/Province/Region or subregion",
        "continent": "Continent name"
      },
      "type": "travel",
      "items": [
        {
          "time": "08:00",
          "title": "Train to [Destination]",
          "type": "travel",
          "duration": "3h 30min",
          "mode": "Train",
          "from": "Starting location",
          "to": "Destination location",
          "description": "Amtrak Acela Express (3.5h, $120-180) or Northeast Regional (4h, $50-90). Book on Amtrak.com 2-3 weeks ahead for best prices. Coastal views after New Haven, historic Providence. Sit right side for ocean views, free WiFi, arrive 30min early.",
          "costEstimate": 85
        }
      ]
    }
  ],
  "totalCostEstimate": 500,
  "tips": [
    "Practical tip 1",
    "Practical tip 2",
    "Practical tip 3"
  ]
}

LOCATION METADATA REQUIREMENTS (CRITICAL):
- ALWAYS include "locationMetadata" for EVERY day
- "continent" MUST be one of: Asia, Europe, Africa, North America, South America, Oceania, Antarctica
- "region" should be:
  * For large countries: State/Province (e.g., "California", "Bavaria", "Queensland")
  * For small countries without states: Subregion (e.g., "South-Eastern Asia" for Timor-Leste, "Western Europe" for Monaco)
  * NEVER use "Unknown Region" - always provide accurate geographic information
- "country" MUST be the official country name (e.g., "United States", "Timor-Leste", "France")
- Use your geographic knowledge to provide accurate continent and region data

TRAVEL ITEM REQUIREMENTS:
- "duration" for travel items MUST be a STRING like "3h 30min", "2h 15min", "45min" (NOT a number)
- "mode" MUST be one of: "Train", "Car", "Flight", "Bus", "Ferry"
- "from" and "to" MUST be the actual location names for Google Maps directions
- Include realistic travel times and costs

TRAVEL DESCRIPTION GUIDELINES (VERY IMPORTANT!):
Travel descriptions must be DETAILED and ACTIONABLE. Include ALL of these elements:

1. SPECIFIC OPTIONS: Name 2-3 actual transportation providers/services with duration and price range
   Example: "Amtrak Acela Express (3.5h, $120-180) or Northeast Regional (4h, $50-90)"

2. BOOKING INFO: Where to book, advance booking tips, how to save money
   Example: "Book on Amtrak.com or app 2-3 weeks ahead for 40% savings. Tuesday/Wednesday often cheaper."

3. SCENIC HIGHLIGHTS: Interesting views or landmarks along the route
   Example: "Coastal views after New Haven, historic Providence skyline, Connecticut shoreline"

4. PRACTICAL TIPS: Useful advice for the journey
   Example: "Sit on right side for ocean views. Free WiFi available. Arrive 30min early for boarding."

EXAMPLES BY MODE:

Train: "Amtrak Acela Express (3.5h, $120-180) or Northeast Regional (4h, $50-90). Book on Amtrak.com 2-3 weeks ahead for best prices. Coastal views after New Haven, historic Providence. Sit right side for ocean views, free WiFi, arrive 30min early."

Flight: "Direct flights on Delta, United, or JetBlue (1.5h, $150-300). Book on Google Flights or airline sites 6-8 weeks ahead. Non-stop preferred over connections. Check-in online 24h before, arrive 2h early for security."

Car: "Scenic 4-hour drive via I-95 or coastal Route 1 (slower but beautiful). Rental from Enterprise/Hertz at airport ($50-80/day). Stop at Mystic Seaport or coastal towns. Free parking at most attractions, paid downtown."

Bus: "Greyhound or Peter Pan (4.5h, $25-45). Book on company websites for e-tickets. WiFi and power outlets available. Departs from central stations, arrive 15min early."

Ferry: "Seasonal ferry service (2h, $60-90). Book at ferrycompany.com in advance, especially summer weekends. Bring light jacket for deck. Scenic harbor views, onboard cafe."

CRITICAL:
- Root must be an OBJECT {...}, NOT an array [...]
- All "time" values must be STRINGS like "09:00", "14:30" (with quotes)
- All "type" values must be one of: "activity", "meal", or "travel"
- Do NOT use pipe symbols (|) in the actual JSON output

IMPORTANT:
- Use exact activity/restaurant names from the lists above
- Ensure times are realistic (e.g., lunch around 12-2 PM, dinner around 6-8 PM)
- Include travel time between activities (15-30 min in same city)
- Don't schedule more than 8-9 hours of activities per day
- Leave buffer time for rest and spontaneous exploration

Generate the plan now:`
  }
}


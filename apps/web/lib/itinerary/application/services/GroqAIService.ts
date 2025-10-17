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
  transportMode?: 'car' | 'train' | 'bike' | 'flight' | 'bus' | 'mixed' // Transport mode preference
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
   * Get validation rules based on transport mode and distance
   */
  private getValidationRules(context: AIGenerationContext): string {
    const distance = Math.round(context.routeDistance)
    const days = context.totalDays
    const mode = context.transportMode || 'car'

    let rules = ''

    switch (mode) {
      case 'bike':
        const minCyclingDays = Math.ceil(distance / 80) // 80km max per day
        const recommendedCyclingDays = Math.ceil(distance / 60) // 60km comfortable

        rules = `
📊 DISTANCE CALCULATION FOR BIKE:
- Total distance: ${distance} km
- Minimum cycling days needed: ${minCyclingDays} days (at 80 km/day)
- Recommended cycling days: ${recommendedCyclingDays} days (at 60 km/day comfortable pace)
- Available days: ${days} days
- Days for sightseeing: ${Math.max(0, days - recommendedCyclingDays)} days

✅ MANDATORY REQUIREMENTS:
1. You MUST allocate AT LEAST ${minCyclingDays} days for cycling
2. Each cycling day MUST be ≤80 km
3. You MUST include intermediate cities for overnight stops every 60-80 km
4. You MUST include rest days if journey >5 cycling days
5. You MUST plan actual cycling routes (not straight-line distance)

🗺️ REQUIRED INTERMEDIATE STOPS:
${this.calculateIntermediateStops(context.fromLocation, context.toLocation, distance, 70)}

❌ VALIDATION FAILURES TO AVOID:
- DO NOT plan ${distance}km in ${Math.min(3, days)} days
- DO NOT skip intermediate overnight stops
- DO NOT use activities from only start/end cities
- DO NOT ignore the ${distance}km total distance`
        break

      case 'car':
        const drivingDays = Math.ceil(distance / 400) // 400km comfortable per day
        rules = `
📊 DISTANCE CALCULATION FOR CAR:
- Total distance: ${distance} km
- Recommended driving days: ${drivingDays} days (at 400 km/day)
- You MUST include rest stops every 200-300 km
- You MUST plan overnight stops for journeys >500 km`
        break

      case 'train':
        rules = `
📊 TRAIN JOURNEY PLANNING:
- Total distance: ${distance} km
- Consider train schedules and connections
- Include time for station transfers
- Plan activities near train stations`
        break

      default:
        rules = `- Plan realistic travel segments based on ${distance} km total distance`
    }

    return rules
  }

  /**
   * Calculate intermediate stops for long journeys
   */
  private calculateIntermediateStops(from: string, to: string, distance: number, segmentKm: number): string {
    const numStops = Math.floor(distance / segmentKm)

    if (numStops <= 1) {
      return `- Direct route possible (distance: ${distance}km)`
    }

    // Provide guidance on intermediate stops
    const examples: Record<string, string[]> = {
      'Barcelona-Rome': ['Montpellier', 'Nice', 'Genoa', 'Pisa', 'Florence', 'Siena'],
      'Paris-Berlin': ['Reims', 'Luxembourg', 'Frankfurt', 'Leipzig'],
      'London-Edinburgh': ['York', 'Newcastle', 'Berwick-upon-Tweed']
    }

    const routeKey = `${from}-${to}`
    const suggestedStops = examples[routeKey] || []

    if (suggestedStops.length > 0) {
      return `- Suggested intermediate cities: ${suggestedStops.join(' → ')}
- Plan ${numStops} overnight stops along this route
- Each segment should be approximately ${segmentKm}km`
    }

    return `- You MUST include ${numStops} intermediate cities for overnight stops
- Each segment should be approximately ${segmentKm}km
- Research actual cities along the route between ${from} and ${to}`
  }

  /**
   * Get transport mode specific guidance
   */
  private getTransportModeGuidance(mode?: string): string {
    switch (mode) {
      case 'bike':
        return `TRANSPORT MODE: BIKE/CYCLING ⚠️ CRITICAL CONSTRAINTS

🚴 MANDATORY DAILY LIMITS (STRICTLY ENFORCED):
- Maximum 80 km per day for recreational cyclists
- Maximum 120 km per day for experienced cyclists
- NEVER plan more than 100 km in a single day without explicit user request
- Each cycling day MUST include overnight accommodation at destination

🛑 MULTI-DAY JOURNEY REQUIREMENTS:
- For distances >150 km: MUST split into multiple days with overnight stops
- Example: Barcelona to Rome (858 km) = MINIMUM 10-12 cycling days
- MUST include intermediate cities for overnight stays
- Each day MUST end in a city/town with accommodation

📍 REQUIRED INTERMEDIATE STOPS (for long journeys):
- Plan stops every 60-80 km for overnight accommodation
- Include rest days every 3-4 cycling days
- Suggest bike-friendly hotels/hostels at each stop
- Include bike storage and repair shop information

🗺️ ROUTE PLANNING:
- Use actual cycling routes, not straight-line distance
- Avoid highways and major motorways (bikes not allowed)
- Suggest scenic coastal or countryside routes
- Consider elevation changes (mountains add 30-50% to time)
- Include ferry crossings if needed (e.g., Mediterranean routes)

⏰ REALISTIC TIME ESTIMATES:
- Average speed: 15-20 km/h (including breaks)
- Add 1-2 hours for lunch and rest stops
- Start early (7-8 AM) to avoid heat
- Finish by 4-5 PM to allow for check-in and rest

❌ WHAT NOT TO DO:
- DO NOT plan 858 km in 2-3 days
- DO NOT skip intermediate overnight stops
- DO NOT use straight-line distance
- DO NOT ignore terrain and elevation`

      case 'train':
        return `TRANSPORT MODE: TRAIN
- Prioritize train connections between cities
- Include realistic train schedules and journey times
- Suggest scenic train routes when available
- Consider train station locations when planning activities
- Include time for station transfers and connections
- Recommend booking advance tickets for popular routes
- Suggest rail passes if economical for the itinerary`

      case 'flight':
        return `TRANSPORT MODE: FLIGHT
- Plan flights for long distances (>500 km)
- Include realistic flight times + 2-3 hours for airport procedures
- Consider airport locations and transfer times to city centers
- Suggest booking flights in advance for better prices
- Include time for check-in, security, and baggage claim
- Recommend direct flights when possible`

      case 'mixed':
        return `TRANSPORT MODE: MIXED (Flexible)
- Use the most efficient transport for each segment
- Trains for medium distances (100-500 km)
- Flights for long distances (>500 km)
- Local transport (bus, metro) within cities
- Consider cost, time, and scenic value when choosing transport
- Provide options when multiple modes are viable`

      case 'car':
      default:
        return `TRANSPORT MODE: CAR/ROAD TRIP
- Plan realistic daily driving distances (300-500 km per day)
- Include rest stops every 2-3 hours
- Suggest scenic routes and viewpoints along the way
- Consider parking availability at destinations
- Include fuel costs in budget estimates
- Recommend interesting stops along the route`
    }
  }

  /**
   * Build optimized prompt for Groq
   */
  private buildPrompt(context: AIGenerationContext, startDate: string): string {
    const interests = context.interests.length > 0
      ? context.interests.join(', ')
      : 'general sightseeing'

    // Transport mode specific guidance
    const transportGuidance = this.getTransportModeGuidance(context.transportMode)

    return `Create a ${context.totalDays}-day travel plan from ${context.fromLocation} to ${context.toLocation}.

ROUTE INFORMATION:
- Distance: ${Math.round(context.routeDistance)} km
- Travel time: ${Math.round(context.routeDuration)} hours
- Stops along the way: ${context.stops.join(', ') || 'none'}
- Transport mode: ${context.transportMode || 'car'}

${transportGuidance}

⚠️ CRITICAL VALIDATION FOR ${context.transportMode?.toUpperCase() || 'CAR'} MODE:
${this.getValidationRules(context)}

IMPORTANT: The itinerary MUST include activities in BOTH ${context.fromLocation} AND ${context.toLocation}.
- Start in ${context.fromLocation} with activities there
- Travel to ${context.toLocation} (allocate travel days as needed)
- END with activities in ${context.toLocation} - this is the final destination!
- Do NOT end the trip with just "traveling to ${context.toLocation}" - include actual activities there!

🗺️ AVAILABLE LOCATIONS & ACTIVITIES (DATABASE RESOURCES):
${context.locationsData.map((loc, i) => `
${i + 1}. ${loc.name} ${(loc as any).hasCompleteData ? '✅ COMPLETE DATA' : '⚠️ LIMITED DATA'}
   ${(loc as any).latitude && (loc as any).longitude ? `📍 Coordinates: ${(loc as any).latitude}, ${(loc as any).longitude}` : ''}
   ${(loc as any).featuredImage ? `🖼️ Featured Image: Available in database` : ''}

   Top Activities (${loc.activities.length} in database):
   ${loc.activities.slice(0, 8).map((a: any, idx: number) =>
     `${idx + 1}. ${a.name}
        ${a.description ? a.description.substring(0, 100) : 'Explore this attraction'}
        Duration: ${a.duration || '1-2 hours'} | Cost: ${a.price_info || 'Varies'}`
   ).join('\n   ')}

   Top Restaurants (${loc.restaurants.length} in database):
   ${loc.restaurants.slice(0, 5).map((r: any, idx: number) =>
     `${idx + 1}. ${r.name} - ${r.cuisine_type || 'Restaurant'} (${r.price_range || '$$'})`
   ).join('\n   ')}
`).join('\n')}

⚠️ CRITICAL REQUIREMENTS - DATA USAGE (MANDATORY):

🚫 ABSOLUTELY FORBIDDEN:
❌ DO NOT invent or hallucinate activities/restaurants
❌ DO NOT use generic names like "Local Restaurant", "City Tour", "Walking Tour"
❌ DO NOT create fictional restaurant names or activities
❌ DO NOT use activities/restaurants not listed above

✅ MANDATORY RULES:
✅ ONLY use activities and restaurants listed above from our database
✅ Use EXACT names as provided (copy-paste from above list)
✅ For locations with ✅ COMPLETE DATA: Use ONLY the provided activities/restaurants
✅ For locations with ⚠️ LIMITED DATA: Use what's available, plan shorter stays
✅ Prioritize locations with ✅ COMPLETE DATA for longer stays (more to do)

📊 DATA COMPLETENESS GUIDE:
- ✅ COMPLETE DATA = 5+ activities AND 3+ restaurants → Plan 2-3 days
- ⚠️ LIMITED DATA = <5 activities OR <3 restaurants → Plan 1 day max or skip
- If a location has NO activities listed, it's a waypoint/transit stop only

📋 ITINERARY REQUIREMENTS:
- Total days: ${context.totalDays}
- Start date: ${startDate}
- Interests: ${interests}
- Budget: ${context.budget}
- Daily schedule: 9 AM - 8 PM
- Include 3 meals per day (breakfast, lunch, dinner)
- Balance activities (don't overpack - max 3-4 activities per day)
- Consider travel time between locations
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
      "location": "Location name from list above (JUST the city/place name, NOT 'Travel to X')",
      "locationMetadata": {
        "name": "Full location name",
        "country": "Country name",
        "region": "State/Province/Region (or subregion like 'South-Eastern Asia' for small countries)",
        "continent": "Continent name (Asia, Europe, Africa, North America, South America, Oceania, Antarctica)",
        "latitude": 40.7128,
        "longitude": -74.0060
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
      ],
      "didYouKnow": "One interesting fact about this location (history, culture, or fun fact)"
    },
    {
      "day": 2,
      "date": "Next day date",
      "location": "Next location name (JUST the city/place name, NOT 'Travel to X')",
      "locationMetadata": {
        "name": "Full location name",
        "country": "Country name",
        "region": "State/Province/Region or subregion",
        "continent": "Continent name",
        "latitude": 40.7128,
        "longitude": -74.0060
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
- "latitude" and "longitude" MUST be accurate decimal coordinates for the location (e.g., 40.7128, -74.0060 for New York)
- Use your geographic knowledge to provide accurate continent, region, and coordinate data

LOCATION NAME REQUIREMENTS (CRITICAL):
- The "location" field MUST contain ONLY the city/place name (e.g., "Paris", "Rome", "Tokyo")
- NEVER use phrases like "Travel to Paris" or "Journey to Rome" in the location field
- For travel days, the location should be the DESTINATION city, not "Travel to X"
- Example: ✅ "location": "Paris" | ❌ "location": "Travel to Paris"

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

DID YOU KNOW FACTS:
- For each "stay" day, include ONE interesting fact in the "didYouKnow" field
- Make it surprising, educational, or useful for travelers
- Keep it concise (1-2 sentences)
- Examples: "Tokyo has over 100 Michelin-starred restaurants, more than any other city" or "The Eiffel Tower was meant to be temporary, built for the 1889 World's Fair"
- For "travel" days, you can omit this field or include a fact about the journey

Generate the plan now:`
  }
}


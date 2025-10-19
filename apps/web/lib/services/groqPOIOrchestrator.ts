/**
 * GROQ POI Orchestrator
 * 
 * Uses GROQ AI as an intelligent orchestrator for POI discovery.
 * GROQ analyzes trip context, validates POI relevance, and fills gaps.
 * 
 * This is NOT just a fallback - GROQ actively improves POI quality.
 */

import { createGroqClient } from '@/lib/groq'
import type { ComprehensivePOI } from './comprehensivePOIService'

export type TravelType = 
  | 'road-trip'
  | 'city-break'
  | 'adventure'
  | 'cultural'
  | 'nature'
  | 'beach'
  | 'family'
  | 'romantic'
  | 'business'
  | 'backpacking'
  | 'luxury'

export interface TripContext {
  from: string
  to: string
  stops?: string[]
  travelType: TravelType
  budget: 'budget' | 'moderate' | 'luxury'
  days: number
  transportMode: string
  interests?: string[]
}

export interface POISearchStrategy {
  priorityCategories: string[]
  accommodationNeeds: {
    count: number
    types: string[]
    locations: string[]
  }
  mealBreaks: {
    count: number
    types: string[]
  }
  activities: {
    count: number
    types: string[]
  }
  criticalGaps: string[]
}

export interface POIGap {
  type: 'accommodation' | 'meal' | 'activity' | 'viewpoint' | 'rest-stop'
  location: string
  reason: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  suggestions: string[]
}

/**
 * STEP 1: GROQ analyzes trip context and generates POI search strategy
 */
export async function generatePOISearchStrategy(
  tripContext: TripContext
): Promise<POISearchStrategy> {
  try {
    const groq = createGroqClient()

    const prompt = `You are a travel planning expert. Analyze this trip and generate a POI search strategy.

TRIP DETAILS:
- Route: ${tripContext.from} → ${tripContext.stops?.join(' → ') || ''} → ${tripContext.to}
- Travel Type: ${tripContext.travelType}
- Budget: ${tripContext.budget}
- Duration: ${tripContext.days} days
- Transport: ${tripContext.transportMode}
- Interests: ${tripContext.interests?.join(', ') || 'general sightseeing'}

TASK:
Generate a search strategy that identifies:
1. Priority POI categories for this travel type
2. Accommodation needs (how many nights, what types, where)
3. Meal breaks needed (how many, what types)
4. Activities to prioritize (count, types)
5. Critical gaps to watch for

Return as JSON:
{
  "priorityCategories": ["category1", "category2", ...],
  "accommodationNeeds": {
    "count": number,
    "types": ["hotel", "hostel", ...],
    "locations": ["city1", "city2", ...]
  },
  "mealBreaks": {
    "count": number,
    "types": ["casual", "fine-dining", ...]
  },
  "activities": {
    "count": number,
    "types": ["outdoor", "cultural", ...]
  },
  "criticalGaps": ["gap1", "gap2", ...]
}`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('GROQ search strategy generation error:', error)
    // Fallback strategy based on travel type
    return getDefaultStrategy(tripContext.travelType)
  }
}

/**
 * STEP 2: GROQ validates POI relevance for the trip
 */
export async function validatePOIRelevance(
  pois: ComprehensivePOI[],
  tripContext: TripContext
): Promise<ComprehensivePOI[]> {
  try {
    const groq = createGroqClient()

    const prompt = `You are a travel expert. Filter these POIs for relevance to this trip.

TRIP CONTEXT:
- Travel Type: ${tripContext.travelType}
- Budget: ${tripContext.budget}
- Duration: ${tripContext.days} days
- Interests: ${tripContext.interests?.join(', ') || 'general'}

POIs TO VALIDATE (${pois.length} total):
${pois.slice(0, 30).map((poi, i) => `${i + 1}. ${poi.name} (${poi.category}, ${poi.source})`).join('\n')}

TASK:
Return indices of POIs that are:
1. Appropriate for ${tripContext.travelType} travelers
2. Within ${tripContext.budget} budget
3. Logistically feasible
4. Highly rated or culturally significant

Return as JSON array of indices:
[0, 2, 5, 7, ...]`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return pois

    const parsed = JSON.parse(response)
    const validIndices = Array.isArray(parsed) ? parsed : parsed.indices || []

    // Return validated POIs + boost their relevance score
    return pois.map((poi, i) => {
      if (validIndices.includes(i)) {
        return {
          ...poi,
          relevanceScore: Math.min((poi.relevanceScore || 50) + 20, 100)
        }
      }
      return poi
    })
  } catch (error) {
    console.error('GROQ POI validation error:', error)
    return pois // Return all POIs if validation fails
  }
}

/**
 * STEP 3: GROQ identifies gaps in POI coverage
 */
export async function identifyPOIGaps(
  pois: ComprehensivePOI[],
  tripContext: TripContext
): Promise<POIGap[]> {
  try {
    const groq = createGroqClient()

    // Analyze current POI coverage
    const categories = pois.reduce((acc, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const prompt = `You are a travel planning expert. Identify gaps in this trip's POI coverage.

TRIP DETAILS:
- Route: ${tripContext.from} → ${tripContext.to}
- Duration: ${tripContext.days} days
- Travel Type: ${tripContext.travelType}
- Budget: ${tripContext.budget}

CURRENT POI COVERAGE:
${Object.entries(categories).map(([cat, count]) => `- ${cat}: ${count} POIs`).join('\n')}

TASK:
Identify critical gaps. For example:
- Missing overnight accommodations
- No meal options for lunch/dinner
- No activities for full days
- Missing viewpoints for scenic routes
- No rest stops for long drives

Return as JSON array:
[{
  "type": "accommodation" | "meal" | "activity" | "viewpoint" | "rest-stop",
  "location": "where this gap exists",
  "reason": "why this is a gap",
  "priority": "critical" | "high" | "medium" | "low",
  "suggestions": ["suggestion1", "suggestion2"]
}]`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return []

    const parsed = JSON.parse(response)
    return Array.isArray(parsed) ? parsed : parsed.gaps || []
  } catch (error) {
    console.error('GROQ gap identification error:', error)
    return []
  }
}

/**
 * STEP 4: GROQ fills identified gaps with POI suggestions
 */
export async function fillPOIGaps(
  gaps: POIGap[],
  tripContext: TripContext
): Promise<ComprehensivePOI[]> {
  try {
    if (gaps.length === 0) return []

    const groq = createGroqClient()

    const prompt = `You are a travel expert. Fill these gaps in the trip plan with specific POI suggestions.

TRIP CONTEXT:
- Route: ${tripContext.from} → ${tripContext.to}
- Travel Type: ${tripContext.travelType}
- Budget: ${tripContext.budget}

GAPS TO FILL:
${gaps.map((gap, i) => `${i + 1}. ${gap.type} in ${gap.location} - ${gap.reason}`).join('\n')}

TASK:
For each gap, suggest 2-3 specific, real POIs that would fill it.
Include name, category, type, description, and why it fits.

Return as JSON array:
[{
  "name": "Specific Place Name",
  "category": "accommodation" | "restaurant" | "attraction" | "activity",
  "type": "hotel" | "cafe" | "museum" | etc,
  "description": "Brief description",
  "visitDuration": minutes,
  "bestTimeOfDay": "morning" | "afternoon" | "evening" | "anytime",
  "priceLevel": "budget" | "moderate" | "expensive" | "luxury",
  "whyItFits": "Explanation of why this fills the gap"
}]`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return []

    const parsed = JSON.parse(response)
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || []

    // Convert to ComprehensivePOI format
    return suggestions.map((poi: any) => ({
      name: poi.name,
      category: poi.category,
      type: poi.type,
      description: poi.description,
      visitDuration: poi.visitDuration,
      bestTimeOfDay: poi.bestTimeOfDay,
      priceLevel: poi.priceLevel,
      source: 'groq' as const,
      relevanceScore: 85 // GROQ gap-fill POIs are highly relevant
    }))
  } catch (error) {
    console.error('GROQ gap filling error:', error)
    return []
  }
}

/**
 * Helper: Get default strategy based on travel type
 */
function getDefaultStrategy(travelType: TravelType): POISearchStrategy {
  const strategies: Record<TravelType, POISearchStrategy> = {
    'road-trip': {
      priorityCategories: ['viewpoint', 'nature', 'roadside-attraction', 'restaurant'],
      accommodationNeeds: { count: 2, types: ['motel', 'hotel'], locations: [] },
      mealBreaks: { count: 6, types: ['casual', 'fast-food'] },
      activities: { count: 3, types: ['scenic-drive', 'photo-stop'] },
      criticalGaps: ['overnight-stops', 'rest-areas']
    },
    'city-break': {
      priorityCategories: ['culture', 'restaurant', 'shopping', 'nightlife'],
      accommodationNeeds: { count: 1, types: ['hotel', 'airbnb'], locations: [] },
      mealBreaks: { count: 4, types: ['casual', 'fine-dining'] },
      activities: { count: 5, types: ['museum', 'walking-tour', 'shopping'] },
      criticalGaps: ['central-accommodation', 'dinner-reservations']
    },
    'adventure': {
      priorityCategories: ['nature', 'activity', 'viewpoint'],
      accommodationNeeds: { count: 2, types: ['hostel', 'camping'], locations: [] },
      mealBreaks: { count: 4, types: ['casual', 'picnic'] },
      activities: { count: 6, types: ['hiking', 'outdoor-sports'] },
      criticalGaps: ['gear-rental', 'trail-access']
    },
    'cultural': {
      priorityCategories: ['culture', 'museum', 'historical', 'restaurant'],
      accommodationNeeds: { count: 2, types: ['hotel', 'guesthouse'], locations: [] },
      mealBreaks: { count: 5, types: ['local-cuisine', 'traditional'] },
      activities: { count: 6, types: ['museum', 'historical-site', 'walking-tour'] },
      criticalGaps: ['guided-tours', 'cultural-experiences']
    },
    'nature': {
      priorityCategories: ['nature', 'viewpoint', 'park', 'hiking'],
      accommodationNeeds: { count: 2, types: ['lodge', 'camping', 'cabin'], locations: [] },
      mealBreaks: { count: 4, types: ['casual', 'picnic'] },
      activities: { count: 5, types: ['hiking', 'wildlife', 'photography'] },
      criticalGaps: ['trail-access', 'park-permits']
    },
    'beach': {
      priorityCategories: ['beach', 'water-sports', 'restaurant', 'viewpoint'],
      accommodationNeeds: { count: 2, types: ['resort', 'beachfront-hotel'], locations: [] },
      mealBreaks: { count: 5, types: ['seafood', 'beachside'] },
      activities: { count: 4, types: ['swimming', 'snorkeling', 'beach-activities'] },
      criticalGaps: ['beach-access', 'water-sports-rental']
    },
    'family': {
      priorityCategories: ['family-friendly', 'playground', 'restaurant', 'activity'],
      accommodationNeeds: { count: 2, types: ['family-hotel', 'apartment'], locations: [] },
      mealBreaks: { count: 6, types: ['family-friendly', 'casual'] },
      activities: { count: 6, types: ['playground', 'zoo', 'aquarium', 'theme-park'] },
      criticalGaps: ['kid-friendly-stops', 'rest-areas']
    },
    'romantic': {
      priorityCategories: ['viewpoint', 'fine-dining', 'culture', 'spa'],
      accommodationNeeds: { count: 2, types: ['boutique-hotel', 'luxury-resort'], locations: [] },
      mealBreaks: { count: 4, types: ['fine-dining', 'romantic'] },
      activities: { count: 4, types: ['sunset-viewing', 'couples-spa', 'wine-tasting'] },
      criticalGaps: ['romantic-dining', 'scenic-spots']
    },
    'business': {
      priorityCategories: ['hotel', 'restaurant', 'conference-center'],
      accommodationNeeds: { count: 1, types: ['business-hotel'], locations: [] },
      mealBreaks: { count: 3, types: ['business-dining', 'quick-service'] },
      activities: { count: 2, types: ['networking', 'business-center'] },
      criticalGaps: ['meeting-spaces', 'wifi-access']
    },
    'backpacking': {
      priorityCategories: ['hostel', 'budget-restaurant', 'free-attraction'],
      accommodationNeeds: { count: 3, types: ['hostel', 'camping'], locations: [] },
      mealBreaks: { count: 6, types: ['budget', 'street-food'] },
      activities: { count: 5, types: ['free-walking-tour', 'hiking', 'local-market'] },
      criticalGaps: ['budget-accommodation', 'free-activities']
    },
    'luxury': {
      priorityCategories: ['luxury-hotel', 'fine-dining', 'spa', 'exclusive'],
      accommodationNeeds: { count: 2, types: ['luxury-hotel', '5-star-resort'], locations: [] },
      mealBreaks: { count: 4, types: ['fine-dining', 'michelin-star'] },
      activities: { count: 4, types: ['spa', 'private-tour', 'exclusive-experience'] },
      criticalGaps: ['luxury-accommodation', 'fine-dining-reservations']
    }
  }

  return strategies[travelType] || strategies['city-break']
}


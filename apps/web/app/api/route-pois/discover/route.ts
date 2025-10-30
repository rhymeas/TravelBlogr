import { NextRequest, NextResponse } from 'next/server'

/**
 * Smart Route POI Discovery API
 * 
 * Finds nearby cities, tourist attractions, and points of interest
 * within a dynamic radius based on route context.
 * 
 * Strategy:
 * 1. Calculate smart radius based on route length and context
 * 2. Use GROQ AI to discover relevant POIs near the clicked point
 * 3. Return structured data with images, descriptions, and coordinates
 */

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface POIResult {
  name: string
  type: 'city' | 'attraction' | 'restaurant' | 'viewpoint' | 'landmark' | 'nature'
  description: string
  distance: number // km from clicked point
  coordinates: { lat: number; lng: number }
  image?: string
  rating?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const routeLength = parseFloat(searchParams.get('routeLength') || '100') // Total route length in km
    const tripType = searchParams.get('tripType') || 'leisure'
    const transportMode = searchParams.get('transportMode') || 'car'

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Calculate smart radius based on route length
    const radius = calculateSmartRadius(routeLength, transportMode)

    // Use GROQ AI to discover POIs
    const pois = await discoverPOIsWithAI(lat, lng, radius, tripType, transportMode)

    return NextResponse.json({
      success: true,
      radius,
      pois,
      coordinates: { lat, lng }
    })
  } catch (error) {
    console.error('Route POI discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover POIs' },
      { status: 500 }
    )
  }
}

/**
 * Calculate smart radius based on route context
 * 
 * Rules:
 * - Short routes (< 50km): 5-10km radius (local attractions)
 * - Medium routes (50-200km): 10-20km radius (regional attractions)
 * - Long routes (> 200km): 20-50km radius (major cities/landmarks)
 * - Adjust for transport mode (bike/foot = smaller radius)
 */
function calculateSmartRadius(routeLength: number, transportMode: string): number {
  let baseRadius: number

  if (routeLength < 50) {
    baseRadius = 7 // 5-10km for short routes
  } else if (routeLength < 200) {
    baseRadius = 15 // 10-20km for medium routes
  } else {
    baseRadius = 30 // 20-50km for long routes
  }

  // Adjust for transport mode
  if (transportMode === 'bike') {
    baseRadius *= 0.7 // Smaller radius for bike trips
  } else if (transportMode === 'foot') {
    baseRadius *= 0.5 // Much smaller radius for walking trips
  }

  return Math.round(baseRadius)
}

/**
 * Use GROQ AI to discover relevant POIs near coordinates
 */
async function discoverPOIsWithAI(
  lat: number,
  lng: number,
  radius: number,
  tripType: string,
  transportMode: string
): Promise<POIResult[]> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not configured, returning empty POIs')
    return []
  }

  const prompt = `You are a travel expert. Find interesting places near coordinates ${lat}, ${lng} within ${radius}km radius.

Trip context:
- Type: ${tripType}
- Transport: ${transportMode}
- Radius: ${radius}km

CRITICAL: First, identify if there is a city or town at or very near these coordinates (within 2-3km).

IMPORTANT: Return MAXIMUM 3 POIs to keep UI clean and API calls minimal.

If there IS a city/town nearby:
- Return 3 POIs WITHIN that city (top attractions, landmarks, or restaurants)
- Focus on the most popular/important places travelers would want to see
- Include the city name in the first result

If there is NO city/town nearby:
- Return 3 POIs in the surrounding area
- Include scenic viewpoints, natural landmarks, or small towns

For each POI, provide:
1. Name (exact, searchable name)
2. Type (city/attraction/restaurant/viewpoint/landmark/nature/cafe)
3. Brief description (1-2 sentences, what makes it special)
4. Approximate distance from point (in km)
5. Approximate coordinates (lat, lng)

Return ONLY valid JSON array, no markdown:
[
  {
    "name": "Example City",
    "type": "city",
    "description": "A charming town known for...",
    "distance": 0.5,
    "coordinates": { "lat": 48.123, "lng": 11.456 }
  }
]`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert API. Return ONLY valid JSON arrays, no markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`GROQ API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'
    
    // Clean markdown if present
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const pois: POIResult[] = JSON.parse(jsonStr)

    // Fetch images for each POI using Brave API
    const poisWithImages = await Promise.all(
      pois.map(async (poi) => {
        const image = await fetchPOIImage(poi.name, poi.type)
        return { ...poi, image }
      })
    )

    return poisWithImages
  } catch (error) {
    console.error('GROQ AI POI discovery error:', error)
    return []
  }
}

/**
 * Fetch image for POI using Brave API
 */
async function fetchPOIImage(name: string, type: string): Promise<string | undefined> {
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY

  if (!BRAVE_API_KEY) {
    return undefined
  }

  try {
    // Build smart query based on POI type
    const query = type === 'city' 
      ? `${name} city aerial view`
      : type === 'nature'
      ? `${name} landscape photography`
      : `${name} tourist attraction`

    const response = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=1`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      return undefined
    }

    const data = await response.json()
    const images = data.results || []

    // CRITICAL: Use thumbnail (Brave CDN URL) first, fallback to url
    return images[0]?.thumbnail || images[0]?.url
  } catch (error) {
    console.error('Brave API image fetch error:', error)
    return undefined
  }
}


/**
 * Comprehensive POI Service
 * 
 * Multi-layered POI discovery system with GROQ AI as ultimate fallback.
 * Ensures we ALWAYS get relevant POIs, accommodations, and sightseeing elements.
 * 
 * Data Source Hierarchy:
 * 1. Database (our cached data) - FASTEST
 * 2. OpenTripMap API (attractions, POIs) - FREE
 * 3. Overpass API (OpenStreetMap data) - FREE
 * 4. GROQ AI (intelligent suggestions) - FALLBACK
 * 
 * This ensures efficient trip planning from A to B (or C, D, etc.)
 * with proper POIs, accommodations, and sightseeing based on travel type.
 */

import { createGroqClient } from '@/lib/groq'

export interface ComprehensivePOI {
  name: string
  category: 'attraction' | 'accommodation' | 'restaurant' | 'activity' | 'viewpoint' | 'nature' | 'culture' | 'shopping'
  type?: string // More specific type (e.g., "museum", "hotel", "cafe")
  description?: string
  coordinates?: { lat: number; lng: number }
  rating?: number
  visitDuration?: number // minutes
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
  priceLevel?: 'budget' | 'moderate' | 'expensive' | 'luxury'
  source: 'database' | 'opentripmap' | 'overpass' | 'groq'
  detourTime?: number // minutes from route
  relevanceScore?: number // 0-100
}

export interface POISearchParams {
  locationName: string
  coordinates?: { lat: number; lng: number }
  travelType?: 'road-trip' | 'city-break' | 'adventure' | 'cultural' | 'nature' | 'beach' | 'family'
  budget?: 'budget' | 'moderate' | 'luxury'
  interests?: string[]
  radius?: number // km
  limit?: number
}

/**
 * Get comprehensive POIs with multi-source fallback
 */
export async function getComprehensivePOIs(
  params: POISearchParams,
  useServerClient = false
): Promise<ComprehensivePOI[]> {
  const {
    locationName,
    coordinates,
    travelType = 'road-trip',
    budget = 'moderate',
    interests = [],
    radius = 10,
    limit = 20
  } = params

  console.log(`🔍 Fetching comprehensive POIs for: ${locationName}`)
  console.log(`   Travel type: ${travelType}, Budget: ${budget}, Radius: ${radius}km`)

  const allPOIs: ComprehensivePOI[] = []

  // LAYER 1: Database (fastest, our cached data)
  console.log('📍 Layer 1: Checking database...')
  const dbPOIs = await fetchDatabasePOIs(locationName, coordinates, limit, useServerClient)
  allPOIs.push(...dbPOIs)
  console.log(`   ✅ Found ${dbPOIs.length} POIs in database`)

  // LAYER 2: OpenTripMap (free, good for attractions)
  if (coordinates && allPOIs.length < limit) {
    console.log('🗺️ Layer 2: Fetching from OpenTripMap...')
    const openTripMapPOIs = await fetchOpenTripMapPOIs(coordinates, radius, limit - allPOIs.length)
    allPOIs.push(...openTripMapPOIs)
    console.log(`   ✅ Found ${openTripMapPOIs.length} POIs from OpenTripMap`)
  }

  // LAYER 3: Overpass API (free, OpenStreetMap data)
  if (coordinates && allPOIs.length < limit) {
    console.log('🌍 Layer 3: Fetching from Overpass API...')
    const overpassPOIs = await fetchOverpassPOIs(coordinates, radius, travelType, limit - allPOIs.length)
    allPOIs.push(...overpassPOIs)
    console.log(`   ✅ Found ${overpassPOIs.length} POIs from Overpass`)
  }

  // LAYER 4: GROQ AI (ultimate fallback - always provides results)
  if (allPOIs.length < 5) {
    console.log('🤖 Layer 4: Using GROQ AI fallback...')
    const groqPOIs = await fetchGroqPOIs(locationName, coordinates, travelType, budget, interests, limit)
    allPOIs.push(...groqPOIs)
    console.log(`   ✅ Generated ${groqPOIs.length} POIs from GROQ AI`)
  }

  // Deduplicate and rank
  const uniquePOIs = deduplicatePOIs(allPOIs)
  const rankedPOIs = rankPOIs(uniquePOIs, travelType, interests)

  console.log(`✅ Total POIs: ${rankedPOIs.length} (from ${allPOIs.length} before dedup)`)

  return rankedPOIs.slice(0, limit)
}

/**
 * LAYER 1: Fetch POIs from database
 */
async function fetchDatabasePOIs(
  locationName: string,
  coordinates?: { lat: number; lng: number },
  limit: number = 20,
  useServerClient = false
): Promise<ComprehensivePOI[]> {
  try {
    // Dynamic import for server/client compatibility
    let supabase
    if (useServerClient) {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      supabase = createServiceSupabase()
    } else {
      const { getBrowserSupabase } = await import('@/lib/supabase')
      supabase = getBrowserSupabase()
    }

    // Fetch from activities table
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .ilike('location_name', `%${locationName}%`)
      .limit(limit)

    if (!activities || activities.length === 0) return []

    return activities.map(activity => ({
      name: activity.name,
      category: categorizePOI(activity.category || activity.name),
      type: activity.category,
      description: activity.description,
      coordinates: activity.latitude && activity.longitude
        ? { lat: activity.latitude, lng: activity.longitude }
        : coordinates,
      rating: activity.rating,
      source: 'database' as const,
      relevanceScore: 90 // Database POIs are highly relevant
    }))
  } catch (error) {
    console.error('Database POI fetch error:', error)
    return []
  }
}

/**
 * LAYER 2: Fetch POIs from OpenTripMap
 */
async function fetchOpenTripMapPOIs(
  coordinates: { lat: number; lng: number },
  radiusKm: number,
  limit: number
): Promise<ComprehensivePOI[]> {
  try {
    const apiKey = process.env.OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6f52aba26a4787b4b1eba825c24d4cbbd'
    const radiusMeters = radiusKm * 1000

    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=${radiusMeters}&lon=${coordinates.lng}&lat=${coordinates.lat}&kinds=interesting_places,tourist_facilities,natural,cultural&limit=${limit}&format=json&apikey=${apiKey}`
    )

    if (!response.ok) return []

    const data = await response.json()
    
    // OpenTripMap returns array directly
    if (!Array.isArray(data)) return []

    return data
      .filter((poi: any) => poi.name) // Only POIs with names
      .map((poi: any) => ({
        name: poi.name,
        category: categorizePOI(poi.kinds),
        type: poi.kinds?.split(',')[0],
        coordinates: {
          lat: poi.point.lat,
          lng: poi.point.lon
        },
        rating: poi.rate ? poi.rate / 2 : undefined, // Convert 0-10 to 0-5
        source: 'opentripmap' as const,
        relevanceScore: 70
      }))
  } catch (error) {
    console.error('OpenTripMap error:', error)
    return []
  }
}

/**
 * LAYER 3: Fetch POIs from Overpass API (OpenStreetMap)
 */
async function fetchOverpassPOIs(
  coordinates: { lat: number; lng: number },
  radiusKm: number,
  travelType: string,
  limit: number
): Promise<ComprehensivePOI[]> {
  try {
    const radiusMeters = radiusKm * 1000

    // Build query based on travel type
    const tags = getOverpassTagsForTravelType(travelType)
    const query = `
      [out:json][timeout:25];
      (
        ${tags.map(tag => `node["${tag}"](around:${radiusMeters},${coordinates.lat},${coordinates.lng});`).join('\n')}
      );
      out body ${limit};
    `

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })

    if (!response.ok) return []

    const data = await response.json()

    return data.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => ({
        name: el.tags.name,
        category: categorizeOverpassElement(el.tags),
        type: el.tags.tourism || el.tags.amenity || el.tags.leisure,
        description: el.tags.description,
        coordinates: { lat: el.lat, lng: el.lon },
        source: 'overpass' as const,
        relevanceScore: 60
      }))
  } catch (error) {
    console.error('Overpass API error:', error)
    return []
  }
}

/**
 * LAYER 4: GROQ AI Fallback - ALWAYS provides results
 */
async function fetchGroqPOIs(
  locationName: string,
  coordinates: { lat: number; lng: number } | undefined,
  travelType: string,
  budget: string,
  interests: string[],
  limit: number
): Promise<ComprehensivePOI[]> {
  try {
    const groq = createGroqClient()

    const prompt = `You are a travel expert. Generate ${limit} must-visit POIs, accommodations, and sightseeing elements for ${locationName}.

Travel Type: ${travelType}
Budget: ${budget}
Interests: ${interests.join(', ') || 'general sightseeing'}

For each POI, provide:
1. Name (real, specific place)
2. Category (attraction/accommodation/restaurant/activity/viewpoint/nature/culture/shopping)
3. Type (more specific, e.g., "museum", "hotel", "cafe")
4. Description (1-2 sentences, why it's worth visiting)
5. Visit duration (in minutes)
6. Best time of day (morning/afternoon/evening/anytime)
7. Price level (budget/moderate/expensive/luxury)

Focus on:
- Real, existing places (not generic suggestions)
- Mix of attractions, accommodations, and dining
- Variety of experiences (culture, nature, food, activities)
- Appropriate for ${travelType} travel style
- Suitable for ${budget} budget

Return as JSON array:
[{
  "name": string,
  "category": string,
  "type": string,
  "description": string,
  "visitDuration": number,
  "bestTimeOfDay": string,
  "priceLevel": string
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
    const pois = Array.isArray(parsed) ? parsed : parsed.pois || []

    return pois.map((poi: any) => ({
      name: poi.name,
      category: poi.category as any,
      type: poi.type,
      description: poi.description,
      coordinates,
      visitDuration: poi.visitDuration,
      bestTimeOfDay: poi.bestTimeOfDay as any,
      priceLevel: poi.priceLevel as any,
      source: 'groq' as const,
      relevanceScore: 80 // GROQ POIs are highly relevant and contextual
    }))
  } catch (error) {
    console.error('GROQ POI generation error:', error)
    return []
  }
}

/**
 * Helper: Categorize POI from various sources
 */
function categorizePOI(input: string): ComprehensivePOI['category'] {
  const lower = input.toLowerCase()
  
  if (lower.includes('hotel') || lower.includes('hostel') || lower.includes('accommodation')) return 'accommodation'
  if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('food')) return 'restaurant'
  if (lower.includes('museum') || lower.includes('gallery') || lower.includes('cultural')) return 'culture'
  if (lower.includes('park') || lower.includes('nature') || lower.includes('natural')) return 'nature'
  if (lower.includes('view') || lower.includes('lookout') || lower.includes('panorama')) return 'viewpoint'
  if (lower.includes('shop') || lower.includes('market') || lower.includes('mall')) return 'shopping'
  if (lower.includes('activity') || lower.includes('sport') || lower.includes('adventure')) return 'activity'
  
  return 'attraction'
}

/**
 * Helper: Categorize Overpass element
 */
function categorizeOverpassElement(tags: any): ComprehensivePOI['category'] {
  if (tags.tourism === 'hotel' || tags.tourism === 'hostel') return 'accommodation'
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') return 'restaurant'
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'culture'
  if (tags.leisure === 'park' || tags.natural) return 'nature'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.shop) return 'shopping'
  if (tags.sport || tags.leisure) return 'activity'
  
  return 'attraction'
}

/**
 * Helper: Get Overpass tags based on travel type
 */
function getOverpassTagsForTravelType(travelType: string): string[] {
  const baseTags = ['tourism', 'amenity=restaurant']
  
  switch (travelType) {
    case 'cultural':
      return [...baseTags, 'historic', 'tourism=museum', 'tourism=gallery']
    case 'nature':
    case 'adventure':
      return [...baseTags, 'natural', 'leisure=park', 'tourism=viewpoint']
    case 'beach':
      return [...baseTags, 'natural=beach', 'leisure=beach_resort']
    case 'family':
      return [...baseTags, 'tourism=attraction', 'leisure=playground', 'amenity=cafe']
    default:
      return [...baseTags, 'tourism=attraction', 'tourism=viewpoint']
  }
}

/**
 * Helper: Deduplicate POIs by name similarity
 */
function deduplicatePOIs(pois: ComprehensivePOI[]): ComprehensivePOI[] {
  const seen = new Set<string>()
  return pois.filter(poi => {
    const key = poi.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Helper: Rank POIs by relevance
 */
function rankPOIs(
  pois: ComprehensivePOI[],
  travelType: string,
  interests: string[]
): ComprehensivePOI[] {
  return pois
    .map(poi => {
      let score = poi.relevanceScore || 50
      
      // Boost by source (database > groq > opentripmap > overpass)
      if (poi.source === 'database') score += 20
      else if (poi.source === 'groq') score += 15
      else if (poi.source === 'opentripmap') score += 10
      
      // Boost by rating
      if (poi.rating) score += poi.rating * 5
      
      // Boost by travel type match
      if (travelType === 'cultural' && poi.category === 'culture') score += 15
      if (travelType === 'nature' && poi.category === 'nature') score += 15
      if (travelType === 'adventure' && poi.category === 'activity') score += 15
      
      // Boost by interests
      interests.forEach(interest => {
        if (poi.name.toLowerCase().includes(interest.toLowerCase())) score += 10
        if (poi.description?.toLowerCase().includes(interest.toLowerCase())) score += 5
      })
      
      return { ...poi, relevanceScore: Math.min(score, 100) }
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
}


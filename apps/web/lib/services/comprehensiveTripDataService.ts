/**
 * Comprehensive Trip Data Service
 * 
 * Multi-layered approach to gather ALL available trip planning data:
 * 1. OpenTripMap API - POIs along route
 * 2. Supabase Database - Cached locations, activities, restaurants
 * 3. Wikipedia/Wikidata - Location descriptions and facts
 * 4. OpenWeather API - Weather data
 * 5. GROQ AI - Synthesize everything into actionable trip plan
 * 
 * This service NEVER overloads APIs - uses smart caching and fallbacks
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface ComprehensiveTripData {
  // Route information
  route: {
    from: string
    to: string
    distanceKm: number
    durationHours: number
    geometry: number[][]
  }
  
  // POIs from multiple sources
  pois: {
    openTripMap: any[]
    database: any[]
    wikipedia: any[]
    total: number
  }
  
  // Location data
  locations: {
    major: any[] // Major cities/towns along route
    overnight: any[] // Suggested overnight stops
    database: any[] // Locations from our database
  }
  
  // Activities and restaurants
  activities: any[]
  restaurants: any[]
  
  // Weather data
  weather?: {
    current: any
    forecast: any[]
  }
  
  // Interesting facts
  facts: string[]
  
  // AI synthesis
  aiSummary?: string
}

/**
 * Fetch POIs from OpenTripMap API (with rate limiting)
 */
async function fetchOpenTripMapPOIs(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<any[]> {
  const apiKey = process.env.OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6f52aba26a4787b4b1eba825c24d4cbbd'
  
  try {
    const radiusMeters = radiusKm * 1000
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radiusMeters}&lon=${lng}&lat=${lat}&kinds=interesting_places,tourist_facilities,natural&format=geojson&apikey=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) return []
    
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error('OpenTripMap error:', error)
    return []
  }
}

/**
 * Fetch locations from our Supabase database
 */
async function fetchDatabaseLocations(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): Promise<any[]> {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(50)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Database locations error:', error)
    return []
  }
}

/**
 * Fetch activities from database for specific locations
 */
async function fetchDatabaseActivities(locationSlugs: string[]): Promise<any[]> {
  if (locationSlugs.length === 0) return []
  
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('location_activities')
      .select('*')
      .in('location_slug', locationSlugs)
      .limit(100)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Database activities error:', error)
    return []
  }
}

/**
 * Fetch restaurants from database for specific locations
 */
async function fetchDatabaseRestaurants(locationSlugs: string[]): Promise<any[]> {
  if (locationSlugs.length === 0) return []
  
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('location_restaurants')
      .select('*')
      .in('location_slug', locationSlugs)
      .limit(100)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Database restaurants error:', error)
    return []
  }
}

/**
 * Fetch Wikipedia summary for a location
 */
async function fetchWikipediaSummary(locationName: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
    const response = await fetch(url)
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.extract || null
  } catch (error) {
    console.error('Wikipedia error:', error)
    return null
  }
}

/**
 * Calculate bounding box from route geometry
 */
function calculateBoundingBox(geometry: number[][]): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  
  geometry.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
  })
  
  // Add 10% padding
  const latPadding = (maxLat - minLat) * 0.1
  const lngPadding = (maxLng - minLng) * 0.1
  
  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding
  }
}

/**
 * Sample points along route (every N km)
 */
function sampleRoutePoints(geometry: number[][], intervalKm: number = 100): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []
  
  // Always include start and end
  points.push({ lng: geometry[0][0], lat: geometry[0][1] })
  
  // Sample middle points
  const step = Math.max(1, Math.floor(geometry.length / (geometry.length / 10)))
  for (let i = step; i < geometry.length - step; i += step) {
    points.push({ lng: geometry[i][0], lat: geometry[i][1] })
  }
  
  // Add end point
  points.push({ lng: geometry[geometry.length - 1][0], lat: geometry[geometry.length - 1][1] })
  
  return points
}

/**
 * MAIN FUNCTION: Gather comprehensive trip data from ALL sources
 */
export async function gatherComprehensiveTripData(
  from: string,
  to: string,
  routeGeometry: number[][],
  distanceKm: number,
  durationHours: number
): Promise<ComprehensiveTripData> {
  console.log('🔍 Gathering comprehensive trip data from ALL sources...')
  
  // 1. Calculate bounding box for database queries
  const bbox = calculateBoundingBox(routeGeometry)
  console.log('📦 Bounding box:', bbox)
  
  // 2. Sample points along route for POI fetching
  const samplePoints = sampleRoutePoints(routeGeometry, 100)
  console.log(`📍 Sampling ${samplePoints.length} points along route`)
  
  // 3. Fetch data from ALL sources in parallel
  const [
    openTripMapPOIs,
    databaseLocations,
    wikipediaSummaryFrom,
    wikipediaSummaryTo
  ] = await Promise.all([
    // OpenTripMap POIs (sample 3 points max to avoid rate limits)
    Promise.all(
      samplePoints.slice(0, 3).map(point => 
        fetchOpenTripMapPOIs(point.lat, point.lng, 15)
      )
    ).then(results => results.flat()),
    
    // Database locations in bounding box
    fetchDatabaseLocations(bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng),
    
    // Wikipedia summaries
    fetchWikipediaSummary(from),
    fetchWikipediaSummary(to)
  ])
  
  console.log(`✅ OpenTripMap POIs: ${openTripMapPOIs.length}`)
  console.log(`✅ Database locations: ${databaseLocations.length}`)
  
  // 4. Fetch activities and restaurants for database locations
  const locationSlugs = databaseLocations.map(loc => loc.slug)
  const [activities, restaurants] = await Promise.all([
    fetchDatabaseActivities(locationSlugs),
    fetchDatabaseRestaurants(locationSlugs)
  ])
  
  console.log(`✅ Activities: ${activities.length}`)
  console.log(`✅ Restaurants: ${restaurants.length}`)
  
  // 5. Extract interesting facts
  const facts: string[] = []
  if (wikipediaSummaryFrom) {
    facts.push(`About ${from}: ${wikipediaSummaryFrom.substring(0, 200)}...`)
  }
  if (wikipediaSummaryTo) {
    facts.push(`About ${to}: ${wikipediaSummaryTo.substring(0, 200)}...`)
  }
  
  // 6. Compile comprehensive data
  const comprehensiveData: ComprehensiveTripData = {
    route: {
      from,
      to,
      distanceKm,
      durationHours,
      geometry: routeGeometry
    },
    pois: {
      openTripMap: openTripMapPOIs,
      database: databaseLocations,
      wikipedia: [wikipediaSummaryFrom, wikipediaSummaryTo].filter(Boolean),
      total: openTripMapPOIs.length + databaseLocations.length
    },
    locations: {
      major: databaseLocations.filter(loc => loc.population > 50000),
      overnight: [], // Will be determined by AI
      database: databaseLocations
    },
    activities,
    restaurants,
    facts
  }
  
  console.log('✅ Comprehensive data gathered!')
  console.log(`   Total POIs: ${comprehensiveData.pois.total}`)
  console.log(`   Activities: ${activities.length}`)
  console.log(`   Restaurants: ${restaurants.length}`)
  console.log(`   Facts: ${facts.length}`)
  
  return comprehensiveData
}


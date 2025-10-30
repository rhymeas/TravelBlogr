/**
 * Valhalla Routing Service
 *
 * Supports both Stadia Maps (hosted Valhalla) and self-hosted Valhalla.
 *
 * PRIORITY:
 * 1. Stadia Maps (if API key set and within free tier limit)
 * 2. Local Valhalla (fallback)
 *
 * FREE TIER LIMITS:
 * - Stadia Maps: 10,000 routes/month
 * - Local Valhalla: Unlimited
 *
 * @see docs/VALHALLA_SETUP_GUIDE.md
 */

import type { RouteCoordinate, RouteResult } from './routingService'
import { trackRoutingRequest, shouldUseStadiaMaps } from './routingMonitor'

// Stadia Maps uses standard Valhalla endpoints
// See: https://docs.stadiamaps.com/routing/
const STADIA_MAPS_URL = 'https://api.stadiamaps.com/route'
const LOCAL_VALHALLA_URL = process.env.VALHALLA_URL || 'http://localhost:8002/route'
const STADIA_API_KEY = process.env.STADIA_MAPS_API_KEY

/**
 * Get multiple route alternatives from Valhalla
 * Returns up to 3 different routes (most scenic, balanced, fastest)
 */
export async function getValhallaRouteWithAlternatives(
  start: RouteCoordinate,
  end: RouteCoordinate
): Promise<RouteResult[]> {
  console.log(`🏞️ Valhalla: Getting route alternatives...`)

  // Determine which Valhalla instance to use
  console.log(`   🔑 Stadia API Key: ${STADIA_API_KEY ? 'SET ✅' : 'NOT SET ❌'}`)
  const shouldUse = await shouldUseStadiaMaps()
  console.log(`   📊 shouldUseStadiaMaps(): ${shouldUse}`)
  const useStadia = STADIA_API_KEY && shouldUse
  const apiUrl = useStadia ? STADIA_MAPS_URL : LOCAL_VALHALLA_URL
  const provider = useStadia ? 'stadia' : 'valhalla'

  console.log(`   🌐 Using ${useStadia ? 'Stadia Maps (hosted)' : 'Local Valhalla'}`)
  console.log(`   🔗 API URL: ${apiUrl}`)

  // Request with high scenic preference to get alternatives
  const costingOptions = {
    use_highways: 0.3,
    use_tolls: 0.5,
    use_ferry: 0.8,
    shortest: false
  }

  const requestBody = {
    locations: [
      { lat: start.latitude, lon: start.longitude },
      { lat: end.latitude, lon: end.longitude }
    ],
    costing: 'auto',
    costing_options: {
      auto: costingOptions
    },
    alternates: 3, // Request 3 alternatives
    units: 'kilometers'
  }

  let requestUrl = apiUrl
  if (useStadia && STADIA_API_KEY) {
    requestUrl = `${apiUrl}?api_key=${STADIA_API_KEY}`
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Valhalla API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  await trackRoutingRequest(provider as 'valhalla' | 'stadia')

  // Parse all alternatives
  const routes: RouteResult[] = []

  // Add main route
  routes.push({ ...parseValhallaResponse(data), provider })

  // Add alternatives
  if (data.alternates && data.alternates.length > 0) {
    console.log(`   🔀 Got ${data.alternates.length} alternative routes`)

    for (const alt of data.alternates) {
      const altData = { trip: alt.trip }
      routes.push({ ...parseValhallaResponse(altData), provider })
    }
  }

  console.log(`   ✅ Returning ${routes.length} route alternatives`)
  return routes
}

/**
 * Get route from Valhalla routing engine
 *
 * Automatically selects between Stadia Maps (hosted) and local Valhalla
 * based on API key availability and free tier limits.
 */
export async function getValhallaRoute(
  start: RouteCoordinate,
  end: RouteCoordinate,
  preference: 'scenic' | 'longest',
  waypoints?: RouteCoordinate[]
): Promise<RouteResult> {
  console.log(`🏞️ Valhalla: Calculating ${preference} route...`)

  // Determine which Valhalla instance to use
  console.log(`   🔑 Stadia API Key: ${STADIA_API_KEY ? 'SET ✅' : 'NOT SET ❌'}`)
  const shouldUse = await shouldUseStadiaMaps()
  console.log(`   📊 shouldUseStadiaMaps(): ${shouldUse}`)
  const useStadia = STADIA_API_KEY && shouldUse
  const apiUrl = useStadia ? STADIA_MAPS_URL : LOCAL_VALHALLA_URL
  const provider = useStadia ? 'stadia' : 'valhalla'

  console.log(`   🌐 Using ${useStadia ? 'Stadia Maps (hosted)' : 'Local Valhalla'}`)
  console.log(`   🔗 API URL: ${apiUrl}`)

  // Configure costing options based on preference and route distance
  const costingOptions = getCostingOptions(preference, start, end)

  // Build locations array (start + waypoints + end)
  const locations = [
    { lat: start.latitude, lon: start.longitude }
  ]

  if (waypoints && waypoints.length > 0) {
    console.log(`   📍 Adding ${waypoints.length} waypoints for ${preference} route`)
    waypoints.forEach(wp => {
      locations.push({ lat: wp.latitude, lon: wp.longitude })
    })
  }

  locations.push({ lat: end.latitude, lon: end.longitude })

  const requestBody = {
    locations,
    costing: 'auto',
    costing_options: {
      auto: costingOptions
    },
    alternates: preference === 'scenic' ? 3 : 1, // More alternatives for scenic
    units: 'kilometers'
  }

  console.log(`   📍 Request: ${locations.length} locations, ${preference} preference`)

  // Build URL with API key for Stadia Maps
  // Stadia Maps uses query parameter authentication: ?api_key=YOUR_KEY
  // See: https://docs.stadiamaps.com/authentication/
  let requestUrl = apiUrl
  if (useStadia && STADIA_API_KEY) {
    requestUrl = `${apiUrl}?api_key=${STADIA_API_KEY}`
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Valhalla API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  // Track usage for monitoring
  await trackRoutingRequest(provider as 'valhalla' | 'stadia')

  // 🚀 PERFORMANCE: Disabled POI scoring for scenic routes (2025-01-28)
  // DEPENDENCIES: Was calling /api/routing/score-route-pois which makes 100+ Overpass API calls
  // CONTEXT: POI scoring was taking 30-60 seconds and timing out - just use first alternative route
  let route: RouteResult
  if (preference === 'scenic' && data.alternates && data.alternates.length > 0) {
    console.log(`   🔀 Got ${data.alternates.length + 1} alternative routes`)

    // Just use the first alternative (Valhalla already ranks them by scenic preference)
    route = parseValhallaResponse(data)
    console.log(`   ✅ Using first alternative route (Valhalla pre-ranked by scenic preference)`)
  } else {
    route = parseValhallaResponse(data)
  }

  // OLD CODE - DISABLED FOR PERFORMANCE
  // This was making 100+ Overpass API calls and taking 30-60 seconds
  /*
  if (preference === 'scenic' && data.alternates && data.alternates.length > 0) {
    console.log(`   🔀 Got ${data.alternates.length + 1} alternative routes`)

    // NEW STRATEGY: Score each route by POI density
    // The more scenic POIs along the route, the more scenic it is!
    const allRoutes = [data.trip, ...data.alternates.map((alt: any) => alt.trip)]

    // Get country code from start point for POI filtering
    const startCountry = await getCountryCode(start.latitude, start.longitude)

    // Score each route via API endpoint (server-side only)
    // DISABLED - See above
    */

  console.log(`   ✅ ${useStadia ? 'Stadia Maps' : 'Valhalla'} route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)

  return { ...route, provider }
}

/**
 * Get country code for a coordinate
 */
async function getCountryCode(lat: number, lng: number): Promise<string> {
  try {
    const query = `
      [out:json][timeout:5];
      is_in(${lat},${lng})->.a;
      area.a["ISO3166-1"]["admin_level"="2"];
      out tags;
    `

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!response.ok) return 'unknown'

    const data = await response.json()

    if (data.elements && data.elements.length > 0) {
      const countryCode = data.elements[0].tags?.['ISO3166-1']
      if (countryCode) {
        return countryCode.toUpperCase()
      }
    }

    return 'unknown'
  } catch (error) {
    console.warn('Country code lookup failed:', error)
    return 'unknown'
  }
}

/**
 * Calculate route distance to determine strategy
 */
function calculateRouteDistance(start: RouteCoordinate, end: RouteCoordinate): number {
  // Haversine formula for great circle distance
  const R = 6371 // Earth's radius in km
  const dLat = (end.latitude - start.latitude) * Math.PI / 180
  const dLon = (end.longitude - start.longitude) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get costing options based on route preference and distance
 *
 * GOOGLE MAPS-STYLE ROUTING LOGIC:
 * - Scenic: Avoid highways, prefer scenic roads (Google's "Avoid Highways" + scenic preference)
 * - Longest: Longer route through towns with good roads
 * - Distance-based progressive adjustments for practicality
 */
function getCostingOptions(
  preference: 'scenic' | 'longest',
  start: RouteCoordinate,
  end: RouteCoordinate
) {
  const directDistance = calculateRouteDistance(start, end)

  console.log(`   📏 Direct distance: ${directDistance.toFixed(1)}km`)

  if (preference === 'scenic') {
    // SCENIC ROUTE LOGIC - Google Maps "Avoid Highways" + scenic preference
    if (directDistance < 50) {
      // Short scenic route: Complete highway avoidance
      console.log('   🏞️ Short scenic route: Complete highway avoidance, maximum scenic')
      return {
        use_highways: 0.0,        // NO highways
        use_tolls: 0.0,           // NO tolls
        use_ferry: 0.5,           // Ferries can be scenic
        shortest: false,
        use_tracks: 0.0,          // Avoid unpaved
        use_living_streets: 1.0,  // Maximum scenic roads
        maneuver_penalty: 2,      // Allow frequent turns for scenery
        gate_penalty: 50,         // More willing to use gated scenic roads
        country_crossing_cost: 10000,     // High cost to cross borders
        country_crossing_penalty: 10000   // High penalty to avoid border crossings
      }
    } else if (directDistance < 200) {
      // Medium scenic route: Minimal highway use
      console.log('   🏞️ Medium scenic route: Minimal highway use, strong scenic preference')
      return {
        use_highways: 0.1,        // Minimal highway use
        use_tolls: 0.0,           // Avoid tolls
        use_ferry: 0.6,           // Ferries preferred
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.9,  // Strong scenic preference
        maneuver_penalty: 3,      // Low penalty for scenic detours
        gate_penalty: 75,
        country_crossing_cost: 10000,
        country_crossing_penalty: 10000
      }
    } else {
      // Long scenic route: Some highways for practicality
      console.log('   🏞️ Long scenic route: Some highways for practicality, scenic corridors')
      return {
        use_highways: 0.2,        // Some highways for long distances
        use_tolls: 0.1,           // Minimal tolls
        use_ferry: 0.7,           // Ferries preferred
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.8,  // Moderate scenic preference
        maneuver_penalty: 5,      // Moderate penalty
        gate_penalty: 100,
        country_crossing_cost: 10000,
        country_crossing_penalty: 10000
      }
    }
  } else {
    // LONGEST ROUTE LOGIC - Longer routes with good roads (highways OK)
    if (directDistance < 50) {
      // Short longest route: Longer route through towns
      console.log('   🛣️ Short longest route: Longer route through towns')
      return {
        use_highways: 0.4,        // Highways OK
        use_tolls: 0.6,           // Tolls OK
        use_ferry: 1.0,           // Prefer ferries (adds distance)
        shortest: false,
        use_tracks: 0.0,          // Avoid unpaved
        use_living_streets: 0.8,  // Prefer going through towns
        maneuver_penalty: 8,      // Moderate penalty
        country_crossing_cost: 10000,
        country_crossing_penalty: 10000
      }
    } else if (directDistance < 200) {
      // Medium longest route: Balanced longer route
      console.log('   🛣️ Medium longest route: Balanced longer route with good roads')
      return {
        use_highways: 0.5,        // Highways OK
        use_tolls: 0.7,           // Tolls OK
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.7,  // Moderate town preference
        maneuver_penalty: 10,     // Moderate penalty
        country_crossing_cost: 10000,
        country_crossing_penalty: 10000
      }
    } else {
      // Long longest route: Practical longer route
      console.log('   🛣️ Long longest route: Practical longer route with highways')
      return {
        use_highways: 0.6,        // Highways OK for long distances
        use_tolls: 0.8,           // Tolls OK
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.6,  // Moderate preference
        maneuver_penalty: 12,     // Higher penalty (practical route)
        country_crossing_cost: 10000,
        country_crossing_penalty: 10000
      }
    }
  }
}

/**
 * Parse Valhalla API response to RouteResult
 */
function parseValhallaResponse(data: any): RouteResult {
  const trip = data.trip

  if (!trip || !trip.legs || trip.legs.length === 0) {
    throw new Error('Invalid Valhalla response: no trip data')
  }

  const leg = trip.legs[0]

  return {
    geometry: {
      type: 'LineString',
      coordinates: decodePolyline6(leg.shape)
    },
    distance: trip.summary.length * 1000, // km to meters
    duration: trip.summary.time,          // seconds
    provider: 'valhalla'
  }
}

/**
 * Decode Valhalla's polyline6 format
 * 
 * Valhalla uses precision 6 (1e6) instead of Google's precision 5 (1e5)
 */
function decodePolyline6(encoded: string): number[][] {
  const coordinates: number[][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b
    let shift = 0
    let result = 0

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lat += dlat

    // Decode longitude
    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lng += dlng

    // Valhalla uses precision 6 (1e6)
    coordinates.push([lng / 1e6, lat / 1e6])
  }

  return coordinates
}

/**
 * Check if Valhalla service is available
 *
 * Checks Stadia Maps first (if API key set), then local Valhalla
 */
export async function isValhallaAvailable(): Promise<boolean> {
  // Check Stadia Maps first (if API key set and within limits)
  if (STADIA_API_KEY) {
    const useStadia = await shouldUseStadiaMaps()
    if (useStadia) {
      return true // Stadia Maps is always available if we have API key
    }
  }

  // Fallback to local Valhalla
  try {
    const response = await fetch(`${LOCAL_VALHALLA_URL}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    return response.ok
  } catch (error) {
    console.warn('⚠️ Local Valhalla service not available:', error)
    return false
  }
}

/**
 * Get Valhalla status endpoint URL
 */
export function getValhallaStatusUrl(): string {
  const baseUrl = process.env.VALHALLA_URL || 'http://localhost:8002'
  return `${baseUrl}/status`
}

/**
 * Get Valhalla service status
 */
export async function getValhallaStatus(): Promise<{
  available: boolean
  version?: string
  tileset?: string
}> {
  try {
    const baseUrl = process.env.VALHALLA_URL || 'http://localhost:8002'
    const response = await fetch(`${baseUrl}/status`)
    
    if (!response.ok) {
      return { available: false }
    }

    const data = await response.json()
    
    return {
      available: true,
      version: data.version,
      tileset: data.tileset_last_modified
    }
  } catch (error) {
    return { available: false }
  }
}


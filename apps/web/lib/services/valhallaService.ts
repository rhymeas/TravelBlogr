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

const STADIA_MAPS_URL = 'https://api.stadiamaps.com/route/v1'
const LOCAL_VALHALLA_URL = process.env.VALHALLA_URL || 'http://localhost:8002'
const STADIA_API_KEY = process.env.STADIA_MAPS_API_KEY

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
  const useStadia = STADIA_API_KEY && await shouldUseStadiaMaps()
  const apiUrl = useStadia ? STADIA_MAPS_URL : LOCAL_VALHALLA_URL
  const provider = useStadia ? 'stadia' : 'valhalla'

  console.log(`   🌐 Using ${useStadia ? 'Stadia Maps (hosted)' : 'Local Valhalla'}`)

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

  // Build headers (add auth for Stadia Maps)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (useStadia && STADIA_API_KEY) {
    headers['Authorization'] = `Stadia-Auth ${STADIA_API_KEY}`
  }

  const response = await fetch(apiUrl, {
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

  // For scenic routes with alternatives, pick the best one
  let route: RouteResult
  if (preference === 'scenic' && data.alternates && data.alternates.length > 0) {
    console.log(`   🔀 Got ${data.alternates.length + 1} alternative routes`)
    // Pick the route that's longer but not the longest (sweet spot for scenic)
    const allRoutes = [data.trip, ...data.alternates.map((alt: any) => alt.trip)]
    const sorted = allRoutes.sort((a: any, b: any) => b.summary.length - a.summary.length)
    const bestRoute = sorted.length > 1 ? sorted[1] : sorted[0]
    route = parseValhallaResponse({ trip: bestRoute })
    console.log(`   ✅ Selected route #${sorted.indexOf(bestRoute) + 1} of ${sorted.length}`)
  } else {
    route = parseValhallaResponse(data)
  }

  console.log(`   ✅ ${useStadia ? 'Stadia Maps' : 'Valhalla'} route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)

  return { ...route, provider }
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
 * INTELLIGENT ROUTING LOGIC:
 *
 * SCENIC ROUTES:
 * - Short routes (<100km): Maximize scenic value, avoid all highways
 * - Medium routes (100-500km): Balance scenic + practicality, some highways OK
 * - Long routes (>500km): Scenic corridors, but allow highways between scenic areas
 *
 * LONGEST ROUTES:
 * - Short routes (<100km): Maximize detours through towns/POIs
 * - Medium routes (100-500km): Route through multiple towns/regions
 * - Long routes (>500km): Create grand tour through major POIs
 */
function getCostingOptions(
  preference: 'scenic' | 'longest',
  start: RouteCoordinate,
  end: RouteCoordinate
) {
  const directDistance = calculateRouteDistance(start, end)

  console.log(`   📏 Direct distance: ${directDistance.toFixed(1)}km`)

  if (preference === 'scenic') {
    // SCENIC ROUTE LOGIC
    if (directDistance < 100) {
      // Short scenic route: Maximize scenic value
      console.log('   🏞️ Short scenic route: Avoiding all highways, maximizing scenic roads')
      return {
        use_highways: 0.0,        // NO highways
        use_tolls: 0.0,           // NO tolls
        use_ferry: 1.0,           // Prefer ferries (scenic!)
        shortest: false,
        use_tracks: 0.0,          // Avoid unpaved
        use_living_streets: 0.9,  // Strongly prefer residential/scenic
        maneuver_penalty: 3,      // Very low penalty (allow many turns)
        country_crossing_cost: 600,
        country_crossing_penalty: 0
      }
    } else if (directDistance < 500) {
      // Medium scenic route: Balance scenic + practicality
      console.log('   🏞️ Medium scenic route: Mostly scenic roads, some highways OK')
      return {
        use_highways: 0.2,        // Minimal highways
        use_tolls: 0.0,           // Avoid tolls
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.7,  // Prefer scenic roads
        maneuver_penalty: 5,      // Low penalty
        country_crossing_cost: 600,
        country_crossing_penalty: 0
      }
    } else {
      // Long scenic route: Scenic corridors with highway connections
      console.log('   🏞️ Long scenic route: Scenic corridors, highways between scenic areas')
      return {
        use_highways: 0.4,        // Some highways OK for long distances
        use_tolls: 0.1,           // Minimal tolls
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.0,
        use_living_streets: 0.6,  // Moderate scenic preference
        maneuver_penalty: 7,      // Moderate penalty
        country_crossing_cost: 600,
        country_crossing_penalty: 0
      }
    }
  } else {
    // LONGEST ROUTE LOGIC
    if (directDistance < 100) {
      // Short longest route: Maximize detours
      console.log('   🛣️ Short longest route: Maximizing detours through towns')
      return {
        use_highways: 0.0,        // NO highways (forces detours)
        use_tolls: 0.0,           // NO tolls
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.3,          // Some unpaved OK (adds distance)
        use_living_streets: 1.0,  // Maximize residential (more POIs)
        maneuver_penalty: 1,      // Minimal penalty (encourage turns)
        country_crossing_cost: 600,
        country_crossing_penalty: 0
      }
    } else if (directDistance < 500) {
      // Medium longest route: Route through multiple towns
      console.log('   🛣️ Medium longest route: Routing through multiple towns/regions')
      return {
        use_highways: 0.3,        // Some highways OK
        use_tolls: 0.2,           // Some tolls OK
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.2,          // Some unpaved OK
        use_living_streets: 0.8,  // Prefer residential
        maneuver_penalty: 3,      // Low penalty
        country_crossing_cost: 600,
        country_crossing_penalty: 0
      }
    } else {
      // Long longest route: Grand tour through major POIs
      console.log('   🛣️ Long longest route: Grand tour through major POIs')
      return {
        use_highways: 0.5,        // Highways OK between POIs
        use_tolls: 0.3,           // Tolls OK
        use_ferry: 1.0,           // Prefer ferries
        shortest: false,
        use_tracks: 0.1,          // Minimal unpaved
        use_living_streets: 0.7,  // Moderate residential preference
        maneuver_penalty: 5,      // Moderate penalty
        country_crossing_cost: 600,
        country_crossing_penalty: 0
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
 * Get Valhalla service status
 */
export async function getValhallaStatus(): Promise<{
  available: boolean
  version?: string
  tileset?: string
}> {
  try {
    const response = await fetch(`${VALHALLA_URL}/status`)
    
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


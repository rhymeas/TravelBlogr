/**
 * Routing Service - Real Road Routes
 *
 * Provides real road routing using:
 * 1. OpenRouteService (primary) - 2,000 requests/day, requires API key
 * 2. OSRM Demo Server (fallback) - Unlimited, no API key
 *
 * Automatically caches routes in database to minimize API calls
 */

import { createClient } from '@supabase/supabase-js'
import { findScenicWaypoints, findPOIRichWaypoints, findFirstScenicWaypoint } from './scenicRouteService'
import { getValhallaRoute, isValhallaAvailable } from './valhallaService'

// 🚀 PERFORMANCE: Upstash Redis caching (Phase 2 optimization - 2025-01-28)
// DEPENDENCIES: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
// CONTEXT: Routes are expensive (2-5s), Upstash cache provides < 10ms response time
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type TransportProfile = 'driving-car' | 'cycling-regular' | 'foot-walking' | 'wheelchair'
export type OSRMProfile = 'driving' | 'cycling' | 'foot'

export interface RouteCoordinate {
  longitude: number
  latitude: number
}

export interface RouteResult {
  geometry: {
    type: 'LineString'
    coordinates: number[][] // [lng, lat] pairs
  }
  distance: number // meters
  duration: number // seconds
  provider: 'openrouteservice' | 'osrm' | 'cache' | 'valhalla' | 'stadia' | 'osrm-scenic-intelligent' | 'osrm-longest-poi-rich' | 'osrm-direct'
}

/**
 * Get route between multiple coordinates
 *
 * 🎯 ROUTE DIFFERENTIATION STRATEGY (2025-01-27)
 * Different route types use different approaches to ensure variety:
 *
 * - FASTEST: ORS with 'fastest' preference (highways, toll roads)
 * - SHORTEST: ORS with 'shortest' preference (direct path)
 * - SCENIC: ORS with avoid_features=['highways'] + OSRM alternatives (scenic roads)
 * - LONGEST: OSRM alternatives, pick longest route
 *
 * 📚 Documentation: docs/ROUTE_CALCULATION_EXPERIMENT.md
 */
export async function getRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile = 'driving-car',
  preference?: 'fastest' | 'shortest' | 'recommended' | 'scenic' | 'longest',
  bustCache: boolean = false
): Promise<RouteResult> {
  if (coordinates.length < 2) {
    throw new Error('At least 2 coordinates required for routing')
  }

  // 🚀 PERFORMANCE: Check Upstash cache first (< 10ms vs 2-5s calculation)
  // DEPENDENCIES: Requires Upstash Redis configured (gracefully degrades if not available)
  // CONTEXT: Cache key includes coordinates, profile, and preference for unique routes
  const cacheKey = generateCacheKey(coordinates, profile, preference)

  if (!bustCache) {
    // Try Upstash cache first (super fast!)
    const upstashCached = await getOrSet<RouteResult | null>(
      CacheKeys.route(cacheKey),
      async () => {
        // If not in Upstash, try database cache
        const dbCached = await getCachedRoute(cacheKey)
        if (dbCached) {
          return { ...dbCached, provider: 'cache' as const }
        }
        return null
      },
      CacheTTL.ROUTE // 30 days
    )

    if (upstashCached) {
      console.log('✅ Route from Upstash cache (< 10ms):', cacheKey)
      return upstashCached
    }
  } else {
    console.log('🔄 Cache busting enabled - forcing fresh calculation')
  }

  console.log(`🛣️ Calculating ${preference || 'default'} route...`)

  // STRATEGY 1: VALHALLA - Use self-hosted Valhalla for scenic and longest routes
  if (preference === 'scenic' || preference === 'longest') {
    console.log(`🏞️ Trying Valhalla for ${preference} route...`)
    try {
      // Check if Valhalla is available
      const valhallaAvailable = await isValhallaAvailable()

      if (valhallaAvailable) {
        // NEW STRATEGY: For scenic routes, add first scenic waypoint to guide the route
        let waypoints: RouteCoordinate[] | undefined = undefined

        if (preference === 'scenic') {
          console.log(`   🎯 Finding first scenic attraction/city to guide route...`)

          // Get country code for POI filtering
          const startCountry = await getCountryCodeForRoute(coordinates[0])

          // Find first scenic waypoint (attraction or city)
          const firstWaypoint = await findFirstScenicWaypoint(
            coordinates[0],
            coordinates[coordinates.length - 1],
            startCountry
          )

          if (firstWaypoint) {
            waypoints = [firstWaypoint]
            console.log(`   ✅ Will route through first scenic waypoint`)
          } else {
            console.log(`   ⚠️ No first scenic waypoint found, using alternatives only`)
          }
        }

        const route = await getValhallaRoute(
          coordinates[0],
          coordinates[coordinates.length - 1],
          preference,
          waypoints
        )
        await cacheRoute(cacheKey, route)
        console.log(`✅ Valhalla ${preference} route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
        return route
      } else {
        console.log('   ⚠️ Valhalla not available, falling back to OSRM + custom waypoints')
      }
    } catch (error) {
      console.warn('⚠️ Valhalla failed, falling back to OSRM + custom waypoints:', error)
    }
  }

  // STRATEGY 2: OSRM + CUSTOM WAYPOINTS - Fallback for scenic/longest routes
  if (preference === 'longest') {
    console.log('🎯 Creating longest route through POI-rich areas (OSRM fallback)...')
    try {
      const osrmProfile = mapToOSRMProfile(profile)

      // Try to find POI-rich waypoints
      const poiWaypoints = await findPOIRichWaypoints(
        coordinates[0],
        coordinates[coordinates.length - 1],
        50 // Max 50% detour
      )

      let detourCoords: RouteCoordinate[]
      if (poiWaypoints.length > 0) {
        // Use intelligent POI-rich waypoints
        detourCoords = [coordinates[0], ...poiWaypoints, coordinates[coordinates.length - 1]]
        console.log(`   ✅ Using ${poiWaypoints.length} POI-rich waypoints`)
      } else {
        // No POI waypoints found - use direct route to avoid border crossing
        console.log('   ⚠️ No POI-rich areas found within same country, using direct route')
        detourCoords = coordinates
      }

      const route = await getOSRMRoute(detourCoords, osrmProfile)
      await cacheRoute(cacheKey, route)
      console.log(`✅ Longest route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
      return { ...route, provider: 'osrm-longest-poi-rich' }
    } catch (error) {
      console.warn('⚠️ Longest route failed:', error)
    }
  }

  if (preference === 'scenic') {
    console.log('🏞️ Creating scenic route with natural feature waypoints (OSRM fallback)...')
    try {
      const osrmProfile = mapToOSRMProfile(profile)

      // Try to find scenic waypoints using Overpass API
      const scenicWaypoints = await findScenicWaypoints(
        coordinates[0],
        coordinates[coordinates.length - 1],
        30 // Max 30% detour
      )

      let detourCoords: RouteCoordinate[]
      if (scenicWaypoints.length > 0) {
        // Use intelligent scenic waypoints
        detourCoords = [coordinates[0], ...scenicWaypoints, coordinates[coordinates.length - 1]]
        console.log(`   ✅ Using ${scenicWaypoints.length} scenic waypoints`)
      } else {
        // No scenic waypoints found - use direct route to avoid border crossing
        console.log('   ⚠️ No scenic features found within same country, using direct route')
        detourCoords = coordinates
      }

      const route = await getOSRMRoute(detourCoords, osrmProfile)
      await cacheRoute(cacheKey, route)
      console.log(`✅ Scenic route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
      return { ...route, provider: 'osrm-scenic-intelligent' }
    } catch (error) {
      console.warn('⚠️ Scenic route failed:', error)
    }
  }

  // STRATEGY 3: SHORTEST - Direct route (baseline)
  if (preference === 'shortest') {
    console.log('📏 Calculating shortest/direct route...')
    try {
      const osrmProfile = mapToOSRMProfile(profile)
      const route = await getOSRMRoute(coordinates, osrmProfile)
      await cacheRoute(cacheKey, route)
      console.log(`✅ Shortest route (direct): ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
      return { ...route, provider: 'osrm-direct' }
    } catch (error) {
      console.warn('⚠️ OSRM shortest failed, trying ORS:', error)

      // Fallback to ORS
      if (process.env.OPENROUTESERVICE_API_KEY) {
        try {
          const route = await getOpenRouteServiceRoute(coordinates, profile, 'shortest')
          await cacheRoute(cacheKey, route)
          console.log(`✅ Shortest route (ORS fallback): ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
          return { ...route, provider: 'openrouteservice' }
        } catch (err) {
          console.warn('⚠️ ORS shortest also failed:', err)
        }
      }
    }
  }

  // STRATEGY 4: FASTEST - Same as shortest (direct route)
  if (preference === 'fastest') {
    console.log('⚡ Calculating fastest/direct route...')
    try {
      const osrmProfile = mapToOSRMProfile(profile)
      const route = await getOSRMRoute(coordinates, osrmProfile)
      await cacheRoute(cacheKey, route)
      console.log(`✅ Fastest route (direct): ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
      return { ...route, provider: 'osrm-direct' }
    } catch (error) {
      console.warn('⚠️ OSRM fastest failed, trying ORS:', error)

      // Fallback to ORS
      if (process.env.OPENROUTESERVICE_API_KEY) {
        try {
          const route = await getOpenRouteServiceRoute(coordinates, profile, 'fastest')
          await cacheRoute(cacheKey, route)
          console.log(`✅ Fastest route (ORS fallback): ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
          return { ...route, provider: 'openrouteservice' }
        } catch (err) {
          console.warn('⚠️ ORS fastest also failed:', err)
        }
      }
    }
  }

  // STRATEGY 4: Fallback to OSRM demo server (basic route)
  try {
    const osrmProfile = mapToOSRMProfile(profile)
    const route = await getOSRMRoute(coordinates, osrmProfile)
    await cacheRoute(cacheKey, route)
    console.log(`✅ Route from OSRM: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
    return { ...route, provider: 'osrm' }
  } catch (error) {
    console.error('❌ All routing providers failed:', error)
    throw new Error('Failed to get route from all providers')
  }
}

/**
 * OpenRouteService API - Standard Routes
 * Free tier: 2,000 requests/day
 *
 * Used for: FASTEST and SHORTEST routes
 */
async function getOpenRouteServiceRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile,
  preference: 'fastest' | 'shortest' | 'recommended'
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => [c.longitude, c.latitude])

  const body = {
    coordinates: coords,
    format: 'geojson',
    preference: preference
  }

  console.log(`📡 ORS API call: ${preference} route`)

  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      method: 'POST',
      headers: {
        'Authorization': process.env.OPENROUTESERVICE_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouteService error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const route = data.features[0]

  return {
    geometry: route.geometry,
    distance: route.properties.segments[0].distance,
    duration: route.properties.segments[0].duration
  }
}

/**
 * OpenRouteService API - Scenic Routes
 *
 * 🏞️ SCENIC ROUTE STRATEGY:
 * - Avoid highways and toll roads
 * - Prefer scenic roads (coastal, mountain, rural)
 * - Use 'recommended' preference with avoid_features
 *
 * This should return a noticeably different route from fastest/shortest
 */
async function getOpenRouteServiceScenicRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => [c.longitude, c.latitude])

  const body = {
    coordinates: coords,
    format: 'geojson',
    preference: 'recommended',
    options: {
      avoid_features: ['highways', 'tollways'],
      // Note: ORS doesn't have explicit "scenic" weighting, but avoiding highways
      // and using recommended preference should give us more scenic routes
    }
  }

  console.log(`📡 ORS API call: SCENIC route (avoid highways/tollways)`)

  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      method: 'POST',
      headers: {
        'Authorization': process.env.OPENROUTESERVICE_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      },
      body: JSON.stringify(body)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouteService scenic error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const route = data.features[0]

  return {
    geometry: route.geometry,
    distance: route.properties.segments[0].distance,
    duration: route.properties.segments[0].duration
  }
}

/**
 * OSRM Demo Server API - Basic Routes
 * Free, no API key required
 *
 * Used as fallback when ORS is unavailable
 */
async function getOSRMRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OSRM error: ${response.status}`)
  }
  const data = await response.json()
  if (data.code !== 'Ok') {
    throw new Error(`OSRM routing failed: ${data.code}`)
  }
  const route = data.routes[0]
  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration
  }
}

/**
 * OSRM Demo Server API - Fastest Routes
 *
 * ⚡ FASTEST ROUTE STRATEGY (OSRM):
 * - Request alternative routes
 * - Pick the route with minimum DURATION (fastest time)
 * - This should use highways and major roads
 */
async function getOSRMFastestRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`

  console.log(`📡 OSRM API call: FASTEST route (alternatives)`)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`)

  const data = await response.json()
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM routing failed: ${data.code}`)
  }

  // Pick the route with minimum duration (fastest)
  let fastest = data.routes[0]
  for (let i = 1; i < data.routes.length; i++) {
    if (data.routes[i].duration < fastest.duration) {
      fastest = data.routes[i]
    }
  }

  console.log(`📊 OSRM fastest: ${data.routes.length} alternatives, fastest is ${(fastest.duration / 60).toFixed(0)}min`)

  return {
    geometry: fastest.geometry,
    distance: fastest.distance,
    duration: fastest.duration
  }
}

/**
 * OSRM Demo Server API - Shortest Routes
 *
 * 📏 SHORTEST ROUTE STRATEGY (OSRM):
 * - Request alternative routes
 * - Pick the route with minimum DISTANCE
 * - This should be the most direct path
 */
async function getOSRMShortestRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`

  console.log(`📡 OSRM API call: SHORTEST route (alternatives)`)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`)

  const data = await response.json()
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM routing failed: ${data.code}`)
  }

  // Pick the route with minimum distance (shortest)
  let shortest = data.routes[0]
  for (let i = 1; i < data.routes.length; i++) {
    if (data.routes[i].distance < shortest.distance) {
      shortest = data.routes[i]
    }
  }

  console.log(`📊 OSRM shortest: ${data.routes.length} alternatives, shortest is ${(shortest.distance / 1000).toFixed(1)}km`)

  return {
    geometry: shortest.geometry,
    distance: shortest.distance,
    duration: shortest.duration
  }
}

/**
 * OSRM Demo Server API - Scenic Routes
 *
 * 🏞️ SCENIC ROUTE STRATEGY (OSRM):
 * - Request alternative routes
 * - Pick a route that's longer but not the longest
 * - Rationale: Longer routes often avoid highways and use scenic roads
 */
async function getOSRMScenicRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`

  console.log(`📡 OSRM API call: SCENIC route (alternatives)`)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`)

  const data = await response.json()
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM routing failed: ${data.code}`)
  }

  // Sort routes by distance (descending)
  const sorted = data.routes.sort((a: any, b: any) => b.distance - a.distance)

  // Pick the second longest route (if available) as it's likely more scenic than fastest
  // but not as extreme as the longest
  const scenicRoute = sorted.length > 1 ? sorted[1] : sorted[0]

  console.log(`📊 OSRM scenic: ${sorted.length} alternatives, picked #${sorted.indexOf(scenicRoute) + 1} (${(scenicRoute.distance / 1000).toFixed(1)}km)`)

  return {
    geometry: scenicRoute.geometry,
    distance: scenicRoute.distance,
    duration: scenicRoute.duration
  }
}

/**
 * OSRM Demo Server API - Longest Routes
 *
 * 🛣️ LONGEST ROUTE STRATEGY:
 * - Request alternative routes
 * - Pick the route with maximum distance
 * - Used for "longest" preference
 */
async function getOSRMLongestRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`

  console.log(`📡 OSRM API call: LONGEST route (alternatives)`)

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OSRM error: ${response.status}`)

  const data = await response.json()
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(`OSRM routing failed: ${data.code}`)
  }

  // Pick the route with maximum distance
  let best = data.routes[0]
  for (let i = 1; i < data.routes.length; i++) {
    if (data.routes[i].distance > best.distance) best = data.routes[i]
  }

  console.log(`📊 OSRM longest: ${data.routes.length} alternatives, longest is ${(best.distance / 1000).toFixed(1)}km`)

  return {
    geometry: best.geometry,
    distance: best.distance,
    duration: best.duration
  }
}



/**
 * Map OpenRouteService profile to OSRM profile
 */
function mapToOSRMProfile(profile: TransportProfile): OSRMProfile {
  switch (profile) {
    case 'driving-car':
      return 'driving'
    case 'cycling-regular':
      return 'cycling'
    case 'foot-walking':
    case 'wheelchair':
      return 'foot'
    default:
      return 'driving'
  }
}

/**
 * Add scenic detour waypoint perpendicular to route
 * Creates a longer, more scenic route by adding waypoints off the direct path
 */
function addScenicDetourWaypoint(
  coordinates: RouteCoordinate[],
  detourFactor: number = 0.15
): RouteCoordinate[] {
  if (coordinates.length < 2) return coordinates

  // For 2-point routes, add waypoint perpendicular to midpoint
  if (coordinates.length === 2) {
    const start = coordinates[0]
    const end = coordinates[1]

    // Calculate midpoint
    const midLat = (start.latitude + end.latitude) / 2
    const midLon = (start.longitude + end.longitude) / 2

    // Calculate perpendicular offset (rotate 90 degrees)
    const deltaLat = end.latitude - start.latitude
    const deltaLon = end.longitude - start.longitude

    // Perpendicular vector (rotated 90 degrees)
    const perpLat = -deltaLon * detourFactor
    const perpLon = deltaLat * detourFactor

    // Add detour waypoint
    const detourPoint: RouteCoordinate = {
      latitude: midLat + perpLat,
      longitude: midLon + perpLon
    }

    console.log(`📍 Added scenic detour waypoint: ${detourPoint.latitude.toFixed(4)}, ${detourPoint.longitude.toFixed(4)}`)

    return [start, detourPoint, end]
  }

  // For multi-point routes, add detour between each segment
  const result: RouteCoordinate[] = [coordinates[0]]

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i]
    const end = coordinates[i + 1]

    // Calculate midpoint
    const midLat = (start.latitude + end.latitude) / 2
    const midLon = (start.longitude + end.longitude) / 2

    // Calculate perpendicular offset
    const deltaLat = end.latitude - start.latitude
    const deltaLon = end.longitude - start.longitude

    const perpLat = -deltaLon * detourFactor
    const perpLon = deltaLat * detourFactor

    // Add detour waypoint
    result.push({
      latitude: midLat + perpLat,
      longitude: midLon + perpLon
    })

    result.push(end)
  }

  console.log(`📍 Added ${result.length - coordinates.length} scenic detour waypoints`)

  return result
}

/**
 * Generate cache key for route
 */
function generateCacheKey(coordinates: RouteCoordinate[], profile: string, preference?: string): string {
  const coordStr = coordinates
    .map(c => `${c.longitude.toFixed(4)},${c.latitude.toFixed(4)}`)
    .join('|')
  return `${profile}:${preference || 'default'}:${coordStr}`
}

/**
 * Get cached route from database
 */
async function getCachedRoute(cacheKey: string): Promise<Omit<RouteResult, 'provider'> | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('route_cache')
      .select('geometry, distance, duration')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days
      .single()

    if (error || !data) return null

    return {
      geometry: data.geometry,
      distance: data.distance,
      duration: data.duration
    }
  } catch (error) {
    console.warn('Cache lookup failed:', error)
    return null
  }
}

/**
 * Cache route in database AND Upstash (dual-layer caching)
 *
 * 🚀 PERFORMANCE: Dual-layer caching strategy (Phase 2 optimization - 2025-01-28)
 * DEPENDENCIES: Requires Upstash Redis (optional) and Supabase route_cache table
 * CONTEXT: Upstash = fast (< 10ms), Database = persistent backup, both = best of both worlds
 */
async function cacheRoute(cacheKey: string, route: Omit<RouteResult, 'provider'>): Promise<void> {
  try {
    // Layer 1: Cache in Upstash (super fast, < 10ms reads)
    const { setCached } = await import('@/lib/upstash')
    await setCached(CacheKeys.route(cacheKey), route, CacheTTL.ROUTE)

    // Layer 2: Cache in database (persistent, survives Upstash eviction)
    const supabase = getSupabaseClient()
    await supabase
      .from('route_cache')
      .upsert({
        cache_key: cacheKey,
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        created_at: new Date().toISOString()
      })

    console.log('✅ Route cached in Upstash + Database')
  } catch (error) {
    console.warn('Failed to cache route:', error)
    // Don't throw - caching is optional
  }
}

/**
 * Batch get routes for multiple segments
 * Useful for multi-stop trips
 */
export async function getBatchRoutes(
  locations: RouteCoordinate[],
  profile: TransportProfile = 'driving-car'
): Promise<RouteResult[]> {
  const routes: RouteResult[] = []

  for (let i = 0; i < locations.length - 1; i++) {
    const route = await getRoute([locations[i], locations[i + 1]], profile)
    routes.push(route)
  }

  return routes
}

/**
 * Get combined route for entire trip
 * Returns single route geometry for all segments
 */
export async function getCombinedRoute(
  locations: RouteCoordinate[],
  profile: TransportProfile = 'driving-car'
): Promise<RouteResult> {
  // For 2 locations, just get direct route
  if (locations.length === 2) {
    return getRoute(locations, profile)
  }

  // For multiple locations, get route through all waypoints
  return getRoute(locations, profile)
}

/**
 * Get country code for a route coordinate
 */
async function getCountryCodeForRoute(coord: RouteCoordinate): Promise<string> {
  try {
    const query = `
      [out:json][timeout:5];
      is_in(${coord.latitude},${coord.longitude})->.a;
      area.a["ISO3166-1"]["admin_level"="2"];
      out tags;
    `

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!response.ok) return 'CA' // Default to Canada for testing

    const data = await response.json()

    if (data.elements && data.elements.length > 0) {
      const countryCode = data.elements[0].tags?.['ISO3166-1']
      if (countryCode) {
        return countryCode.toUpperCase()
      }
    }

    return 'CA' // Default to Canada for testing
  } catch (error) {
    console.warn('Country code lookup failed:', error)
    return 'CA' // Default to Canada for testing
  }
}


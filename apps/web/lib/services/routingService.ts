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
  provider: 'openrouteservice' | 'osrm' | 'cache'
}

/**
 * Get route between multiple coordinates
 * Tries OpenRouteService first, falls back to OSRM if unavailable
 */
export async function getRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile = 'driving-car',
  preference?: 'fastest' | 'shortest' | 'recommended' | 'scenic' | 'longest'
): Promise<RouteResult> {
  if (coordinates.length < 2) {
    throw new Error('At least 2 coordinates required for routing')
  }

  // Check cache first
  const cacheKey = generateCacheKey(coordinates, profile, preference)
  const cached = await getCachedRoute(cacheKey)
  if (cached) {
    console.log('✅ Route from cache:', cacheKey)
    return { ...cached, provider: 'cache' }
  }

  // Special handling for 'longest': Use OSRM alternatives and pick the longest
  if (preference === 'longest') {
    try {
      const osrmProfile = mapToOSRMProfile(profile)
      const route = await getOSRMLongestRoute(coordinates, osrmProfile)
      await cacheRoute(cacheKey, route)
      console.log('✅ Longest route from OSRM alternatives')
      return { ...route, provider: 'osrm' }
    } catch (error) {
      console.warn('⚠️ OSRM longest failed, trying OpenRouteService recommended as fallback:', error)
      // Fallback to ORS recommended
      if (process.env.OPENROUTESERVICE_API_KEY) {
        try {
          const route = await getOpenRouteServiceRoute(coordinates, profile, 'recommended')
          await cacheRoute(cacheKey, route)
          console.log('✅ Route from OpenRouteService (recommended fallback)')
          return { ...route, provider: 'openrouteservice' }
        } catch (err) {
          console.warn('⚠️ OpenRouteService fallback failed:', err)
        }
      }
    }
  }

  // Try OpenRouteService first (if API key available)
  if (process.env.OPENROUTESERVICE_API_KEY) {
    try {
      const route = await getOpenRouteServiceRoute(coordinates, profile, mapPreference(preference))
      await cacheRoute(cacheKey, route)
      console.log('✅ Route from OpenRouteService')
      return { ...route, provider: 'openrouteservice' }
    } catch (error) {
      console.warn('⚠️ OpenRouteService failed, falling back to OSRM:', error)
    }
  }

  // Fallback to OSRM demo server
  try {
    const osrmProfile = mapToOSRMProfile(profile)
    const route = await getOSRMRoute(coordinates, osrmProfile)
    await cacheRoute(cacheKey, route)
    console.log('✅ Route from OSRM demo server')
    return { ...route, provider: 'osrm' }
  } catch (error) {
    console.error('❌ All routing providers failed:', error)
    throw new Error('Failed to get route from all providers')
  }
}

/**
 * OpenRouteService API
 * Free tier: 2,000 requests/day
 */
async function getOpenRouteServiceRoute(
  coordinates: RouteCoordinate[],
  profile: TransportProfile,
  preference?: 'fastest' | 'shortest' | 'recommended' | 'scenic'
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => [c.longitude, c.latitude])

  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      method: 'POST',
      headers: {
        'Authorization': process.env.OPENROUTESERVICE_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      },
      body: JSON.stringify({
        coordinates: coords,
        format: 'geojson',
        preference: mapPreference(preference),
        ...(preference === 'scenic' ? { options: { avoid_features: ['highways'], profile_params: { weightings: { scenic: 1 } } } } : {})
      })
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
 * OSRM Demo Server API
 * Free, no API key required
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


async function getOSRMLongestRoute(
  coordinates: RouteCoordinate[],
  profile: OSRMProfile
): Promise<Omit<RouteResult, 'provider'>> {
  const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`
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

function mapPreference(p?: 'fastest' | 'shortest' | 'recommended' | 'scenic' | 'longest') {
  if (p === 'scenic') return 'recommended'
  if (p === 'shortest') return 'shortest'
  if (p === 'fastest') return 'fastest'
  if (p === 'recommended') return 'recommended'
  // 'longest' not supported by ORS directly
  return undefined
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
 * Cache route in database
 */
async function cacheRoute(cacheKey: string, route: Omit<RouteResult, 'provider'>): Promise<void> {
  try {
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


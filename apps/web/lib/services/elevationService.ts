/**
 * Elevation Service
 * 
 * Fetches elevation data and route information using OpenRouteService API
 * FREE tier: 2000 requests/day, 40 requests/minute
 * 
 * Features:
 * - Route calculation with elevation profile
 * - Elevation data for specific coordinates
 * - Ascent/descent calculations
 * - Distance-elevation graphs
 */

import { createServerSupabase } from '@/lib/supabase-server'

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY
const ORS_BASE_URL = 'https://api.openrouteservice.org'

export interface ElevationProfile {
  elevations: number[] // Elevation in meters at each point
  distances: number[] // Cumulative distance in meters
  ascent: number // Total ascent in meters
  descent: number // Total descent in meters
  maxElevation: number
  minElevation: number
}

export interface RouteWithElevation {
  geometry: any // GeoJSON LineString
  distance: number // Total distance in meters
  duration: number // Total duration in seconds
  elevationProfile: ElevationProfile
}

/**
 * Get route with elevation data between two points
 */
export async function getRouteWithElevation(
  start: [number, number], // [lng, lat]
  end: [number, number], // [lng, lat]
  profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<RouteWithElevation | null> {
  try {
    // Check cache first
    const cacheKey = `${profile}:${start.join(',')}-${end.join(',')}`
    const cached = await getCachedRoute(cacheKey)
    if (cached) {
      return cached
    }

    if (!ORS_API_KEY) {
      console.warn('OpenRouteService API key not configured, using fallback')
      return getFallbackRoute(start, end)
    }

    // Fetch route from OpenRouteService
    const response = await fetch(`${ORS_BASE_URL}/v2/directions/${profile}`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [start, end],
        elevation: true,
        extra_info: ['elevation'],
        instructions: false
      })
    })

    if (!response.ok) {
      console.error('OpenRouteService API error:', response.status, response.statusText)
      return getFallbackRoute(start, end)
    }

    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      return getFallbackRoute(start, end)
    }

    const route = data.routes[0]
    const geometry = route.geometry
    const distance = route.summary.distance
    const duration = route.summary.duration

    // Extract elevation profile
    const elevationProfile = extractElevationProfile(route)

    const result: RouteWithElevation = {
      geometry,
      distance,
      duration,
      elevationProfile
    }

    // Cache the result
    await cacheRoute(cacheKey, result)

    return result
  } catch (error) {
    console.error('Error fetching route with elevation:', error)
    return getFallbackRoute(start, end)
  }
}

/**
 * Extract elevation profile from OpenRouteService route
 */
function extractElevationProfile(route: any): ElevationProfile {
  try {
    const segments = route.segments || []
    const elevations: number[] = []
    const distances: number[] = []
    let totalAscent = 0
    let totalDescent = 0

    for (const segment of segments) {
      if (segment.steps) {
        for (const step of segment.steps) {
          if (step.way_points && step.way_points.length >= 2) {
            const startIdx = step.way_points[0]
            const endIdx = step.way_points[1]
            
            // Get elevation data from geometry
            if (route.geometry && route.geometry.coordinates) {
              for (let i = startIdx; i <= endIdx && i < route.geometry.coordinates.length; i++) {
                const coord = route.geometry.coordinates[i]
                if (coord.length >= 3) {
                  elevations.push(coord[2]) // Elevation is 3rd coordinate
                  distances.push(step.distance || 0)
                }
              }
            }
          }
        }
      }
      
      // Get ascent/descent from segment
      if (segment.ascent !== undefined) totalAscent += segment.ascent
      if (segment.descent !== undefined) totalDescent += segment.descent
    }

    // If no elevation data in segments, try to extract from geometry
    if (elevations.length === 0 && route.geometry && route.geometry.coordinates) {
      let cumulativeDistance = 0
      for (let i = 0; i < route.geometry.coordinates.length; i++) {
        const coord = route.geometry.coordinates[i]
        if (coord.length >= 3) {
          elevations.push(coord[2])
          
          // Calculate distance from previous point
          if (i > 0) {
            const prevCoord = route.geometry.coordinates[i - 1]
            const dist = calculateDistance(
              [prevCoord[1], prevCoord[0]],
              [coord[1], coord[0]]
            )
            cumulativeDistance += dist
          }
          distances.push(cumulativeDistance)
        }
      }
      
      // Calculate ascent/descent if not provided
      if (totalAscent === 0 && totalDescent === 0) {
        for (let i = 1; i < elevations.length; i++) {
          const diff = elevations[i] - elevations[i - 1]
          if (diff > 0) totalAscent += diff
          else totalDescent += Math.abs(diff)
        }
      }
    }

    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0

    return {
      elevations,
      distances,
      ascent: Math.round(totalAscent),
      descent: Math.round(totalDescent),
      maxElevation: Math.round(maxElevation),
      minElevation: Math.round(minElevation)
    }
  } catch (error) {
    console.error('Error extracting elevation profile:', error)
    return {
      elevations: [],
      distances: [],
      ascent: 0,
      descent: 0,
      maxElevation: 0,
      minElevation: 0
    }
  }
}

/**
 * Fallback route calculation (straight line with estimated elevation)
 */
function getFallbackRoute(
  start: [number, number],
  end: [number, number]
): RouteWithElevation {
  const distance = calculateDistance([start[1], start[0]], [end[1], end[0]])
  const duration = distance / 13.89 // Assume 50 km/h average speed
  
  return {
    geometry: {
      type: 'LineString',
      coordinates: [start, end]
    },
    distance,
    duration,
    elevationProfile: {
      elevations: [0, 0],
      distances: [0, distance],
      ascent: 0,
      descent: 0,
      maxElevation: 0,
      minElevation: 0
    }
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = coord1[0] * Math.PI / 180
  const lat2 = coord2[0] * Math.PI / 180
  const deltaLat = (coord2[0] - coord1[0]) * Math.PI / 180
  const deltaLng = (coord2[1] - coord1[1]) * Math.PI / 180

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Get cached route from database
 */
async function getCachedRoute(cacheKey: string): Promise<RouteWithElevation | null> {
  try {
    const supabase = await createServerSupabase()
    
    const { data, error } = await supabase
      .from('route_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days
      .single()
    
    if (error || !data) {
      return null
    }
    
    return {
      geometry: data.geometry,
      distance: Number(data.distance),
      duration: Number(data.duration),
      elevationProfile: (data as any).elevation_data || {
        elevations: [],
        distances: [],
        ascent: 0,
        descent: 0,
        maxElevation: 0,
        minElevation: 0
      }
    }
  } catch (error) {
    console.error('Error fetching cached route:', error)
    return null
  }
}

/**
 * Cache route in database
 */
async function cacheRoute(cacheKey: string, route: RouteWithElevation): Promise<void> {
  try {
    const supabase = await createServerSupabase()
    
    await supabase
      .from('route_cache')
      .upsert({
        cache_key: cacheKey,
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        elevation_data: route.elevationProfile
      })
  } catch (error) {
    console.error('Error caching route:', error)
  }
}


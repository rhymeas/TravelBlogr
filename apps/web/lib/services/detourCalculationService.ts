/**
 * Detour Calculation Service
 * 
 * Calculates actual detour time for POIs along a route.
 * Uses routing API to get real detour times (not just distance).
 * 
 * Use cases:
 * - Calculate detour time for POI
 * - Determine if POI is "worth the detour"
 * - Filter POIs by maximum detour time
 */

import { getRoute, type RouteCoordinate } from './routingService'

export interface DetourCalculation {
  poiCoordinates: [number, number]
  detourTimeMinutes: number
  detourDistanceKm: number
  worthTheDetour: boolean
  closestPointOnRoute: [number, number]
}

/**
 * Calculate detour time for a POI
 * 
 * Algorithm:
 * 1. Find closest point on route to POI
 * 2. Calculate route: closestPoint -> POI -> nextPoint
 * 3. Compare with direct route: closestPoint -> nextPoint
 * 4. Return difference in minutes
 * 
 * @param routeGeometry Full route geometry [[lng, lat], ...]
 * @param poiCoordinates POI coordinates [lng, lat]
 * @param transportMode Transport mode (default: 'driving-car')
 * @returns Detour time in minutes
 */
export async function calculateDetourTime(
  routeGeometry: number[][],
  poiCoordinates: [number, number],
  transportMode: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<number> {
  try {
    // 1. Find closest point on route to POI
    const { closestPoint, closestIndex } = findClosestPointOnRoute(routeGeometry, poiCoordinates)
    
    // If POI is very close to route (< 1km), detour is negligible
    const distanceToPOI = haversineDistance(
      closestPoint[1], closestPoint[0],
      poiCoordinates[1], poiCoordinates[0]
    )
    
    if (distanceToPOI < 1) {
      return Math.round(distanceToPOI * 2) // ~2 min per km
    }

    // 2. Get next point on route (for detour calculation)
    const nextIndex = Math.min(closestIndex + 5, routeGeometry.length - 1) // Look ahead 5 points
    const nextPoint = routeGeometry[nextIndex]

    // 3. Calculate detour route: closestPoint -> POI -> nextPoint
    const detourRoute = await getRoute([
      { longitude: closestPoint[0], latitude: closestPoint[1] },
      { longitude: poiCoordinates[0], latitude: poiCoordinates[1] },
      { longitude: nextPoint[0], latitude: nextPoint[1] }
    ], transportMode)

    // 4. Calculate direct route: closestPoint -> nextPoint
    const directRoute = await getRoute([
      { longitude: closestPoint[0], latitude: closestPoint[1] },
      { longitude: nextPoint[0], latitude: nextPoint[1] }
    ], transportMode)

    // 5. Calculate detour time (difference in minutes)
    const detourSeconds = detourRoute.duration - directRoute.duration
    const detourMinutes = Math.round(detourSeconds / 60)

    return Math.max(0, detourMinutes) // Never negative
  } catch (error) {
    console.error('Error calculating detour time:', error)
    // Fallback: estimate based on distance (2 min per km)
    const distanceToPOI = haversineDistance(
      routeGeometry[0][1], routeGeometry[0][0],
      poiCoordinates[1], poiCoordinates[0]
    )
    return Math.round(distanceToPOI * 2)
  }
}

/**
 * Calculate detour for multiple POIs (with caching)
 * 
 * @param routeGeometry Full route geometry
 * @param pois Array of POI coordinates
 * @param transportMode Transport mode
 * @returns Array of detour calculations
 */
export async function calculateDetoursForPOIs(
  routeGeometry: number[][],
  pois: Array<{ coordinates: [number, number]; name: string }>,
  transportMode: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<Map<string, number>> {
  const detours = new Map<string, number>()
  
  // Calculate detours in parallel (with rate limiting)
  const batchSize = 5 // Process 5 at a time to avoid rate limits
  for (let i = 0; i < pois.length; i += batchSize) {
    const batch = pois.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(poi => 
        calculateDetourTime(routeGeometry, poi.coordinates, transportMode)
          .then(time => ({ name: poi.name, time }))
      )
    )
    
    results.forEach(({ name, time }) => {
      detours.set(name, time)
    })
  }
  
  return detours
}

/**
 * Determine if a POI is "worth the detour"
 * 
 * Criteria:
 * - Quick detours (< 10 min) are always worth it
 * - High-rated POIs (>= 4.5) worth up to 20 min detour
 * - Interest match makes up to 15 min detour worth it
 * - Otherwise, max 10 min detour
 * 
 * @param detourMinutes Detour time in minutes
 * @param poiRating POI rating (0-5)
 * @param userInterests User's interests
 * @param poiKinds POI categories/kinds
 * @returns True if worth the detour
 */
export function isWorthTheDetour(
  detourMinutes: number,
  poiRating: number = 0,
  userInterests: string[] = [],
  poiKinds: string = ''
): boolean {
  // Quick detours always worth it
  if (detourMinutes < 10) return true
  
  // High-rated POIs worth longer detours
  if (poiRating >= 4.5 && detourMinutes < 20) return true
  
  // Interest match makes it worth it
  const poiKeywords = poiKinds.toLowerCase().split(',')
  const interestMatch = userInterests.some(interest => 
    poiKeywords.some(keyword => keyword.includes(interest.toLowerCase()))
  )
  
  if (interestMatch && detourMinutes < 15) return true
  
  // Otherwise, only short detours
  return detourMinutes < 10
}

/**
 * Find closest point on route to a given coordinate
 * 
 * @param routeGeometry Route geometry [[lng, lat], ...]
 * @param targetCoordinates Target coordinates [lng, lat]
 * @returns Closest point and its index
 */
function findClosestPointOnRoute(
  routeGeometry: number[][],
  targetCoordinates: [number, number]
): { closestPoint: [number, number]; closestIndex: number } {
  let minDistance = Infinity
  let closestPoint: [number, number] = routeGeometry[0] as [number, number]
  let closestIndex = 0

  for (let i = 0; i < routeGeometry.length; i++) {
    const point = routeGeometry[i]
    const distance = haversineDistance(
      point[1], point[0],
      targetCoordinates[1], targetCoordinates[0]
    )

    if (distance < minDistance) {
      minDistance = distance
      closestPoint = point as [number, number]
      closestIndex = i
    }
  }

  return { closestPoint, closestIndex }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Filter POIs by maximum detour time
 * 
 * @param pois POIs with detour times
 * @param maxDetourMinutes Maximum acceptable detour time
 * @returns Filtered POIs
 */
export function filterPOIsByDetourTime<T extends { detourTimeMinutes?: number }>(
  pois: T[],
  maxDetourMinutes: number
): T[] {
  return pois.filter(poi => 
    poi.detourTimeMinutes !== undefined && 
    poi.detourTimeMinutes <= maxDetourMinutes
  )
}

/**
 * Sort POIs by detour time (shortest first)
 */
export function sortPOIsByDetourTime<T extends { detourTimeMinutes?: number }>(
  pois: T[]
): T[] {
  return [...pois].sort((a, b) => 
    (a.detourTimeMinutes || Infinity) - (b.detourTimeMinutes || Infinity)
  )
}

/**
 * Get POIs worth the detour
 */
export function getWorthwhilePOIs<T extends { 
  detourTimeMinutes?: number
  rating?: number
  kinds?: string
}>(
  pois: T[],
  userInterests: string[] = []
): T[] {
  return pois.filter(poi => 
    poi.detourTimeMinutes !== undefined &&
    isWorthTheDetour(
      poi.detourTimeMinutes,
      poi.rating,
      userInterests,
      poi.kinds || ''
    )
  )
}


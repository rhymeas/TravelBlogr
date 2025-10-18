/**
 * Route POI Service - Fetch Points of Interest Along Routes
 * 
 * This service samples points along a route geometry and fetches
 * interesting POIs (restaurants, attractions, viewpoints) within
 * a specified radius of the route.
 * 
 * Use cases:
 * - Show interesting stops along a driving route
 * - Suggest restaurants/cafes for breaks
 * - Highlight scenic viewpoints
 * - Find attractions worth a detour
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface RoutePOI {
  name: string
  category: string
  latitude: number
  longitude: number
  distanceFromRoute: number // km
  rating?: number
  description?: string
  wikidata?: string
  kinds?: string
  // Detour information
  detourTimeMinutes?: number
  worthTheDetour?: boolean
  // Visit information
  visitDurationMinutes?: number
  microExperience?: 'quick-stop' | 'coffee-break' | 'meal-break' | 'short-visit' | 'half-day' | 'full-day'
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
  // Ranking
  score?: number
  rankingFactors?: {
    interestMatch: number
    rating: number
    detourEfficiency: number
    timeEfficiency: number
  }
}

export interface RouteSegment {
  startPoint: { lat: number; lng: number }
  endPoint: { lat: number; lng: number }
  pois: RoutePOI[]
}

/**
 * Sample points along a route geometry at regular intervals
 * @param geometry GeoJSON LineString coordinates [[lng, lat], ...]
 * @param intervalKm Distance between sample points in kilometers
 * @returns Array of sample points { lat, lng }
 */
export function sampleRoutePoints(
  geometry: number[][],
  intervalKm: number = 50
): Array<{ lat: number; lng: number }> {
  if (!geometry || geometry.length < 2) {
    return []
  }

  const samples: Array<{ lat: number; lng: number }> = []
  let accumulatedDistance = 0

  // Always include first point
  samples.push({ lat: geometry[0][1], lng: geometry[0][0] })

  for (let i = 1; i < geometry.length; i++) {
    const [lng1, lat1] = geometry[i - 1]
    const [lng2, lat2] = geometry[i]

    const segmentDistance = haversineDistance(lat1, lng1, lat2, lng2)
    accumulatedDistance += segmentDistance

    // Add sample point if we've traveled enough distance
    if (accumulatedDistance >= intervalKm) {
      samples.push({ lat: lat2, lng: lng2 })
      accumulatedDistance = 0
    }
  }

  // Always include last point
  const lastPoint = geometry[geometry.length - 1]
  samples.push({ lat: lastPoint[1], lng: lastPoint[0] })

  return samples
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
 * Fetch POIs near a specific point using OpenTripMap API
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusKm Search radius in kilometers
 * @param categories POI categories to fetch
 * @returns Array of POIs
 */
export async function fetchPOIsNearPoint(
  lat: number,
  lng: number,
  radiusKm: number = 10,
  categories: string[] = ['interesting_places', 'tourist_facilities', 'natural']
): Promise<RoutePOI[]> {
  const apiKey = process.env.OPENTRIPMAP_API_KEY

  if (!apiKey) {
    console.error('❌ CRITICAL: OpenTripMap API key not configured! Set OPENTRIPMAP_API_KEY in environment variables.')
    console.error('   Without this key, POIs along route will not be fetched.')
    console.error('   Get a free API key at: https://opentripmap.io/product')
    return []
  }

  try {
    const radiusMeters = radiusKm * 1000
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radiusMeters}&lon=${lng}&lat=${lat}&kinds=${categories.join(',')}&rate=3&limit=20&apikey=${apiKey}`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('OpenTripMap API error:', response.statusText)
      return []
    }

    const data = await response.json()
    const features = data.features || []

    return features.map((feature: any) => ({
      name: feature.properties.name || 'Unnamed',
      category: feature.properties.kinds?.split(',')[0] || 'unknown',
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      distanceFromRoute: haversineDistance(
        lat,
        lng,
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0]
      ),
      rating: feature.properties.rate || undefined,
      wikidata: feature.properties.wikidata || undefined,
      kinds: feature.properties.kinds || undefined
    }))
  } catch (error) {
    console.error('Error fetching POIs from OpenTripMap:', error)
    return []
  }
}

/**
 * Fetch POIs along an entire route with rate limiting
 * @param geometry Route geometry (GeoJSON LineString)
 * @param sampleIntervalKm Distance between sample points (default: 150km for long routes)
 * @param searchRadiusKm Search radius around each sample point (default: 15km)
 * @param categories POI categories to fetch
 * @returns Array of all POIs along the route (deduplicated)
 */
export async function fetchPOIsAlongRoute(
  geometry: number[][],
  sampleIntervalKm: number = 150, // Increased from 50km to reduce API calls
  searchRadiusKm: number = 15, // Increased from 10km to compensate
  categories: string[] = ['interesting_places', 'tourist_facilities', 'natural']
): Promise<RoutePOI[]> {
  console.log(`🗺️ Fetching POIs along route (${geometry.length} points)`)

  // 1. Sample points along the route
  const samplePoints = sampleRoutePoints(geometry, sampleIntervalKm)
  console.log(`📍 Sampled ${samplePoints.length} points along route`)

  // 2. Limit to max 30 sample points to avoid rate limiting
  const maxSamplePoints = 30
  const limitedSamplePoints = samplePoints.length > maxSamplePoints
    ? samplePoints.filter((_, i) => i % Math.ceil(samplePoints.length / maxSamplePoints) === 0).slice(0, maxSamplePoints)
    : samplePoints

  if (limitedSamplePoints.length < samplePoints.length) {
    console.log(`⚠️  Reduced sample points from ${samplePoints.length} to ${limitedSamplePoints.length} to avoid rate limiting`)
  }

  // 3. Fetch POIs in batches with rate limiting (5 requests per batch, 500ms delay)
  const batchSize = 5
  const delayMs = 500
  const allPOIs: RoutePOI[] = []

  for (let i = 0; i < limitedSamplePoints.length; i += batchSize) {
    const batch = limitedSamplePoints.slice(i, i + batchSize)

    const poisByPoint = await Promise.all(
      batch.map((point) =>
        fetchPOIsNearPoint(point.lat, point.lng, searchRadiusKm, categories)
      )
    )

    allPOIs.push(...poisByPoint.flat())

    // Add delay between batches (except for last batch)
    if (i + batchSize < limitedSamplePoints.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  // 4. Deduplicate POIs
  const uniquePOIs = deduplicatePOIs(allPOIs)

  console.log(`✅ Found ${uniquePOIs.length} unique POIs along route`)
  return uniquePOIs
}

/**
 * Deduplicate POIs by name and proximity
 * (POIs within 1km with same name are considered duplicates)
 */
function deduplicatePOIs(pois: RoutePOI[]): RoutePOI[] {
  const seen = new Map<string, RoutePOI>()

  for (const poi of pois) {
    const key = `${poi.name}-${Math.round(poi.latitude * 100)}-${Math.round(poi.longitude * 100)}`

    if (!seen.has(key)) {
      seen.set(key, poi)
    }
  }

  return Array.from(seen.values())
}

/**
 * Filter POIs by category
 */
export function filterPOIsByCategory(
  pois: RoutePOI[],
  category: string
): RoutePOI[] {
  return pois.filter((poi) => poi.category === category || poi.kinds?.includes(category))
}

/**
 * Sort POIs by rating (highest first)
 */
export function sortPOIsByRating(pois: RoutePOI[]): RoutePOI[] {
  return [...pois].sort((a, b) => (b.rating || 0) - (a.rating || 0))
}

/**
 * Filter POIs by maximum distance from route
 */
export function filterPOIsByDistance(
  pois: RoutePOI[],
  maxDistanceKm: number
): RoutePOI[] {
  return pois.filter((poi) => poi.distanceFromRoute <= maxDistanceKm)
}

/**
 * Get top N POIs by rating
 */
export function getTopPOIs(pois: RoutePOI[], limit: number = 10): RoutePOI[] {
  return sortPOIsByRating(pois).slice(0, limit)
}

/**
 * Enrich POIs with detour time, visit duration, AND ranking
 */
export async function enrichPOIsWithDetourTime(
  pois: RoutePOI[],
  routeGeometry: number[][],
  userInterests: string[] = [],
  transportMode: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
): Promise<RoutePOI[]> {
  const { calculateDetourTime, isWorthTheDetour } = await import('./detourCalculationService')
  const { enrichPOI } = await import('./poiEnrichmentService')
  const { calculatePOIScore } = await import('./poiRankingService')

  const enrichedPOIs: RoutePOI[] = []
  const batchSize = 5

  for (let i = 0; i < pois.length; i += batchSize) {
    const batch = pois.slice(i, i + batchSize)

    const enrichedBatch = await Promise.all(
      batch.map(async (poi) => {
        try {
          // Calculate detour time
          const detourMinutes = await calculateDetourTime(
            routeGeometry,
            [poi.longitude, poi.latitude],
            transportMode
          )

          const worthIt = isWorthTheDetour(
            detourMinutes,
            poi.rating,
            userInterests,
            poi.kinds || ''
          )

          // Add visit duration and micro-experience
          const visitInfo = enrichPOI({
            category: poi.category,
            kinds: poi.kinds,
            rating: poi.rating
          })

          // Calculate ranking score
          const { score, factors } = calculatePOIScore(
            {
              ...poi,
              detourTimeMinutes: detourMinutes,
              visitDurationMinutes: visitInfo.visitDurationMinutes
            },
            userInterests
          )

          return {
            ...poi,
            detourTimeMinutes: detourMinutes,
            worthTheDetour: worthIt,
            ...visitInfo,
            score,
            rankingFactors: factors
          }
        } catch (error) {
          console.error(`Failed to enrich ${poi.name}:`, error)
          return poi
        }
      })
    )

    enrichedPOIs.push(...enrichedBatch)

    if (i + batchSize < pois.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // Sort by score (highest first)
  return enrichedPOIs.sort((a, b) => (b.score || 0) - (a.score || 0))
}

/**
 * Get POIs worth the detour (filtered and sorted)
 */
export function getWorthwhilePOIs(
  pois: RoutePOI[],
  maxDetourMinutes: number = 15
): RoutePOI[] {
  return pois
    .filter(poi =>
      poi.worthTheDetour === true &&
      (poi.detourTimeMinutes || 0) <= maxDetourMinutes
    )
    .sort((a, b) => (a.detourTimeMinutes || 0) - (b.detourTimeMinutes || 0))
}

/**
 * Get quick stops (< 30 min)
 */
export function getQuickStops(pois: RoutePOI[]): RoutePOI[] {
  return pois.filter(poi => poi.microExperience === 'quick-stop')
}

/**
 * Get meal breaks (1-2 hours)
 */
export function getMealBreaks(pois: RoutePOI[]): RoutePOI[] {
  return pois.filter(poi =>
    poi.microExperience === 'meal-break' ||
    poi.microExperience === 'coffee-break'
  )
}

/**
 * Get major attractions (2+ hours)
 */
export function getMajorAttractions(pois: RoutePOI[]): RoutePOI[] {
  return pois.filter(poi =>
    poi.microExperience === 'short-visit' ||
    poi.microExperience === 'half-day' ||
    poi.microExperience === 'full-day'
  )
}

/**
 * Get highly ranked POIs (score >= 70)
 */
export function getHighlyRankedPOIs(pois: RoutePOI[]): RoutePOI[] {
  return pois.filter(poi => (poi.score || 0) >= 70)
}

/**
 * Get POIs by interest category
 */
export function getPOIsByInterest(pois: RoutePOI[], interest: string): RoutePOI[] {
  const int = interest.toLowerCase()
  return pois.filter(poi => {
    const category = poi.category.toLowerCase()
    const kinds = (poi.kinds || '').toLowerCase()
    return category.includes(int) || kinds.includes(int)
  })
}


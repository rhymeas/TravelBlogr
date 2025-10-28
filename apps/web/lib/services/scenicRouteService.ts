/**
 * Scenic Route Service
 * 
 * Generates scenic routes based on natural features and POI density
 * Uses Overpass API to find scenic waypoints (coastlines, mountains, viewpoints, etc.)
 */

import { RouteCoordinate } from './routingService'

export interface ScenicFeature {
  type: 'coastline' | 'mountain' | 'river' | 'lake' | 'canyon' | 'viewpoint' | 'national_park'
  name?: string
  coordinates: { lat: number; lng: number }
  distance: number // Distance from route in km
}

export interface POIDensityArea {
  coordinates: { lat: number; lng: number }
  poiCount: number
  categories: string[]
}

// Cache country codes to avoid redundant API calls
const countryCache = new Map<string, string>()

/**
 * Get country code with caching
 */
async function getCachedCountryCode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`

  if (countryCache.has(key)) {
    return countryCache.get(key)!
  }

  const country = await getCountryCode(lat, lng)
  countryCache.set(key, country)
  return country
}

/**
 * Find scenic waypoints between two points
 * Strategy: Find major scenic towns/cities along alternative routes
 * CRITICAL: Must stay within same country (no border crossings)
 */
export async function findScenicWaypoints(
  start: RouteCoordinate,
  end: RouteCoordinate,
  maxDetourPercent: number = 30
): Promise<RouteCoordinate[]> {
  console.log('🏞️ Finding scenic waypoints (same country only)...')

  // Get country for start and end points (with caching)
  const [startCountry, endCountry] = await Promise.all([
    getCachedCountryCode(start.latitude, start.longitude),
    getCachedCountryCode(end.latitude, end.longitude)
  ])

  if (startCountry === 'unknown' || endCountry === 'unknown') {
    console.log('⚠️ Could not determine country, skipping border check')
    return []
  }

  if (startCountry !== endCountry) {
    console.log(`⚠️ Start (${startCountry}) and end (${endCountry}) in different countries, cannot create scenic route`)
    return []
  }

  console.log(`   📍 Route within: ${startCountry}`)

  // Calculate search area (bounding box with buffer)
  const buffer = 1.0 // degrees (~100km) - larger buffer for better coverage
  const minLat = Math.min(start.latitude, end.latitude) - buffer
  const maxLat = Math.max(start.latitude, end.latitude) + buffer
  const minLon = Math.min(start.longitude, end.longitude) - buffer
  const maxLon = Math.max(start.longitude, end.longitude) + buffer

  // Query for scenic towns/cities (not just random features)
  const scenicTowns = await queryScenicTowns(minLat, maxLat, minLon, maxLon, startCountry)

  if (scenicTowns.length === 0) {
    console.log('⚠️ No scenic towns found, using geometric waypoint')
    return []
  }

  // Calculate direct route distance
  const directDistance = calculateDistance(start, end)
  const maxDetourDistance = directDistance * (1 + maxDetourPercent / 100)

  // Find best scenic waypoint(s) that create a corridor
  const waypoints = selectBestScenicCorridor(
    start,
    end,
    scenicTowns,
    maxDetourDistance,
    startCountry
  )

  console.log(`✅ Found ${waypoints.length} scenic waypoints:`, waypoints.map(w => w.name))
  return waypoints.map(w => ({ latitude: w.coordinates.lat, longitude: w.coordinates.lng }))
}

/**
 * Get country code for coordinates using Overpass API
 * SCALABLE: Works for ALL countries worldwide using OSM data
 */
async function getCountryCode(lat: number, lng: number): Promise<string> {
  try {
    // Use Overpass API to find country boundary at this point
    // This is SCALABLE - works for all 195+ countries worldwide
    const query = `
      [out:json][timeout:5];
      is_in(${lat},${lng})->.a;
      area.a["ISO3166-1"]["admin_level"="2"];
      out tags;
    `

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`Overpass returned ${response.status}`)
      return 'unknown'
    }

    const data = await response.json()

    // Extract ISO3166-1 country code from first result
    if (data.elements && data.elements.length > 0) {
      const countryCode = data.elements[0].tags?.['ISO3166-1']
      if (countryCode) {
        console.log(`   📍 Overpass (${lat.toFixed(2)}, ${lng.toFixed(2)}) → ${countryCode}`)
        return countryCode.toUpperCase()
      }
    }

    console.warn(`No country found at (${lat.toFixed(2)}, ${lng.toFixed(2)})`)
    return 'unknown'
  } catch (error) {
    console.warn('Overpass geocoding failed:', error)
    return 'unknown'
  }
}

/**
 * Query Overpass API for scenic towns/cities (not just random features)
 * Focus on places that are known scenic destinations
 */
async function queryScenicTowns(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  countryCode: string
): Promise<ScenicFeature[]> {
  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`

  // Query for towns/cities with tourism value
  const query = `
    [out:json][timeout:25];
    (
      // Towns and cities
      node["place"~"town|city"](${bbox});

      // Tourist destinations
      node["tourism"="attraction"]["name"](${bbox});

      // Ski resorts (important for mountain routes)
      node["sport"="skiing"]["name"](${bbox});
      way["sport"="skiing"]["name"](${bbox});

      // National parks (as waypoints)
      node["boundary"="national_park"]["name"](${bbox});
      way["boundary"="national_park"]["name"](${bbox});
    );
    out center;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!response.ok) {
      console.error('Overpass API error:', response.statusText)
      return []
    }

    const data = await response.json()

    // Filter and verify country (batch verification for performance)
    const towns: ScenicFeature[] = []
    const candidates: Array<{ el: any; lat: number; lng: number }> = []

    // First pass: collect candidates
    for (const el of data.elements) {
      if (!el.lat && !el.center?.lat) continue
      if (!el.tags?.name) continue

      const lat = el.lat || el.center?.lat
      const lng = el.lon || el.center?.lon

      candidates.push({ el, lat, lng })
    }

    // Second pass: verify countries in parallel (max 5 at a time to avoid rate limiting)
    const batchSize = 5
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async ({ el, lat, lng }) => {
          const townCountry = await getCachedCountryCode(lat, lng)
          return { el, lat, lng, townCountry }
        })
      )

      for (const { el, lat, lng, townCountry } of results) {
        if (townCountry !== countryCode) {
          console.log(`   ⚠️ Skipping ${el.tags.name} (different country: ${townCountry})`)
          continue
        }

        towns.push({
          type: categorizeTown(el.tags),
          name: el.tags.name,
          coordinates: { lat, lng },
          distance: 0
        })
      }
    }

    return towns
  } catch (error) {
    console.error('Overpass query failed:', error)
    return []
  }
}

/**
 * Categorize OSM town/place into scenic type
 */
function categorizeTown(tags: any): ScenicFeature['type'] {
  if (tags.sport === 'skiing') return 'mountain'
  if (tags.boundary === 'national_park') return 'national_park'
  if (tags.tourism === 'attraction') return 'viewpoint'
  if (tags.place === 'town' || tags.place === 'city') return 'viewpoint'
  return 'viewpoint'
}

/**
 * Select best scenic corridor (1-3 waypoints that create a scenic route)
 * Strategy: Find waypoints that are roughly evenly spaced along an alternative path
 */
function selectBestScenicCorridor(
  start: RouteCoordinate,
  end: RouteCoordinate,
  towns: ScenicFeature[],
  maxDistance: number,
  countryCode: string
): ScenicFeature[] {
  if (towns.length === 0) return []

  console.log(`   🔍 Evaluating ${towns.length} scenic towns...`)

  // Calculate perpendicular direction (for alternative route)
  const midpoint = {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2
  }

  const deltaLat = end.latitude - start.latitude
  const deltaLon = end.longitude - start.longitude

  // Find towns that are perpendicular to direct route (alternative corridor)
  const townsWithScore = towns.map(town => {
    const townCoord = { latitude: town.coordinates.lat, longitude: town.coordinates.lng }

    // Distance from start and end
    const distFromStart = calculateDistance(start, townCoord)
    const distFromEnd = calculateDistance(townCoord, end)
    const totalDist = distFromStart + distFromEnd

    // Distance from midpoint (prefer towns near middle of route)
    const distFromMid = calculateDistance(midpoint, townCoord)

    // Perpendicular score (how far off the direct route)
    const perpDist = distanceFromLine(start, end, townCoord)

    // Score: prefer towns that are:
    // 1. Off the direct route (perpendicular)
    // 2. Near the middle of the route
    // 3. Within reasonable detour distance
    let score = 0

    // Bonus for being perpendicular (alternative route)
    if (perpDist > 20 && perpDist < 150) score += 100

    // Bonus for being near middle
    if (distFromMid < 100) score += 50

    // Penalty for too much detour
    const directDist = calculateDistance(start, end)
    const detourPercent = ((totalDist - directDist) / directDist) * 100
    if (detourPercent > 50) score -= 100

    // Bonus for ski resorts and national parks
    if (town.type === 'mountain') score += 30
    if (town.type === 'national_park') score += 20

    return {
      ...town,
      score,
      distFromStart,
      distFromEnd,
      totalDist,
      perpDist
    }
  })

  // Sort by score
  const sorted = townsWithScore
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)

  if (sorted.length === 0) return []

  // Take top 1-2 waypoints
  const waypoints: ScenicFeature[] = []

  // Always take the best one
  waypoints.push(sorted[0])
  console.log(`   ✅ Selected: ${sorted[0].name} (score: ${sorted[0].score.toFixed(0)}, perp: ${sorted[0].perpDist.toFixed(0)}km)`)

  // Optionally take a second waypoint if it creates a good corridor
  if (sorted.length > 1) {
    const second = sorted[1]
    // Only add if it's in a different area (not too close to first)
    const distBetween = calculateDistance(
      { latitude: waypoints[0].coordinates.lat, longitude: waypoints[0].coordinates.lng },
      { latitude: second.coordinates.lat, longitude: second.coordinates.lng }
    )

    if (distBetween > 50 && second.score > 50) {
      waypoints.push(second)
      console.log(`   ✅ Selected: ${second.name} (score: ${second.score.toFixed(0)}, perp: ${second.perpDist.toFixed(0)}km)`)
    }
  }

  return waypoints
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
  point1: RouteCoordinate,
  point2: RouteCoordinate
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude)
  const dLon = toRad(point2.longitude - point1.longitude)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate perpendicular distance from point to line
 */
function distanceFromLine(
  lineStart: RouteCoordinate,
  lineEnd: RouteCoordinate,
  point: RouteCoordinate
): number {
  // Simplified: distance from point to midpoint of line
  const midpoint = {
    latitude: (lineStart.latitude + lineEnd.latitude) / 2,
    longitude: (lineStart.longitude + lineEnd.longitude) / 2
  }
  
  return calculateDistance(midpoint, point)
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find POI-rich waypoints for "longest" route
 * Routes through areas with high POI density
 * CRITICAL: Must stay within same country (no border crossings)
 */
export async function findPOIRichWaypoints(
  start: RouteCoordinate,
  end: RouteCoordinate,
  maxDetourPercent: number = 50
): Promise<RouteCoordinate[]> {
  console.log('🎯 Finding POI-rich waypoints (same country only)...')

  // Get country for start and end points (with caching)
  const [startCountry, endCountry] = await Promise.all([
    getCachedCountryCode(start.latitude, start.longitude),
    getCachedCountryCode(end.latitude, end.longitude)
  ])

  if (startCountry === 'unknown' || endCountry === 'unknown') {
    console.log('⚠️ Could not determine country, skipping border check')
    return []
  }

  if (startCountry !== endCountry) {
    console.log(`⚠️ Start (${startCountry}) and end (${endCountry}) in different countries, cannot create POI-rich route`)
    return []
  }

  console.log(`   📍 Route within: ${startCountry}`)

  // Sample points along perpendicular axis
  const midpoint = {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2
  }

  // Calculate perpendicular direction
  const deltaLat = end.latitude - start.latitude
  const deltaLon = end.longitude - start.longitude

  // Create sample points perpendicular to route
  const samplePoints: RouteCoordinate[] = []
  const offsets = [0.3, 0.5, 0.7] // Different detour amounts

  for (const offset of offsets) {
    samplePoints.push({
      latitude: midpoint.latitude + (-deltaLon * offset),
      longitude: midpoint.longitude + (deltaLat * offset)
    })
    samplePoints.push({
      latitude: midpoint.latitude - (-deltaLon * offset),
      longitude: midpoint.longitude - (deltaLat * offset)
    })
  }

  // Query POI density at each sample point (and verify country with caching)
  const densities = await Promise.all(
    samplePoints.map(async (point) => {
      // Verify this point is in the same country (cached)
      const pointCountry = await getCachedCountryCode(point.latitude, point.longitude)
      if (pointCountry !== startCountry) {
        console.log(`   ⚠️ Skipping sample point (different country: ${pointCountry})`)
        return { coordinates: point, poiCount: 0 }
      }

      const poiCount = await queryPOIDensity(point.latitude, point.longitude)
      return {
        coordinates: point,
        poiCount
      }
    })
  )

  // Select point with highest POI density
  const best = densities
    .filter(d => d.poiCount > 0)
    .sort((a, b) => b.poiCount - a.poiCount)[0]

  if (best && best.poiCount > 5) {
    console.log(`✅ Found POI-rich waypoint with ${best.poiCount} POIs`)
    return [best.coordinates]
  }

  console.log('⚠️ No POI-rich areas found, using geometric waypoint')
  return []
}

/**
 * Query POI density at a point using OpenTripMap
 */
async function queryPOIDensity(lat: number, lng: number): Promise<number> {
  try {
    const apiKey = process.env.OPENTRIPMAP_API_KEY
    if (!apiKey) return 0
    
    const radius = 10000 // 10km radius
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lng}&lat=${lat}&kinds=interesting_places,tourist_facilities,cultural,natural&limit=100&apikey=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) return 0
    
    const data = await response.json()
    return Array.isArray(data) ? data.length : 0
  } catch (error) {
    console.error('POI density query failed:', error)
    return 0
  }
}


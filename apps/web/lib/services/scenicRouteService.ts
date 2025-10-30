/**
 * Scenic Route Service
 * 
 * Generates scenic routes based on natural features and POI density
 * Uses Overpass API to find scenic waypoints (coastlines, mountains, viewpoints, etc.)
 */

import { RouteCoordinate } from './routingService'

export interface ScenicFeature {
  type: string
  name: string
  coordinates: { lat: number; lng: number }
  poiCount: number
  categories: string[]
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
 * Scenic route option with descriptive name and waypoints
 */
export interface ScenicRouteOption {
  id: string
  name: string
  description: string
  waypoints: RouteCoordinate[]
  tags: string[] // e.g., ['coastal', 'mountain', 'famous']
}

/**
 * Get multiple scenic route options for a given start/end
 *
 * STRATEGY: Return 2-4 different scenic route options with descriptive names
 * so users can choose which scenic corridor they prefer.
 *
 * Examples:
 * - Vancouver → Banff: "Sea-to-Sky Highway" vs "Fraser Canyon Route" vs "Okanagan Wine Country"
 * - SF → LA: "Pacific Coast Highway" vs "Inland Route via Yosemite"
 */
export async function getScenicRouteOptions(
  start: RouteCoordinate,
  end: RouteCoordinate,
  countryCode: string
): Promise<ScenicRouteOption[]> {
  console.log(`   🎯 Finding scenic route options...`)
  console.log(`   📍 Start: (${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)})`)
  console.log(`   📍 End: (${end.latitude.toFixed(4)}, ${end.longitude.toFixed(4)})`)
  console.log(`   🌍 Country: ${countryCode}`)

  // ALWAYS return 3 generic route options for ANY route
  // Let Valhalla's routing engine determine the actual scenic paths
  const options: ScenicRouteOption[] = [
    {
      id: 'most-scenic',
      name: 'Most Scenic',
      description: 'Prioritizes scenic roads and natural beauty',
      waypoints: [], // No forced waypoints - let routing engine decide
      tags: ['scenic', 'nature', 'recommended']
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Mix of scenic views and efficient travel',
      waypoints: [], // No forced waypoints
      tags: ['balanced', 'efficient', 'scenic']
    },
    {
      id: 'fastest',
      name: 'Fastest',
      description: 'Quickest route with minimal detours',
      waypoints: [], // No forced waypoints
      tags: ['fast', 'direct', 'highways']
    }
  ]

  console.log(`   ✅ Returning ${options.length} route options for any route`)
  return options
}

/**
 * Find the first scenic attraction/city after the tour start
 *
 * DEPRECATED: Use getScenicRouteOptions() instead for better UX
 *
 * STRATEGY: Force the route to go through a major attraction or city early in the journey
 * This guides Valhalla to take scenic corridors from the start
 *
 * NEW APPROACH: Use Nominatim reverse geocoding to find nearby cities/towns
 * This is more reliable than Overpass API and has better rate limits
 *
 * Priority:
 * 1. Well-known cities/towns (Whistler, Squamish, etc.)
 * 2. Tourist attractions
 * 3. Viewpoints
 * 4. National parks
 */
export async function findFirstScenicWaypoint(
  start: RouteCoordinate,
  end: RouteCoordinate,
  countryCode: string
): Promise<RouteCoordinate | null> {
  console.log(`   🎯 Finding scenic waypoint options...`)
  console.log(`   📍 Start: (${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)})`)
  console.log(`   📍 End: (${end.latitude.toFixed(4)}, ${end.longitude.toFixed(4)})`)
  console.log(`   🌍 Country: ${countryCode}`)

  // For now, return null to use alternatives-based routing
  // The UI will handle showing multiple route options
  return null

  // Calculate search area: 20-40% of the way from start to end
  const midLat = start.latitude + (end.latitude - start.latitude) * 0.3
  const midLng = start.longitude + (end.longitude - start.longitude) * 0.3

  console.log(`   📍 Searching for cities/towns around (${midLat.toFixed(2)}, ${midLng.toFixed(2)})`)

  // STRATEGY: Try well-known scenic cities
  const scenicCities = [
    { name: 'Kamloops', lat: 50.6745, lon: -120.3273, country: 'CA' },
    { name: 'Revelstoke', lat: 50.9981, lon: -118.1957, country: 'CA' },
    { name: 'Golden', lat: 51.2969, lon: -116.9631, country: 'CA' },
    { name: 'Lake Louise', lat: 51.4254, lon: -116.1773, country: 'CA' },
  ]

  // Find the closest scenic city to the mid-point
  let closestCity = null
  let minDistance = Infinity

  for (const city of scenicCities) {
    if (city.country !== countryCode) continue

    const distance = Math.sqrt(
      Math.pow(city.lat - midLat, 2) + Math.pow(city.lon - midLng, 2)
    )

    if (distance < minDistance && distance < 2.0) { // Within ~200km
      minDistance = distance
      closestCity = city
    }
  }

  if (closestCity) {
    console.log(`   ✅ Found first scenic waypoint: ${closestCity.name} (well-known scenic city)`)
    console.log(`   📍 Waypoint coordinates: (${closestCity.lat.toFixed(4)}, ${closestCity.lon.toFixed(4)})`)

    return {
      latitude: closestCity.lat,
      longitude: closestCity.lon
    }
  }

  console.log(`   ⚠️ No well-known scenic city found in search area`)
  return null
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Find scenic waypoints between two points
 * NEW STRATEGY: Sample points along the route and find scenic POIs nearby
 * CRITICAL: Must stay within same country (no border crossings)
 */
export async function findScenicWaypoints(
  start: RouteCoordinate,
  end: RouteCoordinate,
  maxDetourPercent: number = 30
): Promise<RouteCoordinate[]> {
  console.log('🏞️ Finding scenic waypoints along route (same country only)...')

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

  // NEW APPROACH: Sample points along the direct route
  // This is more reliable than bounding box queries
  const samplePoints = generateRoutePoints(start, end, 5) // 5 sample points along route
  console.log(`   📍 Sampling ${samplePoints.length} points along route...`)

  // Find scenic POIs near each sample point
  const allPOIs: ScenicFeature[] = []

  for (const point of samplePoints) {
    const pois = await findScenicPOIsNearPoint(point.latitude, point.longitude, startCountry, 20) // 20km radius
    allPOIs.push(...pois)
  }

  if (allPOIs.length === 0) {
    console.log('⚠️ No scenic POIs found along route')
    return []
  }

  console.log(`   ✅ Found ${allPOIs.length} scenic POIs along route`)

  // Select best waypoints from POIs
  const waypoints = selectBestScenicWaypoints(start, end, allPOIs, 3) // Max 3 waypoints

  if (waypoints.length === 0) {
    console.log('⚠️ No suitable waypoints selected')
    return []
  }

  console.log(`✅ Selected ${waypoints.length} scenic waypoints:`, waypoints.map(w => w.name))
  return waypoints.map(w => ({ latitude: w.coordinates.lat, longitude: w.coordinates.lng }))
}

/**
 * Generate sample points along a route
 */
function generateRoutePoints(
  start: RouteCoordinate,
  end: RouteCoordinate,
  numPoints: number
): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = []

  for (let i = 1; i < numPoints + 1; i++) {
    const fraction = i / (numPoints + 1)
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude: start.longitude + (end.longitude - start.longitude) * fraction
    })
  }

  return points
}

/**
 * Find scenic POIs near a specific point
 */
async function findScenicPOIsNearPoint(
  lat: number,
  lng: number,
  countryCode: string,
  radiusKm: number = 20
): Promise<ScenicFeature[]> {
  // Convert radius to degrees (rough approximation: 1 degree ≈ 111km)
  const radiusDeg = radiusKm / 111

  const query = `
    [out:json][timeout:10];
    (
      // Towns and cities
      node["place"~"town|city"]["name"](around:${radiusKm * 1000},${lat},${lng});

      // Tourist attractions
      node["tourism"="attraction"]["name"](around:${radiusKm * 1000},${lat},${lng});

      // Viewpoints
      node["tourism"="viewpoint"]["name"](around:${radiusKm * 1000},${lat},${lng});

      // National parks
      node["boundary"="national_park"]["name"](around:${radiusKm * 1000},${lat},${lng});
      way["boundary"="national_park"]["name"](around:${radiusKm * 1000},${lat},${lng});

      // Ski resorts
      node["sport"="skiing"]["name"](around:${radiusKm * 1000},${lat},${lng});
      way["sport"="skiing"]["name"](around:${radiusKm * 1000},${lat},${lng});

      // Lakes
      node["natural"="water"]["name"](around:${radiusKm * 1000},${lat},${lng});
      way["natural"="water"]["name"](around:${radiusKm * 1000},${lat},${lng});
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
      console.error(`   ⚠️ Overpass API error at (${lat.toFixed(2)}, ${lng.toFixed(2)}):`, response.statusText)
      return []
    }

    const data = await response.json()
    const pois: ScenicFeature[] = []

    for (const el of data.elements) {
      if (!el.lat && !el.center?.lat) continue
      if (!el.tags?.name) continue

      const poiLat = el.lat || el.center.lat
      const poiLng = el.lon || el.center.lon

      // Verify country (with caching)
      const poiCountry = await getCachedCountryCode(poiLat, poiLng)
      if (poiCountry !== countryCode) {
        console.log(`   ⚠️ Skipping ${el.tags.name} (different country: ${poiCountry})`)
        continue
      }

      pois.push({
        name: el.tags.name,
        type: categorizePOI(el.tags),
        coordinates: { lat: poiLat, lng: poiLng },
        poiCount: 1,
        categories: [el.tags.tourism || el.tags.natural || el.tags.boundary || el.tags.sport || el.tags.place || 'other']
      })
    }

    if (pois.length > 0) {
      console.log(`   ✅ Found ${pois.length} POIs near (${lat.toFixed(2)}, ${lng.toFixed(2)}): ${pois.slice(0, 3).map(p => p.name).join(', ')}${pois.length > 3 ? '...' : ''}`)
    }

    return pois
  } catch (error) {
    console.error(`   ⚠️ Error finding POIs near (${lat.toFixed(2)}, ${lng.toFixed(2)}):`, error)
    return []
  }
}

/**
 * Categorize POI type
 */
function categorizePOI(tags: any): string {
  if (tags.place === 'city') return 'city'
  if (tags.place === 'town') return 'town'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.tourism === 'attraction') return 'attraction'
  if (tags.boundary === 'national_park') return 'national_park'
  if (tags.sport === 'skiing') return 'ski_resort'
  if (tags.natural === 'water') return 'lake'
  return 'other'
}

/**
 * Select best scenic waypoints from POIs
 */
function selectBestScenicWaypoints(
  start: RouteCoordinate,
  end: RouteCoordinate,
  pois: ScenicFeature[],
  maxWaypoints: number = 3
): ScenicFeature[] {
  if (pois.length === 0) return []

  // Score each POI based on:
  // 1. Type (national parks, viewpoints, ski resorts > towns > other)
  // 2. Distance from direct route (prefer POIs along the route)
  // 3. Distribution (spread waypoints evenly)

  const scoredPOIs = pois.map(poi => {
    // Type score
    let typeScore = 0
    if (poi.type === 'national_park') typeScore = 10
    else if (poi.type === 'viewpoint') typeScore = 9
    else if (poi.type === 'ski_resort') typeScore = 8
    else if (poi.type === 'lake') typeScore = 7
    else if (poi.type === 'attraction') typeScore = 6
    else if (poi.type === 'town') typeScore = 5
    else if (poi.type === 'city') typeScore = 4

    // Distance from route (perpendicular distance)
    const distFromRoute = perpendicularDistance(
      { latitude: poi.coordinates.lat, longitude: poi.coordinates.lng },
      start,
      end
    )
    const routeScore = Math.max(0, 10 - distFromRoute / 10) // Closer = higher score

    return {
      poi,
      score: typeScore + routeScore,
      distFromStart: calculateDistance(start, { latitude: poi.coordinates.lat, longitude: poi.coordinates.lng })
    }
  })

  // Sort by score (highest first)
  scoredPOIs.sort((a, b) => b.score - a.score)

  // Select top waypoints, ensuring good distribution
  const selected: ScenicFeature[] = []
  const routeLength = calculateDistance(start, end)

  for (const item of scoredPOIs) {
    if (selected.length >= maxWaypoints) break

    // Check if this POI is well-distributed
    const segment = item.distFromStart / routeLength
    const tooClose = selected.some(s => {
      const sDist = calculateDistance(start, { latitude: s.coordinates.lat, longitude: s.coordinates.lng })
      const sSegment = sDist / routeLength
      return Math.abs(segment - sSegment) < 0.2 // At least 20% apart
    })

    if (!tooClose) {
      selected.push(item.poi)
    }
  }

  // Sort by distance from start (to maintain route order)
  selected.sort((a, b) => {
    const aDist = calculateDistance(start, { latitude: a.coordinates.lat, longitude: a.coordinates.lng })
    const bDist = calculateDistance(start, { latitude: b.coordinates.lat, longitude: b.coordinates.lng })
    return aDist - bDist
  })

  return selected
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: RouteCoordinate,
  lineStart: RouteCoordinate,
  lineEnd: RouteCoordinate
): number {
  const x0 = point.latitude
  const y0 = point.longitude
  const x1 = lineStart.latitude
  const y1 = lineStart.longitude
  const x2 = lineEnd.latitude
  const y2 = lineEnd.longitude

  const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
  const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)

  return (numerator / denominator) * 111 // Convert to km
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
          poiCount: 0,
          categories: []
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

/**
 * Score a route based on POI density along the route
 *
 * CRITICAL: The more scenic POIs along the route, the higher the score!
 *
 * Priority POI types (from user requirements):
 * - Well-known towns/cities (HIGH)
 * - Tourist attractions (HIGH)
 * - Viewpoints (HIGH)
 * - National parks (VERY HIGH)
 * - Ski resorts (HIGH)
 * - Lakes (MEDIUM)
 *
 * @param coordinates - Route coordinates (decoded from Valhalla response)
 * @param countryCode - Country code to ensure POIs are in same country
 * @returns Scenic score (higher = more scenic)
 */
export async function scoreRouteByPOIDensity(
  coordinates: Array<[number, number]>, // [lng, lat] format from Valhalla
  countryCode: string
): Promise<{
  score: number
  poiCount: number
  poiTypes: Record<string, number>
  topPOIs: string[]
}> {
  console.log(`   🎯 Scoring route by POI density (${coordinates.length} points)...`)

  // Sample points along the route (every 20km or so)
  const sampleInterval = Math.max(1, Math.floor(coordinates.length / 10)) // ~10 sample points
  const samplePoints: Array<{ latitude: number; longitude: number }> = []

  for (let i = 0; i < coordinates.length; i += sampleInterval) {
    const [lng, lat] = coordinates[i]
    samplePoints.push({ latitude: lat, longitude: lng })
  }

  console.log(`   📍 Sampling ${samplePoints.length} points along route...`)

  // Find POIs near each sample point
  const allPOIs: ScenicFeature[] = []
  const poiTypes: Record<string, number> = {
    national_park: 0,
    viewpoint: 0,
    ski_resort: 0,
    lake: 0,
    attraction: 0,
    town: 0,
    city: 0
  }

  for (const point of samplePoints) {
    const pois = await findScenicPOIsNearPoint(point.latitude, point.longitude, countryCode, 10) // 10km radius

    for (const poi of pois) {
      // Deduplicate POIs by name
      if (!allPOIs.some(p => p.name === poi.name)) {
        allPOIs.push(poi)
        poiTypes[poi.type] = (poiTypes[poi.type] || 0) + 1
      }
    }
  }

  console.log(`   ✅ Found ${allPOIs.length} unique POIs along route`)

  // Calculate scenic score based on POI types and count
  let score = 0

  // Type-based scoring (user priorities - UPDATED: attractions and towns/cities weighted HIGHER)
  score += poiTypes.national_park * 10  // VERY HIGH priority
  score += poiTypes.attraction * 9      // VERY HIGH priority (tourist attractions) ⬆️
  score += poiTypes.town * 8            // VERY HIGH priority (well-known towns) ⬆️
  score += poiTypes.city * 8            // VERY HIGH priority (well-known cities) ⬆️
  score += poiTypes.viewpoint * 7       // HIGH priority
  score += poiTypes.ski_resort * 6      // MEDIUM-HIGH priority
  score += poiTypes.lake * 5            // MEDIUM priority

  // Diversity bonus: +20% if route has 5+ different POI types
  const uniqueTypes = Object.values(poiTypes).filter(count => count > 0).length
  if (uniqueTypes >= 5) {
    score *= 1.2
    console.log(`   🎨 Diversity bonus! (${uniqueTypes} POI types)`)
  }

  // Get top POIs for logging
  const topPOIs = allPOIs
    .sort((a, b) => {
      const aScore = getTypeScore(a.type)
      const bScore = getTypeScore(b.type)
      return bScore - aScore
    })
    .slice(0, 5)
    .map(p => `${p.name} (${p.type})`)

  console.log(`   📊 Route score: ${score.toFixed(0)} (${allPOIs.length} POIs)`)
  if (topPOIs.length > 0) {
    console.log(`   🏆 Top POIs: ${topPOIs.join(', ')}`)
  }

  return {
    score,
    poiCount: allPOIs.length,
    poiTypes,
    topPOIs
  }
}

/**
 * Get type score for sorting (UPDATED: attractions and towns/cities weighted HIGHER)
 */
function getTypeScore(type: string): number {
  switch (type) {
    case 'national_park': return 10
    case 'attraction': return 9      // ⬆️ Tourist attractions
    case 'town': return 8             // ⬆️ Well-known towns
    case 'city': return 8             // ⬆️ Well-known cities
    case 'viewpoint': return 7
    case 'ski_resort': return 6
    case 'lake': return 5
    default: return 0
  }
}


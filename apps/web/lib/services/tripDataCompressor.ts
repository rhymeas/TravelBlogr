/**
 * Trip Data Compressor
 * 
 * Intelligently compresses comprehensive trip data to:
 * 1. Fit within GROQ API token limits (8,000 tokens)
 * 2. Reduce database storage size
 * 3. Speed up API responses
 * 4. Improve browser performance
 * 
 * Strategy:
 * - Keep only essential fields
 * - Summarize long descriptions
 * - Limit array sizes to top N items
 * - Remove redundant data
 * - Use references instead of full objects
 */

import type { ComprehensiveTripData } from './comprehensiveTripDataService'

export interface CompressedTripData {
  route: {
    from: string
    to: string
    distanceKm: number
    durationHours: number
    // Simplified geometry - sample every Nth point
    geometrySampled: number[][]
  }
  
  // Top POIs only (max 20)
  topPOIs: Array<{
    name: string
    category: string
    lat: number
    lng: number
    rating?: number
  }>
  
  // Major locations only (max 10)
  majorLocations: Array<{
    name: string
    slug: string
    lat: number
    lng: number
    population?: number
  }>
  
  // Top activities (max 15)
  topActivities: Array<{
    name: string
    location: string
    category?: string
    duration?: number
  }>
  
  // Top restaurants (max 15)
  topRestaurants: Array<{
    name: string
    location: string
    cuisine?: string
    priceRange?: string
  }>
  
  // Summarized facts (max 5, truncated to 150 chars each)
  facts: string[]
  
  // Metadata
  meta: {
    originalPOICount: number
    originalActivityCount: number
    originalRestaurantCount: number
    compressionRatio: number
  }
}

/**
 * Compress comprehensive trip data for AI processing
 */
export function compressTripDataForAI(data: ComprehensiveTripData): CompressedTripData {
  console.log('🗜️ Compressing trip data for AI...')
  
  // 1. Simplify route geometry - sample every 10th point
  const geometrySampled = data.route.geometry.filter((_, i) => i % 10 === 0)
  
  // 2. Extract and rank POIs
  const allPOIs = [
    ...data.pois.openTripMap.map(poi => ({
      name: poi.properties?.name || 'Unnamed',
      category: poi.properties?.kinds?.split(',')[0] || 'unknown',
      lat: poi.geometry.coordinates[1],
      lng: poi.geometry.coordinates[0],
      rating: poi.properties?.rate || 0
    })),
    ...data.pois.database.map(loc => ({
      name: loc.name,
      category: 'location',
      lat: loc.latitude,
      lng: loc.longitude,
      rating: loc.rating || 0
    }))
  ]
  
  // Sort by rating and take top 20
  const topPOIs = allPOIs
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 20)
  
  // 3. Major locations only (population > 50k or top 10)
  const majorLocations = data.locations.database
    .filter(loc => loc.population > 50000 || data.locations.major.includes(loc))
    .slice(0, 10)
    .map(loc => ({
      name: loc.name,
      slug: loc.slug,
      lat: loc.latitude,
      lng: loc.longitude,
      population: loc.population
    }))
  
  // 4. Top activities (max 15)
  const topActivities = data.activities
    .slice(0, 15)
    .map(activity => ({
      name: activity.name || activity.title,
      location: activity.location_slug,
      category: activity.category,
      duration: activity.duration
    }))
  
  // 5. Top restaurants (max 15)
  const topRestaurants = data.restaurants
    .slice(0, 15)
    .map(restaurant => ({
      name: restaurant.name,
      location: restaurant.location_slug,
      cuisine: restaurant.cuisine,
      priceRange: restaurant.price_range
    }))
  
  // 6. Summarize facts (max 5, truncate to 150 chars)
  const facts = data.facts
    .slice(0, 5)
    .map(fact => fact.length > 150 ? fact.substring(0, 147) + '...' : fact)
  
  // 7. Calculate compression ratio
  const originalSize = JSON.stringify(data).length
  const compressedData: CompressedTripData = {
    route: {
      from: data.route.from,
      to: data.route.to,
      distanceKm: data.route.distanceKm,
      durationHours: data.route.durationHours,
      geometrySampled
    },
    topPOIs,
    majorLocations,
    topActivities,
    topRestaurants,
    facts,
    meta: {
      originalPOICount: allPOIs.length,
      originalActivityCount: data.activities.length,
      originalRestaurantCount: data.restaurants.length,
      compressionRatio: 0 // Will calculate below
    }
  }
  
  const compressedSize = JSON.stringify(compressedData).length
  compressedData.meta.compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)
  
  console.log(`✅ Compressed: ${originalSize} → ${compressedSize} bytes (${compressedData.meta.compressionRatio}% reduction)`)
  console.log(`   POIs: ${allPOIs.length} → ${topPOIs.length}`)
  console.log(`   Locations: ${data.locations.database.length} → ${majorLocations.length}`)
  console.log(`   Activities: ${data.activities.length} → ${topActivities.length}`)
  console.log(`   Restaurants: ${data.restaurants.length} → ${topRestaurants.length}`)
  console.log(`   Route points: ${data.route.geometry.length} → ${geometrySampled.length}`)
  
  return compressedData
}

/**
 * Format compressed data for GROQ AI prompt
 */
export function formatCompressedDataForAI(
  compressed: CompressedTripData,
  transportMode: string,
  totalDays: number,
  interests: string[]
): string {
  return `
TRIP PLANNING DATA (Compressed & Optimized):

ROUTE INFORMATION:
- From: ${compressed.route.from}
- To: ${compressed.route.to}
- Distance: ${compressed.route.distanceKm} km
- Duration: ${compressed.route.durationHours} hours
- Transport: ${transportMode}
- Days: ${totalDays}
- Interests: ${interests.join(', ')}

MAJOR LOCATIONS ALONG ROUTE (${compressed.majorLocations.length}):
${compressed.majorLocations.map(loc => 
  `- ${loc.name} (pop: ${loc.population?.toLocaleString() || 'unknown'})`
).join('\n')}

TOP POINTS OF INTEREST (${compressed.topPOIs.length} of ${compressed.meta.originalPOICount}):
${compressed.topPOIs.slice(0, 10).map(poi => 
  `- ${poi.name} (${poi.category}${poi.rating ? `, rating: ${poi.rating}` : ''})`
).join('\n')}

TOP ACTIVITIES (${compressed.topActivities.length} of ${compressed.meta.originalActivityCount}):
${compressed.topActivities.slice(0, 8).map(activity => 
  `- ${activity.name} in ${activity.location}${activity.category ? ` (${activity.category})` : ''}`
).join('\n')}

TOP RESTAURANTS (${compressed.topRestaurants.length} of ${compressed.meta.originalRestaurantCount}):
${compressed.topRestaurants.slice(0, 8).map(restaurant => 
  `- ${restaurant.name} in ${restaurant.location}${restaurant.cuisine ? ` (${restaurant.cuisine})` : ''}`
).join('\n')}

INTERESTING FACTS:
${compressed.facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

---

Use this data to create a realistic ${totalDays}-day ${transportMode} trip plan with:
1. Overnight stops at major locations (type: "stay")
2. Daily highlights from the POIs and activities listed above
3. Meal breaks at the restaurants listed above
4. Realistic travel times based on ${transportMode} speed
5. "Did you know?" facts for each location from the facts above

IMPORTANT: Only suggest places from the data above - do not hallucinate new locations!
`.trim()
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if data fits within GROQ token limit
 */
export function fitsWithinTokenLimit(text: string, maxTokens: number = 6000): boolean {
  const tokens = estimateTokenCount(text)
  console.log(`📊 Estimated tokens: ${tokens} / ${maxTokens}`)
  return tokens <= maxTokens
}

/**
 * Compress data for database storage (even more aggressive)
 */
export function compressTripDataForStorage(data: ComprehensiveTripData): any {
  // For database, we only store references and IDs, not full objects
  return {
    route: {
      from: data.route.from,
      to: data.route.to,
      distanceKm: Math.round(data.route.distanceKm),
      durationHours: Math.round(data.route.durationHours * 10) / 10
      // Don't store geometry in database
    },
    poiCount: data.pois.total,
    locationSlugs: data.locations.database.slice(0, 10).map(l => l.slug),
    activityCount: data.activities.length,
    restaurantCount: data.restaurants.length,
    facts: data.facts.slice(0, 3).map(f => f.substring(0, 100))
  }
}


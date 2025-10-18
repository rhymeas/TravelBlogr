/**
 * POI Enrichment Service
 * Adds visit duration and micro-experience categories to POIs
 */

export type MicroExperienceType = 
  | 'quick-stop'      // < 30 min (viewpoint, photo op)
  | 'coffee-break'    // 30-60 min (cafe, quick meal)
  | 'meal-break'      // 1-2 hours (restaurant, lunch)
  | 'short-visit'     // 2-3 hours (small museum, park)
  | 'half-day'        // 3-5 hours (major attraction)
  | 'full-day'        // 5+ hours (theme park, hiking)

export interface EnrichedPOI {
  visitDurationMinutes: number
  microExperience: MicroExperienceType
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
}

/**
 * Estimate visit duration based on POI category
 */
export function estimateVisitDuration(
  category: string,
  kinds: string = '',
  rating: number = 0
): number {
  const cat = category.toLowerCase()
  const k = kinds.toLowerCase()

  // Restaurants & Food
  if (cat.includes('food') || cat.includes('restaurant') || k.includes('restaurant')) {
    if (k.includes('fast_food') || k.includes('cafe')) return 30
    if (k.includes('fine_dining')) return 120
    return 60 // Regular restaurant
  }

  // Museums & Culture
  if (cat.includes('museum') || k.includes('museum')) {
    if (rating >= 4.5) return 180 // Major museum
    return 120 // Regular museum
  }

  // Nature & Parks
  if (cat.includes('natural') || cat.includes('park') || k.includes('park')) {
    if (k.includes('national_park')) return 240
    if (k.includes('viewpoint') || k.includes('lookout')) return 15
    return 90 // Regular park
  }

  // Religious sites
  if (cat.includes('religion') || k.includes('church') || k.includes('temple')) {
    return 45
  }

  // Shopping
  if (cat.includes('shop') || k.includes('shop')) {
    return 60
  }

  // Entertainment
  if (k.includes('theme_park') || k.includes('zoo')) {
    return 300 // 5 hours
  }

  // Historic sites
  if (cat.includes('historic') || k.includes('castle') || k.includes('monument')) {
    if (rating >= 4.5) return 120
    return 60
  }

  // Default
  return 45
}

/**
 * Classify POI into micro-experience category
 */
export function classifyMicroExperience(
  visitDurationMinutes: number
): MicroExperienceType {
  if (visitDurationMinutes < 30) return 'quick-stop'
  if (visitDurationMinutes < 60) return 'coffee-break'
  if (visitDurationMinutes < 120) return 'meal-break'
  if (visitDurationMinutes < 180) return 'short-visit'
  if (visitDurationMinutes < 300) return 'half-day'
  return 'full-day'
}

/**
 * Suggest best time of day for POI
 */
export function suggestBestTimeOfDay(
  category: string,
  kinds: string = ''
): 'morning' | 'afternoon' | 'evening' | 'anytime' {
  const cat = category.toLowerCase()
  const k = kinds.toLowerCase()

  // Breakfast/coffee
  if (k.includes('cafe') || k.includes('breakfast')) return 'morning'

  // Lunch
  if (k.includes('lunch')) return 'afternoon'

  // Dinner/bars
  if (k.includes('bar') || k.includes('nightlife') || k.includes('dinner')) return 'evening'

  // Museums (better in morning, less crowded)
  if (cat.includes('museum')) return 'morning'

  // Viewpoints (sunset)
  if (k.includes('viewpoint') || k.includes('lookout')) return 'evening'

  // Parks (morning or afternoon)
  if (cat.includes('park') || cat.includes('natural')) return 'morning'

  return 'anytime'
}

/**
 * Enrich single POI with all metadata
 */
export function enrichPOI(poi: {
  category: string
  kinds?: string
  rating?: number
}): EnrichedPOI {
  const duration = estimateVisitDuration(
    poi.category,
    poi.kinds || '',
    poi.rating || 0
  )

  return {
    visitDurationMinutes: duration,
    microExperience: classifyMicroExperience(duration),
    bestTimeOfDay: suggestBestTimeOfDay(poi.category, poi.kinds || '')
  }
}

/**
 * Enrich multiple POIs
 */
export function enrichPOIs<T extends { category: string; kinds?: string; rating?: number }>(
  pois: T[]
): Array<T & EnrichedPOI> {
  return pois.map(poi => ({
    ...poi,
    ...enrichPOI(poi)
  }))
}

/**
 * Filter POIs by micro-experience type
 */
export function filterByMicroExperience<T extends { microExperience?: MicroExperienceType }>(
  pois: T[],
  types: MicroExperienceType[]
): T[] {
  return pois.filter(poi => 
    poi.microExperience && types.includes(poi.microExperience)
  )
}

/**
 * Get POIs suitable for a time budget
 */
export function getPOIsForTimeBudget<T extends { visitDurationMinutes?: number }>(
  pois: T[],
  availableMinutes: number
): T[] {
  return pois.filter(poi => 
    poi.visitDurationMinutes && poi.visitDurationMinutes <= availableMinutes
  )
}


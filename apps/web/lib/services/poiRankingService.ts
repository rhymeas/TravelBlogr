/**
 * POI Ranking Service
 * Ranks POIs based on user interests, ratings, and detour time
 */

export interface RankingFactors {
  interestMatch: number // 0-1
  rating: number // 0-1
  detourEfficiency: number // 0-1
  timeEfficiency: number // 0-1
}

export interface RankedPOI {
  score: number // 0-100
  rankingFactors: RankingFactors
}

/**
 * Calculate interest match score
 */
export function calculateInterestMatch(
  poiKinds: string,
  poiCategory: string,
  userInterests: string[]
): number {
  if (userInterests.length === 0) return 0.5 // Neutral if no interests

  const kinds = poiKinds.toLowerCase().split(',')
  const category = poiCategory.toLowerCase()
  
  let matches = 0
  
  for (const interest of userInterests) {
    const int = interest.toLowerCase()
    
    // Direct category match
    if (category.includes(int)) {
      matches += 2
      continue
    }
    
    // Kinds match
    if (kinds.some(k => k.includes(int))) {
      matches += 1
      continue
    }
    
    // Semantic matches
    const semanticMatches: Record<string, string[]> = {
      'food': ['restaurant', 'cafe', 'cuisine', 'dining', 'bakery'],
      'culture': ['museum', 'art', 'gallery', 'theater', 'historic', 'monument'],
      'nature': ['park', 'natural', 'garden', 'forest', 'mountain', 'lake', 'beach'],
      'history': ['historic', 'castle', 'monument', 'archaeological', 'heritage'],
      'art': ['museum', 'gallery', 'art', 'sculpture', 'painting'],
      'adventure': ['hiking', 'climbing', 'sports', 'outdoor', 'activity'],
      'shopping': ['shop', 'market', 'mall', 'boutique'],
      'nightlife': ['bar', 'club', 'nightlife', 'entertainment']
    }
    
    const semanticKeywords = semanticMatches[int] || []
    if (kinds.some(k => semanticKeywords.some(sk => k.includes(sk)))) {
      matches += 1
    }
  }
  
  // Normalize to 0-1
  const maxPossibleMatches = userInterests.length * 2
  return Math.min(matches / maxPossibleMatches, 1)
}

/**
 * Calculate rating score (normalized)
 */
export function calculateRatingScore(rating: number = 0): number {
  return rating / 5 // Normalize 0-5 to 0-1
}

/**
 * Calculate detour efficiency (shorter detour = higher score)
 */
export function calculateDetourEfficiency(detourMinutes: number = 0): number {
  if (detourMinutes === 0) return 1
  if (detourMinutes >= 30) return 0
  
  // Linear decay: 0 min = 1.0, 30 min = 0.0
  return 1 - (detourMinutes / 30)
}

/**
 * Calculate time efficiency (visit duration vs detour time)
 */
export function calculateTimeEfficiency(
  visitDurationMinutes: number = 60,
  detourMinutes: number = 0
): number {
  if (detourMinutes === 0) return 1
  
  const ratio = visitDurationMinutes / detourMinutes
  
  // Good ratio: 60 min visit / 5 min detour = 12
  // Bad ratio: 30 min visit / 20 min detour = 1.5
  
  if (ratio >= 10) return 1 // Excellent
  if (ratio >= 5) return 0.8 // Good
  if (ratio >= 3) return 0.6 // Okay
  if (ratio >= 2) return 0.4 // Marginal
  return 0.2 // Poor
}

/**
 * Calculate overall POI score
 */
export function calculatePOIScore(
  poi: {
    kinds?: string
    category: string
    rating?: number
    detourTimeMinutes?: number
    visitDurationMinutes?: number
  },
  userInterests: string[],
  weights: {
    interest: number
    rating: number
    detour: number
    time: number
  } = {
    interest: 0.4,
    rating: 0.3,
    detour: 0.2,
    time: 0.1
  }
): { score: number; factors: RankingFactors } {
  const interestMatch = calculateInterestMatch(
    poi.kinds || '',
    poi.category,
    userInterests
  )
  
  const ratingScore = calculateRatingScore(poi.rating)
  
  const detourEfficiency = calculateDetourEfficiency(poi.detourTimeMinutes)
  
  const timeEfficiency = calculateTimeEfficiency(
    poi.visitDurationMinutes,
    poi.detourTimeMinutes
  )
  
  // Weighted score
  const score = (
    interestMatch * weights.interest +
    ratingScore * weights.rating +
    detourEfficiency * weights.detour +
    timeEfficiency * weights.time
  ) * 100 // Scale to 0-100
  
  return {
    score: Math.round(score),
    factors: {
      interestMatch,
      rating: ratingScore,
      detourEfficiency,
      timeEfficiency
    }
  }
}

/**
 * Rank multiple POIs
 */
export function rankPOIs<T extends {
  kinds?: string
  category: string
  rating?: number
  detourTimeMinutes?: number
  visitDurationMinutes?: number
}>(
  pois: T[],
  userInterests: string[]
): Array<T & RankedPOI> {
  return pois
    .map(poi => {
      const { score, factors } = calculatePOIScore(poi, userInterests)
      return {
        ...poi,
        score,
        rankingFactors: factors
      }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Get top N ranked POIs
 */
export function getTopRankedPOIs<T extends {
  kinds?: string
  category: string
  rating?: number
  detourTimeMinutes?: number
  visitDurationMinutes?: number
}>(
  pois: T[],
  userInterests: string[],
  limit: number = 10
): Array<T & RankedPOI> {
  return rankPOIs(pois, userInterests).slice(0, limit)
}

/**
 * Filter POIs by minimum score
 */
export function filterByMinScore<T extends { score?: number }>(
  pois: T[],
  minScore: number = 50
): T[] {
  return pois.filter(poi => (poi.score || 0) >= minScore)
}


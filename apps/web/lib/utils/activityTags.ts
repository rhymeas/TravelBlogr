/**
 * Activity Tag Generation
 * Automatically generates tags (difficulty, duration, cost) from activity data
 */

export interface ActivityTagsInput {
  category?: string
  name?: string
  description?: string
  price_info?: string
  duration?: string
  opening_hours?: any
}

export interface ActivityTags {
  difficulty?: 'easy' | 'moderate' | 'hard'
  duration?: string
  cost?: 'free' | 'low' | 'medium' | 'high'
}

/**
 * Generate difficulty tag based on activity type and name
 */
function generateDifficulty(input: ActivityTagsInput): 'easy' | 'moderate' | 'hard' | undefined {
  const { category, name, description } = input
  const text = `${name} ${description}`.toLowerCase()

  // Hard activities
  if (
    text.includes('climb') ||
    text.includes('mountain') ||
    text.includes('trek') ||
    text.includes('hike') ||
    text.includes('expedition') ||
    text.includes('extreme') ||
    category === 'adventure'
  ) {
    return 'hard'
  }

  // Moderate activities
  if (
    text.includes('walk') ||
    text.includes('tour') ||
    text.includes('bike') ||
    text.includes('kayak') ||
    text.includes('surf') ||
    category === 'outdoor'
  ) {
    return 'moderate'
  }

  // Easy activities (museums, viewpoints, etc.)
  if (
    category === 'museum' ||
    category === 'viewpoint' ||
    category === 'attraction' ||
    category === 'park' ||
    text.includes('museum') ||
    text.includes('gallery') ||
    text.includes('viewpoint')
  ) {
    return 'easy'
  }

  return 'easy' // Default to easy
}

/**
 * Generate duration tag from opening hours or activity type
 */
function generateDuration(input: ActivityTagsInput): string {
  const { duration, category, opening_hours, name } = input

  // If duration is already provided, use it
  if (duration) {
    return duration
  }

  const text = name?.toLowerCase() || ''

  // Specific durations based on activity type
  if (category === 'museum') return '2-3 hours'
  if (category === 'viewpoint') return '30 min'
  if (category === 'park') return '1-2 hours'
  if (category === 'attraction') return '1-2 hours'

  // Check name for hints
  if (text.includes('tour')) return '2-3 hours'
  if (text.includes('walk')) return '1-2 hours'
  if (text.includes('hike')) return '3-4 hours'
  if (text.includes('trek')) return 'Full day'

  return 'Varies' // Default
}

/**
 * Generate cost tag from price info or activity type
 */
function generateCost(input: ActivityTagsInput): 'free' | 'low' | 'medium' | 'high' {
  const { price_info, category, name } = input

  // Parse price_info if available
  if (price_info) {
    const priceText = price_info.toLowerCase()
    
    if (priceText.includes('free') || priceText === '0' || priceText === 'free') {
      return 'free'
    }
    
    // Try to extract numbers
    const match = priceText.match(/\d+/)
    if (match) {
      const amount = parseInt(match[0])
      if (amount === 0) return 'free'
      if (amount < 10) return 'low'
      if (amount < 30) return 'medium'
      return 'high'
    }
  }

  const text = `${name} ${category}`.toLowerCase()

  // Free activities
  if (
    category === 'viewpoint' ||
    category === 'park' ||
    text.includes('free') ||
    text.includes('viewpoint') ||
    text.includes('park') ||
    text.includes('square') ||
    text.includes('plaza')
  ) {
    return 'free'
  }

  // Low cost
  if (
    category === 'attraction' ||
    text.includes('market') ||
    text.includes('street')
  ) {
    return 'low'
  }

  // Medium cost (museums, tours)
  if (
    category === 'museum' ||
    text.includes('museum') ||
    text.includes('gallery') ||
    text.includes('tour')
  ) {
    return 'medium'
  }

  // Default to low
  return 'low'
}

/**
 * Generate all tags for an activity
 */
export function generateActivityTags(input: ActivityTagsInput): ActivityTags {
  return {
    difficulty: generateDifficulty(input),
    duration: generateDuration(input),
    cost: generateCost(input)
  }
}

/**
 * Map category from OpenStreetMap to our category types
 */
export function mapActivityCategory(osmCategory?: string): 'outdoor' | 'cultural' | 'food' | 'adventure' | 'relaxation' {
  if (!osmCategory) return 'cultural'

  const category = osmCategory.toLowerCase()

  // Outdoor
  if (
    category.includes('park') ||
    category.includes('viewpoint') ||
    category.includes('nature') ||
    category.includes('beach') ||
    category.includes('mountain')
  ) {
    return 'outdoor'
  }

  // Cultural
  if (
    category.includes('museum') ||
    category.includes('gallery') ||
    category.includes('monument') ||
    category.includes('attraction') ||
    category.includes('historic')
  ) {
    return 'cultural'
  }

  // Food
  if (
    category.includes('food') ||
    category.includes('market') ||
    category.includes('restaurant')
  ) {
    return 'food'
  }

  // Adventure
  if (
    category.includes('sport') ||
    category.includes('climb') ||
    category.includes('dive') ||
    category.includes('adventure')
  ) {
    return 'adventure'
  }

  // Relaxation
  if (
    category.includes('spa') ||
    category.includes('wellness') ||
    category.includes('beach') ||
    category.includes('garden')
  ) {
    return 'relaxation'
  }

  return 'cultural' // Default
}


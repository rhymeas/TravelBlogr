/**
 * Image Quality Scorer
 * 
 * Automatically scores and ranks images based on quality indicators:
 * - Resolution (higher is better)
 * - Aspect ratio (16:9 preferred for cards)
 * - Source reputation (official sites ranked higher)
 * - Title relevance (matches activity name)
 * 
 * Used to auto-select the best image from Brave API results
 */

export interface ScoredImage {
  url: string
  thumbnail: string
  title: string
  source: string
  width: number
  height: number
  score: number
  scoreBreakdown: {
    resolution: number
    aspectRatio: number
    sourceReputation: number
    titleRelevance: number
  }
}

/**
 * Score an image based on quality indicators
 * Returns a score from 0-100
 */
export function scoreImage(
  image: {
    url: string
    thumbnail: string
    title: string
    source: string
    width: number
    height: number
  },
  activityName: string
): ScoredImage {
  const breakdown = {
    resolution: scoreResolution(image.width, image.height),
    aspectRatio: scoreAspectRatio(image.width, image.height),
    sourceReputation: scoreSource(image.source),
    titleRelevance: scoreTitleRelevance(image.title, activityName)
  }

  // Weighted average (resolution and aspect ratio are most important)
  const score = (
    breakdown.resolution * 0.35 +
    breakdown.aspectRatio * 0.30 +
    breakdown.sourceReputation * 0.20 +
    breakdown.titleRelevance * 0.15
  )

  return {
    ...image,
    score: Math.round(score),
    scoreBreakdown: breakdown
  }
}

/**
 * Score multiple images and return sorted by quality (best first)
 */
export function scoreAndRankImages(
  images: Array<{
    url: string
    thumbnail: string
    title: string
    source: string
    width: number
    height: number
  }>,
  activityName: string
): ScoredImage[] {
  return images
    .map(img => scoreImage(img, activityName))
    .sort((a, b) => b.score - a.score) // Highest score first
}

/**
 * Score resolution (0-100)
 * Higher resolution = better quality
 */
function scoreResolution(width: number, height: number): number {
  const pixels = width * height

  // Ideal: 1920x1080 (2M pixels) or higher
  if (pixels >= 2_073_600) return 100 // 1920x1080+
  if (pixels >= 1_310_720) return 90  // 1280x1024
  if (pixels >= 921_600) return 80    // 1280x720
  if (pixels >= 614_400) return 70    // 1024x600
  if (pixels >= 307_200) return 50    // 640x480
  if (pixels >= 153_600) return 30    // 480x320
  return 10 // Very low resolution
}

/**
 * Score aspect ratio (0-100)
 * 16:9 is ideal for card layouts
 */
function scoreAspectRatio(width: number, height: number): number {
  if (width === 0 || height === 0) return 0

  const ratio = width / height
  const ideal = 16 / 9 // 1.778

  // Perfect 16:9
  if (Math.abs(ratio - ideal) < 0.05) return 100

  // Close to 16:9 (1.6 - 1.9)
  if (ratio >= 1.6 && ratio <= 1.9) return 90

  // Widescreen (1.4 - 2.0)
  if (ratio >= 1.4 && ratio <= 2.0) return 75

  // Standard landscape (1.2 - 2.2)
  if (ratio >= 1.2 && ratio <= 2.2) return 60

  // Square or portrait
  if (ratio >= 0.8 && ratio <= 1.2) return 40

  // Very tall or very wide
  return 20
}

/**
 * Score source reputation (0-100)
 * Official sites and reputable sources ranked higher
 */
function scoreSource(source: string): number {
  const sourceLower = source.toLowerCase()

  // Official tourism/government sites
  if (
    sourceLower.includes('.gov') ||
    sourceLower.includes('tourism') ||
    sourceLower.includes('visiteur') ||
    sourceLower.includes('official')
  ) {
    return 100
  }

  // Wikipedia and educational
  if (
    sourceLower.includes('wikipedia') ||
    sourceLower.includes('.edu')
  ) {
    return 95
  }

  // Major travel sites
  if (
    sourceLower.includes('tripadvisor') ||
    sourceLower.includes('lonelyplanet') ||
    sourceLower.includes('timeout') ||
    sourceLower.includes('atlasobscura')
  ) {
    return 90
  }

  // Booking/hotel sites
  if (
    sourceLower.includes('booking') ||
    sourceLower.includes('expedia') ||
    sourceLower.includes('hotels') ||
    sourceLower.includes('airbnb')
  ) {
    return 85
  }

  // Photo sharing sites (high quality images)
  if (
    sourceLower.includes('flickr') ||
    sourceLower.includes('500px') ||
    sourceLower.includes('unsplash') ||
    sourceLower.includes('pexels')
  ) {
    return 80
  }

  // News sites
  if (
    sourceLower.includes('bbc') ||
    sourceLower.includes('cnn') ||
    sourceLower.includes('guardian') ||
    sourceLower.includes('nytimes')
  ) {
    return 75
  }

  // Social media (variable quality)
  if (
    sourceLower.includes('instagram') ||
    sourceLower.includes('pinterest') ||
    sourceLower.includes('facebook')
  ) {
    return 60
  }

  // Blogs and personal sites
  if (
    sourceLower.includes('blog') ||
    sourceLower.includes('wordpress') ||
    sourceLower.includes('medium')
  ) {
    return 50
  }

  // Unknown source
  return 40
}

/**
 * Score title relevance (0-100)
 * How well does the image title match the activity name?
 */
function scoreTitleRelevance(imageTitle: string, activityName: string): number {
  const titleLower = imageTitle.toLowerCase()
  const activityLower = activityName.toLowerCase()

  // Extract key words from activity name (ignore common words)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'visit', 'explore', 'see', 'tour']
  const activityWords = activityLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))

  if (activityWords.length === 0) return 50 // No meaningful words to compare

  // Count how many activity words appear in image title
  const matchCount = activityWords.filter(word => titleLower.includes(word)).length
  const matchRatio = matchCount / activityWords.length

  // Perfect match (all words present)
  if (matchRatio === 1.0) return 100

  // Most words match
  if (matchRatio >= 0.75) return 90

  // Some words match
  if (matchRatio >= 0.5) return 75

  // Few words match
  if (matchRatio >= 0.25) return 60

  // Minimal match
  if (matchCount > 0) return 40

  // No match
  return 20
}

/**
 * Get the best image from a list (highest score)
 */
export function getBestImage(
  images: Array<{
    url: string
    thumbnail: string
    title: string
    source: string
    width: number
    height: number
  }>,
  activityName: string
): ScoredImage | null {
  if (images.length === 0) return null

  const scored = scoreAndRankImages(images, activityName)
  return scored[0] || null
}


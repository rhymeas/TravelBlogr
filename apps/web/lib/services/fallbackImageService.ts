/**
 * Fallback Image Service
 * Provides high-quality fallback images when no user-uploaded or API images are available
 * Uses Unsplash Source API (free, no API key required)
 */

/**
 * Get a fallback image for a location
 * Uses Unsplash Source API with location-specific keywords
 */
export function getLocationFallbackImage(
  locationName: string,
  country?: string,
  width: number = 1200,
  height: number = 800
): string {
  // Create search query from location name and country
  const searchTerms = [locationName, country]
    .filter(Boolean)
    .join(',')
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, '')
    .replace(/\s+/g, ',')

  // Use Unsplash Source API (free, no key required)
  // Format: https://source.unsplash.com/{width}x{height}/?{keywords}
  return `https://source.unsplash.com/${width}x${height}/?${searchTerms},travel,landscape`
}

/**
 * Get a fallback image for a restaurant
 */
export function getRestaurantFallbackImage(
  restaurantName: string,
  cuisineType?: string,
  width: number = 800,
  height: number = 600
): string {
  // Use specific Unsplash photo IDs to avoid rate limiting
  const cuisineImages: Record<string, string> = {
    'italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&h=600&fit=crop',
    'japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
    'chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&h=600&fit=crop',
    'mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
    'french': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
    'indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop',
    'korean': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
  }

  const cuisine = cuisineType?.toLowerCase() || 'default'
  return cuisineImages[cuisine] || cuisineImages['default']
}

/**
 * Get a fallback image for an activity
 */
export function getActivityFallbackImage(
  activityName: string,
  category?: string,
  width: number = 800,
  height: number = 600
): string {
  const searchTerms = [category || 'activity', activityName]
    .filter(Boolean)
    .join(',')
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, '')
    .replace(/\s+/g, ',')

  return `https://source.unsplash.com/${width}x${height}/?${searchTerms},travel`
}

/**
 * Get a fallback image for a trip
 */
export function getTripFallbackImage(
  tripTitle: string,
  destination?: string,
  width: number = 1200,
  height: number = 800
): string {
  const searchTerms = [destination || tripTitle, 'travel', 'adventure']
    .filter(Boolean)
    .join(',')
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, '')
    .replace(/\s+/g, ',')

  return `https://source.unsplash.com/${width}x${height}/?${searchTerms}`
}

/**
 * Get a generic travel fallback image
 */
export function getGenericTravelImage(
  width: number = 1200,
  height: number = 800
): string {
  return `https://source.unsplash.com/${width}x${height}/?travel,landscape,nature`
}

/**
 * Check if a URL is a placeholder
 */
export function isPlaceholderImage(url: string): boolean {
  if (!url) return true
  
  const placeholderPatterns = [
    '/placeholder-',
    'placeholder.',
    'picsum.photos',
    'via.placeholder.com',
    'placehold.it',
    'dummyimage.com'
  ]

  return placeholderPatterns.some(pattern => url.includes(pattern))
}

/**
 * Replace placeholder image with fallback
 */
export function replacePlaceholderImage(
  url: string,
  fallbackUrl: string
): string {
  return isPlaceholderImage(url) ? fallbackUrl : url
}

/**
 * Get category-specific fallback images
 */
export const categoryFallbacks = {
  // Location categories
  'national-park': 'https://source.unsplash.com/1200x800/?national-park,nature,mountains',
  'city': 'https://source.unsplash.com/1200x800/?city,urban,skyline',
  'beach': 'https://source.unsplash.com/1200x800/?beach,ocean,tropical',
  'mountain': 'https://source.unsplash.com/1200x800/?mountain,hiking,alpine',
  'desert': 'https://source.unsplash.com/1200x800/?desert,sand,dunes',
  'forest': 'https://source.unsplash.com/1200x800/?forest,trees,nature',
  'lake': 'https://source.unsplash.com/1200x800/?lake,water,reflection',
  'island': 'https://source.unsplash.com/1200x800/?island,tropical,paradise',
  
  // Activity categories
  'hiking': 'https://source.unsplash.com/800x600/?hiking,trail,mountains',
  'skiing': 'https://source.unsplash.com/800x600/?skiing,snow,winter',
  'diving': 'https://source.unsplash.com/800x600/?diving,underwater,ocean',
  'surfing': 'https://source.unsplash.com/800x600/?surfing,waves,beach',
  'climbing': 'https://source.unsplash.com/800x600/?climbing,rock,adventure',
  'kayaking': 'https://source.unsplash.com/800x600/?kayaking,water,paddle',
  'cycling': 'https://source.unsplash.com/800x600/?cycling,bike,road',
  'wildlife': 'https://source.unsplash.com/800x600/?wildlife,safari,animals',
  'cultural': 'https://source.unsplash.com/800x600/?culture,temple,heritage',
  'food-tour': 'https://source.unsplash.com/800x600/?food,market,cuisine',
  
  // Restaurant categories
  'italian': 'https://source.unsplash.com/800x600/?italian-food,pasta,pizza',
  'japanese': 'https://source.unsplash.com/800x600/?japanese-food,sushi,ramen',
  'mexican': 'https://source.unsplash.com/800x600/?mexican-food,tacos,burrito',
  'french': 'https://source.unsplash.com/800x600/?french-food,cuisine,bistro',
  'chinese': 'https://source.unsplash.com/800x600/?chinese-food,dim-sum,noodles',
  'indian': 'https://source.unsplash.com/800x600/?indian-food,curry,spices',
  'thai': 'https://source.unsplash.com/800x600/?thai-food,pad-thai,curry',
  'seafood': 'https://source.unsplash.com/800x600/?seafood,fish,ocean',
  'steakhouse': 'https://source.unsplash.com/800x600/?steak,meat,grill',
  'cafe': 'https://source.unsplash.com/800x600/?cafe,coffee,breakfast',
  'bakery': 'https://source.unsplash.com/800x600/?bakery,bread,pastry',
  'bar': 'https://source.unsplash.com/800x600/?bar,cocktails,drinks'
}

/**
 * Get fallback image by category
 */
export function getCategoryFallbackImage(
  category: string,
  defaultUrl?: string
): string {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-')
  return categoryFallbacks[normalizedCategory as keyof typeof categoryFallbacks] 
    || defaultUrl 
    || getGenericTravelImage()
}

/**
 * Batch replace placeholder images in an array
 */
export function replacePlaceholderImages(
  images: string[],
  getFallback: (index: number) => string
): string[] {
  return images.map((url, index) => 
    isPlaceholderImage(url) ? getFallback(index) : url
  )
}

/**
 * Get a deterministic fallback image based on a seed
 * Useful for consistent images across page reloads
 */
export function getDeterministicFallbackImage(
  seed: string,
  category: string = 'travel',
  width: number = 1200,
  height: number = 800
): string {
  // Create a hash from the seed
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  
  // Use hash to select from a predefined set of high-quality images
  const imageCollections = [
    `https://source.unsplash.com/${width}x${height}/?${category},landscape`,
    `https://source.unsplash.com/${width}x${height}/?${category},nature`,
    `https://source.unsplash.com/${width}x${height}/?${category},adventure`,
    `https://source.unsplash.com/${width}x${height}/?${category},explore`,
    `https://source.unsplash.com/${width}x${height}/?${category},destination`
  ]
  
  const index = Math.abs(hash) % imageCollections.length
  return imageCollections[index]
}

/**
 * Preload fallback images for better performance
 */
export function preloadFallbackImages(urls: string[]): void {
  if (typeof window === 'undefined') return

  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Get optimized fallback image URL with quality and format parameters
 */
export function getOptimizedFallbackImage(
  baseUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'webp' | 'auto'
  } = {}
): string {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    format = 'auto'
  } = options

  // Unsplash supports quality and format parameters
  return `${baseUrl}&w=${width}&h=${height}&q=${quality}&fm=${format}`
}


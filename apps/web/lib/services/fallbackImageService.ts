/**
 * Fallback Image Service
 * Provides high-quality fallback images when no user-uploaded or API images are available
 * Uses Unsplash Source API (free, no API key required)
 */

/**
 * Get a fallback image for a location
 * CRITICAL: ALWAYS use country-specific fallback images
 * This ensures fallback images are contextually relevant to the location
 */
export function getLocationFallbackImage(
  locationName: string,
  country?: string,
  width: number = 1200,
  height: number = 800
): string {
  // CRITICAL: Use country-specific fallback images
  // This prevents showing random/irrelevant images when APIs fail

  // Country-specific high-quality Unsplash images
  const countryFallbacks: Record<string, string> = {
    // Europe
    'norway': 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1200&h=800&fit=crop', // Norwegian fjords
    'morocco': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&h=800&fit=crop', // Marrakesh
    'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop', // Paris
    'italy': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&h=800&fit=crop', // Venice
    'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200&h=800&fit=crop', // Barcelona
    'greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&h=800&fit=crop', // Santorini
    'switzerland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop', // Swiss Alps
    'germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&h=800&fit=crop', // Berlin
    'netherlands': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&h=800&fit=crop', // Amsterdam
    'portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=800&fit=crop', // Lisbon

    // Asia
    'japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop', // Tokyo
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&h=800&fit=crop', // Bangkok
    'china': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&h=800&fit=crop', // Shanghai
    'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=800&fit=crop', // Taj Mahal
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=800&fit=crop', // Singapore
    'vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop', // Vietnam
    'indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=800&fit=crop', // Bali

    // Americas
    'united states': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1200&h=800&fit=crop', // NYC
    'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200&h=800&fit=crop', // Vancouver
    'mexico': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&h=800&fit=crop', // Mexico
    'brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=800&fit=crop', // Rio
    'argentina': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&h=800&fit=crop', // Buenos Aires

    // Oceania
    'australia': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&h=800&fit=crop', // Sydney
    'new zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&h=800&fit=crop', // NZ

    // Africa
    'south africa': 'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=1200&h=800&fit=crop', // Cape Town
    'egypt': 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&h=800&fit=crop', // Pyramids
    'kenya': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=800&fit=crop', // Safari
  }

  // Try to find country-specific fallback
  const countryKey = country?.toLowerCase() || ''
  if (countryFallbacks[countryKey]) {
    console.log(`✅ Using country-specific fallback for ${country}`)
    return countryFallbacks[countryKey]
  }

  // Fallback: Use Unsplash Source with location + country
  const searchTerms = [locationName, country]
    .filter(Boolean)
    .join(',')
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, '')
    .replace(/\s+/g, ',')

  console.log(`⚠️ Using generic Unsplash fallback for ${locationName}, ${country}`)
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


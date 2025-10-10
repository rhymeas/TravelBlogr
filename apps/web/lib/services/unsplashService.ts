/**
 * Unsplash API Service
 * Free restaurant and food images
 */

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

export interface UnsplashImage {
  id: string
  url: string
  thumb: string
  alt: string
  photographer: string
  photographerUrl: string
}

/**
 * Search for restaurant/food images on Unsplash
 * Free tier: 50 requests/hour
 */
export async function searchRestaurantImages(
  query: string,
  count = 5
): Promise<UnsplashImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not configured')
    return []
  }

  try {
    const searchQuery = `${query} restaurant food`
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    )

    if (!response.ok) {
      console.error('Unsplash API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    
    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      alt: photo.alt_description || `${query} restaurant`,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html
    }))
  } catch (error) {
    console.error('Error fetching Unsplash images:', error)
    return []
  }
}

/**
 * Get a single random restaurant image for a cuisine type
 */
export async function getRandomRestaurantImage(
  cuisineType: string
): Promise<UnsplashImage | null> {
  const images = await searchRestaurantImages(cuisineType, 1)
  return images[0] || null
}

/**
 * Get images for multiple restaurants in batch
 * Optimized to reduce API calls
 */
export async function getRestaurantImagesBatch(
  restaurants: Array<{ name: string; cuisine_type?: string }>
): Promise<Map<string, UnsplashImage>> {
  const imageMap = new Map<string, UnsplashImage>()
  
  // Group by cuisine type to reduce API calls
  const cuisineGroups = new Map<string, string[]>()
  
  restaurants.forEach(r => {
    const cuisine = r.cuisine_type || 'restaurant'
    if (!cuisineGroups.has(cuisine)) {
      cuisineGroups.set(cuisine, [])
    }
    cuisineGroups.get(cuisine)!.push(r.name)
  })

  // Fetch images for each cuisine type
  for (const [cuisine, names] of cuisineGroups) {
    const images = await searchRestaurantImages(cuisine, names.length)
    
    // Assign images to restaurants
    names.forEach((name, index) => {
      if (images[index]) {
        imageMap.set(name, images[index])
      }
    })
  }

  return imageMap
}


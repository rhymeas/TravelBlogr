/**
 * Unsplash API Client
 * FREE: 50 requests/hour
 * 
 * Gets high-quality location images
 */

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  description: string | null
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}

interface UnsplashResponse {
  results: UnsplashPhoto[]
  total: number
}

/**
 * Fetch location images from Unsplash
 */
export async function fetchImagesFromUnsplash(
  locationName: string,
  count: number = 10
): Promise<string[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY

  if (!apiKey) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not set, skipping image fetch')
    return []
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(locationName)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`)
    }

    const data: UnsplashResponse = await response.json()

    // Return regular-sized image URLs
    return data.results.map(photo => photo.urls.regular)
  } catch (error) {
    console.error('Error fetching from Unsplash:', error)
    return []
  }
}

/**
 * Get fallback images (free stock photos without API)
 */
export function getFallbackImages(locationName: string, count: number = 10): string[] {
  // Use Unsplash Source (no API key needed, but less control)
  const keywords = locationName.toLowerCase().replace(/\s+/g, ',')
  
  return Array.from({ length: count }, (_, i) => 
    `https://source.unsplash.com/1600x900/?${keywords}&sig=${i}`
  )
}


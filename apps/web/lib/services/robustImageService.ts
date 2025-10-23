/**
 * Production Image Service with AGGRESSIVE Multi-Source Fetching
 *
 * AGGRESSIVE MODE: Fetches from ALL sources simultaneously for maximum variety!
 *
 * Image Sources (all queried in parallel):
 * 1. Pixabay API (unlimited, free, requires key - easy to get at pixabay.com)
 * 2. Pexels API (unlimited, free, requires key)
 * 3. Unsplash API (50/hour, free, requires key)
 * 4. Wikimedia Commons (unlimited, free, no API key)
 * 5. Wikipedia REST API (unlimited, free, no API key)
 * 6. Mapbox Static (if token available)
 * 7. Unsplash Source (high-quality fallback, no API key, always works)
 *
 * Gallery Mode: Queries ALL sources with multiple search terms to get maximum images
 * Single Image Mode: Falls back through sources until one succeeds
 */

import { getLocationFallbackImage, isPlaceholderImage } from './fallbackImageService'
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
// DEPRECATED: Replaced with Upstash Redis for persistent caching
// const imageCache = new Map<string, { url: string; timestamp: number }>()

/**
 * Wikimedia Commons Image Search
 * FREE - No API key needed - Unlimited requests
 */
async function fetchWikimediaImage(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `list=search&` +
      `srsearch=${encodeURIComponent(searchTerm)}&` +
      `format=json&` +
      `origin=*`
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!data.query?.search?.[0]) return null

    const pageTitle = data.query.search[0].title

    // Get image URL from page
    const imageResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `titles=${encodeURIComponent(pageTitle)}&` +
      `prop=imageinfo&` +
      `iiprop=url&` +
      `format=json&` +
      `origin=*`
    )

    if (!imageResponse.ok) return null

    const imageData = await imageResponse.json()
    const pages = imageData.query?.pages

    if (!pages) return null

    const page = Object.values(pages)[0] as any
    const imageUrl = page?.imageinfo?.[0]?.url

    if (imageUrl) {
      console.log(`✅ Wikimedia Commons: Found image for "${searchTerm}"`)
      return imageUrl
    }

    return null
  } catch (error) {
    console.error('Wikimedia Commons error:', error)
    return null
  }
}

/**
 * Wikipedia REST API Image
 * FREE - No API key needed - Unlimited requests
 */
async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.thumbnail?.source) {
      console.log(`✅ Wikipedia: Found image for "${searchTerm}"`)
      return data.thumbnail.source
    }

    if (data.originalimage?.source) {
      console.log(`✅ Wikipedia: Found original image for "${searchTerm}"`)
      return data.originalimage.source
    }

    return null
  } catch (error) {
    console.error('Wikipedia error:', error)
    return null
  }
}

/**
 * Pexels API Image Search
 * FREE - Unlimited requests - Requires API key
 * Enhanced with quality filtering and better search terms
 */
async function fetchPexelsImage(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    // Fetch more results to filter for quality
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      // Filter for high-quality, relevant images
      // Prefer images with higher width (better quality)
      // Avoid images that are too narrow or too square
      const qualityPhotos = data.photos.filter((photo: any) => {
        const width = photo.width
        const height = photo.height
        const aspectRatio = width / height

        // Prefer landscape images (aspect ratio between 1.3 and 2.5)
        // Minimum width of 1920px for quality
        return width >= 1920 && aspectRatio >= 1.3 && aspectRatio <= 2.5
      })

      const selectedPhoto = qualityPhotos[0] || data.photos[0]

      console.log(`✅ Pexels: Found image for "${searchTerm}" (${selectedPhoto.width}x${selectedPhoto.height})`)
      return selectedPhoto.src.large2x || selectedPhoto.src.large
    }

    return null
  } catch (error) {
    console.error('Pexels error:', error)
    return null
  }
}

/**
 * Unsplash API Image Search
 * FREE - 50 requests/hour - Requires API key
 * Enhanced with quality filtering
 */
async function fetchUnsplashImage(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY

  if (!apiKey) {
    return null
  }

  try {
    // Fetch more results and use orientation filter
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      // Filter for high-quality images
      // Prefer images with more likes (better quality/relevance)
      const sortedResults = data.results.sort((a: any, b: any) => b.likes - a.likes)
      const selectedImage = sortedResults[0]

      console.log(`✅ Unsplash: Found image for "${searchTerm}" (${selectedImage.likes} likes)`)
      return selectedImage.urls.regular
    }

    return null
  } catch (error) {
    console.error('Unsplash error:', error)
    return null
  }
}

/**
 * Unsplash Source - No API Key Required!
 * FREE - Unlimited - No authentication needed
 * Returns high-quality travel images
 */
function fetchUnsplashSource(locationName: string, country?: string, width: number = 1600, height: number = 900): string {
  return getLocationFallbackImage(locationName, country, width, height)
}

/**
 * Pixabay API - Free high-quality images
 * FREE - Unlimited with API key (easy to get at pixabay.com)
 */
async function fetchPixabayImages(query: string, count: number = 10): Promise<string[]> {
  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${count}&safesearch=true`,
      { next: { revalidate: 3600 } }
    )

    if (response.ok) {
      const data = await response.json()
      const images = data.hits?.map((hit: any) => hit.largeImageURL) || []
      console.log(`✅ Pixabay: Found ${images.length} images`)
      return images
    }
  } catch (error) {
    console.error('Pixabay error:', error)
  }

  return []
}


/**
 * Mapbox Static Image
 * FREE tier available - Requires access token
 */
async function fetchMapboxStaticImage(
  locationName: string,
  lat?: number,
  lng?: number
): Promise<string | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken || !lat || !lng) {
    return null
  }

  try {
    // Mapbox Static Images API
    const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lng},${lat},12,0/1200x800@2x?access_token=${accessToken}`

    console.log(`✅ Mapbox: Generated static map for "${locationName}"`)
    return imageUrl
  } catch (error) {
    console.error('Mapbox error:', error)
    return null
  }
}



/**
 * Fetch Location Image with Multiple Fallbacks
 *
 * OPTIMIZATION: Checks database first, only fetches from APIs if missing
 * Stores fetched URLs in database permanently (never refetch)
 */
export async function fetchLocationImage(
  locationName: string,
  manualUrl?: string,
  lat?: number,
  lng?: number,
  locationSlug?: string
): Promise<string> {
  // 1. Use manual URL if provided and not a placeholder
  if (manualUrl && !isPlaceholderImage(manualUrl)) {
    console.log(`✅ Using manual URL for "${locationName}"`)
    return manualUrl
  }

  // 2. Check database first (PERMANENT CACHE)
  if (locationSlug) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: location } = await supabase
        .from('locations')
        .select('featured_image')
        .eq('slug', locationSlug)
        .single()

      if (location?.featured_image && !isPlaceholderImage(location.featured_image)) {
        console.log(`✅ Using database image for "${locationName}" (never refetch!)`)
        return location.featured_image
      }
    } catch (error) {
      console.error('Error checking database for image:', error)
    }
  }

  // 3. Check Upstash Redis cache (persistent, fast)
  const cacheKey = CacheKeys.image(locationName)
  const cachedUrl = await getCached<string>(cacheKey)
  if (cachedUrl && !isPlaceholderImage(cachedUrl)) {
    console.log(`✅ Using Upstash cached image for "${locationName}" (< 10ms)`)
    return cachedUrl
  }

  console.log(`🔍 Fetching NEW image for location: "${locationName}" (will save to database + Upstash)`)

  // 4. Fetch from external APIs (ONLY if not in database/cache)
  const searchTerms = [
    `${locationName} cityscape skyline`,
    `${locationName} city center architecture`,
    `${locationName} landmark famous building`,
    `${locationName} aerial view city`,
    `${locationName} travel destination`
  ]

  let imageUrl: string | null = null

  // Try Pexels (unlimited, best quality, requires key)
  for (const term of searchTerms) {
    imageUrl = await fetchPexelsImage(term)
    if (imageUrl) {
      console.log(`✅ Found image with search term: "${term}"`)
      await saveImageToDatabase(locationSlug, imageUrl, locationName)
      // Cache in Upstash for fast future lookups
      await setCached(cacheKey, imageUrl, CacheTTL.IMAGE)
      return imageUrl
    }
  }

  // Try Unsplash API (50/hour, high quality, requires key)
  for (const term of searchTerms) {
    imageUrl = await fetchUnsplashImage(term)
    if (imageUrl) {
      console.log(`✅ Found image with search term: "${term}"`)
      await saveImageToDatabase(locationSlug, imageUrl, locationName)
      await setCached(cacheKey, imageUrl, CacheTTL.IMAGE)
      return imageUrl
    }
  }

  // Try Wikimedia Commons (unlimited, free)
  imageUrl = await fetchWikimediaImage(`${locationName} city`)
  if (imageUrl) {
    await saveImageToDatabase(locationSlug, imageUrl, locationName)
    await setCached(cacheKey, imageUrl, CacheTTL.IMAGE)
    return imageUrl
  }

  // Try Wikipedia (unlimited, free)
  imageUrl = await fetchWikipediaImage(locationName)
  if (imageUrl) {
    await saveImageToDatabase(locationSlug, imageUrl, locationName)
    await setCached(cacheKey, imageUrl, CacheTTL.IMAGE)
    return imageUrl
  }

  // Try Mapbox Static (if coordinates available)
  if (lat && lng) {
    imageUrl = await fetchMapboxStaticImage(locationName, lat, lng)
    if (imageUrl) {
      await saveImageToDatabase(locationSlug, imageUrl, locationName)
      await setCached(cacheKey, imageUrl, CacheTTL.IMAGE)
      return imageUrl
    }
  }

  // Use placeholder image (fallback) - DON'T save to database or cache
  imageUrl = `https://picsum.photos/seed/${encodeURIComponent(locationName)}/1600/900`
  console.log(`⚠️ Using placeholder for "${locationName}" (will be replaced by cron job)`)
  return imageUrl
}

/**
 * Save fetched image URL to database (PERMANENT STORAGE)
 * This ensures images are NEVER refetched
 */
async function saveImageToDatabase(
  locationSlug: string | undefined,
  imageUrl: string,
  locationName: string
): Promise<void> {
  if (!locationSlug) {
    console.log(`⚠️ No slug provided, skipping database save for "${locationName}"`)
    return
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('locations')
      .update({ featured_image: imageUrl })
      .eq('slug', locationSlug)

    if (error) {
      console.error(`❌ Failed to save image to database for "${locationName}":`, error)
    } else {
      console.log(`💾 Saved image URL to database for "${locationName}" (permanent!)`)
    }
  } catch (error) {
    console.error(`❌ Error saving image to database:`, error)
  }
}

/**
 * Fetch Location Gallery (multiple images) - AGGRESSIVE MODE
 * Fetches from ALL sources simultaneously to maximize variety
 */
export async function fetchLocationGallery(
  locationName: string,
  count: number = 5
): Promise<string[]> {
  console.log(`🔍 AGGRESSIVE MODE: Fetching images from ALL sources for: "${locationName}"`)

  const allImages: string[] = []
  const fetchPromises: Promise<void>[] = []

  // 1. Pixabay API (if available) - FREE, easy to get key
  const pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    console.log('📸 Querying Pixabay API...')
    fetchPromises.push(
      fetchPixabayImages(`${locationName} travel`, 15)
        .then(urls => {
          if (urls.length > 0) {
            allImages.push(...urls)
            console.log(`✅ Pixabay: ${urls.length} images`)
          }
        })
        .catch(err => console.error('Pixabay error:', err))
    )
  }

  // 2. Pexels API (if available)
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    console.log('📸 Querying Pexels API...')
    fetchPromises.push(
      fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(locationName + ' travel')}&per_page=15`,
        { headers: { 'Authorization': pexelsKey } }
      )
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.photos) {
            const urls = data.photos.map((p: any) => p.src.large)
            allImages.push(...urls)
            console.log(`✅ Pexels: ${urls.length} images`)
          }
        })
        .catch(err => console.error('Pexels error:', err))
    )
  }

  // 3. Unsplash API (if available)
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    console.log('📸 Querying Unsplash API...')
    fetchPromises.push(
      fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(locationName)}&per_page=15`,
        { headers: { 'Authorization': `Client-ID ${unsplashKey}` } }
      )
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.results) {
            const urls = data.results.map((r: any) => r.urls.regular)
            allImages.push(...urls)
            console.log(`✅ Unsplash: ${urls.length} images`)
          }
        })
        .catch(err => console.error('Unsplash error:', err))
    )
  }

  // 3. Wikipedia/Wikimedia - Multiple search terms
  const wikiSearchTerms = [
    locationName,
    `${locationName} landmark`,
    `${locationName} architecture`,
    `${locationName} cityscape`,
    `${locationName} culture`,
    `${locationName} tourism`,
    `${locationName} attractions`
  ]

  console.log('📸 Querying Wikipedia/Wikimedia...')
  for (const term of wikiSearchTerms) {
    // Wikipedia
    fetchPromises.push(
      fetchWikipediaImage(term)
        .then(url => {
          if (url) {
            allImages.push(url)
            console.log(`✅ Wikipedia: Found image for "${term}"`)
          }
        })
        .catch(() => {})
    )

    // Wikimedia Commons
    fetchPromises.push(
      fetchWikimediaImage(term)
        .then(url => {
          if (url) {
            allImages.push(url)
            console.log(`✅ Wikimedia: Found image for "${term}"`)
          }
        })
        .catch(() => {})
    )
  }

  // Wait for all API calls to complete
  await Promise.all(fetchPromises)

  // Deduplicate images
  const uniqueImages = Array.from(new Set(allImages))
  console.log(`🎉 Total unique images from all sources: ${uniqueImages.length}`)

  // If we still need more, add placeholders with variety
  const finalImages = [...uniqueImages]
  let picsumIndex = 0
  while (finalImages.length < count) {
    const seed = `${locationName}-picsum-${picsumIndex++}`
    finalImages.push(`https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`)
  }

  console.log(`📦 Returning ${Math.min(count, finalImages.length)} images (${uniqueImages.length} real + ${finalImages.length - uniqueImages.length} placeholders)`)
  return finalImages.slice(0, count)
}

/**
 * Fetch Restaurant Image
 */
export async function fetchRestaurantImage(
  restaurantName: string,
  locationName: string,
  manualUrl?: string
): Promise<string> {
  if (manualUrl) return manualUrl

  // Try generic food images
  const foodImage = await fetchPexelsImage(`${restaurantName} food restaurant`)
  if (foodImage) return foodImage

  const cuisineImage = await fetchUnsplashImage(`restaurant food`)
  if (cuisineImage) return cuisineImage

  return '/placeholder-restaurant.svg'
}

/**
 * Fetch Activity Image
 */
export async function fetchActivityImage(
  activityName: string,
  locationName: string,
  manualUrl?: string
): Promise<string> {
  if (manualUrl) return manualUrl

  const activityImage = await fetchPexelsImage(`${activityName} ${locationName}`)
  if (activityImage) return activityImage

  const genericImage = await fetchWikipediaImage(activityName)
  if (genericImage) return genericImage

  return '/placeholder-activity.svg'
}


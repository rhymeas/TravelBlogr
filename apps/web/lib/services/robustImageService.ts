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
    // Fetch fewer results for speed, use small images
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        },
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      const selectedPhoto = data.photos[0]

      console.log(`✅ Pexels: Found image for "${searchTerm}" (${selectedPhoto.width}x${selectedPhoto.height})`)
      // Use SMALL or MEDIUM size for fast loading (not large2x!)
      return selectedPhoto.src.medium || selectedPhoto.src.small || selectedPhoto.src.large
    }

    return null
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Pexels timeout after 3s')
    } else {
      console.error('Pexels error:', error)
    }
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
    // Fetch fewer results for speed, add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        },
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const selectedImage = data.results[0]

      console.log(`✅ Unsplash: Found image for "${searchTerm}" (${selectedImage.likes} likes)`)
      // Use SMALL size for fast loading (not regular!)
      return selectedImage.urls.small || selectedImage.urls.regular
    }

    return null
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Unsplash timeout after 3s')
    } else {
      console.error('Unsplash error:', error)
    }
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
 * Fetch Activity Image with Enhanced Contextualization
 *
 * PRIORITY ORDER (as per user requirements):
 * 1. Brave Images API (best quality, web-scale search)
 * 2. Reddit Ultra System (community photos, high engagement)
 * 3. Pexels (stock photos, unlimited)
 * 4. Unsplash (professional photography)
 * 5. Wikipedia/Wikimedia (location-specific)
 * 6. Openverse (Creative Commons)
 *
 * @param activityName - Name of the activity/attraction
 * @param locationName - Name of the location (city)
 * @param country - Country name for additional context
 * @param manualUrl - Optional manual URL override
 * @returns Image URL or placeholder
 */
export async function fetchActivityImage(
  activityName: string,
  locationName: string,
  country?: string,
  manualUrl?: string
): Promise<string> {
  if (manualUrl) return manualUrl

  // Enhanced search query with location + country context
  const contextualQuery = country
    ? `${activityName} ${locationName} ${country}`
    : `${activityName} ${locationName}`

  console.log(`🔍 Fetching activity image with context: "${contextualQuery}"`)

  // PRIORITY 1: Brave Images API (if API key available)
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
  console.log(`🔑 Brave API key available: ${braveApiKey ? 'YES' : 'NO'}`)
  if (braveApiKey) {
    console.log(`🚀 Calling Brave Images API for: "${contextualQuery}"`)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout for Brave

      const braveUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(contextualQuery)}&count=1`
      const braveResponse = await fetch(braveUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': braveApiKey
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (braveResponse.ok) {
        const braveData = await braveResponse.json()
        const braveImage = braveData.results?.[0]?.thumbnail?.src || braveData.results?.[0]?.properties?.url
        if (braveImage) {
          console.log(`✅ PRIORITY 1: Found image from Brave Images API`)
          return braveImage
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Brave API timeout after 2s')
      } else {
        console.error('Brave Images API error:', err)
      }
    }
  }

  // PRIORITY 2: Reddit Ultra System (community photos)
  try {
    const { scrapeRedditImages } = await import('./socialImageScraperService')
    const redditImages = await scrapeRedditImages(contextualQuery, 1)
    if (redditImages.length > 0) {
      console.log(`✅ PRIORITY 2: Found image from Reddit Ultra`)
      return redditImages[0].url
    }
  } catch (err) {
    console.error('Reddit Ultra error:', err)
  }

  // PRIORITY 3: Pexels (stock photos, unlimited)
  const pexelsImage = await fetchPexelsImage(contextualQuery)
  if (pexelsImage) {
    console.log(`✅ PRIORITY 3: Found image from Pexels`)
    return pexelsImage
  }

  // PRIORITY 4: Unsplash (professional photography)
  const unsplashImage = await fetchUnsplashImage(contextualQuery)
  if (unsplashImage) {
    console.log(`✅ PRIORITY 4: Found image from Unsplash`)
    return unsplashImage
  }

  // PRIORITY 5: Wikipedia/Wikimedia (location-specific)
  const wikipediaImage = await fetchWikipediaImage(activityName)
  if (wikipediaImage) {
    console.log(`✅ PRIORITY 5: Found image from Wikipedia`)
    return wikipediaImage
  }

  console.log(`⚠️ No image found from any source, using placeholder`)
  return '/placeholder-activity.svg'
}


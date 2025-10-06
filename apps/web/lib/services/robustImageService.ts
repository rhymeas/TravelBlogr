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
 * 7. Lorem Picsum (high-quality placeholders, no API key, always works)
 *
 * Gallery Mode: Queries ALL sources with multiple search terms to get maximum images
 * Single Image Mode: Falls back through sources until one succeeds
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const imageCache = new Map<string, { url: string; timestamp: number }>()

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
 */
async function fetchPexelsImage(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=1`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.photos?.[0]?.src?.large) {
      console.log(`✅ Pexels: Found image for "${searchTerm}"`)
      return data.photos[0].src.large
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
 */
async function fetchUnsplashImage(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (data.results?.[0]?.urls?.regular) {
      console.log(`✅ Unsplash: Found image for "${searchTerm}"`)
      return data.results[0].urls.regular
    }

    return null
  } catch (error) {
    console.error('Unsplash error:', error)
    return null
  }
}

/**
 * Lorem Picsum - No API Key Required!
 * FREE - Unlimited - No authentication needed
 * Returns high-quality placeholder images
 */
function fetchLoremPicsum(seed: string, width: number = 1600, height: number = 900): string {
  // Use seed for consistent images per location
  const seedHash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return `https://picsum.photos/seed/${seedHash}/${width}/${height}`
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
 */
export async function fetchLocationImage(
  locationName: string,
  manualUrl?: string,
  lat?: number,
  lng?: number
): Promise<string> {
  // 1. Use manual URL if provided
  if (manualUrl && manualUrl !== '/placeholder-location.svg') {
    console.log(`✅ Using manual URL for "${locationName}"`)
    return manualUrl
  }

  // Check cache
  const cacheKey = `location:${locationName}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached image for "${locationName}"`)
    return cached.url
  }

  console.log(`🔍 Fetching image for location: "${locationName}"`)

  // 2. Try Pexels (unlimited, best quality, requires key)
  let imageUrl = await fetchPexelsImage(`${locationName} travel destination`)
  if (imageUrl) {
    imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
    return imageUrl
  }

  // 3. Try Unsplash API (50/hour, high quality, requires key)
  imageUrl = await fetchUnsplashImage(`${locationName} travel`)
  if (imageUrl) {
    imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
    return imageUrl
  }

  // 4. Try Wikimedia Commons (unlimited, free)
  imageUrl = await fetchWikimediaImage(`${locationName} city`)
  if (imageUrl) {
    imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
    return imageUrl
  }

  // 5. Try Wikipedia (unlimited, free)
  imageUrl = await fetchWikipediaImage(locationName)
  if (imageUrl) {
    imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
    return imageUrl
  }

  // 6. Try Mapbox Static (if coordinates available)
  if (lat && lng) {
    imageUrl = await fetchMapboxStaticImage(locationName, lat, lng)
    if (imageUrl) {
      imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
      return imageUrl
    }
  }

  // 7. Use Lorem Picsum (always works, high quality)
  imageUrl = fetchLoremPicsum(locationName, 1600, 900)
  console.log(`✅ Using Lorem Picsum for "${locationName}"`)
  imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
  return imageUrl
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

  // If we still need more, add Lorem Picsum with variety
  const finalImages = [...uniqueImages]
  let picsumIndex = 0
  while (finalImages.length < count) {
    const seed = `${locationName}-picsum-${picsumIndex++}`
    finalImages.push(fetchLoremPicsum(seed, 1600, 900))
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


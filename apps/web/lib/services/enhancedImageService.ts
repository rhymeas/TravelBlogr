/**
 * Enhanced Image Service with Quality Controls
 *
 * Features:
 * - High-resolution image fetching
 * - Image quality validation
 * - Better search terms for location-specific images
 * - Support for 20+ images per location
 * - Filters out irrelevant images (people portraits, etc.)
 * - High-quality fallbacks instead of placeholders
 * - Brave Search API integration (Priority #2 - fantastic images!)
 */

import { getLocationFallbackImage, isPlaceholderImage } from './fallbackImageService'
import { searchImages as braveSearchImages } from './braveSearchService'
import { withRedditLimit, fetchWithTimeout } from '@/lib/utils/redditLimiter'

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const imageCache = new Map<string, { url: string; timestamp: number }>()

// Image quality thresholds
const MIN_IMAGE_WIDTH = 1200
const MIN_IMAGE_HEIGHT = 800
const PREFERRED_ASPECT_RATIO_MIN = 1.2 // Landscape preferred
const PREFERRED_ASPECT_RATIO_MAX = 2.0

/**
 * Brave Search API - Fetch FANTASTIC high-quality images
 * Priority #2 in the image stack
 *
 * @param locationName - The location name to search for
 * @param limit - Maximum number of images to fetch
 * @param country - Country name for disambiguation (e.g., "Norway" vs "USA")
 * @param region - Region/state name for additional context (e.g., "Vestland")
 */
async function fetchBraveImages(
  locationName: string,
  limit: number = 10,
  country?: string,
  region?: string
): Promise<string[]> {
  try {
    // Build context-aware search query to avoid ambiguous location names
    let searchQuery = locationName

    // Add region if available and different from location name
    if (region && region !== locationName && !locationName.includes(region)) {
      searchQuery += ` ${region}`
    }

    // Add country if available and different from location name (CRITICAL for disambiguation)
    if (country && country !== locationName && !locationName.includes(country)) {
      searchQuery += ` ${country}`
    }

    // Add search terms
    searchQuery += ' cityscape travel'

    console.log(`🔍 [BRAVE] Context-aware search: "${searchQuery}"`)
    const results = await braveSearchImages(searchQuery, limit)

    // Extract thumbnail URLs (16:9 optimized from imgs.search.brave.com)
    const urls = results
      .map(r => r.thumbnail || r.url)
      .filter(url => url && url.startsWith('http'))

    if (urls.length > 0) {
      console.log(`✅ [BRAVE] Found ${urls.length} fantastic images for "${searchQuery}"`)
      console.log(`   First image: ${urls[0].substring(0, 100)}...`)
    } else {
      console.warn(`⚠️ [BRAVE] No images found for "${searchQuery}"`)
    }

    return urls
  } catch (error) {
    console.error(`❌ [BRAVE] API error for "${locationName}":`, error)
    return []
  }
}

/**
 * Enhanced Wikimedia Commons - Fetch HIGH RESOLUTION images WITH FILTERING
 */
async function fetchWikimediaHighRes(searchTerm: string): Promise<string | null> {
  try {
    // Fetch multiple results to filter from
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `list=search&` +
      `srsearch=${encodeURIComponent(searchTerm)}&` +
      `srlimit=10&` + // Get 10 results to filter
      `format=json&` +
      `origin=*`
    )

    if (!response.ok) return null
    const data = await response.json()
    if (!data.query?.search || data.query.search.length === 0) return null

    // FILTER OUT unwanted images by title/filename
    const rejectKeywords = [
      'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider', 'beetle', 'moth', 'fly',
      'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet', 'mammal',
      'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar', 'pine',
      'flower', 'flowers', 'plant', 'plants', 'flora', 'botanical',
      'person', 'people', 'portrait', 'face', 'man', 'woman', 'child',
      'sign', 'signs', 'signage', 'text', 'billboard', 'plaque',
      'grylloblatta', 'scudderi' // Specific bug species
    ]

    const filteredResults = data.query.search.filter((result: any) => {
      const title = (result.title || '').toLowerCase()
      return !rejectKeywords.some(kw => title.includes(kw))
    })

    if (filteredResults.length === 0) {
      console.log(`⚠️ Wikimedia: All results filtered out for "${searchTerm}"`)
      return null
    }

    const pageTitle = filteredResults[0].title

    // Request HIGH RESOLUTION version (2000px width)
    const imageResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `titles=${encodeURIComponent(pageTitle)}&` +
      `prop=imageinfo&` +
      `iiprop=url|size&` +
      `iiurlwidth=2000&` + // Request 2000px width
      `format=json&` +
      `origin=*`
    )

    if (!imageResponse.ok) return null
    const imageData = await imageResponse.json()
    const pages = imageData.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as any
    const imageInfo = page?.imageinfo?.[0]

    // Prefer thumburl (scaled version), fallback to original
    const imageUrl = imageInfo?.thumburl || imageInfo?.url
    const width = imageInfo?.thumbwidth || imageInfo?.width
    const height = imageInfo?.thumbheight || imageInfo?.height

    // Quality check
    if (width && height && width >= MIN_IMAGE_WIDTH && height >= MIN_IMAGE_HEIGHT) {
      console.log(`✅ Wikimedia HIGH-RES: ${width}x${height} for "${searchTerm}" (filtered ${filteredResults.length}/${data.query.search.length})`)
      return imageUrl
    }

    return null
  } catch (error) {
    console.error('Wikimedia error:', error)
    return null
  }
}

/**
 * Enhanced Wikipedia - Get original high-res image
 */
async function fetchWikipediaHighRes(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )

    if (!response.ok) return null
    const data = await response.json()

    // Prefer original image over thumbnail
    if (data.originalimage?.source) {
      console.log(`✅ Wikipedia ORIGINAL: Found for "${searchTerm}"`)
      return data.originalimage.source
    }

    if (data.thumbnail?.source) {
      // Try to get higher resolution by modifying URL
      const thumbUrl = data.thumbnail.source
      const highResUrl = thumbUrl.replace(/\/\d+px-/, '/2000px-')
      console.log(`✅ Wikipedia HIGH-RES: Found for "${searchTerm}"`)
      return highResUrl
    }

    return null
  } catch (error) {
    console.error('Wikipedia error:', error)
    return null
  }
}

/**
 * Pexels - Request large/original size WITH SMART FILTERING FOR FEATURED IMAGE
 */
async function fetchPexelsHighRes(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    // Fetch MORE images to filter from (10 instead of 1)
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape`,
      { headers: { 'Authorization': apiKey } }
    )

    if (!response.ok) return null
    const data = await response.json()

    if (!data.photos || data.photos.length === 0) return null

    // SMART FILTERING: Find the BEST cityscape/landmark image
    const filteredPhotos = data.photos.filter((p: any) => {
      const alt = (p.alt || '').toLowerCase()

      // REJECT: People, interiors, close-ups, food, statues, night, street, B&W, military, silhouettes, bridges, nature close-ups, stadiums, objects, sky-only
      // PRIORITY: ONLY locations and environments - NO people, NO objects, NO things
      const rejectKeywords = [
        // People (AGGRESSIVE - reject ALL people)
        'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
        'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
        'laughing', 'smiling', 'nude', 'naked', 'model', 'couple', 'family', 'group',
        'walking', 'standing', 'sitting', 'running', 'jumping',
        // Sports & Stadiums (CRITICAL: Filter out all sports venues)
        'stadium', 'stadiums', 'arena', 'arenas', 'sports', 'football', 'soccer', 'baseball',
        'basketball', 'tennis', 'field', 'pitch', 'court', 'track', 'game', 'match',
        // Objects & Things (NEW - reject objects, not environments)
        'car', 'cars', 'vehicle', 'bike', 'bicycle', 'motorcycle', 'boat', 'ship',
        'plane', 'airplane', 'train', 'bus', 'tram',
        // Interiors
        'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
        // Vehicles & Transport
        'car', 'vehicle', 'food', 'dish', 'meal', 'restaurant interior', 'bus', 'train',
        // Close-ups & Details
        'close-up', 'closeup', 'detail', 'macro',
        // Statues & Art
        'statue', 'sculpture', 'monument statue', 'bronze', 'marble statue',
        // Night & Dark
        'night', 'evening', 'dark', 'nighttime', 'illuminated', 'lights at night',
        // Street level (too close)
        'street view', 'sidewalk', 'pavement', 'crosswalk', 'pedestrian',
        // Black & White
        'black and white', 'monochrome', 'grayscale', 'b&w', 'bw',
        // Military & War
        'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
        // Silhouettes
        'silhouette', 'silhouetted', 'shadow', 'backlit',
        // Bridges (too common, not distinctive)
        'bridge', 'bridges', 'overpass', 'viaduct',
        // Sports & Activities
        'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
        // Architecture Details
        'facade', 'building facade', 'wall', 'door',
        // Image Quality
        'transparent', 'png', 'cutout', 'isolated',
        // Nature Close-ups (AGGRESSIVE - no close-ups, only environments)
        'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar',
        'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet',
        'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider',
        // Sky-Only & Sunset (AGGRESSIVE - no sky-only images)
        'sky only', 'clouds only', 'cloud', 'sunset', 'sunrise', 'dawn', 'dusk',
        'twilight', 'golden hour', 'magic hour', 'dramatic sky',
        // Signs & Text
        'sign', 'signs', 'signage', 'text', 'billboard', 'graffiti', 'writing'
      ]
      if (rejectKeywords.some(kw => alt.includes(kw))) {
        return false
      }

      // Check if image is likely B&W (Pexels doesn't always tag it)
      // Skip images with "black", "white", "gray" in description
      if (alt.includes('black') || alt.includes('white') || alt.includes('gray') || alt.includes('grey')) {
        return false
      }

      // PREFER: PRIORITY - Locations and environments ONLY
      // NO people, NO objects, NO sky-only, NO stadiums - JUST locations and environments
      const preferKeywords = [
        // Cityscapes & Urban Environments
        'city', 'skyline', 'aerial', 'view', 'cityscape', 'panorama', 'downtown', 'urban',
        // Architecture & Buildings (as part of environment)
        'architecture', 'building', 'tower', 'cathedral', 'monument', 'landmark',
        'palace', 'castle', 'temple', 'mosque', 'church',
        // Natural Landscapes & Environments
        'landscape', 'mountain', 'valley', 'coastline', 'beach', 'ocean', 'lake', 'river',
        'forest', 'countryside', 'hills', 'cliffs',
        // Daytime & Clear Views
        'daytime', 'day', 'blue sky', 'sunny'
      ]
      return preferKeywords.some(kw => alt.includes(kw))
    })

    // Use the FIRST filtered image (highest quality match)
    const bestPhoto = filteredPhotos[0] || data.photos[0]

    if (bestPhoto?.src?.original) {
      console.log(`✅ Pexels ORIGINAL: Found for "${searchTerm}" (filtered ${filteredPhotos.length}/${data.photos.length})`)
      return bestPhoto.src.original
    }

    if (bestPhoto?.src?.large2x) {
      console.log(`✅ Pexels LARGE2X: Found for "${searchTerm}" (filtered ${filteredPhotos.length}/${data.photos.length})`)
      return bestPhoto.src.large2x
    }

    return null
  } catch (error) {
    console.error('Pexels error:', error)
    return null
  }
}

/**
 * Unsplash - Request full/raw size WITH SMART FILTERING FOR FEATURED IMAGE
 */
async function fetchUnsplashHighRes(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) return null

  try {
    // Fetch MORE images to filter from (10 instead of 1)
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape`,
      { headers: { 'Authorization': `Client-ID ${apiKey}` } }
    )

    if (!response.ok) return null
    const data = await response.json()

    if (!data.results || data.results.length === 0) return null

    // SMART FILTERING: Find the BEST cityscape/landmark image
    const filteredResults = data.results.filter((r: any) => {
      const description = (r.description || r.alt_description || '').toLowerCase()

      // REJECT: People, interiors, close-ups, food, statues, night, street, B&W, military, silhouettes, bridges, sports, facades, nature close-ups, stadiums, objects, sky-only
      // PRIORITY: ONLY locations and environments - NO people, NO objects, NO things
      const rejectKeywords = [
        // People (AGGRESSIVE - reject ALL people)
        'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
        'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
        'laughing', 'smiling', 'nude', 'naked', 'model', 'couple', 'family', 'group',
        'walking', 'standing', 'sitting', 'running', 'jumping',
        // Sports & Stadiums (CRITICAL: Filter out all sports venues)
        'stadium', 'stadiums', 'arena', 'arenas', 'sports', 'football', 'soccer', 'baseball',
        'basketball', 'tennis', 'field', 'pitch', 'court', 'track', 'game', 'match',
        // Objects & Things (NEW - reject objects, not environments)
        'car', 'cars', 'vehicle', 'bike', 'bicycle', 'motorcycle', 'boat', 'ship',
        'plane', 'airplane', 'train', 'bus', 'tram',
        // Interiors
        'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
        // Vehicles & Transport
        'car', 'vehicle', 'food', 'dish', 'meal', 'restaurant interior', 'bus', 'train',
        // Close-ups & Details
        'close-up', 'closeup', 'detail', 'macro',
        // Statues & Art
        'statue', 'sculpture', 'monument statue', 'bronze', 'marble statue',
        // Night & Dark
        'night', 'evening', 'dark', 'nighttime', 'illuminated', 'lights at night',
        // Street level (too close)
        'street view', 'sidewalk', 'pavement', 'crosswalk', 'pedestrian',
        // Black & White
        'black and white', 'monochrome', 'grayscale', 'b&w', 'bw',
        // Military & War
        'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
        // Silhouettes
        'silhouette', 'silhouetted', 'shadow', 'backlit',
        // Bridges (too common, not distinctive)
        'bridge', 'bridges', 'overpass', 'viaduct',
        // Sports & Activities
        'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
        // Architecture Details
        'facade', 'building facade', 'wall', 'door',
        // Image Quality
        'transparent', 'png', 'cutout', 'isolated',
        // Nature Close-ups (AGGRESSIVE - no close-ups, only environments)
        'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar',
        'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet',
        'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider',
        // Sky-Only & Sunset (AGGRESSIVE - no sky-only images)
        'sky only', 'clouds only', 'cloud', 'sunset', 'sunrise', 'dawn', 'dusk',
        'twilight', 'golden hour', 'magic hour', 'dramatic sky',
        // Signs & Text
        'sign', 'signs', 'signage', 'text', 'billboard', 'graffiti', 'writing'
      ]
      if (rejectKeywords.some(kw => description.includes(kw))) {
        return false
      }

      // Check if image is likely B&W
      if (description.includes('black') || description.includes('white') || description.includes('gray') || description.includes('grey')) {
        return false
      }

      // PREFER: PRIORITY - Locations and environments ONLY
      // NO people, NO objects, NO sky-only, NO stadiums - JUST locations and environments
      const preferKeywords = [
        // Cityscapes & Urban Environments
        'city', 'skyline', 'aerial', 'view', 'cityscape', 'panorama', 'downtown', 'urban',
        // Architecture & Buildings (as part of environment)
        'architecture', 'building', 'tower', 'cathedral', 'monument', 'landmark',
        'palace', 'castle', 'temple', 'mosque', 'church',
        // Natural Landscapes & Environments
        'landscape', 'mountain', 'valley', 'coastline', 'beach', 'ocean', 'lake', 'river',
        'forest', 'countryside', 'hills', 'cliffs',
        // Daytime & Clear Views
        'daytime', 'day', 'blue sky', 'sunny'
      ]
      return preferKeywords.some(kw => description.includes(kw))
    })

    // Use the FIRST filtered image (highest quality match)
    const bestResult = filteredResults[0] || data.results[0]

    if (bestResult?.urls?.full) {
      console.log(`✅ Unsplash FULL: Found for "${searchTerm}" (filtered ${filteredResults.length}/${data.results.length})`)
      return bestResult.urls.full
    }

    return null
  } catch (error) {
    console.error('Unsplash error:', error)
    return null
  }
}

/**
 * Reddit ULTRA-FILTERED - Fetch ONLY city/architecture/landscape images (NO API KEY!)
 * Uses 10 STRICT FILTERS to remove ALL non-environment content
 * UPGRADED: Same filtering as test page Reddit ULTRA method
 */
export async function fetchRedditImages(
  locationName: string,
  count: number = 20,
  country?: string,
  region?: string
): Promise<string[]> {
  const images: string[] = []

  // Build context-aware search query
  let searchQuery = locationName
  if (country && country !== locationName && !locationName.includes(country)) {
    searchQuery += ` ${country}`
  }

  console.log(`🔍 [REDDIT] Context-aware search: "${searchQuery}"`)

  // STRATEGY: Search travel photography subreddits for location name
  const travelSubreddits = [
    'CityPorn',        // Urban landscapes
    'EarthPorn',       // Natural landscapes
    'ArchitecturePorn', // Buildings
    'VillagePorn',     // Small towns
    'TravelPics',      // Travel photography
    'travel',          // General travel
    'itookapicture',   // Photography
    'pics'             // General high-quality photos
  ]

  try {
    for (const subreddit of travelSubreddits) {
      if (images.length >= count) break

      // Search subreddit for location name with country context
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=top&t=all&limit=50`

      const response = await withRedditLimit(() =>
        fetchWithTimeout(
          searchUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
            }
          },
          6000
        )
      )

      if (!response.ok) {
        console.warn(`⚠️ [REDDIT] r/${subreddit} returned ${response.status}`)
        continue
      }

      const data = await response.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        if (images.length >= count) break

        const postData = post.data
        const imageUrl = postData.url
        const title = (postData.title || '').toLowerCase()

        // Only accept direct image URLs
        if (!imageUrl || !imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)) continue

        // ULTRA-STRICT FILTERING - 10 FILTERS

        // 1. REJECT: People, faces, selfies, portraits
        const rejectPeople = [
          'selfie', 'portrait', 'me ', 'my ', 'face', 'person', 'people', 'crowd', 'tourist',
          'wedding', 'bride', 'groom', 'couple', 'family', 'cosplay', 'costume', 'wearing'
        ]
        if (rejectPeople.some(kw => title.includes(kw))) continue

        // 2. REJECT: Food, restaurants, meals
        const rejectFood = [
          'food', 'meal', 'dish', 'restaurant', 'cafe', 'coffee',
          'breakfast', 'lunch', 'dinner', 'dessert', 'pizza',
          'burger', 'sushi', 'ramen', 'cuisine', 'recipe',
          'cooking', 'ate', 'eating', 'delicious', 'tasty'
        ]
        if (rejectFood.some(kw => title.includes(kw))) continue

        // 3. REJECT: Art, drawings, renders, digital content
        const rejectArt = [
          'drawing', 'painting', 'art', 'sketch', 'illustration',
          'render', 'rendered', '3d', 'digital', 'photoshop',
          'edited', 'composite', 'manipulation', 'ai generated',
          'midjourney', 'dalle', 'stable diffusion', 'anime', 'manga',
          'cartoon', 'comic', 'meme', 'funny', 'lol'
        ]
        if (rejectArt.some(kw => title.includes(kw))) continue

        // 4. REJECT: Animals, pets, wildlife
        const rejectAnimals = [
          'dog', 'cat', 'pet', 'puppy', 'kitten', 'bird',
          'animal', 'wildlife', 'zoo', 'aquarium', 'fish'
        ]
        if (rejectAnimals.some(kw => title.includes(kw))) continue

        // 5. REJECT: Indoor, interiors, museums
        const rejectIndoor = [
          'museum', 'gallery', 'exhibition', 'interior', 'inside',
          'room', 'bedroom', 'bathroom', 'kitchen', 'office',
          'hotel room', 'apartment', 'sleek'
        ]
        if (rejectIndoor.some(kw => title.includes(kw))) continue

        // 6. REJECT: Screenshots, graphs, maps, diagrams
        const rejectDigital = [
          'screenshot', 'graph', 'chart', 'map', 'diagram',
          'infographic', 'data', 'statistics', 'guide'
        ]
        if (rejectDigital.some(kw => title.includes(kw))) continue

        // 7. REJECT: Questions, discussions, text posts
        const rejectText = [
          'question', 'help', 'advice', 'recommend', 'suggestion',
          'what', 'where', 'how', 'why', 'when', 'should i',
          'anyone know', 'does anyone', 'can someone'
        ]
        if (rejectText.some(kw => title.includes(kw))) continue

        // 8. POSITIVE SIGNALS: Prefer these keywords
        const preferKeywords = [
          'view', 'skyline', 'cityscape', 'landscape', 'architecture',
          'building', 'street', 'downtown', 'city', 'town',
          'sunset', 'sunrise', 'night', 'evening', 'morning',
          'aerial', 'panorama', 'vista', 'scenery', 'beautiful'
        ]
        const hasPositiveSignal = preferKeywords.some(kw => title.includes(kw))

        // 9. QUALITY SCORE: Prefer posts with higher scores
        const score = postData.score || 0
        if (score < 50 && !hasPositiveSignal) continue // Skip low-quality posts without positive signals

        images.push(imageUrl)
      }

      if (images.length > 0) {
        console.log(`✅ [REDDIT] r/${subreddit}: Found ${images.length} images so far`)
      }
    }

    if (images.length > 0) {
      console.log(`✅ [REDDIT] Total: ${images.length} ULTRA-FILTERED images for "${locationName}"`)
      console.log(`   First image: ${images[0].substring(0, 100)}...`)
    } else {
      console.warn(`⚠️ [REDDIT] No images found for "${locationName}"`)
    }

    return images

  } catch (error) {
    console.error(`❌ [REDDIT] Error:`, error)
    return images
  }
}

/**
 * Flickr ULTRA-FILTERED - Fetch ONLY city/architecture/landscape images (NO API KEY!)
 * Uses same 10 STRICT FILTERS as Reddit ULTRA
 * NEW: Added to production image service
 */
async function fetchFlickrImages(locationName: string, count: number = 20): Promise<string[]> {
  const images: string[] = []

  try {
    console.log(`Fetching Flickr ULTRA images for "${locationName}"`)

    // Flickr public feed - NO API KEY REQUIRED!
    const searchUrl = `https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(locationName)}&format=json&nojsoncallback=1`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
      }
    })

    if (!response.ok) {
      console.error('Flickr API error:', response.status)
      return []
    }

    const data = await response.json()
    const items = data?.items || []

    console.log(`Found ${items.length} Flickr photos for "${locationName}"`)

    // ULTRA-STRICT FILTERING (same as Reddit ULTRA)
    for (const item of items) {
      if (images.length >= count) break

      // Get image URL (use larger size if available)
      const imageUrl = item.media?.m
      if (!imageUrl) continue

      // Replace _m.jpg with _b.jpg for larger size
      const largerUrl = imageUrl.replace('_m.jpg', '_b.jpg').replace('_m.png', '_b.png')

      const title = (item.title || '').toLowerCase()
      const tags = (item.tags || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      const combined = `${title} ${tags} ${description}`

      // LIGHTER FILTERING for Flickr (only reject obvious bad content)
      // Flickr tags are usually good, so we don't need to be as strict as Reddit

      // 1. REJECT: People portraits (but allow cityscapes with people in background)
      const rejectPeople = ['selfie', 'portrait', 'face', 'wedding', 'bride', 'groom']
      if (rejectPeople.some(kw => combined.includes(kw))) continue

      // 2. REJECT: Food close-ups
      const rejectFood = ['food', 'meal', 'dish', 'pizza', 'burger', 'sushi', 'recipe', 'cooking']
      if (rejectFood.some(kw => combined.includes(kw))) continue

      // 3. REJECT: Art/digital content
      const rejectArt = ['drawing', 'painting', 'sketch', 'render', '3d', 'digital art', 'anime', 'cartoon', 'meme']
      if (rejectArt.some(kw => combined.includes(kw))) continue

      // If passed basic filters, include the image
      images.push(largerUrl)
    }

    console.log(`✅ Flickr ULTRA: Filtered to ${images.length} images for "${locationName}"`)
    return images

  } catch (error) {
    console.error('❌ Flickr ULTRA error:', error)
    return []
  }
}

/**
 * Openverse API - Aggregates 800M+ CC-licensed images (NO API KEY NEEDED!)
 * Uses api.openverse.engineering (stable endpoint)
 * Includes Flickr, Wikimedia, Europeana, and 50+ other sources
 */
async function fetchOpenverseImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(searchTerm)}&license=by,by-sa,cc0&size=large&orientation=landscape&page_size=${count}`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.log(`⚠️ Openverse: ${response.status} for "${searchTerm}"`)
      return []
    }

    const data = await response.json()
    const images = data.results?.map((img: any) => img.url).filter((url: string) => url) || []

    if (images.length > 0) {
      console.log(`✅ Openverse: Found ${images.length} images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('Openverse error:', error)
    return []
  }
}

/**
 * Europeana API - 50M+ cultural heritage images (museums, archives)
 * Great for historical/landmark travel shots - CC0/PD focus
 */
async function fetchEuropeanaImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const apiKey = process.env.EUROPEANA_API_KEY || 'api2demo'

    const response = await fetch(
      `https://www.europeana.eu/api/v2/search.json?wskey=${apiKey}&query=${encodeURIComponent(searchTerm)}&qf=IMAGE+rights:(CC0+OR+http://www.europeana.eu/rights/rr-f/)&media=true&rows=${count}`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.log(`⚠️ Europeana: ${response.status} for "${searchTerm}"`)
      return []
    }

    const data = await response.json()
    const images = data.items
      ?.map((item: any) => item.edmPreview?.[0] || item.guid)
      .filter((url: string) => url && url.startsWith('http')) || []

    if (images.length > 0) {
      console.log(`✅ Europeana: Found ${images.length} CC0/PD images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('Europeana error:', error)
    return []
  }
}

/**
 * Smithsonian Open Access - 4.5M+ CC0/PD images from US museums
 * Strong for cultural/natural travel sites
 */
async function fetchSmithsonianImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const apiKey = process.env.SMITHSONIAN_API_KEY
    if (!apiKey) return []

    const response = await fetch(
      `https://api.si.edu/openaccess/api/v1.0/search?api_key=${apiKey}&q=${encodeURIComponent(searchTerm)}&rows=${count}&f.data_source=Smithsonian&f.terms=online_media_type:Images+rights:CC0`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.log(`⚠️ Smithsonian: ${response.status} for "${searchTerm}"`)
      return []
    }

    const data = await response.json()
    const images = data.response?.rows
      ?.map((row: any) => row.content?.descriptiveNonRepeating?.online_media?.media?.[0]?.content)
      .filter((url: string) => url && url.startsWith('http')) || []

    if (images.length > 0) {
      console.log(`✅ Smithsonian: Found ${images.length} CC0 images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('Smithsonian error:', error)
    return []
  }
}

/**
 * NYPL Digital Collections - Historical travel images (maps, photos), all PD
 */
async function fetchNYPLImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const apiKey = process.env.NYPL_API_KEY
    if (!apiKey) return []

    const response = await fetch(
      `http://api.repo.nypl.org/api/v1/items/search?q=${encodeURIComponent(searchTerm)}&publicDomainOnly=true&per_page=${count}`,
      {
        headers: {
          'Authorization': `Token token=${apiKey}`,
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.log(`⚠️ NYPL: ${response.status} for "${searchTerm}"`)
      return []
    }

    const data = await response.json()
    const images = data.nyplAPI?.response?.capture
      ?.map((item: any) => item.imageID ? `http://images.nypl.org/${item.imageID}/t` : null)
      .filter((url: string) => url) || []

    if (images.length > 0) {
      console.log(`✅ NYPL: Found ${images.length} PD images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('NYPL error:', error)
    return []
  }
}

/**
 * Library of Congress - Free PD images, great for historical travel photos
 */
async function fetchLibraryOfCongressImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const response = await fetch(
      `https://www.loc.gov/search/?q=${encodeURIComponent(searchTerm)}&fo=json&c=${count}&at=results`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.log(`⚠️ Library of Congress: ${response.status} for "${searchTerm}"`)
      return []
    }

    const data = await response.json()
    const images = data.results
      ?.filter((item: any) => item.image_url && item.rights?.includes('public domain'))
      ?.map((item: any) => item.image_url?.[0])
      .filter((url: string) => url && url.startsWith('http')) || []

    if (images.length > 0) {
      console.log(`✅ Library of Congress: Found ${images.length} PD images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('Library of Congress error:', error)
    return []
  }
}

/**
 * Met Museum - PD/CC0 art and photos, some travel-related
 */
async function fetchMetMuseumImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    // First, search for object IDs
    const searchResponse = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(searchTerm)}&isPublicDomain=true`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)',
          'Accept': 'application/json'
        }
      }
    )

    if (!searchResponse.ok) return []

    const searchData = await searchResponse.json()
    const objectIDs = searchData.objectIDs?.slice(0, count) || []

    if (objectIDs.length === 0) return []

    // Fetch details for each object to get image URLs
    const imagePromises = objectIDs.map(async (id: number) => {
      try {
        const objResponse = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
        )
        if (!objResponse.ok) return null
        const objData = await objResponse.json()
        return objData.primaryImage || objData.primaryImageSmall
      } catch {
        return null
      }
    })

    const images = (await Promise.all(imagePromises))
      .filter((url: string | null) => url && url.startsWith('http')) as string[]

    if (images.length > 0) {
      console.log(`✅ Met Museum: Found ${images.length} PD images for "${searchTerm}"`)
    }
    return images
  } catch (error) {
    console.error('Met Museum error:', error)
    return []
  }
}



/**
 * Generate better search terms for locations
 */
function generateLocationSearchTerms(locationName: string): string[] {
  return [
    `${locationName} cityscape`,
    `${locationName} skyline`,
    `${locationName} aerial view`,
    `${locationName} landmark`,
    `${locationName} architecture`,
    `${locationName} panorama`,
    `${locationName} city center`,
    `${locationName} downtown`,
    `${locationName} historic district`,
    `${locationName} famous buildings`,
    `${locationName} tourist attractions`,
    `${locationName} travel photography`,
    `${locationName} urban landscape`,
    `${locationName} city view`,
    `${locationName} monuments`
  ]
}

/**
 * Fetch HIGH QUALITY location image (single) with ENHANCED hierarchical fallback
 *
 * NEW: Uses smart hierarchical fallback system
 * - Searches Local → District → County → Regional → National → Continental → Global
 * - Fetches 1-5 images per level (not 20+) to avoid overwhelming APIs
 * - Stops when we have enough contextual images
 * - Caches results to avoid repeated API calls
 *
 * @param locationName - Primary location name (e.g., "Vilnius")
 * @param region - Region/state (e.g., "Vilnius County")
 * @param country - Country (e.g., "Lithuania")
 * @param additionalData - Optional district, county, continent data
 */
export async function fetchLocationImageHighQuality(
  locationName: string,
  manualUrl?: string,
  region?: string,
  country?: string,
  additionalData?: {
    district?: string
    county?: string
    continent?: string
  }
): Promise<string> {
  if (manualUrl && !isPlaceholderImage(manualUrl)) {
    return manualUrl
  }

  const cacheKey = `location-hq:${locationName}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url
  }

  console.log(`🔍 Fetching HIGH QUALITY FEATURED image with ENHANCED hierarchical fallback`)
  console.log(`   📍 Location: ${locationName}`)
  if (region) console.log(`   📍 Region: ${region}`)
  if (country) console.log(`   📍 Country: ${country}`)
  if (additionalData?.district) console.log(`   📍 District: ${additionalData.district}`)
  if (additionalData?.county) console.log(`   📍 County: ${additionalData.county}`)

  // NEW: Use enhanced hierarchical fallback system
  const {
    parseLocationHierarchy,
    fetchImagesWithHierarchicalFallback,
    flattenHierarchicalResults
  } = await import('./hierarchicalImageFallback')

  const hierarchy = parseLocationHierarchy(locationName, region, country, additionalData)
  const hierarchicalResults = await fetchImagesWithHierarchicalFallback(hierarchy, 5) // Only need 1-5 for featured
  const hierarchicalImages = flattenHierarchicalResults(hierarchicalResults, 5)

  if (hierarchicalImages.length > 0) {
    console.log(`✅ Found ${hierarchicalImages.length} images via hierarchical fallback`)
    const bestImage = hierarchicalImages[0]
    imageCache.set(cacheKey, { url: bestImage, timestamp: Date.now() })
    return bestImage
  }

  // FALLBACK: Original hierarchical search (city → region → country)
  console.log(`⚠️ Hierarchical fallback found no images, trying original search...`)
  const searchLevels = [
    { name: locationName, level: 'city', priority: 10 },
    ...(region ? [{ name: region, level: 'region', priority: 7 }] : []),
    ...(country ? [{ name: country, level: 'country', priority: 5 }] : [])
  ]

  // QUERY ALL PROVIDERS IN PARALLEL - Mix results for best quality
  const allCandidates: Array<{ url: string; source: string; score: number; level: string }> = []
  const fetchPromises: Promise<void>[] = []

  // For each location level, try multiple search terms
  for (const { name, level, priority } of searchLevels) {
    const searchTerms = [
      `${name} skyline cityscape`,      // Best: Full city view
      `${name} aerial view city`,       // Best: Aerial cityscape
      `${name} panorama`,               // Best: Wide panoramic view
      `${name} landmark architecture`,  // Good: Iconic buildings
      `${name} downtown`                // Good: City center
    ]

    // PRIORITY #1: Brave Search API (FANTASTIC high-quality images!)
    console.log(`🥇 PRIORITY #1: Brave Search API for "${name}"...`)
    fetchPromises.push(
      fetchBraveImages(name, 10, country, region)
        .then(urls => {
          if (urls.length > 0) {
            console.log(`✅ Brave API: Found ${urls.length} fantastic images for "${name}"`)
            urls.forEach(url => {
              allCandidates.push({
                url,
                source: 'Brave API',
                score: priority + 20, // HIGHEST PRIORITY - Brave is best!
                level
              })
            })
          }
        })
        .catch(err => console.error('Brave API error:', err))
    )

    // PRIORITY #2: Reddit ULTRA (BEST location-specific images with 10 STRICT FILTERS!)
    console.log(`🥈 PRIORITY #2: Reddit ULTRA for "${name}"...`)
    fetchPromises.push(
      fetchRedditImages(name, 5)
        .then(urls => {
          if (urls.length > 0) {
            console.log(`✅ Reddit ULTRA: Found ${urls.length} ULTRA-FILTERED images for "${name}"`)
            urls.forEach(url => {
              allCandidates.push({
                url,
                source: 'Reddit ULTRA',
                score: priority + 18, // Second priority - Reddit ULTRA is excellent!
                level
              })
            })
          }
        })
        .catch(err => console.error(`Reddit ULTRA error for "${name}":`, err))
    )

    // PRIORITY #3: Pexels (high quality stock photos with URL validation)
    for (const term of searchTerms) {
      fetchPromises.push(
        fetchPexelsHighRes(term)
          .then(url => {
            if (url && url.startsWith('http') && !url.includes('placeholder') && !url.includes('undefined')) {
              allCandidates.push({
                url,
                source: 'Pexels',
                score: priority + 15, // Third priority - validated URLs only
                level
              })
            }
          })
          .catch(err => console.error('Pexels error:', err))
      )
    }

    // PRIORITY #4: Flickr ULTRA (NO API KEY! Same strict filtering as Reddit)
    console.log(`📍 PRIORITY #4: Flickr ULTRA for "${name}"...`)
    fetchPromises.push(
      fetchFlickrImages(name, 5)
        .then(urls => {
          if (urls.length > 0) {
            console.log(`✅ Flickr ULTRA: Found ${urls.length} filtered images for "${name}"`)
            urls.forEach(url => {
              allCandidates.push({
                url,
                source: 'Flickr ULTRA',
                score: priority + 12, // Fourth priority
                level
              })
            })
          }
        })
        .catch(err => console.error('Flickr ULTRA error:', err))
    )

    // PRIORITY #5: Unsplash (high quality, 50/hour)
    for (const term of searchTerms) {
      fetchPromises.push(
        fetchUnsplashHighRes(term)
          .then(url => {
            if (url) {
              allCandidates.push({
                url,
                source: 'Unsplash',
                score: priority + 9,
                level
              })
            }
          })
          .catch(err => console.error('Unsplash error:', err))
      )
    }

    // PRIORITY #6: Wikimedia (free, high-res available)
    for (const term of searchTerms) {
      fetchPromises.push(
        fetchWikimediaHighRes(term)
          .then(url => {
            if (url) {
              allCandidates.push({
                url,
                source: 'Wikimedia',
                score: priority + 7,
                level
              })
            }
          })
          .catch(err => console.error('Wikimedia error:', err))
      )
    }

    // PRIORITY #7: Wikipedia original
    fetchPromises.push(
      fetchWikipediaHighRes(name)
        .then(url => {
          if (url) {
            allCandidates.push({
              url,
              source: 'Wikipedia',
              score: priority + 8,
              level
            })
          }
        })
        .catch(err => console.error('Wikipedia error:', err))
    )
  }

  // Wait for all providers to respond
  console.log(`⏳ Waiting for ${fetchPromises.length} image providers to respond...`)
  await Promise.all(fetchPromises)

  // CRITICAL: Validate all image URLs before using them
  const validCandidates = allCandidates.filter(candidate => {
    const url = candidate.url

    // Must be a valid HTTP/HTTPS URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      console.warn(`❌ Invalid URL (not HTTP): "${url?.substring(0, 50)}..."`)
      return false
    }

    // Must not contain non-Latin characters (Arabic, Berber, etc.)
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u2D30-\u2D7F]/.test(url)) {
      console.warn(`❌ Invalid URL (contains non-Latin characters): "${url.substring(0, 50)}..."`)
      return false
    }

    // Must have a valid image extension or be from known image CDN
    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
    const isKnownCDN = url.includes('unsplash.com') ||
                       url.includes('imgur.com') ||
                       url.includes('reddit.com') ||
                       url.includes('imgs.search.brave.com') ||
                       url.includes('wikimedia.org') ||
                       url.includes('pexels.com')

    if (!hasImageExtension && !isKnownCDN) {
      console.warn(`❌ Invalid URL (no image extension or known CDN): "${url.substring(0, 50)}..."`)
      return false
    }

    return true
  })

  // Log results from each provider
  console.log(`📊 Image fetch results:`)
  console.log(`   Total candidates: ${allCandidates.length}`)
  console.log(`   Valid candidates: ${validCandidates.length}`)
  console.log(`   Rejected: ${allCandidates.length - validCandidates.length}`)

  if (validCandidates.length > 0) {
    const bySource = validCandidates.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} valid images`)
    })
  }

  // Pick the BEST image (highest score = city-level + provider quality)
  if (validCandidates.length > 0) {
    const best = validCandidates.sort((a, b) => b.score - a.score)[0]
    console.log(`✅ Selected BEST featured image:`)
    console.log(`   Source: ${best.source}`)
    console.log(`   Level: ${best.level}`)
    console.log(`   Score: ${best.score}`)
    console.log(`   URL: ${best.url.substring(0, 100)}...`)
    imageCache.set(cacheKey, { url: best.url, timestamp: Date.now() })
    return best.url
  }

  // High-quality fallback instead of placeholder
  console.warn(`⚠️ No featured image found from ANY provider for "${locationName}"`)
  console.warn(`   Brave API: Check if API key is set`)
  console.warn(`   Reddit: Check if subreddits are accessible`)
  console.warn(`   Using country-specific fallback for: ${country}`)
  return getLocationFallbackImage(locationName, country)
}

/**
 * Fetch HIGH QUALITY location gallery (20+ images) with ENHANCED hierarchical fallback
 *
 * NEW: Uses smart hierarchical fallback system
 * - Searches Local → District → County → Regional → National → Continental → Global
 * - Fetches 1-5 images per level until we have enough
 * - Stops when we reach target count
 * - Caches results to avoid repeated API calls
 *
 * @param locationName - Primary location name
 * @param count - Target number of images
 * @param region - Region/state for fallback
 * @param country - Country for fallback
 * @param additionalData - Optional district, county, continent data
 */
export async function fetchLocationGalleryHighQuality(
  locationName: string,
  count: number = 20,
  region?: string,
  country?: string,
  additionalData?: {
    district?: string
    county?: string
    continent?: string
  }
): Promise<string[]> {
  console.log(`🖼️ Fetching ${count} HIGH QUALITY gallery images with ENHANCED hierarchical fallback`)
  console.log(`   📍 Location: ${locationName}`)
  if (region) console.log(`   📍 Region: ${region}`)
  if (country) console.log(`   📍 Country: ${country}`)
  if (additionalData?.district) console.log(`   📍 District: ${additionalData.district}`)
  if (additionalData?.county) console.log(`   📍 County: ${additionalData.county}`)

  // NEW: Use enhanced hierarchical fallback system
  const {
    parseLocationHierarchy,
    fetchImagesWithHierarchicalFallback,
    flattenHierarchicalResults
  } = await import('./hierarchicalImageFallback')

  const hierarchy = parseLocationHierarchy(locationName, region, country, additionalData)
  const hierarchicalResults = await fetchImagesWithHierarchicalFallback(hierarchy, count)
  const hierarchicalImages = flattenHierarchicalResults(hierarchicalResults, count)

  if (hierarchicalImages.length >= count * 0.5) {
    // If we got at least 50% of target from hierarchical search, use it
    console.log(`✅ Found ${hierarchicalImages.length} images via hierarchical fallback (target: ${count})`)
    return hierarchicalImages
  }

  // FALLBACK: Original search if hierarchical didn't find enough
  console.log(`⚠️ Hierarchical fallback found only ${hierarchicalImages.length} images, trying original search...`)

  const allImages: string[] = [...hierarchicalImages] // Start with what we have
  const fetchPromises: Promise<void>[] = []

  // HIERARCHICAL SEARCH: Prioritize city, fallback to region/country
  const searchNames = [locationName]
  if (region && region !== locationName) searchNames.push(region)
  if (country && country !== locationName && country !== region) searchNames.push(country)

  const primaryLocation = searchNames[0] // Use first (most specific) for search terms

  // PRIORITY #1: Brave Search API (FANTASTIC high-quality images!)
  console.log('🥇 PRIORITY #1: Brave Search API (fantastic high-quality images)...')
  fetchPromises.push(
    fetchBraveImages(primaryLocation, 20, country, region)
      .then(urls => {
        if (urls.length > 0) {
          console.log(`✅ Brave API: Found ${urls.length} fantastic images`)
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('Brave API error:', err))
  )

  // PRIORITY #2: Reddit ULTRA (BEST location-specific images with 10 STRICT FILTERS!)
  console.log('🥈 PRIORITY #2: Reddit ULTRA (travel photography subreddits with ULTRA-FILTERING)...')
  fetchPromises.push(
    fetchRedditImages(primaryLocation, 20)
      .then(urls => {
        if (urls.length > 0) {
          console.log(`✅ Reddit ULTRA: Found ${urls.length} ULTRA-FILTERED images`)
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('Reddit ULTRA error:', err))
  )

  // PRIORITY #3: Pexels (high quality stock photos with smart filtering + URL validation)
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    console.log('🥉 PRIORITY #3: Pexels (high-res images with smart filtering + URL validation)...')
    const pexelsSearchTerms = [
      `${primaryLocation} cityscape`,
      `${primaryLocation} skyline`,
      `${primaryLocation} architecture`,
      `${primaryLocation} landmark`,
      `${primaryLocation} aerial view`
    ]

    for (const term of pexelsSearchTerms) {
      fetchPromises.push(
        fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=15&orientation=landscape`,
          { headers: { 'Authorization': pexelsKey } }
        )
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.photos) {
              // SMART FILTERING: Only include images that are actually relevant
              const filteredPhotos = data.photos.filter((p: any) => {
                const alt = (p.alt || '').toLowerCase()
                const locationLower = primaryLocation.toLowerCase()

                // REJECT: People, interiors, statues, night, street level, B&W, military, silhouettes, bridges, sports, facades, nature close-ups, stadiums
                const rejectKeywords = [
                  // People (EXPANDED)
                  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
                  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
                  'laughing', 'smiling', 'nude', 'naked',
                  // Sports & Stadiums
                  'stadium', 'stadiums', 'arena', 'arenas', 'sports', 'football', 'soccer', 'baseball',
                  'basketball', 'tennis', 'field', 'pitch', 'court', 'track',
                  // Interiors
                  'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
                  // Vehicles
                  'car', 'vehicle', 'road trip', 'dashboard', 'bus', 'train',
                  // Statues & Art
                  'statue', 'sculpture', 'bronze', 'marble statue',
                  // Night & Dark
                  'night', 'evening', 'dark', 'nighttime', 'illuminated', 'lights at night',
                  // Street level (too close)
                  'street view', 'sidewalk', 'pavement', 'crosswalk', 'pedestrian',
                  // Black & White
                  'black and white', 'monochrome', 'grayscale', 'b&w', 'bw',
                  // Military & War
                  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
                  // Silhouettes
                  'silhouette', 'silhouetted', 'shadow', 'backlit',
                  // Bridges (too common, not distinctive)
                  'bridge', 'bridges', 'overpass', 'viaduct',
                  // Sports & Activities
                  'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
                  // Architecture Details
                  'facade', 'building facade', 'wall', 'door',
                  // Image Quality
                  'transparent', 'png', 'cutout', 'isolated',
                  // Nature Close-ups (AGGRESSIVE - no close-ups, only environments)
                  'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar',
                  'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet',
                  'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider',
                  // Sky-Only & Sunset (AGGRESSIVE - no sky-only images)
                  'sky only', 'clouds only', 'cloud', 'sunset', 'sunrise', 'dawn', 'dusk',
                  'twilight', 'golden hour', 'magic hour', 'dramatic sky',
                  // Signs & Text
                  'sign', 'signs', 'signage', 'text', 'billboard', 'graffiti', 'writing'
                ]
                if (rejectKeywords.some(kw => alt.includes(kw))) {
                  return false
                }

                // Check if image is likely B&W
                if (alt.includes('black') || alt.includes('white') || alt.includes('gray') || alt.includes('grey')) {
                  return false
                }

                // ACCEPT: PRIORITY - Locations and environments ONLY
                // NO people, NO objects, NO sky-only - JUST locations and environments
                const acceptKeywords = [
                  // Cityscapes & Urban Environments
                  'city', 'skyline', 'aerial', 'view', 'cityscape', 'panorama', 'downtown', 'urban',
                  // Architecture & Buildings (as part of environment)
                  'architecture', 'building', 'tower', 'cathedral', 'monument', 'landmark',
                  'palace', 'castle', 'temple', 'mosque', 'church', 'square', 'town',
                  // Natural Landscapes & Environments
                  'landscape', 'mountain', 'valley', 'coastline', 'beach', 'ocean', 'lake', 'river',
                  'forest', 'countryside', 'hills', 'cliffs',
                  // Daytime & Clear Views
                  'daytime', 'day', 'blue sky', 'sunny'
                ]
                const hasLocation = alt.includes(locationLower)
                const hasRelevantKeyword = acceptKeywords.some(kw => alt.includes(kw))

                return hasLocation || hasRelevantKeyword
              })

              // ✅ URL VALIDATION: Only include valid HTTP(S) URLs
              const validUrls = filteredPhotos
                .map((p: any) => p.src.original || p.src.large2x || p.src.large)
                .filter((url: string) => {
                  // Must be valid HTTP(S) URL
                  if (!url || typeof url !== 'string') return false
                  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
                  // Reject placeholder patterns
                  if (url.includes('placeholder') || url.includes('undefined') || url.includes('null')) return false
                  return true
                })

              allImages.push(...validUrls)
              console.log(`✅ Pexels: ${validUrls.length}/${data.photos.length} valid images for "${term}"`)
            }
          })
          .catch(err => console.error('Pexels error:', err))
      )
    }
  }

  // PRIORITY #4: Flickr ULTRA (NO API KEY! Lighter filtering than Reddit)
  console.log('📍 PRIORITY #4: Flickr ULTRA (NO API KEY with lighter filtering)...')
  fetchPromises.push(
    fetchFlickrImages(primaryLocation, 20)
      .then(urls => {
        if (urls.length > 0) {
          console.log(`✅ Flickr ULTRA: Found ${urls.length} filtered images`)
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('Flickr ULTRA error:', err))
  )

  // 4. Openverse (800M+ images, NO API KEY NEEDED!)
  console.log('📸 Querying Openverse (api.openverse.engineering)...')
  const openverseTerms = [
    `${primaryLocation} cityscape`,
    `${primaryLocation} landmark`,
    `${primaryLocation} architecture`,
    `${primaryLocation} travel`
  ]

  for (const term of openverseTerms) {
    fetchPromises.push(
      fetchOpenverseImages(term, 5)
        .then(urls => {
          if (urls.length > 0) {
            allImages.push(...urls)
          }
        })
        .catch(err => console.error('Openverse error:', err))
    )
  }

  // 5. Europeana (50M+ cultural heritage images, NO API KEY NEEDED!)
  console.log('📸 Querying Europeana (museums & archives)...')
  const europeanaTerms = [
    `${primaryLocation}`,
    `${primaryLocation} monument`,
    `${primaryLocation} historic`
  ]

  for (const term of europeanaTerms) {
    fetchPromises.push(
      fetchEuropeanaImages(term, 5)
        .then(urls => {
          if (urls.length > 0) {
            allImages.push(...urls)
          }
        })
        .catch(err => console.error('Europeana error:', err))
    )
  }

  // 6. Unsplash API (high quality, 50/hour limit) - WITH SMART FILTERING
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    console.log('📸 Querying Unsplash for high-res images...')
    const searchTerms = [
      `${primaryLocation} cityscape`,
      `${primaryLocation} architecture`,
      `${primaryLocation} travel`
    ]

    for (const term of searchTerms) {
      fetchPromises.push(
        fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=15&orientation=landscape`,
          { headers: { 'Authorization': `Client-ID ${unsplashKey}` } }
        )
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.results) {
              // SMART FILTERING: Check description and tags
              const filteredResults = data.results.filter((r: any) => {
                const description = (r.description || r.alt_description || '').toLowerCase()
                const locationLower = primaryLocation.toLowerCase()

                // REJECT: People, interiors, statues, night, street level, B&W, military, silhouettes, bridges, sports, facades, nature close-ups, stadiums
                const rejectKeywords = [
                  // People (EXPANDED)
                  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
                  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
                  'laughing', 'smiling', 'nude', 'naked',
                  // Sports & Stadiums
                  'stadium', 'stadiums', 'arena', 'arenas', 'sports', 'football', 'soccer', 'baseball',
                  'basketball', 'tennis', 'field', 'pitch', 'court', 'track',
                  // Interiors
                  'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
                  // Vehicles
                  'car', 'vehicle', 'food', 'dish', 'meal', 'restaurant interior', 'bus', 'train',
                  // Statues & Art
                  'statue', 'sculpture', 'bronze', 'marble statue',
                  // Night & Dark
                  'night', 'evening', 'dark', 'nighttime', 'illuminated', 'lights at night',
                  // Street level (too close)
                  'street view', 'sidewalk', 'pavement', 'crosswalk', 'pedestrian',
                  // Black & White
                  'black and white', 'monochrome', 'grayscale', 'b&w', 'bw',
                  // Military & War
                  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
                  // Silhouettes
                  'silhouette', 'silhouetted', 'shadow', 'backlit',
                  // Bridges (too common, not distinctive)
                  'bridge', 'bridges', 'overpass', 'viaduct',
                  // Sports & Activities
                  'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
                  // Architecture Details
                  'facade', 'building facade', 'wall', 'door',
                  // Image Quality
                  'transparent', 'png', 'cutout', 'isolated',
                  // Nature Close-ups (AGGRESSIVE - no close-ups, only environments)
                  'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar',
                  'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet',
                  'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider',
                  // Sky-Only & Sunset (AGGRESSIVE - no sky-only images)
                  'sky only', 'clouds only', 'cloud', 'sunset', 'sunrise', 'dawn', 'dusk',
                  'twilight', 'golden hour', 'magic hour', 'dramatic sky',
                  // Signs & Text
                  'sign', 'signs', 'signage', 'text', 'billboard', 'graffiti', 'writing'
                ]
                if (rejectKeywords.some(kw => description.includes(kw))) {
                  return false
                }

                // Check if image is likely B&W
                if (description.includes('black') || description.includes('white') || description.includes('gray') || description.includes('grey')) {
                  return false
                }

                // ACCEPT: PRIORITY - Locations and environments ONLY
                // NO people, NO objects, NO sky-only - JUST locations and environments
                const acceptKeywords = [
                  // Cityscapes & Urban Environments
                  'city', 'skyline', 'aerial', 'view', 'cityscape', 'panorama', 'downtown', 'urban',
                  // Architecture & Buildings (as part of environment)
                  'architecture', 'building', 'tower', 'cathedral', 'monument', 'landmark',
                  'palace', 'castle', 'temple', 'mosque', 'church', 'square', 'town', 'historic',
                  // Natural Landscapes & Environments
                  'landscape', 'mountain', 'valley', 'coastline', 'beach', 'ocean', 'lake', 'river',
                  'forest', 'countryside', 'hills', 'cliffs',
                  // Daytime & Clear Views
                  'daytime', 'day', 'blue sky', 'sunny'
                ]
                const hasLocation = description.includes(locationLower)
                const hasRelevantKeyword = acceptKeywords.some(kw => description.includes(kw))

                return hasLocation || hasRelevantKeyword
              })

              const urls = filteredResults.map((r: any) => r.urls.full || r.urls.regular)
              allImages.push(...urls)
              console.log(`✅ Unsplash: ${urls.length}/${data.results.length} relevant images for "${term}"`)
            }
          })
          .catch(err => console.error('Unsplash error:', err))
      )
    }
  }

  // 5. Smithsonian Open Access (4.5M+ CC0/PD images)
  console.log('📸 Querying Smithsonian Open Access...')
  const smithsonianTerms = [
    `${locationName}`,
    `${locationName} landmark`
  ]

  for (const term of smithsonianTerms) {
    fetchPromises.push(
      fetchSmithsonianImages(term, 5)
        .then(urls => {
          if (urls.length > 0) {
            allImages.push(...urls)
          }
        })
        .catch(err => console.error('Smithsonian error:', err))
    )
  }

  // 6. NYPL Digital Collections (historical travel images, all PD)
  console.log('📸 Querying NYPL Digital Collections...')
  fetchPromises.push(
    fetchNYPLImages(locationName, 5)
      .then(urls => {
        if (urls.length > 0) {
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('NYPL error:', err))
  )

  // 7. Library of Congress (PD images, great for US destinations)
  console.log('📸 Querying Library of Congress...')
  fetchPromises.push(
    fetchLibraryOfCongressImages(locationName, 5)
      .then(urls => {
        if (urls.length > 0) {
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('Library of Congress error:', err))
  )

  // 8. Met Museum (PD/CC0 art and photos)
  console.log('📸 Querying Met Museum...')
  fetchPromises.push(
    fetchMetMuseumImages(locationName, 5)
      .then(urls => {
        if (urls.length > 0) {
          allImages.push(...urls)
        }
      })
      .catch(err => console.error('Met Museum error:', err))
  )

  // 9. Wikimedia Commons (free, high-res available)
  console.log('📸 Querying Wikimedia Commons for high-res images...')
  const wikiSearchTerms = generateLocationSearchTerms(locationName).slice(0, 8)

  for (const term of wikiSearchTerms) {
    fetchPromises.push(
      fetchWikimediaHighRes(term)
        .then(url => {
          if (url) {
            allImages.push(url)
            console.log(`✅ Wikimedia: Found image for "${term}"`)
          }
        })
        .catch(() => {})
    )

    fetchPromises.push(
      fetchWikipediaHighRes(term)
        .then(url => {
          if (url) {
            allImages.push(url)
            console.log(`✅ Wikipedia: Found image for "${term}"`)
          }
        })
        .catch(() => {})
    )
  }

  // Wait for all API calls
  await Promise.all(fetchPromises)

  // CRITICAL: Validate all image URLs before using them
  const validImages = allImages.filter(url => {
    // Must be a valid HTTP/HTTPS URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/'))) {
      console.warn(`❌ Invalid gallery URL (not HTTP): "${url?.substring(0, 50)}..."`)
      return false
    }

    // Must not contain non-Latin characters (Arabic, Berber, etc.)
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u2D30-\u2D7F]/.test(url)) {
      console.warn(`❌ Invalid gallery URL (contains non-Latin characters): "${url.substring(0, 50)}..."`)
      return false
    }

    return true
  })

  // Deduplicate
  const uniqueImages = Array.from(new Set(validImages))
  console.log(`🎉 Gallery images:`)
  console.log(`   Total fetched: ${allImages.length}`)
  console.log(`   Valid: ${validImages.length}`)
  console.log(`   Unique: ${uniqueImages.length}`)
  console.log(`   Rejected: ${allImages.length - validImages.length}`)

  // If we have fewer than 10 images, add community upload placeholder
  const MIN_IMAGES_THRESHOLD = 10
  if (uniqueImages.length < MIN_IMAGES_THRESHOLD) {
    console.log(`⚠️ Only ${uniqueImages.length} images found (target: ${count})`)
    console.log(`📸 Adding community upload placeholder to encourage contributions`)

    // Add a special placeholder that indicates community can upload
    const communityPlaceholder = `/api/placeholder/community-upload?location=${encodeURIComponent(locationName)}`
    uniqueImages.push(communityPlaceholder)
  }

  // Return requested count
  return uniqueImages.slice(0, count)
}

/**
 * Smart Fallback Gallery Fetcher with Backend Cache & User Uploads
 *
 * Priority order:
 * 1. Brave Search (primary - best quality)
 * 2. Reddit Ultra (secondary - if Brave fails)
 * 3. Backend cache (tertiary - existing location images < 1 month old)
 * 4. User-uploaded images (quaternary - community contributions)
 *
 * @param locationId - Location ID for backend cache lookup
 * @param locationName - Location name for Brave/Reddit search
 * @param count - Target number of images
 * @param region - Region for hierarchical fallback
 * @param country - Country for hierarchical fallback
 */
export async function fetchLocationGalleryWithSmartFallback(
  locationId: string,
  locationName: string,
  count: number = 20,
  region?: string,
  country?: string
): Promise<string[]> {
  console.log(`🎯 Smart Fallback Gallery Fetcher for "${locationName}"`)
  console.log(`   Priority: Brave → Reddit → Backend Cache (< 1mo) → User Uploads`)

  const allImages: string[] = []

  // PRIORITY #1: Brave Search API (FANTASTIC high-quality images!)
  console.log(`🥇 PRIORITY #1: Brave Search API...`)
  try {
    const braveUrls = await fetchBraveImages(locationName, 20, country, region)
    if (braveUrls.length > 0) {
      console.log(`✅ Brave: Found ${braveUrls.length} images - using these!`)
      allImages.push(...braveUrls)
      return allImages.slice(0, count)
    }
    console.log(`⚠️ Brave: No images found, trying Reddit...`)
  } catch (error) {
    console.error(`❌ Brave error:`, error)
  }

  // PRIORITY #2: Reddit ULTRA (if Brave failed)
  console.log(`🥈 PRIORITY #2: Reddit ULTRA...`)
  try {
    const redditUrls = await fetchRedditImages(locationName, 20, country, region)
    if (redditUrls.length > 0) {
      console.log(`✅ Reddit: Found ${redditUrls.length} images - using these!`)
      allImages.push(...redditUrls)
      return allImages.slice(0, count)
    }
    console.log(`⚠️ Reddit: No images found, checking backend cache...`)
  } catch (error) {
    console.error(`❌ Reddit error:`, error)
  }

  // PRIORITY #3: Backend Cache (existing location images < 1 month old)
  console.log(`🥉 PRIORITY #3: Backend Cache (< 1 month old)...`)
  try {
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServerSupabase()

    // Get existing location images that are less than 1 month old
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existingLocation, error } = await supabase
      .from('locations')
      .select('gallery_images, updated_at')
      .eq('id', locationId)
      .gt('updated_at', oneMonthAgo)
      .single()

    if (existingLocation?.gallery_images && Array.isArray(existingLocation.gallery_images)) {
      const validCacheImages = existingLocation.gallery_images.filter((url: string) => {
        // Filter out placeholders and invalid URLs
        if (!url || typeof url !== 'string') return false
        if (!url.startsWith('http')) return false
        if (url.includes('placeholder') || url.includes('undefined') || url.includes('null')) return false
        return true
      })

      if (validCacheImages.length > 0) {
        console.log(`✅ Backend Cache: Found ${validCacheImages.length} recent images - using these!`)
        allImages.push(...validCacheImages)
        return allImages.slice(0, count)
      }
    }
    console.log(`⚠️ Backend Cache: No recent images found, checking user uploads...`)
  } catch (error) {
    console.error(`❌ Backend cache error:`, error)
  }

  // PRIORITY #4: User-Uploaded Images (community contributions)
  console.log(`📍 PRIORITY #4: User-Uploaded Images...`)
  try {
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServerSupabase()

    // Get user-uploaded images for this location
    const { data: userImages, error } = await supabase
      .from('location_images')
      .select('image_url')
      .eq('location_id', locationId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (userImages && userImages.length > 0) {
      const userImageUrls = userImages
        .map((img: any) => img.image_url)
        .filter((url: string) => {
          if (!url || typeof url !== 'string') return false
          if (!url.startsWith('http')) return false
          if (url.includes('placeholder') || url.includes('undefined') || url.includes('null')) return false
          return true
        })

      if (userImageUrls.length > 0) {
        console.log(`✅ User Uploads: Found ${userImageUrls.length} community images - using these!`)
        allImages.push(...userImageUrls)
        return allImages.slice(0, count)
      }
    }
    console.log(`⚠️ User Uploads: No community images found`)
  } catch (error) {
    console.error(`❌ User uploads error:`, error)
  }

  // FALLBACK: Return empty array (no images available)
  console.log(`❌ No images found from any source - returning empty array`)
  return []
}


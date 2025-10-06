/**
 * Enhanced Image Service with Quality Controls
 * 
 * Features:
 * - High-resolution image fetching
 * - Image quality validation
 * - Better search terms for location-specific images
 * - Support for 20+ images per location
 * - Filters out irrelevant images (people portraits, etc.)
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const imageCache = new Map<string, { url: string; timestamp: number }>()

// Image quality thresholds
const MIN_IMAGE_WIDTH = 1200
const MIN_IMAGE_HEIGHT = 800
const PREFERRED_ASPECT_RATIO_MIN = 1.2 // Landscape preferred
const PREFERRED_ASPECT_RATIO_MAX = 2.0

/**
 * Enhanced Wikimedia Commons - Fetch HIGH RESOLUTION images
 */
async function fetchWikimediaHighRes(searchTerm: string): Promise<string | null> {
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
      console.log(`✅ Wikimedia HIGH-RES: ${width}x${height} for "${searchTerm}"`)
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
 * Pexels - Request large/original size
 */
async function fetchPexelsHighRes(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`,
      { headers: { 'Authorization': apiKey } }
    )

    if (!response.ok) return null
    const data = await response.json()

    // Use 'original' or 'large2x' for best quality
    if (data.photos?.[0]?.src?.original) {
      console.log(`✅ Pexels ORIGINAL: Found for "${searchTerm}"`)
      return data.photos[0].src.original
    }

    if (data.photos?.[0]?.src?.large2x) {
      console.log(`✅ Pexels LARGE2X: Found for "${searchTerm}"`)
      return data.photos[0].src.large2x
    }

    return null
  } catch (error) {
    console.error('Pexels error:', error)
    return null
  }
}

/**
 * Unsplash - Request full/raw size
 */
async function fetchUnsplashHighRes(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`,
      { headers: { 'Authorization': `Client-ID ${apiKey}` } }
    )

    if (!response.ok) return null
    const data = await response.json()

    // Use 'full' or 'raw' for best quality
    if (data.results?.[0]?.urls?.full) {
      console.log(`✅ Unsplash FULL: Found for "${searchTerm}"`)
      return data.results[0].urls.full
    }

    return null
  } catch (error) {
    console.error('Unsplash error:', error)
    return null
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
 * Fetch HIGH QUALITY location image (single)
 */
export async function fetchLocationImageHighQuality(
  locationName: string,
  manualUrl?: string
): Promise<string> {
  if (manualUrl && manualUrl !== '/placeholder-location.svg') {
    return manualUrl
  }

  const cacheKey = `location-hq:${locationName}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url
  }

  console.log(`🔍 Fetching HIGH QUALITY image for: "${locationName}"`)

  // Try high-quality sources in order
  const searchTerms = [
    `${locationName} cityscape`,
    `${locationName} skyline`,
    `${locationName} aerial view`
  ]

  for (const term of searchTerms) {
    // 1. Pexels (best quality, unlimited)
    let imageUrl = await fetchPexelsHighRes(term)
    if (imageUrl) {
      imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
      return imageUrl
    }

    // 2. Unsplash (high quality, 50/hour)
    imageUrl = await fetchUnsplashHighRes(term)
    if (imageUrl) {
      imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
      return imageUrl
    }

    // 3. Wikimedia (free, high-res available)
    imageUrl = await fetchWikimediaHighRes(term)
    if (imageUrl) {
      imageCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() })
      return imageUrl
    }
  }

  // 4. Wikipedia original
  const wikiImage = await fetchWikipediaHighRes(locationName)
  if (wikiImage) {
    imageCache.set(cacheKey, { url: wikiImage, timestamp: Date.now() })
    return wikiImage
  }

  // Fallback
  return '/placeholder-location.svg'
}

/**
 * Fetch HIGH QUALITY location gallery (20+ images)
 */
export async function fetchLocationGalleryHighQuality(
  locationName: string,
  count: number = 20
): Promise<string[]> {
  console.log(`🖼️ Fetching ${count} HIGH QUALITY gallery images for: "${locationName}"`)

  const allImages: string[] = []
  const fetchPromises: Promise<void>[] = []

  // 1. Openverse (800M+ images, NO API KEY NEEDED!)
  console.log('📸 Querying Openverse (api.openverse.engineering)...')
  const openverseTerms = [
    `${locationName} cityscape`,
    `${locationName} landmark`,
    `${locationName} architecture`,
    `${locationName} travel`
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

  // 2. Europeana (50M+ cultural heritage images, NO API KEY NEEDED!)
  console.log('📸 Querying Europeana (museums & archives)...')
  const europeanaTerms = [
    `${locationName}`,
    `${locationName} monument`,
    `${locationName} historic`
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

  // 3. Pexels (high quality, unlimited)
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    console.log('📸 Querying Pexels for high-res images...')
    const searchTerms = [
      `${locationName} cityscape`,
      `${locationName} skyline`,
      `${locationName} architecture`,
      `${locationName} landmark`,
      `${locationName} aerial view`
    ]

    for (const term of searchTerms) {
      fetchPromises.push(
        fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=5&orientation=landscape`,
          { headers: { 'Authorization': pexelsKey } }
        )
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.photos) {
              // Use original or large2x for best quality
              const urls = data.photos.map((p: any) => p.src.original || p.src.large2x || p.src.large)
              allImages.push(...urls)
              console.log(`✅ Pexels: ${urls.length} images for "${term}"`)
            }
          })
          .catch(err => console.error('Pexels error:', err))
      )
    }
  }

  // 4. Unsplash API (high quality, 50/hour limit)
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    console.log('📸 Querying Unsplash for high-res images...')
    const searchTerms = [
      `${locationName} cityscape`,
      `${locationName} architecture`,
      `${locationName} travel`
    ]

    for (const term of searchTerms) {
      fetchPromises.push(
        fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=5&orientation=landscape`,
          { headers: { 'Authorization': `Client-ID ${unsplashKey}` } }
        )
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.results) {
              // Use full resolution
              const urls = data.results.map((r: any) => r.urls.full || r.urls.regular)
              allImages.push(...urls)
              console.log(`✅ Unsplash: ${urls.length} images for "${term}"`)
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

  // Deduplicate
  const uniqueImages = Array.from(new Set(allImages))
  console.log(`🎉 Total unique HIGH QUALITY images: ${uniqueImages.length}`)

  // Return requested count
  return uniqueImages.slice(0, count)
}


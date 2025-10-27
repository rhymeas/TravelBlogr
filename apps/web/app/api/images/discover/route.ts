import { NextRequest, NextResponse } from 'next/server'
import { searchImages as braveSearchImages } from '@/lib/services/braveSearchService'
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'
import { withRedditLimit, fetchWithTimeout } from '@/lib/utils/redditLimiter'

/**
 * Unified Image Discovery API
 * GET /api/images/discover?query=...&limit=20&context=trip
 * 
 * Returns images from:
 * 1. Brave API (Priority #1 - fantastic 16:9 images)
 * 2. Reddit ULTRA (Priority #2 - travel photography)
 * 3. Pexels, Flickr (fallbacks)
 * 
 * All images are mixed and sorted by quality score
 */

interface ImageResult {
  url: string
  thumbnail?: string
  source: 'Brave API' | 'Reddit ULTRA' | 'Pexels' | 'Flickr' | 'Custom'
  title?: string
  score: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20')
    const context = searchParams.get('context') || 'trip'

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    // Check cache first (24 hours)
    const cacheKey = CacheKeys.imageDiscovery(query, limit)
    const cached = await getCached<ImageResult[]>(cacheKey)
    
    if (cached) {
      console.log(`✅ Image Discovery Cache HIT: ${query}`)
      return NextResponse.json({
        success: true,
        images: cached,
        count: cached.length,
        cached: true
      })
    }

    const allImages: ImageResult[] = []

    // PRIORITY #1: Brave API (fantastic 16:9 images!)
    try {
      // CRITICAL FIX: Be more specific for small towns/villages to avoid wrong images
      // For locations with commas (e.g., "Braak, Schleswig-Holstein, Germany"), use full name
      const isSpecificLocation = query.includes(',')

      const searchTerm = context === 'trip'
        ? isSpecificLocation
          ? `${query} village town cityscape` // More specific for small locations
          : `${query} travel destination cityscape`
        : context === 'activity'
        ? `${query} activity tourism`
        : context === 'restaurant'
        ? `${query} restaurant food dining`
        : context === 'blog'
        ? `${query} travel blog photography`
        : `${query} travel`

      console.log(`🔍 Brave API search term: "${searchTerm}"`)
      const braveImages = await braveSearchImages(searchTerm, Math.ceil(limit * 0.5))

      braveImages.forEach(img => {
        allImages.push({
          url: img.url,
          thumbnail: img.thumbnail, // 16:9 optimized!
          source: 'Brave API',
          title: img.title,
          score: 100 // Highest priority
        })
      })

      console.log(`✅ Brave API: ${braveImages.length} images for "${query}"`)
    } catch (error) {
      console.error('Brave API error:', error)
    }

    // PRIORITY #2: Reddit ULTRA (travel photography with strict filtering)
    try {
      const redditImages = await fetchRedditUltraImages(query, Math.ceil(limit * 0.3))
      
      redditImages.forEach(url => {
        allImages.push({
          url,
          source: 'Reddit ULTRA',
          score: 90 // Second priority
        })
      })

      console.log(`✅ Reddit ULTRA: ${redditImages.length} images for "${query}"`)
    } catch (error) {
      console.error('Reddit ULTRA error:', error)
    }

    // PRIORITY #3: Pexels (high-quality stock photos)
    const pexelsKey = process.env.PEXELS_API_KEY
    if (pexelsKey && allImages.length < limit) {
      try {
        const pexelsImages = await fetchPexelsImages(query, Math.ceil(limit * 0.2), pexelsKey)
        
        pexelsImages.forEach(img => {
          allImages.push({
            url: img.url,
            thumbnail: img.thumbnail,
            source: 'Pexels',
            title: img.title,
            score: 80 // Third priority
          })
        })

        console.log(`✅ Pexels: ${pexelsImages.length} images for "${query}"`)
      } catch (error) {
        console.error('Pexels error:', error)
      }
    }

    // Sort by score (highest first) and limit
    const sortedImages = allImages
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Cache for 24 hours
    await setCached(cacheKey, sortedImages, CacheTTL.LONG)

    return NextResponse.json({
      success: true,
      images: sortedImages,
      count: sortedImages.length,
      cached: false
    })

  } catch (error) {
    console.error('Image discovery API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch Reddit ULTRA images (travel photography subreddits)
 */
async function fetchRedditUltraImages(query: string, limit: number): Promise<string[]> {
  const subreddits = [
    'CityPorn',
    'EarthPorn',
    'TravelPics',
    'VillagePorn',
    'ArchitecturePorn'
  ]

  const images: string[] = []

  for (const subreddit of subreddits) {
    if (images.length >= limit) break

    try {
      const response = await withRedditLimit(() =>
        fetchWithTimeout(
          `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=year&limit=10`,
          { headers: { 'User-Agent': 'TravelBlogr/1.0' } },
          6000
        )
      )

      if (!response.ok) continue

      const data = await response.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        const url = post.data?.url
        if (!url) continue

        // STRICT FILTERING (same as Reddit ULTRA)
        if (
          url.match(/\.(jpg|jpeg|png|webp)$/i) &&
          !url.includes('gallery') &&
          !url.includes('v.redd.it') &&
          post.data.score > 100 &&
          !post.data.over_18
        ) {
          images.push(url)
          if (images.length >= limit) break
        }
      }
    } catch (error) {
      console.error(`Reddit ${subreddit} error:`, error)
    }
  }

  return images
}

/**
 * Fetch Pexels images
 */
async function fetchPexelsImages(
  query: string,
  limit: number,
  apiKey: string
): Promise<Array<{ url: string; thumbnail: string; title: string }>> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' travel cityscape')}&per_page=${limit}&orientation=landscape`,
      { headers: { 'Authorization': apiKey } }
    )

    if (!response.ok) return []

    const data = await response.json()
    
    return (data.photos || []).map((photo: any) => ({
      url: photo.src.large2x,
      thumbnail: photo.src.medium,
      title: photo.alt || query
    }))
  } catch (error) {
    console.error('Pexels fetch error:', error)
    return []
  }
}


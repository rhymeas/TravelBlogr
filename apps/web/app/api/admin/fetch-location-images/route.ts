/**
 * API Route: Fetch Location Images
 * Fetches images from multiple sources with quality filtering
 * PRIORITY: Reddit ULTRA → Pexels → Flickr ULTRA → Openverse → Europeana → Unsplash
 * ALL FREE - NO API KEYS REQUIRED for top 3 sources!
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchLocationGalleryHighQuality } from '@/lib/services/enhancedImageService'
import { fetchSocialImages } from '@/lib/services/socialImageScraperService'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ImageResult {
  url: string
  source: string
  platform: string
  width?: number
  height?: number
  score: number
  author?: string
  title?: string
}

/**
 * Extract location hierarchy from a location name
 * Example: "Uval, Zaamin District, Jizzakh Region, Uzbekistan"
 * Returns: ["Uval, Zaamin District, Jizzakh Region, Uzbekistan", "Zaamin District, Jizzakh Region, Uzbekistan", "Jizzakh Region, Uzbekistan", "Uzbekistan"]
 */
function getLocationHierarchy(locationName: string): string[] {
  const parts = locationName.split(',').map(p => p.trim())
  const hierarchy: string[] = []

  // Add full name
  hierarchy.push(locationName)

  // Add progressively broader locations
  for (let i = 1; i < parts.length; i++) {
    hierarchy.push(parts.slice(i).join(', '))
  }

  return hierarchy
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationName, page = 1, perPage = 20, includeSocial = true } = body

    if (!locationName) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    console.log(`🖼️ Fetching images for: ${locationName} (page ${page})`)

    // Get location hierarchy for fallback
    const hierarchy = getLocationHierarchy(locationName)
    console.log(`📍 Location hierarchy:`, hierarchy)

    // Fetch from multiple sources in parallel
    const targetCount = perPage * page
    const fetchCount = Math.min(targetCount + 30, 100)

    // 1. Enhanced image service (Pexels, Unsplash, Wikimedia, etc.)
    let imageUrls: string[] = []
    let socialImages: any[] = []
    let usedLocation = locationName
    let hierarchyLevel = 0

    // Try each level of hierarchy until we get enough images
    for (let i = 0; i < hierarchy.length; i++) {
      const searchLocation = hierarchy[i]
      console.log(`🔍 Trying: ${searchLocation}`)

      const imageUrlsPromise = fetchLocationGalleryHighQuality(searchLocation, fetchCount)
      const socialImagesPromise = includeSocial
        ? fetchSocialImages(searchLocation, 30)
        : Promise.resolve([])

      const [urls, social] = await Promise.all([imageUrlsPromise, socialImagesPromise])

      const totalImages = urls.length + social.length
      console.log(`   Found ${totalImages} images (${urls.length} standard + ${social.length} social)`)

      // Minimum threshold: need at least 15 images, or use last level
      const minThreshold = 15

      // If we found enough images, use this level
      if (totalImages >= minThreshold || i === hierarchy.length - 1) {
        imageUrls = urls
        socialImages = social
        usedLocation = searchLocation
        hierarchyLevel = i
        console.log(`✅ Using images from: ${searchLocation} (level ${i})`)
        break
      } else {
        console.log(`   ⚠️ Only ${totalImages} images (need ${minThreshold}), trying broader location...`)
      }
    }

    console.log(`✅ Fetched ${imageUrls.length} standard images`)
    console.log(`✅ Fetched ${socialImages.length} social images`)

    // Convert standard images to ImageResult format
    const standardImages: ImageResult[] = imageUrls.map((url: string, index: number) => {
      let platform = 'Unknown'
      let source = url

      // Detect platform from URL
      if (url.includes('pexels.com')) {
        platform = 'Pexels'
      } else if (url.includes('unsplash.com')) {
        platform = 'Unsplash'
      } else if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
        platform = 'Wikimedia'
      } else if (url.includes('openverse.org')) {
        platform = 'Openverse'
      } else if (url.includes('flickr.com')) {
        platform = 'Flickr'
      } else if (url.includes('pixabay.com')) {
        platform = 'Pixabay'
      }

      // Score based on position and platform
      let score = 100 - index
      if (platform === 'Pexels' || platform === 'Unsplash') {
        score += 10 // Boost trusted platforms
      }

      return {
        url,
        source,
        platform,
        score: Math.max(0, Math.min(100, score))
      }
    })

    // Convert social images to ImageResult format
    const socialImageResults: ImageResult[] = (socialImages || []).map((img: any, index: number) => {
      // Normalize scores: Reddit scores can be 10k+, normalize to 80-110 (higher than standard)
      let normalizedScore = 80 // Default score (higher than standard images)
      if (img.score) {
        if (img.score > 5000) {
          normalizedScore = 110 - index // Very popular Reddit post (110, 109, 108...)
        } else if (img.score > 1000) {
          normalizedScore = 105 - index // Popular post
        } else if (img.score > 100) {
          normalizedScore = 95 - index // Decent post
        } else if (img.score > 10) {
          normalizedScore = 85 - index // Low score
        } else {
          normalizedScore = 75 - index // Very low score
        }
      }

      return {
        url: img.url,
        source: img.sourceUrl || img.url,
        platform: img.platform,
        score: Math.max(50, normalizedScore), // Ensure minimum score of 50
        author: img.author,
        title: img.title
      }
    })

    // Combine and sort by score
    const allImages = [...standardImages, ...socialImageResults]
    allImages.sort((a, b) => b.score - a.score)

    // Remove duplicates
    const uniqueImages = allImages.filter((img, index, self) =>
      index === self.findIndex((t) => t.url === img.url)
    )

    console.log(`✅ Total unique images: ${uniqueImages.length}`)

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedImages = uniqueImages.slice(startIndex, endIndex)

    console.log(`📄 Returning page ${page}: ${paginatedImages.length} images`)

    return NextResponse.json({
      images: paginatedImages,
      page,
      perPage,
      total: uniqueImages.length,
      hasMore: endIndex < uniqueImages.length,
      sources: {
        standard: standardImages.length,
        social: socialImageResults.length,
        total: uniqueImages.length
      },
      metadata: {
        requestedLocation: locationName,
        usedLocation,
        hierarchyLevel,
        fallbackUsed: hierarchyLevel > 0
      }
    })

  } catch (error) {
    console.error('❌ Error fetching images:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        images: []
      },
      { status: 500 }
    )
  }
}


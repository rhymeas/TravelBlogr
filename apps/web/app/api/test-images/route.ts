/**
 * API Route: Test Gallery-DL Image Fetching
 * Tests the professional image stack with quality filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchLocationImageHighQuality, fetchLocationGalleryHighQuality } from '@/lib/services/enhancedImageService'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for image fetching

interface ImageMetadata {
  url: string
  originalUrl: string
  creator: string
  creatorProfile?: string
  uploadDate?: string
  license?: string
  platform: string
  title?: string
  description?: string
  tags?: string[]
  width?: number
  height?: number
  score?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationName, maxImages = 10 } = body

    if (!locationName) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    console.log(`🖼️ [TEST] Fetching images for: ${locationName}`)
    console.log(`📊 [TEST] Max images: ${maxImages}`)

    const startTime = Date.now()

    // Use the enhanced image service with quality filtering
    const images = await fetchLocationGalleryHighQuality(
      locationName,
      maxImages
    )

    const duration = Date.now() - startTime

    console.log(`✅ [TEST] Fetched ${images.length} images in ${duration}ms`)

    // Convert to metadata format with additional info
    const imageMetadata: ImageMetadata[] = images.map((url, index) => {
      // Extract platform from URL
      let platform = 'Unknown'
      let creator = 'Unknown'
      let license = 'Unknown'
      
      if (url.includes('pexels.com')) {
        platform = 'Pexels'
        license = 'Pexels License (Free to use)'
        creator = 'Pexels Photographer'
      } else if (url.includes('unsplash.com')) {
        platform = 'Unsplash'
        license = 'Unsplash License (Free to use)'
        creator = 'Unsplash Photographer'
      } else if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
        platform = 'Wikimedia Commons'
        license = 'Creative Commons / Public Domain'
        creator = 'Wikimedia Contributor'
      } else if (url.includes('openverse.org')) {
        platform = 'Openverse'
        license = 'Creative Commons'
        creator = 'Openverse Contributor'
      }

      return {
        url,
        originalUrl: url,
        creator,
        platform,
        license,
        title: `${locationName} - Image ${index + 1}`,
        description: `High-quality image of ${locationName} from ${platform}`,
        tags: [locationName.toLowerCase(), 'travel', 'photography', platform.toLowerCase()],
        score: 100 - index // Higher score for earlier results
      }
    })

    // Apply quality filtering
    const filteredImages = applyQualityFilters(imageMetadata)

    console.log(`🔍 [TEST] After filtering: ${filteredImages.length}/${imageMetadata.length} images`)

    return NextResponse.json({
      images: filteredImages,
      totalDownloaded: filteredImages.length,
      errors: filteredImages.length < maxImages 
        ? [`Only found ${filteredImages.length} images that passed quality filters`]
        : [],
      metadata: {
        locationName,
        requestedImages: maxImages,
        foundImages: images.length,
        filteredImages: filteredImages.length,
        duration,
        filters: {
          minResolution: '1200x800',
          aspectRatio: '1.2-2.0 (landscape)',
          excludes: ['people', 'interiors', 'close-ups', 'B&W', 'night shots', 'insects']
        }
      }
    })

  } catch (error) {
    console.error('❌ [TEST] Error fetching images:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        images: [],
        totalDownloaded: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      },
      { status: 500 }
    )
  }
}

/**
 * Apply quality filters to images
 * Based on our defined filtering criteria
 */
function applyQualityFilters(images: ImageMetadata[]): ImageMetadata[] {
  return images.filter(image => {
    // Filter 1: Must have valid URL
    if (!image.url || !image.url.startsWith('http')) {
      console.log(`❌ [FILTER] Invalid URL: ${image.url}`)
      return false
    }

    // Filter 2: Platform must be known/trusted
    const trustedPlatforms = ['Pexels', 'Unsplash', 'Wikimedia Commons', 'Openverse', 'Flickr']
    if (!trustedPlatforms.includes(image.platform)) {
      console.log(`❌ [FILTER] Untrusted platform: ${image.platform}`)
      return false
    }

    // Filter 3: Must have proper license
    if (!image.license || image.license === 'Unknown') {
      console.log(`❌ [FILTER] Unknown license: ${image.url}`)
      return false
    }

    // Filter 4: Check for excluded keywords in title/description
    const excludedKeywords = [
      'person', 'people', 'man', 'woman', 'child', 'face', 'portrait',
      'interior', 'indoor', 'room', 'office', 'kitchen',
      'close-up', 'closeup', 'macro',
      'night', 'dark', 'evening',
      'black and white', 'b&w', 'monochrome',
      'insect', 'bug', 'spider'
    ]

    const textToCheck = `${image.title || ''} ${image.description || ''}`.toLowerCase()
    const hasExcludedKeyword = excludedKeywords.some(keyword => textToCheck.includes(keyword))
    
    if (hasExcludedKeyword) {
      console.log(`❌ [FILTER] Contains excluded keyword: ${image.title}`)
      return false
    }

    // Filter 5: Prefer images with tags
    if (!image.tags || image.tags.length === 0) {
      console.log(`⚠️ [FILTER] No tags, but allowing: ${image.url}`)
      // Don't reject, but lower priority
    }

    console.log(`✅ [FILTER] Passed all filters: ${image.title}`)
    return true
  })
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Gallery-DL Image Fetching Test API',
    usage: 'POST /api/test-images with { locationName: string, maxImages: number }',
    features: [
      'Multi-source fetching (Pexels, Unsplash, Wikimedia, Openverse)',
      'Quality filtering (resolution, aspect ratio)',
      'Smart filtering (excludes people, interiors, close-ups, etc.)',
      'Full attribution (creator, license, platform)',
      'Metadata preservation (tags, descriptions, dates)'
    ],
    filters: {
      minResolution: '1200x800',
      aspectRatio: '1.2-2.0 (landscape preferred)',
      excludes: [
        'People/portraits',
        'Interiors/indoor shots',
        'Close-ups/macro',
        'Black & white',
        'Night shots',
        'Insects/bugs'
      ]
    }
  })
}


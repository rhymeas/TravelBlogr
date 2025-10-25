import { NextRequest, NextResponse } from 'next/server'
import { searchImages as braveSearchImages } from '@/lib/services/braveSearchService'
import { searchRedditLocationImages } from '@/lib/services/socialImageScraperService'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/images/search
 * 
 * Universal image search endpoint
 * Supports multiple sources: brave, reddit, database
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''
    const source = searchParams.get('source') || 'brave'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 })
    }

    let images: any[] = []

    switch (source) {
      case 'brave':
        images = await searchBraveImages(query, limit)
        break

      case 'reddit':
        images = await searchRedditImages(query, limit)
        break

      case 'database':
        images = await searchDatabaseImages(query, limit)
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid source' }, { status: 400 })
    }

    return NextResponse.json({ success: true, images, count: images.length })
  } catch (error: any) {
    console.error('Image search error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * Search Brave for images
 */
async function searchBraveImages(query: string, limit: number) {
  const results = await braveSearchImages(query, limit)

  return results.map((img: any) => ({
    url: img.url,
    thumbnail: img.thumbnail,
    title: img.title,
    source: 'brave',
    width: img.properties.width,
    height: img.properties.height,
  }))
}

/**
 * Search Reddit for images (uses existing ultra-filtered implementation)
 */
async function searchRedditImages(query: string, limit: number) {
  const results = await searchRedditLocationImages(query, limit)

  return results.map((img: any) => ({
    url: img.url,
    thumbnail: img.url,
    title: img.title,
    source: 'reddit',
    attribution: {
      author: img.author,
      sourceUrl: img.permalink,
    },
    score: img.score,
  }))
}

/**
 * Search database for cached images
 */
async function searchDatabaseImages(query: string, limit: number) {
  const supabase = createServiceSupabase()

  // Search locations by name
  const { data: locations, error } = await supabase
    .from('locations')
    .select('name, slug, featured_image, gallery_images')
    .ilike('name', `%${query}%`)
    .not('featured_image', 'is', null)
    .limit(limit)

  if (error || !locations) {
    console.error('Database search error:', error)
    return []
  }

  const images: any[] = []

  for (const location of locations) {
    // Add featured image
    if (location.featured_image) {
      images.push({
        url: location.featured_image,
        thumbnail: location.featured_image,
        title: location.name,
        source: 'database',
      })
    }

    // Add gallery images
    if (location.gallery_images && Array.isArray(location.gallery_images)) {
      for (const galleryImg of location.gallery_images.slice(0, 3)) {
        images.push({
          url: galleryImg,
          thumbnail: galleryImg,
          title: `${location.name} - Gallery`,
          source: 'database',
        })
      }
    }

    if (images.length >= limit) break
  }

  return images.slice(0, limit)
}


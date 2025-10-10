/**
 * Test Social Image Scraping
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchSocialImages } from '@/lib/services/socialImageScraperService'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || 'Paris'
  
  console.log(`🧪 Testing social image scraping for: ${query}`)
  
  try {
    const images = await fetchSocialImages(query, 10)
    
    return NextResponse.json({
      query,
      total: images.length,
      images: images.map(img => ({
        url: img.url.substring(0, 80),
        platform: img.platform,
        author: img.author,
        title: img.title?.substring(0, 60),
        score: img.score,
        sourceUrl: img.sourceUrl?.substring(0, 80)
      }))
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}


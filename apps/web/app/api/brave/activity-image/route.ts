import { NextRequest, NextResponse } from 'next/server'
import { fetchActivityData, fetchRestaurantData } from '@/lib/services/braveActivityService'

/**
 * API Route: Fetch Brave Activity/Restaurant Images
 * GET /api/brave/activity-image?name=...&location=...&type=activity|restaurant&count=5
 * 
 * Returns 16:9 optimized images and booking links from Brave API
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const location = searchParams.get('location')
    const type = searchParams.get('type') || 'activity'
    const count = parseInt(searchParams.get('count') || '5')
    const tripType = searchParams.get('tripType')
    const context = searchParams.get('context')

    if (!name || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: name, location' },
        { status: 400 }
      )
    }

    // Only pass options if tripType or context are actually provided
    const options = (tripType || context) ? {
      tripType: tripType ?? undefined,
      context: context ?? undefined
    } : undefined

    let data
    if (type === 'restaurant') {
      data = await fetchRestaurantData(name, location, count, options)
    } else {
      data = await fetchActivityData(name, location, count, options)
    }

    return NextResponse.json({
      success: true,
      data: {
        images: data.images,
        links: data.links,
        count: data.images.length
      }
    })

  } catch (error) {
    console.error('Brave activity image API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


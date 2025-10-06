/**
 * API Route: Get Restaurants for Location
 * GET /api/locations/[slug]/restaurants
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchLocationBySlug } from '@/lib/supabase/locationQueries'

interface RouteParams {
  params: {
    slug: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnverified = searchParams.get('include_unverified') === 'true'

    // First get location by slug to get the ID
    const location = await fetchLocationBySlug(params.slug)
    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location not found'
        },
        { status: 404 }
      )
    }

    let restaurants = location.restaurants || []

    // Filter by verification status if needed
    if (!includeUnverified) {
      restaurants = restaurants.filter((r: any) => r.is_verified === true)
    }

    return NextResponse.json({
      success: true,
      data: restaurants,
      count: restaurants.length
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch restaurants'
      },
      { status: 500 }
    )
  }
}


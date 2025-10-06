/**
 * API Route: Get Weather Data for Location
 * GET /api/locations/[slug]/weather
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

    const weather = location.location_weather?.[0]

    if (!weather) {
      return NextResponse.json(
        {
          success: false,
          error: 'Weather data not found for this location'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: weather
    })
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data'
      },
      { status: 500 }
    )
  }
}


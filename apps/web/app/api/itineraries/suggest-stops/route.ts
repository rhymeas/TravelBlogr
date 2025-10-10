/**
 * API Route: Suggest Stops Between Locations
 * POST /api/itineraries/suggest-stops
 * 
 * Returns interesting stops along the route between two locations
 */

import { NextRequest, NextResponse } from 'next/server'
import { RouteCalculatorService } from '@/lib/itinerary/application/services/RouteCalculatorService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/itineraries/suggest-stops
 * Get suggested stops between two locations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: from, to'
        },
        { status: 400 }
      )
    }

    // Use the existing route calculator to find stops
    const routeCalculator = new RouteCalculatorService()
    
    try {
      const routeInfo = await routeCalculator.calculateRoute(from, to, 5) // Get up to 5 stops
      
      // Transform stops to simple format
      const stops = routeInfo.stops.map(stop => ({
        name: stop.name,
        slug: stop.slug,
        region: stop.coordinates ? undefined : undefined, // Will be added by location discovery
        country: undefined
      }))

      return NextResponse.json({
        success: true,
        stops,
        meta: {
          from: routeInfo.fromLocation,
          to: routeInfo.toLocation,
          distance: routeInfo.distanceKm,
          stopsFound: stops.length
        }
      })
    } catch (error: any) {
      // If locations not found, return empty suggestions
      console.error('Error calculating route:', error)
      return NextResponse.json({
        success: true,
        stops: [],
        meta: {
          message: 'No stops found between these locations'
        }
      })
    }

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}


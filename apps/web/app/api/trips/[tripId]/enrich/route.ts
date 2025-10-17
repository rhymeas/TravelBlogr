/**
 * API Route: Enrich Trip with Route Data
 * 
 * Fetches real coordinates, route data, and elevation profiles for a trip
 * GET /api/trips/[tripId]/enrich
 */

import { NextRequest, NextResponse } from 'next/server'
import { enrichTripWithRouteData } from '@/lib/services/tripEnrichmentService'

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    // Enrich trip with route data
    const enrichedLocations = await enrichTripWithRouteData(tripId)

    if (!enrichedLocations || enrichedLocations.length === 0) {
      return NextResponse.json(
        { error: 'Failed to enrich trip data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      locations: enrichedLocations,
      totalLocations: enrichedLocations.length
    })
  } catch (error) {
    console.error('Error in enrich trip API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


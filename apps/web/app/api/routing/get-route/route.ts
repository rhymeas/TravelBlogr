/**
 * API Route: Get Real Road Route
 * 
 * Provides real road routing using:
 * 1. OpenRouteService (primary) - 2,000 requests/day
 * 2. OSRM Demo Server (fallback) - Unlimited
 * 
 * Automatically caches routes to minimize API calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRoute, type RouteCoordinate, type TransportProfile } from '@/lib/services/routingService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coordinates, profile = 'driving-car', preference } = body

    // Validate input
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 coordinates required' },
        { status: 400 }
      )
    }

    // Validate coordinates format
    for (const coord of coordinates) {
      if (typeof coord.longitude !== 'number' || typeof coord.latitude !== 'number') {
        return NextResponse.json(
          { error: 'Invalid coordinate format. Expected { longitude: number, latitude: number }' },
          { status: 400 }
        )
      }
    }

    // Get route from service
    const route = await getRoute(coordinates as RouteCoordinate[], profile as TransportProfile, preference as any)

    return NextResponse.json(route)
  } catch (error) {
    console.error('Routing API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get route' },
      { status: 500 }
    )
  }
}


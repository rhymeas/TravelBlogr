/**
 * API Route: Get POIs Along Route
 * POST /api/routing/pois-along-route
 * 
 * Fetches points of interest (restaurants, attractions, viewpoints)
 * along a route geometry.
 * 
 * Request body:
 * {
 *   geometry: number[][], // GeoJSON LineString coordinates [[lng, lat], ...]
 *   sampleIntervalKm?: number, // Distance between sample points (default: 50)
 *   searchRadiusKm?: number, // Search radius around each point (default: 10)
 *   categories?: string[], // POI categories to fetch
 *   maxDistanceKm?: number, // Max distance from route (default: 5)
 *   limit?: number // Max POIs to return (default: 20)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   pois: RoutePOI[],
 *   meta: {
 *     totalFound: number,
 *     samplePoints: number,
 *     categories: string[]
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchPOIsAlongRoute,
  filterPOIsByDistance,
  getTopPOIs,
  type RoutePOI
} from '@/lib/services/routePOIService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/routing/pois-along-route
 * Fetch POIs along a route geometry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      geometry,
      sampleIntervalKm = 50,
      searchRadiusKm = 10,
      categories = ['interesting_places', 'tourist_facilities', 'natural'],
      maxDistanceKm = 5,
      limit = 20
    } = body

    // Validate input
    if (!geometry || !Array.isArray(geometry) || geometry.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid geometry: must be an array of at least 2 coordinate pairs [[lng, lat], ...]'
        },
        { status: 400 }
      )
    }

    console.log(`🗺️ Fetching POIs along route with ${geometry.length} points`)

    // Fetch POIs along the route
    const allPOIs = await fetchPOIsAlongRoute(
      geometry,
      sampleIntervalKm,
      searchRadiusKm,
      categories
    )

    // Filter by distance from route
    const nearbyPOIs = filterPOIsByDistance(allPOIs, maxDistanceKm)

    // Get top POIs by rating
    const topPOIs = getTopPOIs(nearbyPOIs, limit)

    return NextResponse.json({
      success: true,
      pois: topPOIs,
      meta: {
        totalFound: allPOIs.length,
        nearbyCount: nearbyPOIs.length,
        returned: topPOIs.length,
        sampleIntervalKm,
        searchRadiusKm,
        maxDistanceKm,
        categories
      }
    })
  } catch (error: any) {
    console.error('Error fetching POIs along route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch POIs along route'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/routing/pois-along-route
 * API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/routing/pois-along-route',
    method: 'POST',
    description: 'Fetch points of interest along a route geometry',
    requestBody: {
      geometry: 'number[][] (required) - GeoJSON LineString coordinates [[lng, lat], ...]',
      sampleIntervalKm: 'number (optional) - Distance between sample points (default: 50)',
      searchRadiusKm: 'number (optional) - Search radius around each point (default: 10)',
      categories: 'string[] (optional) - POI categories (default: ["interesting_places", "tourist_facilities", "natural"])',
      maxDistanceKm: 'number (optional) - Max distance from route (default: 5)',
      limit: 'number (optional) - Max POIs to return (default: 20)'
    },
    response: {
      success: 'boolean',
      pois: 'RoutePOI[] - Array of POIs with name, category, coordinates, distance, rating',
      meta: 'object - Metadata about the search'
    },
    example: {
      request: {
        geometry: [
          [13.4050, 52.5200], // Berlin
          [13.7372, 51.0504], // Dresden
          [14.4378, 50.0755]  // Prague
        ],
        sampleIntervalKm: 50,
        searchRadiusKm: 10,
        categories: ['interesting_places', 'tourist_facilities'],
        maxDistanceKm: 5,
        limit: 20
      },
      response: {
        success: true,
        pois: [
          {
            name: 'Meissen Cathedral',
            category: 'interesting_places',
            latitude: 51.1633,
            longitude: 13.4717,
            distanceFromRoute: 2.3,
            rating: 4
          }
        ],
        meta: {
          totalFound: 45,
          nearbyCount: 28,
          returned: 20,
          sampleIntervalKm: 50,
          searchRadiusKm: 10,
          maxDistanceKm: 5,
          categories: ['interesting_places', 'tourist_facilities']
        }
      }
    }
  })
}


import { NextRequest, NextResponse } from 'next/server'
import { scoreRouteByPOIDensity } from '@/lib/services/scenicRouteService'

/**
 * API Route: Score a route by POI density
 * 
 * POST /api/routing/score-route-pois
 * 
 * Body:
 * {
 *   coordinates: Array<[number, number]>,  // [lng, lat] format
 *   countryCode: string
 * }
 * 
 * Returns:
 * {
 *   score: number,
 *   poiCount: number,
 *   poiTypes: Record<string, number>,
 *   topPOIs: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { coordinates, countryCode } = await request.json()

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    if (!countryCode || typeof countryCode !== 'string') {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      )
    }

    console.log(`🎯 Scoring route with ${coordinates.length} points in ${countryCode}`)

    const result = await scoreRouteByPOIDensity(coordinates, countryCode)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error scoring route by POI density:', error)
    return NextResponse.json(
      { error: 'Failed to score route' },
      { status: 500 }
    )
  }
}


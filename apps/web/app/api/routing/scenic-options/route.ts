import { NextRequest, NextResponse } from 'next/server'
import { getScenicRouteOptions, ScenicRouteOption } from '@/lib/services/scenicRouteService'
import { getValhallaRoute } from '@/lib/services/valhallaService'
import { RouteCoordinate } from '@/lib/services/routingService'

/**
 * API endpoint to get multiple scenic route options with calculated routes
 * 
 * POST /api/routing/scenic-options
 * 
 * Body:
 * {
 *   "start": { "latitude": 49.2827, "longitude": -123.1207 },
 *   "end": { "latitude": 51.1784, "longitude": -115.5708 },
 *   "countryCode": "CA"
 * }
 * 
 * Response:
 * {
 *   "options": [
 *     {
 *       "id": "sea-to-sky",
 *       "name": "Sea-to-Sky Highway",
 *       "description": "World-famous coastal drive through Squamish & Whistler",
 *       "tags": ["coastal", "mountain", "famous", "ski-resort"],
 *       "route": {
 *         "distance": 1018100,
 *         "duration": 45120,
 *         "geometry": {...}
 *       }
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { start, end, countryCode } = await request.json()

    if (!start || !end || !countryCode) {
      return NextResponse.json(
        { error: 'Missing required fields: start, end, countryCode' },
        { status: 400 }
      )
    }

    console.log(`🎯 Getting scenic route options for ${countryCode}`)
    console.log(`   📍 Start: (${start.latitude}, ${start.longitude})`)
    console.log(`   📍 End: (${end.latitude}, ${end.longitude})`)

    // Get scenic route options
    const options = await getScenicRouteOptions(start, end, countryCode)

    if (options.length === 0) {
      return NextResponse.json({
        options: [],
        message: 'No predefined scenic route options for this route. Using alternatives.'
      })
    }

    // Get all route alternatives from a single Valhalla call
    console.log(`   🛣️ Fetching route alternatives from Valhalla...`)

    try {
      // Import getValhallaRouteWithAlternatives
      const { getValhallaRouteWithAlternatives } = await import('@/lib/services/valhallaService')

      const routes = await getValhallaRouteWithAlternatives(start, end)

      console.log(`   ✅ Got ${routes.length} route alternatives`)

      // Map routes to options (most scenic, balanced, fastest)
      const optionsWithRoutes = options.map((option, index) => {
        const route = routes[index] || routes[0] // Fallback to first route if not enough alternatives

        return {
          ...option,
          route: {
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry,
            provider: route.provider
          }
        }
      })

      return NextResponse.json({ options: optionsWithRoutes })
    } catch (error) {
      console.error(`   ❌ Failed to get route alternatives:`, error)

      // Fallback: Get single route for all options
      const route = await getValhallaRoute(start, end, 'scenic', [])

      const optionsWithRoutes = options.map(option => ({
        ...option,
        route: {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          provider: route.provider
        }
      }))

      return NextResponse.json({ options: optionsWithRoutes })
    }
  } catch (error) {
    console.error('Error getting scenic route options:', error)
    return NextResponse.json(
      { error: 'Failed to get scenic route options' },
      { status: 500 }
    )
  }
}


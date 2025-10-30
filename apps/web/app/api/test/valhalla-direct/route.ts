/**
 * Direct Valhalla API Test Endpoint
 * 
 * Calls Valhalla/Stadia Maps directly with custom costing options
 * No caching, no routing service - pure Valhalla test
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { start, end, config } = await request.json()

    console.log('\n🎯 Direct Valhalla Test')
    console.log('📍 Start:', start.name)
    console.log('📍 End:', end.name)
    console.log('⚙️ Config:', config)

    // Use Stadia Maps (hosted Valhalla)
    const stadiaApiKey = process.env.STADIA_MAPS_API_KEY
    if (!stadiaApiKey) {
      throw new Error('STADIA_MAPS_API_KEY not configured')
    }

    const valhallaUrl = `https://route.stadiamaps.com/route?api_key=${stadiaApiKey}`

    // Build Valhalla request
    const valhallaRequest = {
      locations: [
        { lat: start.latitude, lon: start.longitude },
        { lat: end.latitude, lon: end.longitude }
      ],
      costing: 'auto',
      costing_options: {
        auto: config
      },
      directions_options: {
        units: 'kilometers'
      }
    }

    console.log('📤 Valhalla Request:', JSON.stringify(valhallaRequest, null, 2))

    // Call Valhalla
    const response = await fetch(valhallaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(valhallaRequest)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Valhalla error:', error)
      throw new Error(`Valhalla API failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Valhalla response received')

    // Extract route data
    const trip = data.trip
    const leg = trip.legs[0]
    const shape = leg.shape

    // Decode polyline
    const coordinates = decodePolyline(shape)

    const result = {
      geometry: {
        type: 'LineString',
        coordinates
      },
      distance: trip.summary.length * 1000, // km to meters
      duration: trip.summary.time, // seconds
      provider: 'stadia-valhalla-direct'
    }

    console.log(`✅ Route: ${(result.distance / 1000).toFixed(1)}km, ${(result.duration / 60).toFixed(0)}min`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Direct Valhalla test failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get route' },
      { status: 500 }
    )
  }
}

/**
 * Decode Valhalla polyline (precision 6)
 */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const factor = Math.pow(10, precision)
  const coordinates: [number, number][] = []
  let lat = 0
  let lng = 0
  let index = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push([lng / factor, lat / factor])
  }

  return coordinates
}


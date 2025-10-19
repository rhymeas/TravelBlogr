/**
 * API Route: Location Intelligence
 * 
 * Get intelligent location data with hierarchy:
 * 1. Database locations and POIs
 * 2. Existing trips to this location
 * 3. Existing blog posts about this location
 * 4. External APIs (future)
 * 5. GROQ AI suggestions (future)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'

export async function POST(request: NextRequest) {
  try {
    const { locationName } = await request.json()

    if (!locationName) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Getting intelligence for: ${locationName}`)

    // Get intelligence using server-side client
    const intelligence = await getLocationIntelligence(locationName, true)

    return NextResponse.json({
      success: true,
      data: intelligence
    })
  } catch (error) {
    console.error('Error getting location intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to get location intelligence', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


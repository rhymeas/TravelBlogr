/**
 * API Route: Enrich Blog Post Days
 * 
 * Enriches blog post days with location data (images, POIs, transportation)
 * This is a server-side API route that can use server-only packages
 */

import { NextRequest, NextResponse } from 'next/server'
import { enrichBlogPostDays } from '@/lib/services/blogEnrichmentService'

export async function POST(request: NextRequest) {
  try {
    const { days } = await request.json()

    if (!days || !Array.isArray(days)) {
      return NextResponse.json(
        { error: 'Invalid request: days array required' },
        { status: 400 }
      )
    }

    console.log(`🎨 Enriching ${days.length} days via API route...`)

    // Enrich days using server-side client
    const enrichedDays = await enrichBlogPostDays(days, true)

    return NextResponse.json({
      success: true,
      days: enrichedDays
    })
  } catch (error) {
    console.error('Error enriching days:', error)
    return NextResponse.json(
      { error: 'Failed to enrich days', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


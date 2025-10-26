/**
 * API Route: Admin - Create Location
 * POST /api/admin/locations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

import { isAmbiguousLocationName, DUPLICATE_COORD_THRESHOLD } from '@/lib/utils/locationValidation'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface CreateLocationRequest {
  name: string
  slug: string
  latitude: number
  longitude: number
  country: string
  region: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    const body: CreateLocationRequest = await request.json()
    const { name, slug, latitude, longitude, country, region, description } = body

    if (!name || !slug || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Block unclear/ambiguous location names
    if (isAmbiguousLocationName(name)) {
      return NextResponse.json(
        { success: false, error: 'Ambiguous location name. Please provide a specific city/town/place (not borders, checkpoints, or placeholders).' },
        { status: 400 }
      )
    }

    // Duplicate protection by slug
    const { data: slugExisting } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (slugExisting) {
      return NextResponse.json(
        { success: false, error: 'Location already exists (duplicate slug)' },
        { status: 409 }
      )
    }

    // Duplicate protection by name
    const { data: nameDupes } = await supabase
      .from('locations')
      .select('id')
      .ilike('name', name)
      .limit(1)

    if (nameDupes && nameDupes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Location with this name already exists' },
        { status: 409 }
      )
    }

    // Duplicate protection by proximity
    const { data: nearDupes } = await supabase
      .from('locations')
      .select('id')
      .gte('latitude', latitude - DUPLICATE_COORD_THRESHOLD)
      .lte('latitude', latitude + DUPLICATE_COORD_THRESHOLD)
      .gte('longitude', longitude - DUPLICATE_COORD_THRESHOLD)
      .lte('longitude', longitude + DUPLICATE_COORD_THRESHOLD)
      .limit(1)

    if (nearDupes && nearDupes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A nearby location already exists (duplicate by proximity)' },
        { status: 409 }
      )
    }

    // Create location
    const { data, error } = await supabase
      .from('locations')
      .insert({
        name,
        slug,
        latitude,
        longitude,
        country: country || 'TBD',
        region: region || 'TBD',
        description: description || '',
        is_published: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Automatically trigger image refetch for newly created locations
    // This ensures new locations have proper hero images instead of fallbacks
    try {
      console.log(`🔄 Auto-triggering image refetch for new location: ${name}`)
      const refetchResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/refetch-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: data.id,
          locationName: name,
          includeImages: true,
          includeRestaurants: false,
          includeActivities: false,
          includeDescription: false,
          includeMetadata: false,
          includeWeather: false
        })
      })

      if (!refetchResponse.ok) {
        console.warn(`⚠️ Auto-refetch failed for ${name}, but location was created`)
      } else {
        console.log(`✅ Auto-refetch completed for ${name}`)
      }
    } catch (refetchError) {
      console.warn(`⚠️ Auto-refetch error (non-critical):`, refetchError)
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


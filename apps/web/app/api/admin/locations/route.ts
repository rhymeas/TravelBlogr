/**
 * API Route: Admin - Create Location
 * POST /api/admin/locations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

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


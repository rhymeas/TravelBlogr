import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { deleteCached, CacheKeys } from '@/lib/upstash'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface UpdateMetadataRequest {
  locationId: string
  locationSlug: string
  country?: string
  region?: string
  latitude?: number
  longitude?: number
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication - allow any signed-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to edit location metadata' },
        { status: 401 }
      )
    }

    const body: UpdateMetadataRequest = await request.json()
    const { locationId, locationSlug, country, region, latitude, longitude } = body

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing required field: locationId' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return NextResponse.json(
          { error: 'Both latitude and longitude must be provided together' },
          { status: 400 }
        )
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (country !== undefined) updateData.country = country
    if (region !== undefined) updateData.region = region
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude

    // Update location
    const { error: updateError } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', locationId)

    if (updateError) {
      console.error('Error updating location metadata:', updateError)
      return NextResponse.json(
        { error: 'Failed to update location metadata' },
        { status: 500 }
      )
    }

    // Log contribution
    const changes = []
    if (country !== undefined) changes.push(`country: ${country}`)
    if (region !== undefined) changes.push(`region: ${region}`)
    if (latitude !== undefined) changes.push(`coordinates: ${latitude}, ${longitude}`)

    await supabase.from('location_contributions').insert({
      location_id: locationId,
      user_id: user.id,
      contribution_type: 'metadata_updated',
      field_edited: 'metadata',
      change_snippet: changes.join('; '),
      created_at: new Date().toISOString(),
    })

    // Invalidate cache - ALWAYS invalidate Upstash FIRST, then Next.js cache
    await deleteCached(CacheKeys.location(locationSlug))
    await deleteCached(`${CacheKeys.location(locationSlug)}:related`)
    revalidatePath(`/locations/${locationSlug}`)
    revalidatePath('/locations')

    return NextResponse.json({
      success: true,
      message: 'Location metadata updated successfully!',
      updated: updateData,
    })
  } catch (error) {
    console.error('Error updating location metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


/**
 * API Route: Fix Location Slug
 * POST /api/admin/fix-location-slug
 * 
 * Admin-only endpoint to update a location's slug to include country/region
 * This fixes legacy locations that were created with incomplete slugs
 * 
 * Example: "lofthus" → "lofthus-norway"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin permissions
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { locationId, newSlug } = await request.json()

    if (!locationId || !newSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing locationId or newSlug' },
        { status: 400 }
      )
    }

    console.log(`🔧 [ADMIN] Fixing location slug: ${locationId} → "${newSlug}"`)

    // Fetch location from database
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    const oldSlug = location.slug
    console.log(`📍 Current slug: "${oldSlug}" → New slug: "${newSlug}"`)

    // Check if new slug already exists
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id, name, slug')
      .eq('slug', newSlug)
      .maybeSingle()

    if (existingLocation && existingLocation.id !== locationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Slug "${newSlug}" already exists for location "${existingLocation.name}"` 
        },
        { status: 409 }
      )
    }

    // Update slug in database
    const { error: updateError } = await supabase
      .from('locations')
      .update({ slug: newSlug })
      .eq('id', locationId)

    if (updateError) {
      console.error(`❌ Update error:`, updateError)
      return NextResponse.json(
        { success: false, error: `Failed to update slug: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Slug updated successfully!`)

    // CRITICAL: Invalidate ALL cache layers
    console.log(`🗑️ Invalidating cache for old and new slugs...`)
    
    // Invalidate Upstash cache (FIRST - data source)
    await deleteCached(CacheKeys.location(oldSlug))
    await deleteCached(`${CacheKeys.location(oldSlug)}:related`)
    await deleteCached(CacheKeys.location(newSlug))
    await deleteCached(`${CacheKeys.location(newSlug)}:related`)

    // Invalidate Next.js cache (SECOND - page cache)
    revalidatePath(`/locations/${oldSlug}`)
    revalidatePath(`/locations/${newSlug}`)
    revalidatePath('/locations')

    console.log(`✅ Cache invalidated!`)

    return NextResponse.json({
      success: true,
      message: `Location slug updated from "${oldSlug}" to "${newSlug}"`,
      oldSlug,
      newSlug,
      locationName: location.name
    })

  } catch (error) {
    console.error(`❌ Error fixing location slug:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


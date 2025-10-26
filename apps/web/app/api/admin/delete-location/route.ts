/**
 * API Route: Delete Location
 * DELETE /api/admin/delete-location
 * 
 * Admin-only endpoint to delete a location and all related data
 * - Deletes location record
 * - Deletes related restaurants, activities, images
 * - Handles cascade deletion
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'

export const runtime = 'nodejs'
export const maxDuration = 30

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

    const { locationId, locationName } = await request.json()

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Missing locationId' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [ADMIN] Deleting location: ${locationName} (${locationId})`)

    // Verify location exists
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('id, name, slug')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    // Delete related data (cascade)
    // Most tables have ON DELETE CASCADE, but we'll delete explicitly for safety
    console.log(`🗑️ Deleting related data...`)

    // Delete tables with CASCADE (will auto-delete, but we do it explicitly for logging)
    const deleteTables = [
      'restaurants',
      'activities',
      'attractions',
      'location_activity_links', // NEW: Activity links table (replaces old activities table)
      'activity_media', // NEW: Activity media/photos
      'location_images',
      'location_ratings',
      'location_comments',
      'location_contributions',
      'location_views',
      'user_location_notes',
      'user_locations',
      'trip_location_customizations'
    ]

    for (const table of deleteTables) {
      console.log(`   - Deleting from ${table}...`)
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('location_id', locationId)

      if (error) {
        console.warn(`   ⚠️ Error deleting from ${table}:`, error.message)
        // Continue anyway - might not exist or already deleted by CASCADE
      }
    }

    // Set NULL for tables with ON DELETE SET NULL
    console.log(`🗑️ Updating references with SET NULL...`)

    const setNullTables = [
      'blog_posts',
      'trip_checklists',
      'trip_notes'
    ]

    for (const table of setNullTables) {
      console.log(`   - Setting location_id to NULL in ${table}...`)
      const { error } = await supabase
        .from(table)
        .update({ location_id: null })
        .eq('location_id', locationId)

      if (error) {
        console.warn(`   ⚠️ Error updating ${table}:`, error.message)
        // Continue anyway
      }
    }

    // Delete the location itself
    console.log(`🗑️ Deleting location record...`)
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)

    if (deleteError) {
      console.error(`❌ Delete error:`, deleteError)
      return NextResponse.json(
        { success: false, error: `Failed to delete location: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Location deleted successfully!`)

    // Invalidate caches
    console.log(`🧹 Invalidating caches...`)
    try {
      const { deleteCached, CacheKeys } = await import('@/lib/upstash')
      const { revalidatePath } = await import('next/cache')

      // Clear Upstash cache
      await deleteCached(CacheKeys.location(location.slug))
      await deleteCached(`${CacheKeys.location(location.slug)}:related`)

      // Revalidate Next.js cache
      revalidatePath(`/locations/${location.slug}`)
      revalidatePath('/locations')

      console.log(`✅ Caches invalidated`)
    } catch (cacheError) {
      console.warn(`⚠️ Error invalidating caches:`, cacheError)
      // Continue anyway - deletion was successful
    }

    return NextResponse.json({
      success: true,
      message: `Location "${location.name}" has been deleted`,
      deletedLocation: {
        id: location.id,
        name: location.name,
        slug: location.slug
      }
    })

  } catch (error) {
    console.error(`❌ Error deleting location:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface LocationToDelete {
  id: string
  name: string
  slug: string
  country: string
  created_at: string
  rating_count?: number
  view_count?: number
}

interface DeletionStats {
  locations: number
  location_ratings: number
  location_views: number
  location_comments: number
  location_media: number
  location_tips: number
  location_category_assignments: number
  user_locations: number
}

/**
 * Find all locations with "Travel to" in their titles
 */
async function findTravelToLocations(supabase: any): Promise<LocationToDelete[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, created_at, rating_count, view_count')
    .or('name.ilike.%Travel to%,name.ilike.%travel to%')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Count related records for a location
 */
async function countRelatedRecords(supabase: any, locationId: string): Promise<Partial<DeletionStats>> {
  const stats: Partial<DeletionStats> = {}

  // Count location_ratings
  const { count: ratingsCount } = await supabase
    .from('location_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_ratings = ratingsCount || 0

  // Count location_views
  const { count: viewsCount } = await supabase
    .from('location_views')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_views = viewsCount || 0

  // Count location_comments
  const { count: commentsCount } = await supabase
    .from('location_comments')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_comments = commentsCount || 0

  // Count location_media
  const { count: mediaCount } = await supabase
    .from('location_media')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_media = mediaCount || 0

  // Count location_tips
  const { count: tipsCount } = await supabase
    .from('location_tips')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_tips = tipsCount || 0

  // Count location_category_assignments
  const { count: categoriesCount } = await supabase
    .from('location_category_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_category_assignments = categoriesCount || 0

  // Count user_locations
  const { count: userLocationsCount } = await supabase
    .from('user_locations')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.user_locations = userLocationsCount || 0

  return stats
}

/**
 * Delete a location and all related records
 */
async function deleteLocation(supabase: any, locationId: string): Promise<Partial<DeletionStats>> {
  const stats: Partial<DeletionStats> = {}

  // Delete location_ratings
  const { error: ratingsError, count: ratingsCount } = await supabase
    .from('location_ratings')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (ratingsError) throw ratingsError
  stats.location_ratings = ratingsCount || 0

  // Delete location_views
  const { error: viewsError, count: viewsCount } = await supabase
    .from('location_views')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (viewsError) throw viewsError
  stats.location_views = viewsCount || 0

  // Delete location_comments
  const { error: commentsError, count: commentsCount } = await supabase
    .from('location_comments')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (commentsError) throw commentsError
  stats.location_comments = commentsCount || 0

  // Delete location_media
  const { error: mediaError, count: mediaCount } = await supabase
    .from('location_media')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (mediaError) throw mediaError
  stats.location_media = mediaCount || 0

  // NOTE: location_posts (blog posts) are NOT deleted - they remain in the database

  // Delete location_tips
  const { error: tipsError, count: tipsCount } = await supabase
    .from('location_tips')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (tipsError) throw tipsError
  stats.location_tips = tipsCount || 0

  // Delete location_category_assignments
  const { error: categoriesError, count: categoriesCount } = await supabase
    .from('location_category_assignments')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (categoriesError) throw categoriesError
  stats.location_category_assignments = categoriesCount || 0

  // Delete user_locations
  const { error: userLocationsError, count: userLocationsCount } = await supabase
    .from('user_locations')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (userLocationsError) throw userLocationsError
  stats.user_locations = userLocationsCount || 0

  // Finally, delete the location itself
  const { error: locationError } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
  if (locationError) throw locationError
  stats.locations = 1

  return stats
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authSupabase = await createServerSupabase()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

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

    // Parse request body
    const body = await request.json()
    const { dryRun = false } = body

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Step 1: Find all "Travel to" locations
    const locations = await findTravelToLocations(supabase)

    if (locations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No locations found with "Travel to" in their titles',
        locations: [],
        totalStats: null,
        deletionStats: null
      })
    }

    // Step 2: Count all related records
    const totalStats: DeletionStats = {
      locations: locations.length,
      location_ratings: 0,
      location_views: 0,
      location_comments: 0,
      location_media: 0,
      location_tips: 0,
      location_category_assignments: 0,
      user_locations: 0
    }

    for (const loc of locations) {
      const stats = await countRelatedRecords(supabase, loc.id)
      totalStats.location_ratings += stats.location_ratings || 0
      totalStats.location_views += stats.location_views || 0
      totalStats.location_comments += stats.location_comments || 0
      totalStats.location_media += stats.location_media || 0
      totalStats.location_tips += stats.location_tips || 0
      totalStats.location_category_assignments += stats.location_category_assignments || 0
      totalStats.user_locations += stats.user_locations || 0
    }

    // If dry run, return preview without deleting
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Found ${locations.length} location(s) to delete`,
        locations,
        totalStats,
        deletionStats: null
      })
    }

    // Step 3: Delete locations
    const deletionStats: DeletionStats = {
      locations: 0,
      location_ratings: 0,
      location_views: 0,
      location_comments: 0,
      location_media: 0,
      location_tips: 0,
      location_category_assignments: 0,
      user_locations: 0
    }

    const deletedLocations: string[] = []
    const failedLocations: { name: string; error: string }[] = []

    for (const loc of locations) {
      try {
        const stats = await deleteLocation(supabase, loc.id)
        
        deletionStats.locations += stats.locations || 0
        deletionStats.location_ratings += stats.location_ratings || 0
        deletionStats.location_views += stats.location_views || 0
        deletionStats.location_comments += stats.location_comments || 0
        deletionStats.location_media += stats.location_media || 0
        deletionStats.location_tips += stats.location_tips || 0
        deletionStats.location_category_assignments += stats.location_category_assignments || 0
        deletionStats.user_locations += stats.user_locations || 0
        
        deletedLocations.push(loc.name)
      } catch (error) {
        failedLocations.push({
          name: loc.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Successfully deleted ${deletedLocations.length} location(s)`,
      locations,
      totalStats,
      deletionStats,
      deletedLocations,
      failedLocations
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// GET /api/stats/landing - Public statistics for landing page
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Aggregate statistics using Promise.all for performance
    const [
      tripsResult,
      locationsResult,
      postsResult,
      usersResult,
      mediaResult
    ] = await Promise.all([
      // Published trips count
      supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      
      // Featured locations count
      supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
      
      // Published posts count
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      
      // Active users count
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true }),
      
      // Media files count for visual content stats
      supabase
        .from('media_files')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'image')
    ])

    // Calculate total distance from trip location data
    const { data: tripsWithLocation } = await supabase
      .from('trips')
      .select('location_data')
      .eq('status', 'published')
      .not('location_data', 'is', null)

    // Calculate approximate total distance (simplified calculation)
    let totalDistance = 0
    if (tripsWithLocation) {
      totalDistance = tripsWithLocation.reduce((acc, trip) => {
        const locationData = trip.location_data as any
        if (locationData?.totalDistance) {
          return acc + locationData.totalDistance
        }
        return acc + 500 // Default estimate per trip
      }, 0)
    }

    const stats = {
      totalTrips: tripsResult.count || 0,
      totalDestinations: locationsResult.count || 0,
      totalStories: postsResult.count || 0,
      totalTravelers: usersResult.count || 0,
      totalDistance: Math.round(totalDistance),
      totalPhotos: mediaResult.count || 0
    }

    // Cache for 5 minutes
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('Landing stats API error:', error)
    
    // Return fallback stats on error
    return NextResponse.json({
      totalTrips: 0,
      totalDestinations: 0,
      totalStories: 0,
      totalTravelers: 0,
      totalDistance: 0,
      totalPhotos: 0
    }, { status: 500 })
  }
}

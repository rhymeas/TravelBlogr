import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Fix Activity Descriptions for All Locations
 *
 * This endpoint generates proper descriptions for activities that have:
 * - NULL descriptions
 * - Empty descriptions
 * - Very short descriptions (< 20 characters)
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const locationSlug = searchParams.get('slug')
    const dryRun = searchParams.get('dryRun') === 'true'

    console.log('🔧 Starting activity description fix...')
    console.log(`   Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE UPDATE'}`)
    
    // Get locations to process
    let locationsQuery = supabase
      .from('locations')
      .select('id, name, slug')
      .order('name')

    if (locationSlug) {
      locationsQuery = locationsQuery.eq('slug', locationSlug)
      console.log(`   Scope: Single location (${locationSlug})`)
    } else {
      console.log(`   Scope: All locations`)
    }

    const { data: locations, error: locationsError } = await locationsQuery

    if (locationsError) {
      throw locationsError
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ 
        error: 'No locations found',
        success: false 
      }, { status: 404 })
    }

    console.log(`📍 Found ${locations.length} location(s) to process\n`)

    const results = []
    let totalFixed = 0

    for (const location of locations) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📍 Processing: ${location.name} (${location.slug})`)
      console.log('='.repeat(60))

      // Get activities with missing or short descriptions
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('location_id', location.id)

      if (activitiesError) {
        console.error(`❌ Error fetching activities:`, activitiesError)
        results.push({
          location: location.name,
          slug: location.slug,
          error: 'Failed to fetch activities',
          fixed: 0
        })
        continue
      }

      if (!activities || activities.length === 0) {
        console.log(`ℹ️ No activities found`)
        results.push({
          location: location.name,
          slug: location.slug,
          fixed: 0,
          total: 0
        })
        continue
      }

      // Filter activities that need description fixes
      const activitiesNeedingFix = activities.filter(a => 
        !a.description || 
        a.description.length < 20 ||
        a.description === a.name
      )

      console.log(`📊 Activities: ${activities.length} total, ${activitiesNeedingFix.length} need fixes`)

      if (activitiesNeedingFix.length === 0) {
        console.log(`✅ All activities already have good descriptions`)
        results.push({
          location: location.name,
          slug: location.slug,
          fixed: 0,
          total: activities.length
        })
        continue
      }

      // Generate descriptions
      const updates = activitiesNeedingFix.map(activity => {
        const category = activity.category || 'attraction'
        const name = activity.name
        
        let description = ''
        
        // Generate smart description based on category
        if (category === 'museum') {
          description = `Visit ${name}, a museum showcasing local culture and history. A must-see attraction for art and history enthusiasts.`
        } else if (category === 'viewpoint') {
          description = `Enjoy breathtaking views at ${name}. Perfect spot for photography and taking in the scenery.`
        } else if (category === 'attraction') {
          description = `Explore ${name}, one of the popular attractions in ${location.name}. Great for sightseeing and experiencing local culture.`
        } else if (category === 'park') {
          description = `Relax and unwind at ${name}, a beautiful green space perfect for walks and outdoor activities.`
        } else {
          description = `Experience ${name} in ${location.name}. A wonderful place to visit and explore.`
        }
        
        return {
          id: activity.id,
          name: activity.name,
          oldDescription: activity.description || '(empty)',
          newDescription: description,
          category: category
        }
      })

      // Show preview
      console.log(`\n📝 Preview of changes:`)
      updates.slice(0, 3).forEach((update, i) => {
        console.log(`\n${i + 1}. ${update.name} (${update.category})`)
        console.log(`   OLD: ${update.oldDescription.substring(0, 60)}${update.oldDescription.length > 60 ? '...' : ''}`)
        console.log(`   NEW: ${update.newDescription.substring(0, 60)}...`)
      })
      if (updates.length > 3) {
        console.log(`   ... and ${updates.length - 3} more`)
      }

      // Apply updates (unless dry run)
      if (!dryRun) {
        console.log(`\n💾 Applying updates...`)
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('activities')
            .update({ description: update.newDescription })
            .eq('id', update.id)

          if (updateError) {
            console.error(`❌ Failed to update ${update.name}:`, updateError)
          }
        }
        console.log(`✅ Updated ${updates.length} activities`)
      } else {
        console.log(`\n🔍 DRY RUN - No changes applied`)
      }

      totalFixed += updates.length
      results.push({
        location: location.name,
        slug: location.slug,
        fixed: updates.length,
        total: activities.length,
        samples: updates.slice(0, 3).map(u => ({
          name: u.name,
          category: u.category,
          newDescription: u.newDescription
        }))
      })
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ COMPLETE`)
    console.log(`   Locations processed: ${locations.length}`)
    console.log(`   Activities fixed: ${totalFixed}`)
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      dryRun,
      locationsProcessed: locations.length,
      totalFixed,
      results
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check which locations need fixes
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()
    
    const { searchParams } = new URL(request.url)
    const locationSlug = searchParams.get('slug')

    // Get all locations with activity counts
    let query = supabase
      .from('locations')
      .select(`
        id,
        name,
        slug,
        activities (
          id,
          name,
          description,
          category
        )
      `)
      .order('name')

    if (locationSlug) {
      query = query.eq('slug', locationSlug)
    }

    const { data: locations, error } = await query

    if (error) throw error

    // Analyze each location
    const analysis = locations?.map(location => {
      const activities = location.activities || []
      const needsFix = activities.filter((a: any) => 
        !a.description || 
        a.description.length < 20 ||
        a.description === a.name
      )

      return {
        name: location.name,
        slug: location.slug,
        totalActivities: activities.length,
        needsFix: needsFix.length,
        percentage: activities.length > 0 
          ? Math.round((needsFix.length / activities.length) * 100)
          : 0,
        samples: needsFix.slice(0, 3).map((a: any) => ({
          name: a.name,
          category: a.category,
          currentDescription: a.description || '(empty)'
        }))
      }
    }).filter(l => l.needsFix > 0) || []

    return NextResponse.json({
      success: true,
      locationsNeedingFix: analysis.length,
      totalLocations: locations?.length || 0,
      locations: analysis
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 })
  }
}


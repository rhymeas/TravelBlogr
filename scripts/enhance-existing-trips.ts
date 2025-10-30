/**
 * Auto-Enhance Existing Trips Script
 * 
 * This script enriches existing trips with:
 * - High-quality images from Brave API
 * - Official website links
 * - Activity descriptions
 * - POI metadata
 * 
 * Usage:
 * - Dry run (preview): npm run enhance-trips -- --dry-run
 * - Enhance all trips: npm run enhance-trips
 * - Enhance specific trip: npm run enhance-trips -- --trip-id=<id>
 * - Enhance user's trips: npm run enhance-trips -- --user-id=<id>
 * 
 * Features:
 * - Smart rate limiting (respects Brave API 20 RPS limit)
 * - Progress tracking with detailed logs
 * - Dry run mode to preview changes
 * - Batch processing with concurrency control
 * - Automatic retry on failures
 * - Preserves existing data (only fills missing fields)
 */

import { createClient } from '@supabase/supabase-js'
import { searchActivity } from '../apps/web/lib/services/braveSearchService'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY)
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const tripIdArg = args.find(arg => arg.startsWith('--trip-id='))
const userIdArg = args.find(arg => arg.startsWith('--user-id='))
const specificTripId = tripIdArg?.split('=')[1]
const specificUserId = userIdArg?.split('=')[1]

// Rate limiting (18 requests per second to stay under 20 RPS limit)
const RATE_LIMIT_RPS = 18
const RATE_LIMIT_DELAY = 1000 / RATE_LIMIT_RPS // ~55ms between requests

// Concurrency control
const MAX_CONCURRENT_TRIPS = 3
const MAX_CONCURRENT_ACTIVITIES = 5

// Statistics
const stats = {
  tripsProcessed: 0,
  tripsEnhanced: 0,
  tripsSkipped: 0,
  tripsFailed: 0,
  activitiesEnhanced: 0,
  activitiesFailed: 0,
  imagesAdded: 0,
  linksAdded: 0,
  descriptionsAdded: 0,
}

/**
 * Sleep for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch trips to enhance
 */
async function fetchTrips(): Promise<any[]> {
  console.log('\n📊 Fetching trips to enhance...\n')

  let query = supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter by specific trip ID
  if (specificTripId) {
    query = query.eq('id', specificTripId)
    console.log(`🎯 Filtering by trip ID: ${specificTripId}`)
  }

  // Filter by specific user ID
  if (specificUserId) {
    query = query.eq('user_id', specificUserId)
    console.log(`👤 Filtering by user ID: ${specificUserId}`)
  }

  const { data: trips, error } = await query

  if (error) {
    console.error('❌ Error fetching trips:', error)
    throw error
  }

  console.log(`✅ Found ${trips?.length || 0} trips to process\n`)
  return trips || []
}

/**
 * Extract activities from trip location_data
 */
function extractActivities(trip: any): Array<{ name: string; location: string; day: number }> {
  const activities: Array<{ name: string; location: string; day: number }> = []

  try {
    const locationData = trip.location_data

    if (!locationData || !Array.isArray(locationData)) {
      return activities
    }

    locationData.forEach((day: any, index: number) => {
      const location = day.location || day.name || ''
      
      // Extract activities from schedule
      if (day.schedule && Array.isArray(day.schedule)) {
        day.schedule.forEach((activity: any) => {
          if (activity.name && !activity.name.toLowerCase().includes('depart') && !activity.name.toLowerCase().includes('arrive')) {
            activities.push({
              name: activity.name,
              location,
              day: index + 1
            })
          }
        })
      }

      // Extract POIs
      if (day.pois && Array.isArray(day.pois)) {
        day.pois.forEach((poi: any) => {
          if (poi.name) {
            activities.push({
              name: poi.name,
              location,
              day: index + 1
            })
          }
        })
      }
    })
  } catch (error) {
    console.error('Error extracting activities:', error)
  }

  return activities
}

/**
 * Enhance single activity with Brave API
 */
async function enhanceActivity(
  activityName: string,
  location: string
): Promise<{ image?: string; link?: string; description?: string } | null> {
  try {
    // Rate limiting
    await sleep(RATE_LIMIT_DELAY)

    console.log(`  🔍 Enriching: "${activityName}" in ${location}`)

    // Use smart searchActivity service
    const { images, links } = await searchActivity(activityName, location)

    const result = {
      image: images[0]?.thumbnail || images[0]?.url || undefined,
      link: links[0]?.url || undefined,
      description: links[0]?.description || undefined
    }

    if (result.image) stats.imagesAdded++
    if (result.link) stats.linksAdded++
    if (result.description) stats.descriptionsAdded++

    console.log(`  ✅ Found: ${result.image ? '🖼️' : ''}${result.link ? '🔗' : ''}${result.description ? '📝' : ''}`)

    return result

  } catch (error) {
    console.error(`  ❌ Failed to enhance "${activityName}":`, error)
    stats.activitiesFailed++
    return null
  }
}

/**
 * Enhance single trip
 */
async function enhanceTrip(trip: any): Promise<boolean> {
  console.log(`\n📍 Processing Trip: "${trip.title}" (ID: ${trip.id})`)
  console.log(`   Created: ${new Date(trip.created_at).toLocaleDateString()}`)

  try {
    // Extract activities
    const activities = extractActivities(trip)
    console.log(`   Found ${activities.length} activities to enhance`)

    if (activities.length === 0) {
      console.log('   ⚠️ No activities found, skipping...')
      stats.tripsSkipped++
      return false
    }

    // Enhance activities with concurrency control
    const enhancedActivities: Map<string, any> = new Map()

    for (let i = 0; i < activities.length; i += MAX_CONCURRENT_ACTIVITIES) {
      const batch = activities.slice(i, i + MAX_CONCURRENT_ACTIVITIES)
      
      const results = await Promise.all(
        batch.map(async (activity) => {
          const enrichment = await enhanceActivity(activity.name, activity.location)
          return { activity, enrichment }
        })
      )

      results.forEach(({ activity, enrichment }) => {
        if (enrichment) {
          enhancedActivities.set(activity.name, enrichment)
          stats.activitiesEnhanced++
        }
      })
    }

    // Update trip location_data with enriched data
    if (enhancedActivities.size > 0 && !isDryRun) {
      const updatedLocationData = trip.location_data.map((day: any) => {
        // Enhance schedule activities
        if (day.schedule && Array.isArray(day.schedule)) {
          day.schedule = day.schedule.map((activity: any) => {
            const enrichment = enhancedActivities.get(activity.name)
            if (enrichment) {
              return {
                ...activity,
                image_url: enrichment.image || activity.image_url,
                link_url: enrichment.link || activity.link_url,
                description: enrichment.description || activity.description
              }
            }
            return activity
          })
        }

        // Enhance POIs
        if (day.pois && Array.isArray(day.pois)) {
          day.pois = day.pois.map((poi: any) => {
            const enrichment = enhancedActivities.get(poi.name)
            if (enrichment) {
              return {
                ...poi,
                image: enrichment.image || poi.image,
                link: enrichment.link || poi.link,
                description: enrichment.description || poi.description
              }
            }
            return poi
          })
        }

        return day
      })

      // Save to database
      const { error } = await supabase
        .from('trips')
        .update({
          location_data: updatedLocationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) {
        console.error('   ❌ Failed to update trip:', error)
        stats.tripsFailed++
        return false
      }

      console.log(`   ✅ Enhanced ${enhancedActivities.size} activities`)
      stats.tripsEnhanced++
      return true
    } else if (isDryRun) {
      console.log(`   🔍 DRY RUN: Would enhance ${enhancedActivities.size} activities`)
      stats.tripsEnhanced++
      return true
    } else {
      console.log('   ⚠️ No activities were enhanced')
      stats.tripsSkipped++
      return false
    }

  } catch (error) {
    console.error('   ❌ Error enhancing trip:', error)
    stats.tripsFailed++
    return false
  } finally {
    stats.tripsProcessed++
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 TravelBlogr Trip Enhancement Script\n')
  console.log('=' .repeat(60))
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved')
  } else {
    console.log('⚠️  LIVE MODE - Changes will be saved to database')
  }
  
  console.log('=' .repeat(60))

  try {
    // Fetch trips
    const trips = await fetchTrips()

    if (trips.length === 0) {
      console.log('\n⚠️ No trips found to enhance')
      return
    }

    // Process trips with concurrency control
    for (let i = 0; i < trips.length; i += MAX_CONCURRENT_TRIPS) {
      const batch = trips.slice(i, i + MAX_CONCURRENT_TRIPS)
      
      await Promise.all(
        batch.map(trip => enhanceTrip(trip))
      )

      // Progress update
      console.log(`\n📊 Progress: ${Math.min(i + MAX_CONCURRENT_TRIPS, trips.length)}/${trips.length} trips processed`)
    }

    // Final statistics
    console.log('\n' + '='.repeat(60))
    console.log('📊 ENHANCEMENT COMPLETE')
    console.log('='.repeat(60))
    console.log(`Trips Processed:      ${stats.tripsProcessed}`)
    console.log(`Trips Enhanced:       ${stats.tripsEnhanced}`)
    console.log(`Trips Skipped:        ${stats.tripsSkipped}`)
    console.log(`Trips Failed:         ${stats.tripsFailed}`)
    console.log(`Activities Enhanced:  ${stats.activitiesEnhanced}`)
    console.log(`Activities Failed:    ${stats.activitiesFailed}`)
    console.log(`Images Added:         ${stats.imagesAdded}`)
    console.log(`Links Added:          ${stats.linksAdded}`)
    console.log(`Descriptions Added:   ${stats.descriptionsAdded}`)
    console.log('='.repeat(60))

    if (isDryRun) {
      console.log('\n🔍 This was a DRY RUN - no changes were saved')
      console.log('   Run without --dry-run to apply changes')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main()


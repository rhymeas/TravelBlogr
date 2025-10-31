#!/usr/bin/env tsx

/**
 * Cleanup Script: Remove "Travel to" Locations
 * 
 * This script removes all locations with "Travel to" in their titles from the database.
 * It also removes all related data to maintain database integrity.
 * 
 * Related tables cleaned up:
 * - locations (main table)
 * - location_ratings (user ratings)
 * - location_views (pixel tracking)
 * - location_comments (community comments)
 * - location_media (images/videos)
 * - location_posts (CMS posts about locations)
 * - location_tips (user tips)
 * - location_category_assignments (category relationships)
 * - user_locations (user customizations)
 * 
 * Usage:
 *   npm run cleanup:travel-to-locations
 *   
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --confirm    Skip confirmation prompt (use with caution!)
 * 
 * Examples:
 *   npm run cleanup:travel-to-locations -- --dry-run
 *   npm run cleanup:travel-to-locations -- --confirm
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const skipConfirmation = args.includes('--confirm')

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
  location_posts: number
  location_tips: number
  location_category_assignments: number
  user_locations: number
}

/**
 * Find all locations with "Travel to" in their titles
 */
async function findTravelToLocations(): Promise<LocationToDelete[]> {
  console.log('🔍 Searching for locations with "Travel to" in their titles...\n')

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, created_at, rating_count, view_count')
    .or('name.ilike.%Travel to%,name.ilike.%travel to%')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    throw error
  }

  return data || []
}

/**
 * Count related records for a location
 */
async function countRelatedRecords(locationId: string): Promise<Partial<DeletionStats>> {
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

  // Count location_posts
  const { count: postsCount } = await supabase
    .from('location_posts')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId)
  stats.location_posts = postsCount || 0

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
async function deleteLocation(locationId: string): Promise<Partial<DeletionStats>> {
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

  // Delete location_posts
  const { error: postsError, count: postsCount } = await supabase
    .from('location_posts')
    .delete({ count: 'exact' })
    .eq('location_id', locationId)
  if (postsError) throw postsError
  stats.location_posts = postsCount || 0

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

/**
 * Ask user for confirmation
 */
async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Cleanup Script: Remove "Travel to" Locations                 ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n')
  }

  // Step 1: Find all "Travel to" locations
  const locations = await findTravelToLocations()

  if (locations.length === 0) {
    console.log('✅ No locations found with "Travel to" in their titles.')
    console.log('   Database is already clean!\n')
    return
  }

  console.log(`📊 Found ${locations.length} location(s) to delete:\n`)

  // Display locations
  locations.forEach((loc, index) => {
    console.log(`${index + 1}. ${loc.name}`)
    console.log(`   Slug: ${loc.slug}`)
    console.log(`   Country: ${loc.country}`)
    console.log(`   Created: ${new Date(loc.created_at).toLocaleDateString()}`)
    console.log(`   Ratings: ${loc.rating_count || 0} | Views: ${loc.view_count || 0}`)
    console.log('')
  })

  // Step 2: Count all related records
  console.log('📊 Counting related records...\n')
  
  const totalStats: DeletionStats = {
    locations: locations.length,
    location_ratings: 0,
    location_views: 0,
    location_comments: 0,
    location_media: 0,
    location_posts: 0,
    location_tips: 0,
    location_category_assignments: 0,
    user_locations: 0
  }

  for (const loc of locations) {
    const stats = await countRelatedRecords(loc.id)
    totalStats.location_ratings += stats.location_ratings || 0
    totalStats.location_views += stats.location_views || 0
    totalStats.location_comments += stats.location_comments || 0
    totalStats.location_media += stats.location_media || 0
    totalStats.location_posts += stats.location_posts || 0
    totalStats.location_tips += stats.location_tips || 0
    totalStats.location_category_assignments += stats.location_category_assignments || 0
    totalStats.user_locations += stats.user_locations || 0
  }

  console.log('📊 Total records to be deleted:\n')
  console.log(`   Locations:                    ${totalStats.locations}`)
  console.log(`   Location Ratings:             ${totalStats.location_ratings}`)
  console.log(`   Location Views:               ${totalStats.location_views}`)
  console.log(`   Location Comments:            ${totalStats.location_comments}`)
  console.log(`   Location Media:               ${totalStats.location_media}`)
  console.log(`   Location Posts:               ${totalStats.location_posts}`)
  console.log(`   Location Tips:                ${totalStats.location_tips}`)
  console.log(`   Location Category Assignments: ${totalStats.location_category_assignments}`)
  console.log(`   User Locations:               ${totalStats.user_locations}`)
  console.log(`   ─────────────────────────────────────────────────`)
  const totalRecords = Object.values(totalStats).reduce((sum, val) => sum + val, 0)
  console.log(`   TOTAL:                        ${totalRecords}\n`)

  if (isDryRun) {
    console.log('✅ DRY RUN COMPLETE - No data was deleted\n')
    return
  }

  // Step 3: Confirm deletion
  if (!skipConfirmation) {
    console.log('⚠️  WARNING: This action cannot be undone!\n')
    const confirmed = await askConfirmation('Are you sure you want to delete these locations? (y/N): ')
    
    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user.\n')
      return
    }
  }

  // Step 4: Delete locations
  console.log('\n🗑️  Deleting locations...\n')

  let deletedCount = 0
  const deletionStats: DeletionStats = {
    locations: 0,
    location_ratings: 0,
    location_views: 0,
    location_comments: 0,
    location_media: 0,
    location_posts: 0,
    location_tips: 0,
    location_category_assignments: 0,
    user_locations: 0
  }

  for (const loc of locations) {
    try {
      console.log(`   Deleting: ${loc.name}...`)
      const stats = await deleteLocation(loc.id)
      
      deletionStats.locations += stats.locations || 0
      deletionStats.location_ratings += stats.location_ratings || 0
      deletionStats.location_views += stats.location_views || 0
      deletionStats.location_comments += stats.location_comments || 0
      deletionStats.location_media += stats.location_media || 0
      deletionStats.location_posts += stats.location_posts || 0
      deletionStats.location_tips += stats.location_tips || 0
      deletionStats.location_category_assignments += stats.location_category_assignments || 0
      deletionStats.user_locations += stats.user_locations || 0
      
      deletedCount++
      console.log(`   ✅ Deleted successfully\n`)
    } catch (error) {
      console.error(`   ❌ Error deleting ${loc.name}:`, error)
    }
  }

  // Step 5: Summary
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Deletion Summary                                              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  console.log(`✅ Successfully deleted ${deletedCount} location(s)\n`)
  console.log('📊 Records deleted:\n')
  console.log(`   Locations:                    ${deletionStats.locations}`)
  console.log(`   Location Ratings:             ${deletionStats.location_ratings}`)
  console.log(`   Location Views:               ${deletionStats.location_views}`)
  console.log(`   Location Comments:            ${deletionStats.location_comments}`)
  console.log(`   Location Media:               ${deletionStats.location_media}`)
  console.log(`   Location Posts:               ${deletionStats.location_posts}`)
  console.log(`   Location Tips:                ${deletionStats.location_tips}`)
  console.log(`   Location Category Assignments: ${deletionStats.location_category_assignments}`)
  console.log(`   User Locations:               ${deletionStats.user_locations}`)
  console.log(`   ─────────────────────────────────────────────────`)
  const totalDeleted = Object.values(deletionStats).reduce((sum, val) => sum + val, 0)
  console.log(`   TOTAL:                        ${totalDeleted}\n`)
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })


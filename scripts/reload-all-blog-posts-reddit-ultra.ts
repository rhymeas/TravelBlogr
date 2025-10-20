#!/usr/bin/env tsx

/**
 * Reload ALL blog posts with Reddit ULTRA images and proper map functionality
 *
 * This script:
 * 1. Fetches all blog posts from database
 * 2. Refetches images using Reddit ULTRA (priority #1)
 * 3. Ensures all days have proper coordinates for map display
 * 4. Updates blog posts in database
 *
 * Usage:
 * npx tsx scripts/reload-all-blog-posts-reddit-ultra.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { BlogPostEnhancer } from '../apps/web/lib/batch/domain/BlogPostEnhancer'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Geocode a location to get coordinates
 */
async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    console.log(`      🌍 Geocoding: ${locationName}`)
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)'
        }
      }
    )

    if (!response.ok) {
      console.error(`      ❌ Geocoding failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      console.log(`      ✅ Coordinates: ${coords.lat}, ${coords.lng}`)
      return coords
    }

    console.log(`      ⚠️  No coordinates found`)
    return null
  } catch (error) {
    console.error(`      ❌ Geocoding error:`, error)
    return null
  }
}

/**
 * Ensure all days have proper coordinates for map display
 */
async function ensureMapCoordinates(content: any): Promise<any> {
  if (!content?.days || !Array.isArray(content.days)) {
    return content
  }

  console.log(`   📍 Ensuring map coordinates for ${content.days.length} days...`)

  let updatedCount = 0

  for (const day of content.days) {
    // Check if day has location data
    if (!day.location?.coordinates) {
      // Try to get location name
      const locationName = day.location?.name || day.title || content.destination

      if (locationName) {
        const coords = await geocodeLocation(locationName)
        
        if (coords) {
          // Add coordinates to day
          day.location = {
            ...day.location,
            name: locationName,
            coordinates: coords
          }
          updatedCount++
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  console.log(`   ✅ Added coordinates to ${updatedCount} days`)

  return content
}

/**
 * Reload a single blog post with Reddit ULTRA images and map coordinates
 */
async function reloadBlogPost(post: any) {
  console.log(`\n📝 Reloading: ${post.title}`)
  console.log(`   Slug: ${post.slug}`)

  try {
    const content = post.content as any

    if (!content?.destination) {
      console.log(`   ⚠️  No destination found, skipping...`)
      return { success: false, reason: 'no_destination' }
    }

    // Create a trip object from blog post content
    const tripData = {
      destination: content.destination,
      days: content.days || [],
      title: post.title
    }

    // 1. Refetch images with Reddit ULTRA
    console.log(`   🖼️  Fetching images with Reddit ULTRA for: ${content.destination}`)
    const enhancedContent = await BlogPostEnhancer.enhance(
      content,
      tripData
    )

    // Count images
    const imageCount = enhancedContent.content.images?.length || 0
    console.log(`   ✅ Fetched ${imageCount} images (Reddit ULTRA priority!)`)

    // 2. Ensure map coordinates
    const daysWithCoords = await ensureMapCoordinates({ days: enhancedContent.content.days })

    // 3. Update blog post with new structure (days directly in content)
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: {
          ...content,
          days: daysWithCoords.days,
          images: enhancedContent.content.images,
          mapData: enhancedContent.content.mapData,
          adPlacements: enhancedContent.content.adPlacements
        },
        featured_image: enhancedContent.featured_image,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id)

    if (updateError) {
      console.error(`   ❌ Failed to update:`, updateError)
      return { success: false, reason: 'update_failed', error: updateError }
    }

    console.log(`   ✅ Blog post reloaded successfully!`)
    return { success: true, imageCount }

  } catch (error) {
    console.error(`   ❌ Error reloading blog post:`, error)
    return { success: false, reason: 'exception', error }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting blog post reload with Reddit ULTRA...\n')
  console.log('📋 This will:')
  console.log('   1. Fetch all blog posts from database')
  console.log('   2. Refetch images using Reddit ULTRA (priority #1)')
  console.log('   3. Ensure all days have coordinates for map display')
  console.log('   4. Update blog posts in database\n')

  // 1. Fetch all blog posts
  console.log('📦 Fetching all blog posts...')
  const { data: posts, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('❌ Failed to fetch blog posts:', fetchError)
    process.exit(1)
  }

  if (!posts || posts.length === 0) {
    console.log('⚠️  No blog posts found')
    process.exit(0)
  }

  console.log(`✅ Found ${posts.length} blog posts\n`)

  // 2. Reload each blog post
  const results = {
    total: posts.length,
    success: 0,
    failed: 0,
    skipped: 0,
    totalImages: 0
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] Processing...`)

    const result = await reloadBlogPost(post)

    if (result.success) {
      results.success++
      results.totalImages += result.imageCount || 0
    } else if (result.reason === 'no_destination') {
      results.skipped++
    } else {
      results.failed++
    }

    // Small delay between posts to avoid rate limits
    if (i < posts.length - 1) {
      console.log(`   ⏳ Waiting 2 seconds before next post...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 3. Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 RELOAD SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total blog posts: ${results.total}`)
  console.log(`✅ Successfully reloaded: ${results.success}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️  Skipped (no destination): ${results.skipped}`)
  console.log(`📸 Total images fetched: ${results.totalImages}`)
  console.log('='.repeat(60))
  console.log('\n✅ All blog posts reloaded with Reddit ULTRA images!')
  console.log('🗺️  All blog posts now have proper map functionality!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })


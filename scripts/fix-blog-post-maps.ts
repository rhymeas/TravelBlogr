#!/usr/bin/env tsx

/**
 * Fix Blog Post Maps - Add Location Coordinates
 * 
 * This script adds geocoded coordinates to blog post days so maps work properly
 * 
 * Usage:
 * npx tsx scripts/fix-blog-post-maps.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Geocode a location name to coordinates using GeoNames API
 */
async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const username = process.env.GEONAMES_USERNAME || 'travelblogr'
    const response = await fetch(
      `http://api.geonames.org/searchJSON?q=${encodeURIComponent(locationName)}&maxRows=1&username=${username}`
    )

    if (!response.ok) {
      console.log(`⚠️  Geocoding failed for "${locationName}"`)
      return null
    }

    const data = await response.json()
    const result = data.geonames?.[0]

    if (!result) {
      console.log(`⚠️  No results for "${locationName}"`)
      return null
    }

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lng)
    }
  } catch (error) {
    console.error(`❌ Geocoding error for "${locationName}":`, error)
    return null
  }
}

/**
 * Fix a single blog post by adding coordinates to days
 */
async function fixBlogPost(postId: string, slug: string, title: string) {
  console.log(`\n📝 Fixing: ${title}`)

  // Get blog post
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    console.error(`❌ Failed to fetch post:`, fetchError)
    return
  }

  const content = post.content as any
  if (!content?.days || content.days.length === 0) {
    console.log(`⚠️  No days found in content`)
    return
  }

  console.log(`   Found ${content.days.length} days`)

  // Add coordinates to each day
  let updatedCount = 0
  const updatedDays = await Promise.all(
    content.days.map(async (day: any) => {
      // Skip if already has coordinates
      if (day.location?.coordinates) {
        console.log(`   ✓ Day ${day.day_number}: Already has coordinates`)
        return day
      }

      // Get location name
      const locationName = day.location?.name || day.title || content.destination

      console.log(`   🔍 Geocoding: ${locationName}`)

      // Geocode location
      const coords = await geocodeLocation(locationName)

      if (coords) {
        updatedCount++
        console.log(`   ✅ Day ${day.day_number}: ${coords.lat}, ${coords.lng}`)
        return {
          ...day,
          location: {
            ...day.location,
            name: locationName,
            coordinates: coords
          }
        }
      } else {
        console.log(`   ⚠️  Day ${day.day_number}: Could not geocode`)
        return day
      }
    })
  )

  if (updatedCount === 0) {
    console.log(`   ⚠️  No coordinates added`)
    return
  }

  // Update blog post
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({
      content: {
        ...content,
        days: updatedDays
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)

  if (updateError) {
    console.error(`❌ Failed to update post:`, updateError)
    return
  }

  console.log(`   ✅ Updated ${updatedCount} days with coordinates`)
}

async function main() {
  console.log('🗺️  Fixing blog post maps...\n')

  // Get all published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error || !posts) {
    console.error('❌ Failed to fetch blog posts:', error)
    return
  }

  console.log(`Found ${posts.length} published blog posts\n`)

  // Fix each post
  for (const post of posts) {
    await fixBlogPost(post.id, post.slug, post.title)
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n✅ All blog posts fixed!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })


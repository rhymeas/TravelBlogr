#!/usr/bin/env tsx
/**
 * Add Images to Blog Posts
 * Simple script to add location-specific images to blog post days
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addImagesToPost(slug: string) {
  console.log(`\n🔧 Processing: ${slug}`)

  // Fetch post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    console.error(`❌ Not found`)
    return
  }

  const content = post.content as any
  let updated = false

  // Process each day
  if (content.days && Array.isArray(content.days)) {
    for (let i = 0; i < content.days.length; i++) {
      const day = content.days[i]
      const locationName = day.location?.name || content.destination

      // Skip if already has images
      if (day.images && day.images.length > 0) {
        console.log(`  Day ${day.day_number}: Already has ${day.images.length} images ✓`)
        continue
      }

      console.log(`  Day ${day.day_number}: Fetching images for ${locationName}...`)
      
      try {
        const imageUrls = await fetchLocationGalleryHighQuality(locationName, 3)
        
        if (imageUrls && imageUrls.length > 0) {
          // Create image objects
          day.images = imageUrls.map((url: string, idx: number) => ({
            url,
            alt: `${locationName} - Day ${day.day_number}`,
            caption: locationName,
            size: idx === 0 ? 'large' : 'medium',
            aspectRatio: '16:9',
            position: idx
          }))
          
          console.log(`    ✅ Added ${imageUrls.length} images`)
          updated = true
        } else {
          console.log(`    ⚠️  No images found`)
        }
      } catch (error) {
        console.log(`    ❌ Error:`, error.message)
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Save if updated
  if (updated) {
    console.log(`  💾 Saving changes...`)
    
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id)

    if (updateError) {
      console.error(`  ❌ Save failed:`, updateError.message)
    } else {
      console.log(`  ✅ Saved successfully!`)
    }
  } else {
    console.log(`  ℹ️  No changes needed`)
  }
}

async function main() {
  console.log('🚀 Adding images to blog posts...\n')

  // Process specific posts
  const posts = [
    'barcelona-family-travel-guide',
    'lisbon-digital-nomad-guide',
    'kyoto-autumn-photography-journey'
  ]

  for (const slug of posts) {
    await addImagesToPost(slug)
  }

  console.log('\n✅ Done!')
}

main()


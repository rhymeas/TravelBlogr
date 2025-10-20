#!/usr/bin/env tsx
/**
 * Final Blog Post Fixer
 * 
 * Fixes all remaining issues:
 * 1. Duplicating introduction text ✅
 * 2. Missing location-specific images (Unsplash/Pexels)
 * 3. Missing public transport provider links
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

// Transport providers by city
const TRANSPORT_PROVIDERS: Record<string, { providers: string[]; tips: string }> = {
  'Barcelona': {
    providers: ['TMB Metro', 'TMB Bus', 'FGC Trains', 'Renfe Cercanías'],
    tips: 'Get a T-Casual card for 10 trips - works on metro, bus, and trains. Download the TMB app for real-time schedules.'
  },
  'Tokyo': {
    providers: ['Tokyo Metro', 'Toei Subway', 'JR East', 'Keio Line', 'Odakyu Line'],
    tips: 'Get a Suica or Pasmo card for seamless travel. Download the Tokyo Subway Navigation app.'
  },
  'Rome': {
    providers: ['ATAC Metro', 'ATAC Bus', 'Trenitalia'],
    tips: 'Buy a Roma Pass for unlimited public transport and museum discounts. Metro closes at 11:30 PM on weekdays.'
  },
  'Lisbon': {
    providers: ['Metro de Lisboa', 'Carris Trams', 'Carris Buses', 'CP Trains'],
    tips: 'Get a Viva Viagem card and load it with 24-hour passes. Don\'t miss the iconic Tram 28!'
  },
  'Kyoto': {
    providers: ['Kyoto City Bus', 'Kyoto Subway', 'Keihan Railway', 'Hankyu Railway'],
    tips: 'Buy a Kyoto Bus One-Day Pass for unlimited bus rides. Buses are the best way to reach temples.'
  }
}

// Add transport providers to location
function addTransportProviders(locationName: string): any {
  const cityName = locationName.split(',')[0].trim()
  
  for (const [city, transport] of Object.entries(TRANSPORT_PROVIDERS)) {
    if (cityName.toLowerCase().includes(city.toLowerCase())) {
      return transport
    }
  }

  return null
}

async function fixBlogPost(slug: string) {
  console.log(`\n🔧 Fixing: ${slug}`)

  // Fetch post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    console.error(`❌ Not found: ${slug}`)
    return
  }

  const content = post.content as any
  let updated = false

  // 1. Fix duplicating introduction
  if (content.introduction) {
    const sentences = content.introduction.split('...')
    if (sentences.length > 1) {
      content.introduction = sentences[0].trim() + '...'
      console.log('  ✅ Fixed duplicated introduction')
      updated = true
    }
  }

  // 2. Add images and transport to each day
  if (content.days && Array.isArray(content.days)) {
    for (let i = 0; i < content.days.length; i++) {
      const day = content.days[i]
      const locationName = day.location?.name || content.destination

      // Add images if missing
      if (!day.images || day.images.length === 0) {
        console.log(`  🖼️  Fetching images for ${locationName}...`)

        try {
          const imageUrls = await fetchLocationGalleryHighQuality(locationName, 3)
          if (imageUrls && imageUrls.length > 0) {
            day.images = imageUrls.map((url: string, idx: number) => ({
              url,
              alt: `${locationName} - Day ${day.day_number}`,
              caption: `${locationName}`,
              size: idx === 0 ? 'large' : 'medium',
              aspectRatio: '16:9',
              position: idx
            }))
            console.log(`    ✅ Added ${imageUrls.length} images`)
            updated = true
          }
        } catch (error) {
          console.log(`    ⚠️  Error fetching images:`, error)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Add transport providers if missing
      if (day.location && !day.location.transportation) {
        const transport = addTransportProviders(locationName)
        
        if (transport) {
          day.location.transportation = transport
          console.log(`    🚇 Added transport: ${transport.providers.join(', ')}`)
          updated = true
        }
      }
    }
  }

  // 3. Update post if changes were made
  if (updated) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id)

    if (updateError) {
      console.error(`❌ Error updating:`, updateError)
    } else {
      console.log(`✅ Successfully updated`)
    }
  } else {
    console.log(`  ℹ️  No changes needed`)
  }
}

async function main() {
  console.log('🚀 Starting final blog post fixes...\n')

  // Get all blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .order('created_at', { ascending: false })

  if (error || !posts) {
    console.error('❌ Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts.length} blog posts\n`)

  for (const post of posts) {
    await fixBlogPost(post.slug)
  }

  console.log('\n✅ All done!')
}

main()


#!/usr/bin/env tsx
/**
 * Comprehensive Blog Post Fixer
 * 
 * Fixes:
 * 1. Duplicating introduction text
 * 2. Missing location-specific images
 * 3. Missing public transport provider links
 * 4. Generic images instead of location-specific
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

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

// Fetch location-specific images from Reddit
async function fetchLocationImages(locationName: string, count: number = 3): Promise<any[]> {
  const subreddits = [
    'itookapicture',
    'travelphotography', 
    'CityPorn',
    'VillagePorn',
    'ArchitecturePorn'
  ]

  const images: any[] = []
  
  for (const subreddit of subreddits) {
    if (images.length >= count) break

    try {
      const searchQuery = locationName.split(',')[0].trim() // Just city name
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=top&t=year&limit=10`,
        { headers: { 'User-Agent': 'TravelBlogr/1.0' } }
      )

      if (!response.ok) continue

      const data = await response.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        if (images.length >= count) break

        const postData = post.data
        const url = postData.url

        // Check if it's a direct image URL
        if (url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png'))) {
          images.push({
            url,
            alt: `${locationName} - ${postData.title}`,
            caption: postData.title,
            size: images.length === 0 ? 'large' : 'medium',
            aspectRatio: '16:9',
            position: images.length
          })
        }
      }
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error)
    }
  }

  return images
}

// Fix introduction duplication
function fixIntroduction(content: any): any {
  if (!content.introduction) return content

  const intro = content.introduction
  
  // Check if introduction is duplicated
  const sentences = intro.split('...')
  if (sentences.length > 1) {
    // Take only the first occurrence
    content.introduction = sentences[0].trim() + '...'
  }

  return content
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
  console.log(`\n🔧 Fixing blog post: ${slug}`)

  // Fetch post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    console.error(`❌ Post not found: ${slug}`)
    return
  }

  const content = post.content as any
  let updated = false

  // 1. Fix duplicating introduction
  console.log('  📝 Fixing introduction...')
  const oldIntro = content.introduction
  fixIntroduction(content)
  if (oldIntro !== content.introduction) {
    console.log('    ✅ Fixed duplicated introduction')
    updated = true
  }

  // 2. Add images and transport to each day
  if (content.days && Array.isArray(content.days)) {
    for (let i = 0; i < content.days.length; i++) {
      const day = content.days[i]
      console.log(`  📅 Processing Day ${day.day_number}: ${day.title}`)

      // Add images if missing
      if (!day.images || day.images.length === 0) {
        const locationName = day.location?.name || content.destination
        console.log(`    🖼️  Fetching images for ${locationName}...`)
        
        const images = await fetchLocationImages(locationName, 3)
        if (images.length > 0) {
          day.images = images
          console.log(`    ✅ Added ${images.length} images`)
          updated = true
        } else {
          console.log(`    ⚠️  No images found`)
        }
      }

      // Add transport providers if missing
      if (day.location && !day.location.transportation) {
        const locationName = day.location.name
        const transport = addTransportProviders(locationName)
        
        if (transport) {
          day.location.transportation = transport
          console.log(`    🚇 Added transport providers: ${transport.providers.join(', ')}`)
          updated = true
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
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
      console.error(`❌ Error updating post:`, updateError)
    } else {
      console.log(`✅ Successfully updated ${slug}`)
    }
  } else {
    console.log(`  ℹ️  No changes needed`)
  }
}

async function main() {
  console.log('🚀 Starting comprehensive blog post fixes...\n')

  // Get all blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .order('created_at', { ascending: false })

  if (error || !posts) {
    console.error('❌ Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts.length} blog posts to process\n`)

  for (const post of posts) {
    await fixBlogPost(post.slug)
  }

  console.log('\n✅ All blog posts processed!')
}

main()


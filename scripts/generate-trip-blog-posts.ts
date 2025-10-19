#!/usr/bin/env tsx

/**
 * Generate Blog Posts from Existing Trips
 *
 * This script:
 * 1. Fetches all published trips from the database
 * 2. For each trip, generates an engaging blog post from trip data
 * 3. Integrates trip data (itinerary, maps, photos, highlights)
 * 4. Saves blog posts to the blog_posts table
 *
 * Note: This creates blog posts directly from trip data.
 * Users can enhance their posts using the GROQ writing assistant in the CMS.
 *
 * Usage:
 *   npm run generate-blog-posts
 *   or
 *   tsx scripts/generate-trip-blog-posts.ts
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Trip {
  id: string
  user_id: string
  title: string
  slug: string
  description: string
  cover_image: string
  start_date: string
  end_date: string
  location_data: any
  created_at: string
}

interface Post {
  id: string
  trip_id: string
  title: string
  content: string
  excerpt: string
  featured_image: string | null
  location: string | null
  location_data: any
  post_date: string
  order_index: number
}

interface BlogPostContent {
  title: string
  excerpt: string
  introduction: string
  highlights: string[]
  days: Array<{
    day_number: number
    title: string
    description: string
    activities: string[]
    tips?: string
    location?: {
      name: string
      coordinates?: { lat: number; lng: number }
    }
  }>
  practicalInfo: {
    bestTime: string
    budget: string
    packing: string[]
  }
  conclusion: string
  tags: string[]
  category: string
}

/**
 * Generate engaging blog post content directly from trip data
 * (No AI - create content from existing trip information)
 */
function generateBlogPostContent(trip: Trip, posts: Post[]): BlogPostContent {
  // Extract destination from trip data
  const destination = trip.location_data?.route?.to ||
                     trip.location_data?.locations?.major?.[0]?.name ||
                     posts[0]?.location ||
                     'Unknown Destination'

  // Determine trip category based on trip data
  const category = determineTripCategory(trip, posts)

  // Create engaging title
  const title = `${posts.length} Days in ${destination}: ${trip.title}`

  // Create excerpt from description
  const excerpt = trip.description
    ? trip.description.substring(0, 180) + '...'
    : `Discover the ultimate ${posts.length}-day journey through ${destination}. An unforgettable adventure awaits!`

  // Create introduction
  const introduction = `
${trip.description || `Embark on an incredible ${posts.length}-day journey through ${destination}.`}

This carefully crafted itinerary takes you through the best experiences, hidden gems, and must-see attractions. Whether you're seeking adventure, culture, or relaxation, this trip has something special for everyone.

From the moment you arrive to your final farewell, every day is filled with memorable moments and authentic experiences that will stay with you long after you return home.
  `.trim()

  // Extract highlights from trip data
  const highlights = extractHighlights(trip, posts)

  // Create day-by-day content
  const days = posts.map((post, index) => ({
    day_number: index + 1,
    title: post.title,
    description: post.content || post.excerpt || `Explore ${post.location || 'amazing locations'} and discover unforgettable experiences.`,
    activities: extractActivities(post),
    tips: generateProTip(post, index),
    location: {
      name: post.location || destination,
      coordinates: post.location_data?.coordinates
    }
  }))

  // Create practical information
  const practicalInfo = {
    bestTime: determineBestTime(trip),
    budget: estimateBudget(posts.length),
    packing: generatePackingList(category, posts.length)
  }

  // Create conclusion
  const conclusion = `
This ${posts.length}-day journey through ${destination} offers the perfect blend of adventure, culture, and unforgettable experiences. From ${posts[0]?.title || 'your first day'} to ${posts[posts.length - 1]?.title || 'your final day'}, every moment is designed to create lasting memories.

Ready to embark on your own adventure? Start planning your trip today and discover why ${destination} should be at the top of your travel bucket list. The journey of a lifetime awaits!
  `.trim()

  // Generate tags
  const tags = generateTags(trip, posts, destination, category)

  return {
    title,
    excerpt,
    introduction,
    highlights,
    days,
    practicalInfo,
    conclusion,
    tags,
    category
  }
}

/**
 * Helper functions for content generation
 */
function determineTripCategory(trip: Trip, posts: Post[]): string {
  const title = trip.title.toLowerCase()
  const description = (trip.description || '').toLowerCase()

  if (title.includes('family') || description.includes('family')) return 'Family'
  if (title.includes('adventure') || description.includes('adventure')) return 'Adventure'
  if (title.includes('beach') || description.includes('beach')) return 'Beach'
  if (title.includes('cultural') || description.includes('culture')) return 'Cultural'
  if (title.includes('road trip') || description.includes('road trip')) return 'Road Trip'

  return 'Travel Guide'
}

function extractHighlights(trip: Trip, posts: Post[]): string[] {
  const highlights: string[] = []

  // Add highlights from trip location_data
  if (trip.location_data?.highlights) {
    highlights.push(...trip.location_data.highlights)
  }

  // Add highlights from posts
  posts.forEach(post => {
    if (post.excerpt) {
      highlights.push(post.excerpt)
    }
  })

  // If no highlights, create generic ones
  if (highlights.length === 0) {
    highlights.push(
      `${posts.length} days of unforgettable experiences`,
      'Carefully curated itinerary',
      'Mix of popular attractions and hidden gems',
      'Authentic local experiences',
      'Perfect for all travel styles'
    )
  }

  return highlights.slice(0, 7)
}

function extractActivities(post: Post): string[] {
  const activities: string[] = []

  // Try to extract from content
  if (post.content) {
    const lines = post.content.split('\n')
    lines.forEach(line => {
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        activities.push(line.trim().replace(/^[-•]\s*/, ''))
      }
    })
  }

  // If no activities found, create generic ones
  if (activities.length === 0) {
    activities.push(
      `Explore ${post.location || 'the area'}`,
      'Visit local attractions',
      'Experience authentic culture'
    )
  }

  return activities.slice(0, 5)
}

function generateProTip(post: Post, dayIndex: number): string {
  const tips = [
    'Book accommodations in advance for better rates',
    'Start early to avoid crowds at popular attractions',
    'Try local restaurants for authentic cuisine',
    'Bring comfortable walking shoes',
    'Download offline maps before you go',
    'Learn a few basic phrases in the local language',
    'Keep your camera charged for amazing photo opportunities'
  ]

  return tips[dayIndex % tips.length]
}

function determineBestTime(trip: Trip): string {
  if (trip.start_date) {
    const month = new Date(trip.start_date).toLocaleString('en-US', { month: 'long' })
    return `${month} is an excellent time to visit`
  }
  return 'Spring and fall offer pleasant weather and fewer crowds'
}

function estimateBudget(days: number): string {
  const perDay = 100
  const total = days * perDay
  return `Approximately $${total}-${total * 1.5} for ${days} days (mid-range budget)`
}

function generatePackingList(category: string, days: number): string[] {
  const baseItems = [
    'Comfortable walking shoes',
    'Weather-appropriate clothing',
    'Travel adapter',
    'Portable charger',
    'Camera or smartphone',
    'Reusable water bottle'
  ]

  if (category === 'Beach') {
    baseItems.push('Sunscreen', 'Swimwear', 'Beach towel')
  } else if (category === 'Adventure') {
    baseItems.push('Hiking boots', 'Backpack', 'First aid kit')
  } else if (category === 'Cultural') {
    baseItems.push('Modest clothing', 'Guidebook', 'Phrasebook')
  }

  return baseItems
}

function generateTags(trip: Trip, posts: Post[], destination: string, category: string): string[] {
  const tags = new Set<string>()

  tags.add(destination.toLowerCase().replace(/\s+/g, '-'))
  tags.add(category.toLowerCase().replace(/\s+/g, '-'))
  tags.add('travel-guide')
  tags.add(`${posts.length}-days`)

  // Add location-based tags
  posts.forEach(post => {
    if (post.location) {
      tags.add(post.location.toLowerCase().replace(/\s+/g, '-'))
    }
  })

  return Array.from(tags).slice(0, 10)
}

/**
 * Extract location coordinates from trip data
 */
function extractLocationCoordinates(trip: Trip, posts: Post[]): Array<{ lat: number; lng: number; name: string }> {
  const coordinates: Array<{ lat: number; lng: number; name: string }> = []

  // Try to extract from location_data JSONB
  if (trip.location_data) {
    if (trip.location_data.route?.geometry) {
      // Extract from route geometry
      const geometry = trip.location_data.route.geometry
      if (Array.isArray(geometry) && geometry.length > 0) {
        geometry.forEach((coord: number[], index: number) => {
          if (coord.length === 2) {
            coordinates.push({
              lat: coord[1],
              lng: coord[0],
              name: `Stop ${index + 1}`
            })
          }
        })
      }
    }

    if (trip.location_data.locations?.major) {
      // Extract from major locations
      trip.location_data.locations.major.forEach((loc: any) => {
        if (loc.lat && loc.lng) {
          coordinates.push({
            lat: loc.lat,
            lng: loc.lng,
            name: loc.name || 'Location'
          })
        }
      })
    }
  }

  // Extract from posts location_data
  posts.forEach((post) => {
    if (post.location_data?.coordinates) {
      const { lat, lng } = post.location_data.coordinates
      if (lat && lng) {
        coordinates.push({
          lat,
          lng,
          name: post.location || post.title
        })
      }
    }
  })

  return coordinates
}

/**
 * Generate blog post for a single trip
 */
async function generateBlogPostForTrip(trip: Trip): Promise<void> {
  console.log(`\n📝 Generating blog post for: ${trip.title}`)

  // Fetch trip posts (itinerary days)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('trip_id', trip.id)
    .order('order_index', { ascending: true })

  if (postsError) {
    console.error(`Error fetching posts for trip ${trip.id}:`, postsError)
    return
  }

  if (!posts || posts.length === 0) {
    console.log(`⚠️  No posts found for trip ${trip.id}, skipping...`)
    return
  }

  console.log(`   Found ${posts.length} days in itinerary`)

  // Generate blog post content from trip data
  console.log(`   ✍️  Generating blog post content...`)
  const blogContent = generateBlogPostContent(trip, posts)

  // Extract location coordinates for map
  const locationCoordinates = extractLocationCoordinates(trip, posts)
  console.log(`   📍 Extracted ${locationCoordinates.length} location coordinates`)

  // Enrich days with location coordinates
  const enrichedDays = blogContent.days.map((day, index) => {
    const coords = locationCoordinates[index] || locationCoordinates[0]
    return {
      ...day,
      location: {
        name: day.location?.name || coords?.name || posts[index]?.location || 'Unknown',
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined
      }
    }
  })

  // Prepare blog post data
  const blogPost = {
    title: blogContent.title,
    slug: '', // Will be auto-generated by trigger
    excerpt: blogContent.excerpt,
    content: {
      introduction: blogContent.introduction,
      highlights: blogContent.highlights,
      days: enrichedDays,
      practicalInfo: blogContent.practicalInfo,
      conclusion: blogContent.conclusion,
      mapData: {
        locations: locationCoordinates,
        showRoute: true
      }
    },
    featured_image: trip.cover_image,
    gallery_images: posts
      .filter(p => p.featured_image)
      .map(p => p.featured_image)
      .filter(Boolean) as string[],
    status: 'published',
    visibility: 'public',
    category: blogContent.category,
    tags: blogContent.tags,
    author_id: trip.user_id,
    trip_id: trip.id,
    seo_title: `${blogContent.title} - Complete Travel Guide`,
    seo_description: blogContent.excerpt,
    seo_keywords: blogContent.tags,
    published_at: new Date().toISOString()
  }

  // Insert blog post
  const { data: insertedPost, error: insertError } = await supabase
    .from('blog_posts')
    .insert(blogPost)
    .select()
    .single()

  if (insertError) {
    console.error(`   ❌ Error inserting blog post:`, insertError)
    return
  }

  console.log(`   ✅ Blog post created: ${insertedPost.slug}`)
  console.log(`   📊 Stats: ${blogContent.days.length} days, ${blogContent.tags.length} tags, ${locationCoordinates.length} map points`)
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting blog post generation...\n')

  // Fetch all published trips
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (tripsError) {
    console.error('Error fetching trips:', tripsError)
    process.exit(1)
  }

  if (!trips || trips.length === 0) {
    console.log('No published trips found.')
    process.exit(0)
  }

  console.log(`Found ${trips.length} published trips\n`)

  // Generate blog posts for each trip
  for (const trip of trips) {
    try {
      await generateBlogPostForTrip(trip)
    } catch (error) {
      console.error(`Error processing trip ${trip.id}:`, error)
      continue
    }
  }

  console.log('\n✅ Blog post generation complete!')
}

// Run the script
main().catch(console.error)


#!/usr/bin/env tsx

/**
 * Generate Blog Posts from Existing Trips
 * 
 * This script:
 * 1. Fetches all published trips from the database
 * 2. For each trip, generates an engaging blog post using GROQ AI
 * 3. Integrates trip data (itinerary, maps, photos, highlights)
 * 4. Saves blog posts to the blog_posts table
 * 
 * Usage:
 *   npm run generate-blog-posts
 *   or
 *   tsx scripts/generate-trip-blog-posts.ts
 */

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

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
 * Generate engaging blog post content using GROQ AI
 */
async function generateBlogPostContent(trip: Trip, posts: Post[]): Promise<BlogPostContent> {
  const prompt = `You are a professional travel writer creating an engaging, emotional, and inspiring blog post.

TRIP DETAILS:
- Title: ${trip.title}
- Description: ${trip.description}
- Duration: ${posts.length} days
- Dates: ${trip.start_date} to ${trip.end_date}

DAY-BY-DAY ITINERARY:
${posts.map((post, index) => `
Day ${index + 1}: ${post.title}
Location: ${post.location || 'Not specified'}
${post.content}
${post.excerpt ? `Highlights: ${post.excerpt}` : ''}
`).join('\n')}

TASK:
Create a compelling blog post (2000-3000 words) that:
1. Has an emotional, inspiring introduction that makes readers want to visit
2. Highlights the best moments and experiences
3. Provides practical information (best time to visit, budget, packing tips)
4. Includes engaging descriptions for each day
5. Suggests activities and experiences
6. Adds pro tips for travelers
7. Has a conclusion that inspires action

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Engaging blog post title (60-80 chars)",
  "excerpt": "Compelling excerpt (150-200 chars)",
  "introduction": "Emotional introduction paragraph (200-300 words)",
  "highlights": ["Highlight 1", "Highlight 2", ...] (5-7 highlights),
  "days": [
    {
      "day_number": 1,
      "title": "Day title",
      "description": "Engaging description (150-200 words)",
      "activities": ["Activity 1", "Activity 2", ...],
      "tips": "Pro tip for this day",
      "location": {
        "name": "Location name",
        "coordinates": { "lat": 0, "lng": 0 }
      }
    }
  ],
  "practicalInfo": {
    "bestTime": "Best time to visit",
    "budget": "Budget estimate",
    "packing": ["Item 1", "Item 2", ...]
  },
  "conclusion": "Inspiring conclusion (150-200 words)",
  "tags": ["tag1", "tag2", ...] (5-10 tags),
  "category": "Category (e.g., 'Adventure', 'Family', 'Cultural', 'Beach', 'Road Trip')"
}

Make it emotional, engaging, and actionable. Use vivid descriptions and storytelling.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional travel writer who creates engaging, emotional, and inspiring blog posts. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from GROQ')
    }

    const parsed = JSON.parse(content)
    return parsed as BlogPostContent
  } catch (error) {
    console.error('Error generating blog post content:', error)
    throw error
  }
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

  // Generate blog post content using GROQ
  console.log(`   🤖 Generating content with GROQ AI...`)
  const blogContent = await generateBlogPostContent(trip, posts)

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


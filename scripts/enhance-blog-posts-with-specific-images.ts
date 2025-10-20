#!/usr/bin/env tsx

/**
 * Enhanced Blog Post Image System
 * 
 * Fetches UNIQUE, SPECIFIC images for each day using Reddit ULTRA
 * - Each day gets images specific to its location/activity
 * - NO recurring images across days
 * - Links to proper location detail pages
 * - Creates/updates locations in database
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Import the existing Reddit ULTRA function from enhancedImageService
async function fetchRedditImages(locationName: string, count: number = 20): Promise<string[]> {
  const travelSubreddits = [
    'CityPorn', 'EarthPorn', 'ArchitecturePorn', 'VillagePorn',
    'TravelPics', 'travel', 'itookapicture', 'pics'
  ]

  const allImages: Array<{ url: string; score: number }> = []

  for (const subreddit of travelSubreddits) {
    try {
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(locationName)}&restrict_sr=1&sort=top&limit=50`

      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'TravelBlogr/1.0' }
      })

      if (!response.ok) continue

      const data = await response.json()
      const posts = data.data?.children || []

      for (const post of posts) {
        const postData = post.data

        // Only image posts
        if (!postData.url || !postData.url.match(/\.(jpg|jpeg|png|webp)$/i)) continue

        // ULTRA-FILTERING
        const title = postData.title?.toLowerCase() || ''

        const rejectPeople = ['selfie', 'portrait', 'face', 'wedding', 'bride', 'groom', 'couple', 'person', 'people', 'man', 'woman', 'girl', 'boy']
        if (rejectPeople.some(word => title.includes(word))) continue

        const rejectFood = ['food', 'meal', 'dish', 'restaurant', 'pizza', 'burger', 'sushi', 'ramen', 'cooking', 'recipe']
        if (rejectFood.some(word => title.includes(word))) continue

        const rejectArt = ['drawing', 'painting', 'sketch', 'render', '3d', 'digital art', 'ai generated', 'meme', 'cartoon', 'anime']
        if (rejectArt.some(word => title.includes(word))) continue

        const rejectAnimals = ['dog', 'cat', 'pet', 'wildlife', 'bird', 'animal']
        if (rejectAnimals.some(word => title.includes(word))) continue

        const rejectIndoors = ['museum', 'interior', 'room', 'apartment', 'inside', 'indoor']
        if (rejectIndoors.some(word => title.includes(word))) continue

        const rejectDigital = ['screenshot', 'graph', 'map', 'diagram', 'chart', 'infographic']
        if (rejectDigital.some(word => title.includes(word))) continue

        const rejectText = ['question', 'help', 'advice', 'recommendation', 'tips', 'guide']
        if (rejectText.some(word => title.includes(word))) continue

        const positiveSignals = ['view', 'skyline', 'cityscape', 'architecture', 'landscape', 'panorama', 'sunset', 'sunrise', 'night', 'lights']
        const hasPositiveSignal = positiveSignals.some(word => title.includes(word))

        const score = postData.score || 0
        const bonusScore = hasPositiveSignal ? score * 1.5 : score

        allImages.push({
          url: postData.url,
          score: bonusScore
        })
      }

      // Add delay between subreddit requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error)
    }
  }

  allImages.sort((a, b) => b.score - a.score)
  const uniqueUrls = [...new Set(allImages.map(img => img.url))]
  return uniqueUrls.slice(0, count)
}



// Geocode location
async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TravelBlogr/1.0' } }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }

  return null
}

// Check if location exists in database (don't create new ones for now)
async function getLocationSlug(locationName: string): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('locations')
      .select('id, slug')
      .ilike('name', locationName)
      .limit(1)
      .single()

    if (existing) {
      console.log(`     ✅ Location exists: ${locationName} (${existing.slug})`)
      return existing.slug
    }

    // Generate slug even if location doesn't exist in DB
    const slug = locationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    console.log(`     ℹ️  Location not in DB: ${locationName} (slug: ${slug})`)
    return slug
  } catch (error) {
    // Generate slug anyway
    const slug = locationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return slug
  }
}

// Extract specific location from day title/description
function extractSpecificLocation(day: any, mainDestination: string): string {
  const title = day.title?.toLowerCase() || ''
  const description = day.description?.toLowerCase() || ''
  const activities = day.activities?.join(' ').toLowerCase() || ''
  
  const text = `${title} ${description} ${activities}`
  
  // Common Tokyo neighborhoods/areas
  const tokyoAreas = [
    'Shibuya', 'Shinjuku', 'Harajuku', 'Akihabara', 'Asakusa', 'Ginza',
    'Odaiba', 'Roppongi', 'Ikebukuro', 'Ueno', 'Tsukiji', 'Nakamise'
  ]
  
  // Check for specific areas
  for (const area of tokyoAreas) {
    if (text.includes(area.toLowerCase())) {
      return `${area}, ${mainDestination}`
    }
  }
  
  // Check for specific attractions
  if (text.includes('ghibli')) return 'Ghibli Museum, Tokyo'
  if (text.includes('disneyland')) return 'Tokyo Disneyland'
  if (text.includes('teamlab')) return 'TeamLab Borderless, Tokyo'
  if (text.includes('sensoji') || text.includes('senso-ji')) return 'Sensoji Temple, Tokyo'
  if (text.includes('meiji shrine')) return 'Meiji Shrine, Tokyo'
  if (text.includes('skytree')) return 'Tokyo Skytree'
  
  // Default to main destination
  return mainDestination
}

// Enhance single blog post
async function enhanceBlogPost(post: any) {
  console.log(`\n📝 Enhancing: ${post.title}`)
  
  const content = post.content
  const destination = content.destination
  
  if (!content.days || content.days.length === 0) {
    console.log('⏭️  No days found, skipping')
    return
  }
  
  const usedImages = new Set<string>()
  const enhancedDays = []
  
  for (const day of content.days) {
    console.log(`\n  📅 Day ${day.day_number}: ${day.title}`)
    
    // Extract specific location for this day
    const specificLocation = extractSpecificLocation(day, destination)
    console.log(`     📍 Specific location: ${specificLocation}`)
    
    // Geocode location
    const coordinates = await geocodeLocation(specificLocation)
    if (coordinates) {
      console.log(`     🌍 Coordinates: ${coordinates.lat}, ${coordinates.lng}`)
    }

    // Get location slug (check if exists in DB)
    const locationSlug = await getLocationSlug(specificLocation)
    
    // Fetch UNIQUE images for this specific location
    console.log(`     🖼️  Fetching Reddit ULTRA images for: ${specificLocation}`)
    const allImages = await fetchRedditImages(specificLocation, 10)
    
    // Filter out already used images
    const uniqueImages = allImages.filter(url => !usedImages.has(url))
    
    // Take 2 images for this day
    const dayImages = uniqueImages.slice(0, 2)
    dayImages.forEach(url => usedImages.add(url))
    
    console.log(`     ✅ Found ${dayImages.length} unique images`)
    
    // Create blog image objects
    const blogImages = dayImages.map((url, index) => ({
      url,
      alt: `${specificLocation} - Day ${day.day_number}`,
      size: index === 0 ? 'large' : 'medium',
      aspectRatio: '16:9',
      position: day.day_number * 10 + index
    }))
    
    enhancedDays.push({
      ...day,
      location: {
        name: specificLocation,
        slug: locationSlug,
        coordinates
      },
      images: blogImages.length > 0 ? blogImages : undefined
    })
  }
  
  // Collect all images for content.images array
  const allContentImages = enhancedDays.flatMap(day => day.images || [])
  
  // Update blog post
  const { error } = await supabase
    .from('blog_posts')
    .update({
      content: {
        ...content,
        days: enhancedDays,
        images: allContentImages
      },
      featured_image: allContentImages[0]?.url || content.featured_image
    })
    .eq('id', post.id)
  
  if (error) {
    console.error(`❌ Error updating blog post:`, error)
  } else {
    console.log(`✅ Updated blog post with ${allContentImages.length} unique images`)
  }
}

// Main function
async function main() {
  console.log('🚀 Enhancing blog posts with specific Reddit ULTRA images...\n')
  
  // Fetch all blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching blog posts:', error)
    return
  }
  
  console.log(`Found ${posts.length} blog posts\n`)
  
  for (const post of posts) {
    await enhanceBlogPost(post)
    // Wait 2 seconds between posts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n✅ All blog posts enhanced!')
}

main()


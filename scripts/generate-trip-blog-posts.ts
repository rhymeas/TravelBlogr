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

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!")
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗")
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗")
  process.exit(1)
}

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
  destination: string
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
 * Generate engaging blog post content using verbalized sampling technique
 * Creates diverse, authentic content by varying tone, perspective, and style
 */
function generateBlogPostContent(trip: Trip, posts: Post[]): BlogPostContent {
  // Extract destination from trip title or description
  // Examples: "Family Adventure in Tokyo" → "Tokyo"
  //           "European Road Trip: Paris to Rome" → "Europe"
  //           "Vancouver Fun" → "Vancouver"

  let destination = "Unknown Destination"

  // Try to extract from title first
  const titleMatch = trip.title.match(/in\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\s+-)/i) ||
                     trip.title.match(/to\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\s+-)/i) ||
                     trip.title.match(/^([A-Z][a-zA-Z\s]+?)\s+(?:Fun|Adventure|Trip|Journey)/i)

  if (titleMatch) {
    destination = titleMatch[1].trim()
  } else if (trip.location_data?.route?.to) {
    destination = trip.location_data.route.to
  } else if (trip.location_data?.locations?.major?.[0]?.name) {
    destination = trip.location_data.locations.major[0].name
  } else if (posts[0]?.location) {
    destination = posts[0].location
  }

  // Determine trip category based on trip data
  const category = determineTripCategory(trip, posts)

  // Use verbalized sampling to create varied writing styles
  const writingStyles = [
    "personal-storytelling",
    "practical-guide",
    "emotional-journey",
    "adventure-narrative",
    "cultural-immersion"
  ]

  // Select style based on trip category and randomization
  const styleIndex = Math.floor(Math.random() * writingStyles.length)
  const selectedStyle = writingStyles[styleIndex]

  // Create engaging title with varied approaches
  const title = generateVariedTitle(trip, posts, destination, selectedStyle)

  // Create excerpt with different tones
  const excerpt = generateVariedExcerpt(trip, posts, destination, selectedStyle)

  // Create introduction with verbalized sampling
  const introduction = generateVariedIntroduction(trip, posts, destination, selectedStyle)

  // Extract highlights from trip data
  const highlights = extractHighlights(trip, posts)

  // Create day-by-day content with varied descriptions
  const days = posts.map((post, index) => ({
    day_number: index + 1,
    title: post.title,
    description: generateVariedDayDescription(post, index, selectedStyle),
    activities: extractActivities(post),
    tips: generateVariedProTip(post, index, selectedStyle),
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
This ${posts.length}-day journey through ${destination} offers the perfect blend of adventure, culture, and unforgettable experiences. From ${posts[0]?.title || "your first day"} to ${posts[posts.length - 1]?.title || "your final day"}, every moment is designed to create lasting memories.

Ready to embark on your own adventure? Start planning your trip today and discover why ${destination} should be at the top of your travel bucket list. The journey of a lifetime awaits!
  `.trim()

  // Generate tags
  const tags = generateTags(trip, posts, destination, category)

  return {
    destination,
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
 * Verbalized Sampling Functions - Generate varied content with different tones
 */

function generateVariedTitle(trip: Trip, posts: Post[], destination: string, style: string): string {
  const titleVariations = {
    "personal-storytelling": [
      `My ${posts.length}-Day Love Affair with ${destination}`,
      `How ${destination} Changed My Perspective on Travel`,
      `${posts.length} Days That Made Me Fall for ${destination}`,
      `Why ${destination} Stole My Heart: A ${posts.length}-Day Journey`
    ],
    "practical-guide": [
      `The Ultimate ${posts.length}-Day ${destination} Itinerary`,
      `${destination} in ${posts.length} Days: Complete Travel Guide`,
      `How to Spend ${posts.length} Perfect Days in ${destination}`,
      `${destination}: Your ${posts.length}-Day Blueprint`
    ],
    "emotional-journey": [
      `${posts.length} Days of Wonder: Discovering ${destination}`,
      `Finding Magic in ${destination}: A ${posts.length}-Day Story`,
      `The Journey That Changed Everything: ${posts.length} Days in ${destination}`,
      `${destination}: Where Dreams Meet Reality`
    ],
    "adventure-narrative": [
      `${posts.length} Days of Adventure: Conquering ${destination}`,
      `Epic ${destination}: A ${posts.length}-Day Expedition`,
      `Chasing Thrills Through ${destination}`,
      `${destination} Unleashed: ${posts.length} Days of Pure Adventure`
    ],
    "cultural-immersion": [
      `Living Like a Local: ${posts.length} Days in ${destination}`,
      `Beyond Tourism: Authentic ${destination} in ${posts.length} Days`,
      `${destination} Through Local Eyes`,
      `The Real ${destination}: A ${posts.length}-Day Cultural Journey`
    ]
  }

  const variations = titleVariations[style as keyof typeof titleVariations] || titleVariations["practical-guide"]
  const randomIndex = Math.floor(Math.random() * variations.length)
  return variations[randomIndex]
}

function generateVariedExcerpt(trip: Trip, posts: Post[], destination: string, style: string): string {
  if (trip.description && trip.description.length > 50) {
    return trip.description.substring(0, 180) + "..."
  }

  const excerptVariations = {
    "personal-storytelling": [
      `I never expected ${destination} to move me the way it did. ${posts.length} days turned into a lifetime of memories.`,
      `Some trips change you. This ${posts.length}-day journey through ${destination} was one of them.`,
      `${destination} wasn"t just a destination—it became a part of who I am.`
    ],
    "practical-guide": [
      `Everything you need for the perfect ${posts.length}-day ${destination} adventure. Tested, refined, and ready for you.`,
      `The complete ${destination} itinerary: ${posts.length} days of unforgettable experiences, zero guesswork.`,
      `Your blueprint for ${posts.length} incredible days in ${destination}. Let"s make it happen.`
    ],
    "emotional-journey": [
      `${posts.length} days. Countless moments. One unforgettable journey through ${destination}.`,
      `This is the story of how ${destination} captured my soul in just ${posts.length} days.`,
      `Magic exists. I found it in ${destination} over ${posts.length} extraordinary days.`
    ],
    "adventure-narrative": [
      `${posts.length} days of adrenaline, discovery, and pure adventure in ${destination}. Are you ready?`,
      `From sunrise to sunset, ${destination} delivered thrills beyond imagination.`,
      `This isn"t your average trip. This is ${posts.length} days of epic ${destination} adventure.`
    ],
    "cultural-immersion": [
      `Forget the tourist traps. This is ${destination} as locals live it—${posts.length} days of authentic experiences.`,
      `${posts.length} days living, eating, and breathing ${destination} culture.`,
      `The real ${destination} revealed through ${posts.length} days of genuine connection.`
    ]
  }

  const variations = excerptVariations[style as keyof typeof excerptVariations] || excerptVariations["practical-guide"]
  const randomIndex = Math.floor(Math.random() * variations.length)
  return variations[randomIndex]
}

function generateVariedIntroduction(trip: Trip, posts: Post[], destination: string, style: string): string {
  const introVariations = {
    "personal-storytelling": `
I"ll be honest—I didn"t know what to expect when I landed in ${destination}. ${posts.length} days felt like both too much and not enough time. But as I sit here now, scrolling through photos and reliving every moment, I realize this trip gave me something I didn"t even know I was looking for.

${trip.description || `This journey through ${destination} wasn"t just about ticking off landmarks or collecting Instagram shots.`} It was about the unexpected conversations, the wrong turns that led to perfect discoveries, and the moments that made me stop and think, "I need to remember this forever."

Let me take you through those ${posts.length} days—not as a perfect itinerary, but as a real journey with all its surprises, challenges, and absolute magic.
    `,
    "practical-guide": `
Planning ${posts.length} days in ${destination}? You"re in the right place. I"ve done the research, made the mistakes, and refined this itinerary so you don"t have to.

${trip.description || `This guide is built from real experience—not just internet research.`} Every recommendation has been tested. Every timing has been optimized. Every backup plan has been thought through.

Whether you"re traveling solo, with family, or with friends, this ${posts.length}-day blueprint will help you make the most of ${destination} without the stress of constant planning.
    `,
    "emotional-journey": `
There are trips you take, and then there are journeys that take you. ${destination} was the latter.

${trip.description || `Over ${posts.length} days, this place unfolded like a story I didn"t know I needed to hear.`} Each day brought new perspectives, unexpected beauty, and moments that made me pause and simply breathe it all in.

This isn"t just a travel guide—it"s an invitation to experience ${destination} the way it deserves to be experienced: with open eyes, an open heart, and ${posts.length} days to let it all sink in.
    `,
    "adventure-narrative": `
${posts.length} days. One incredible destination. Zero regrets.

${trip.description || `${destination} isn"t for the faint of heart—and that"s exactly why you"re here.`} This itinerary is designed for those who want more than pretty photos. You want stories. You want adrenaline. You want to push boundaries and come home with tales that make people lean in closer.

Buckle up. These ${posts.length} days in ${destination} are going to be wild.
    `,
    "cultural-immersion": `
Tourism shows you a place. Immersion lets you feel it.

${trip.description || `This ${posts.length}-day journey through ${destination} goes beyond the surface.`} We"re not just visiting—we"re connecting. With locals who became friends. With traditions that opened our eyes. With flavors, sounds, and rhythms that you can"t find in any guidebook.

Ready to experience ${destination} the way it"s meant to be experienced? Let"s dive in.
    `
  }

  return (introVariations[style as keyof typeof introVariations] || introVariations["practical-guide"]).trim()
}

/**
 * Helper functions for content generation
 */
function determineTripCategory(trip: Trip, posts: Post[]): string {
  const title = trip.title.toLowerCase()
  const description = (trip.description || "").toLowerCase()

  if (title.includes("family") || description.includes("family")) return "Family"
  if (title.includes("adventure") || description.includes("adventure")) return "Adventure"
  if (title.includes("beach") || description.includes("beach")) return "Beach"
  if (title.includes("cultural") || description.includes("culture")) return "Cultural"
  if (title.includes("road trip") || description.includes("road trip")) return "Road Trip"

  return "Travel Guide"
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
      "Carefully curated itinerary",
      "Mix of popular attractions and hidden gems",
      "Authentic local experiences",
      "Perfect for all travel styles"
    )
  }

  return highlights.slice(0, 7)
}

function extractActivities(post: Post): string[] {
  const activities: string[] = []

  // Try to extract from content
  if (post.content) {
    const lines = post.content.split("\n")
    lines.forEach(line => {
      if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        activities.push(line.trim().replace(/^[-•]\s*/, ""))
      }
    })
  }

  // If no activities found, create generic ones
  if (activities.length === 0) {
    activities.push(
      `Explore ${post.location || "the area"}`,
      "Visit local attractions",
      "Experience authentic culture"
    )
  }

  return activities.slice(0, 5)
}

function generateVariedDayDescription(post: Post, dayIndex: number, style: string): string {
  // If post has content, enhance it with style
  if (post.content && post.content.length > 50) {
    const stylePrefix = {
      "personal-storytelling": `Day ${dayIndex + 1} started with a feeling I can"t quite describe. `,
      "practical-guide": `Here"s what you need to know for Day ${dayIndex + 1}: `,
      "emotional-journey": `This was the day everything clicked. `,
      "adventure-narrative": `Day ${dayIndex + 1} brought the kind of adventure you dream about. `,
      "cultural-immersion": `Today we dove deep into local life. `
    }

    const prefix = stylePrefix[style as keyof typeof stylePrefix] || ""
    return prefix + post.content
  }

  // Generate varied descriptions based on style
  const location = post.location || "this incredible place"
  const descriptionVariations = {
    "personal-storytelling": [
      `I woke up excited for ${location}. The day unfolded in ways I never expected—each moment better than the last.`,
      `${location} had been on my list forever. Actually being there? Even better than I imagined.`,
      `Some days stick with you. This day in ${location} is one I"ll never forget.`
    ],
    "practical-guide": [
      `${location} is best experienced with a plan. Here"s how to maximize your time and avoid common pitfalls.`,
      `Strategic timing makes all the difference in ${location}. Follow this schedule for the best experience.`,
      `${location} offers incredible experiences when you know where to go and when.`
    ],
    "emotional-journey": [
      `${location} touched something deep inside me. The beauty, the energy, the pure magic of it all.`,
      `Walking through ${location}, I felt completely present—no past, no future, just this perfect moment.`,
      `${location} reminded me why I travel. It"s not about the places—it"s about how they make you feel.`
    ],
    "adventure-narrative": [
      `${location} delivered exactly the kind of adrenaline rush I was craving. No regrets, just pure excitement.`,
      `This is what adventure looks like: ${location}, no safety net, just pure experience.`,
      `${location} pushed every boundary and exceeded every expectation. This is what we came for.`
    ],
    "cultural-immersion": [
      `In ${location}, we weren"t tourists—we were guests. The locals welcomed us into their world.`,
      `${location} showed us life beyond the guidebooks. Real people, real stories, real connection.`,
      `Today in ${location}, we learned that the best experiences can"t be planned—they"re shared.`
    ]
  }

  const variations = descriptionVariations[style as keyof typeof descriptionVariations] || descriptionVariations["practical-guide"]
  const randomIndex = Math.floor(Math.random() * variations.length)
  return variations[randomIndex]
}

function generateVariedProTip(post: Post, dayIndex: number, style: string): string {
  const tipVariations = {
    "personal-storytelling": [
      "Trust your instincts. The best moments often come from spontaneous decisions.",
      "Talk to locals. Their recommendations beat any guidebook.",
      "Take mental snapshots, not just photos. Some moments are meant to be felt.",
      "Get lost on purpose. The detours often become the highlights."
    ],
    "practical-guide": [
      "Book tickets online to skip the lines and save time.",
      "Start early—most attractions are less crowded before 9 AM.",
      "Download offline maps the night before to avoid data charges.",
      "Bring a portable charger. You will be using your phone more than you think."
    ],
    "emotional-journey": [
      "Slow down. You do not need to see everything to feel everything.",
      "Journal at the end of each day. Future you will thank present you.",
      "Say yes to invitations. The best stories come from unexpected connections.",
      "Put the camera down sometimes. Experience it with your eyes, not through a lens."
    ],
    "adventure-narrative": [
      "Push your comfort zone. That is where the magic happens.",
      "Pack light, move fast. Flexibility beats preparation every time.",
      "Weather changes fast - always have a backup plan.",
      "The early bird gets the epic sunrise. Set that alarm."
    ],
    "cultural-immersion": [
      "Learn basic phrases. Effort matters more than perfection.",
      "Eat where locals eat. Skip the tourist restaurants.",
      "Ask permission before taking photos of people. Respect goes a long way.",
      "Participate, do not just observe. You are not here to watch - you are here to connect."
    ]
  }

  const variations = tipVariations[style as keyof typeof tipVariations] || tipVariations["practical-guide"]
  const randomIndex = Math.floor(Math.random() * variations.length)
  return variations[randomIndex]
}

function determineBestTime(trip: Trip): string {
  if (trip.start_date) {
    const month = new Date(trip.start_date).toLocaleString("en-US", { month: "long" })
    return `${month} is an excellent time to visit`
  }
  return "Spring and fall offer pleasant weather and fewer crowds"
}

function estimateBudget(days: number): string {
  const perDay = 100
  const total = days * perDay
  return `Approximately $${total}-${total * 1.5} for ${days} days (mid-range budget)`
}

function generatePackingList(category: string, days: number): string[] {
  const baseItems = [
    "Comfortable walking shoes",
    "Weather-appropriate clothing",
    "Travel adapter",
    "Portable charger",
    "Camera or smartphone",
    "Reusable water bottle"
  ]

  if (category === "Beach") {
    baseItems.push("Sunscreen", "Swimwear", "Beach towel")
  } else if (category === "Adventure") {
    baseItems.push("Hiking boots", "Backpack", "First aid kit")
  } else if (category === "Cultural") {
    baseItems.push("Modest clothing", "Guidebook", "Phrasebook")
  }

  return baseItems
}

function generateTags(trip: Trip, posts: Post[], destination: string, category: string): string[] {
  const tags = new Set<string>()

  tags.add(destination.toLowerCase().replace(/\s+/g, "-"))
  tags.add(category.toLowerCase().replace(/\s+/g, "-"))
  tags.add("travel-guide")
  tags.add(`${posts.length}-days`)

  // Add location-based tags
  posts.forEach(post => {
    if (post.location) {
      tags.add(post.location.toLowerCase().replace(/\s+/g, "-"))
    }
  })

  return Array.from(tags).slice(0, 10)
}

/**
 * Geocode a location name to coordinates using GeoNames API
 * CRITICAL: This ensures we ALWAYS have coordinates for maps
 */
async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const username = process.env.GEONAMES_USERNAME || 'travelblogr'
    const response = await fetch(
      `http://api.geonames.org/searchJSON?q=${encodeURIComponent(locationName)}&maxRows=1&username=${username}`
    )

    if (!response.ok) return null

    const data = await response.json()
    const result = data.geonames?.[0]

    if (!result) return null

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
 * Extract ACTUAL location name from post or trip data
 * CRITICAL: Returns the city/place name, NOT descriptive titles
 */
function extractActualLocationName(post: Post, trip: Trip, destination: string): string {
  // Priority 1: Post location (if it's a real place name, not a title)
  if (post.location && post.location.length < 50 && !post.location.includes(':')) {
    return post.location
  }

  // Priority 2: Trip location_data
  if (trip.location_data?.locations?.major?.[0]?.name) {
    return trip.location_data.locations.major[0].name
  }

  // Priority 3: Trip destination
  if (trip.location_data?.route?.to) {
    return trip.location_data.route.to
  }

  // Priority 4: Extracted destination from title
  return destination
}

/**
 * Extract location coordinates from trip data WITH GEOCODING
 * CRITICAL: This ensures ALL blog posts have working maps at scale
 */
async function extractLocationCoordinates(
  trip: Trip,
  posts: Post[],
  destination: string
): Promise<Array<{ lat: number; lng: number; name: string }>> {
  const coordinates: Array<{ lat: number; lng: number; name: string }> = []

  console.log(`   🗺️  Geocoding locations for map...`)

  // Try to extract from location_data JSONB first
  if (trip.location_data?.locations?.major) {
    trip.location_data.locations.major.forEach((loc: any) => {
      if (loc.lat && loc.lng && loc.name) {
        coordinates.push({
          lat: loc.lat,
          lng: loc.lng,
          name: loc.name
        })
      }
    })
  }

  // If we have coordinates from trip data, use them
  if (coordinates.length > 0) {
    console.log(`   ✅ Found ${coordinates.length} coordinates from trip data`)
    return coordinates
  }

  // Otherwise, geocode each post's location
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const locationName = extractActualLocationName(post, trip, destination)

    console.log(`   🔍 Geocoding Day ${i + 1}: ${locationName}`)

    // Try to get coordinates from post data first
    if (post.location_data?.coordinates) {
      coordinates.push({
        lat: post.location_data.coordinates.lat,
        lng: post.location_data.coordinates.lng,
        name: locationName
      })
      console.log(`   ✅ Day ${i + 1}: Using existing coordinates`)
      continue
    }

    // Geocode the location
    const coords = await geocodeLocation(locationName)
    if (coords) {
      coordinates.push({
        lat: coords.lat,
        lng: coords.lng,
        name: locationName
      })
      console.log(`   ✅ Day ${i + 1}: ${coords.lat}, ${coords.lng}`)
    } else {
      console.log(`   ⚠️  Day ${i + 1}: Could not geocode, using destination fallback`)
      // Fallback: Use destination coordinates
      const destCoords = await geocodeLocation(destination)
      if (destCoords) {
        coordinates.push({
          lat: destCoords.lat,
          lng: destCoords.lng,
          name: locationName
        })
      }
    }

    // Add delay to avoid rate limiting (GeoNames free tier)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return coordinates
}

/**
 * Generate blog post for a single trip
 */
async function generateBlogPostForTrip(trip: Trip): Promise<void> {
  console.log(`\n📝 Generating blog post for: ${trip.title}`)

  // Fetch trip posts (itinerary days)
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("trip_id", trip.id)
    .order("order_index", { ascending: true })

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

  // Extract location coordinates for map WITH GEOCODING
  // CRITICAL: This ensures ALL blog posts have working maps
  const locationCoordinates = await extractLocationCoordinates(trip, posts, blogContent.destination)
  console.log(`   📍 Extracted ${locationCoordinates.length} location coordinates`)

  // Enrich days with location coordinates
  // CRITICAL: Use actual location names, not descriptive titles
  const enrichedDays = blogContent.days.map((day, index) => {
    const coords = locationCoordinates[index] || locationCoordinates[0]
    // Use the geocoded location name, not the day title
    const actualLocationName = coords?.name || extractActualLocationName(posts[index], trip, blogContent.destination)

    return {
      ...day,
      location: {
        name: actualLocationName, // CRITICAL: Actual location name for geocoding
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined
      }
    }
  })

  // Prepare blog post data
  const blogPost = {
    title: blogContent.title,
    slug: "", // Will be auto-generated by trigger
    excerpt: blogContent.excerpt,
    content: {
      destination: blogContent.destination,
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
    status: "published",
    visibility: "public",
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
    .from("blog_posts")
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
  console.log("🚀 Starting blog post generation...\n")

  // Fetch all published trips
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (tripsError) {
    console.error("Error fetching trips:", tripsError)
    process.exit(1)
  }

  if (!trips || trips.length === 0) {
    console.log("No published trips found.")
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

  console.log("\n✅ Blog post generation complete!")
}

// Run the script
main().catch(console.error)


/**
 * Location Intelligence Service
 * 
 * Smart data hierarchy for blog post creation:
 * 1. Check our database for existing location data
 * 2. Check existing trips to this location
 * 3. Check existing blog posts about this location
 * 4. Fetch from external APIs (OpenTripMap, WikiVoyage)
 * 5. Use GROQ AI as last resort
 * 
 * This ensures we leverage our own data before making external requests.
 */

import { getBrowserSupabase } from '@/lib/supabase'

// Dynamic import for server-only code
async function getSupabaseClient(useServerClient: boolean) {
  if (useServerClient) {
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    return createServiceSupabase()
  }
  return getBrowserSupabase()
}

export interface LocationData {
  id?: string
  name: string
  country?: string
  region?: string
  description?: string
  featured_image?: string
  coordinates?: {
    lat: number
    lng: number
  }
  source: 'database' | 'trips' | 'blog_posts' | 'external' | 'ai'
}

export interface POISuggestion {
  id: string
  name: string
  category: 'restaurant' | 'attraction' | 'hotel' | 'activity' | 'transport'
  description?: string
  address?: string
  rating?: number
  price?: string
  image?: string
  coordinates?: {
    lat: number
    lng: number
  }
  source: 'database' | 'trips' | 'blog_posts' | 'external' | 'ai'
}

export interface TripActivity {
  name: string
  description?: string
  location?: string
  tips?: string
  source: 'trip' | 'blog_post'
  trip_id?: string
  blog_post_id?: string
}

export interface LocationIntelligence {
  location: LocationData | null
  pois: POISuggestion[]
  activities: TripActivity[]
  existingTrips: any[]
  existingBlogPosts: any[]
  suggestions: {
    title: string[]
    highlights: string[]
    practicalInfo: {
      bestTime?: string
      budget?: string
      tips?: string[]
    }
  }
}

/**
 * Get intelligent location data with hierarchy
 */
export async function getLocationIntelligence(
  locationName: string,
  useServerClient = false
): Promise<LocationIntelligence> {
  const supabase = await getSupabaseClient(useServerClient)

  console.log(`🔍 Getting intelligence for: ${locationName}`)

  // Initialize result
  const result: LocationIntelligence = {
    location: null,
    pois: [],
    activities: [],
    existingTrips: [],
    existingBlogPosts: [],
    suggestions: {
      title: [],
      highlights: [],
      practicalInfo: {}
    }
  }

  // STEP 1: Check our locations database
  console.log('📍 Step 1: Checking locations database...')
  const { data: dbLocation } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', `%${locationName}%`)
    .eq('is_published', true)
    .limit(1)
    .single()

  if (dbLocation) {
    console.log('✅ Found location in database:', dbLocation.name)
    result.location = {
      id: dbLocation.id,
      name: dbLocation.name,
      country: dbLocation.country,
      region: dbLocation.region,
      description: dbLocation.description,
      featured_image: dbLocation.featured_image,
      coordinates: dbLocation.latitude && dbLocation.longitude ? {
        lat: dbLocation.latitude,
        lng: dbLocation.longitude
      } : undefined,
      source: 'database'
    }

    // Get POIs from location_posts (activities at this location)
    const { data: locationPosts } = await supabase
      .from('location_posts')
      .select('*')
      .eq('location_id', dbLocation.id)
      .limit(20)

    if (locationPosts && locationPosts.length > 0) {
      console.log(`✅ Found ${locationPosts.length} POIs from location_posts`)
      result.pois = locationPosts.map(post => ({
        id: post.id,
        name: post.title || post.location || 'Activity',
        category: categorizePOI(post.title || post.content),
        description: post.content?.substring(0, 200),
        source: 'database' as const
      }))
    }
  }

  // STEP 2: Check existing trips to this location
  console.log('🗺️ Step 2: Checking existing trips...')
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      posts (*)
    `)
    .or(`title.ilike.%${locationName}%,description.ilike.%${locationName}%`)
    .eq('status', 'published')
    .limit(5)

  if (trips && trips.length > 0) {
    console.log(`✅ Found ${trips.length} existing trips`)
    result.existingTrips = trips

    // Extract activities from trip posts
    trips.forEach(trip => {
      if (trip.posts && Array.isArray(trip.posts)) {
        trip.posts.forEach((post: any) => {
          result.activities.push({
            name: post.title || 'Activity',
            description: post.content,
            location: post.location,
            tips: extractTips(post.content),
            source: 'trip',
            trip_id: trip.id
          })

          // Extract POIs from post content
          const pois = extractPOIsFromContent(post)
          result.pois.push(...pois)
        })
      }
    })

    // Generate suggestions from trips
    result.suggestions.highlights = extractHighlights(trips)
    result.suggestions.practicalInfo = extractPracticalInfo(trips)
  }

  // STEP 3: Check existing blog posts about this location
  console.log('📝 Step 3: Checking existing blog posts...')
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .or(`title.ilike.%${locationName}%,excerpt.ilike.%${locationName}%`)
    .eq('status', 'published')
    .limit(5)

  if (blogPosts && blogPosts.length > 0) {
    console.log(`✅ Found ${blogPosts.length} existing blog posts`)
    result.existingBlogPosts = blogPosts

    // Extract activities from blog posts
    blogPosts.forEach(post => {
      const content = post.content || {}
      
      // Extract days/activities
      if (content.days && Array.isArray(content.days)) {
        content.days.forEach((day: any) => {
          if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach((activity: string) => {
              result.activities.push({
                name: activity,
                description: day.description,
                location: day.location?.name,
                tips: day.tips,
                source: 'blog_post',
                blog_post_id: post.id
              })
            })
          }
        })
      }

      // Extract highlights
      if (content.highlights && Array.isArray(content.highlights)) {
        result.suggestions.highlights.push(...content.highlights)
      }
    })

    // Generate title suggestions from existing posts
    result.suggestions.title = generateTitleVariations(locationName, blogPosts)
  }

  console.log(`📊 Intelligence gathered:
    - Location: ${result.location ? '✅' : '❌'}
    - POIs: ${result.pois.length}
    - Activities: ${result.activities.length}
    - Existing trips: ${result.existingTrips.length}
    - Existing blog posts: ${result.existingBlogPosts.length}
  `)

  return result
}

/**
 * Helper: Categorize POI based on title/content
 */
function categorizePOI(text: string): POISuggestion['category'] {
  const lower = text.toLowerCase()
  
  if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('food') || lower.includes('eat')) {
    return 'restaurant'
  }
  if (lower.includes('hotel') || lower.includes('accommodation') || lower.includes('stay')) {
    return 'hotel'
  }
  if (lower.includes('museum') || lower.includes('temple') || lower.includes('palace') || lower.includes('landmark')) {
    return 'attraction'
  }
  if (lower.includes('train') || lower.includes('bus') || lower.includes('flight') || lower.includes('transport')) {
    return 'transport'
  }
  
  return 'activity'
}

/**
 * Helper: Extract POIs from post content
 */
function extractPOIsFromContent(post: any): POISuggestion[] {
  const pois: POISuggestion[] = []
  
  // Extract from title
  if (post.title) {
    pois.push({
      id: `poi-${post.id}`,
      name: post.title,
      category: categorizePOI(post.title),
      description: post.content?.substring(0, 200),
      source: 'trips'
    })
  }

  return pois
}

/**
 * Helper: Extract tips from content
 */
function extractTips(content: string): string {
  if (!content) return ''
  
  // Look for common tip patterns
  const tipPatterns = [
    /tip[s]?:(.+?)(?:\n|$)/gi,
    /pro tip:(.+?)(?:\n|$)/gi,
    /advice:(.+?)(?:\n|$)/gi,
  ]

  for (const pattern of tipPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  return ''
}

/**
 * Helper: Extract highlights from trips
 */
function extractHighlights(trips: any[]): string[] {
  const highlights: string[] = []
  
  trips.forEach(trip => {
    if (trip.description) {
      highlights.push(trip.description.substring(0, 100))
    }
  })

  return highlights.slice(0, 5)
}

/**
 * Helper: Extract practical info from trips
 */
function extractPracticalInfo(trips: any[]): LocationIntelligence['suggestions']['practicalInfo'] {
  // Aggregate data from trips
  const info: LocationIntelligence['suggestions']['practicalInfo'] = {
    tips: []
  }

  trips.forEach(trip => {
    if (trip.start_date) {
      const month = new Date(trip.start_date).toLocaleString('en-US', { month: 'long' })
      info.bestTime = `${month} is a great time to visit`
    }
  })

  return info
}

/**
 * Helper: Generate title variations
 */
function generateTitleVariations(locationName: string, blogPosts: any[]): string[] {
  const variations: string[] = []
  
  // Extract patterns from existing titles
  blogPosts.forEach(post => {
    if (post.title.includes(locationName)) {
      variations.push(post.title)
    }
  })

  // Add some default variations
  variations.push(
    `Ultimate ${locationName} Travel Guide`,
    `${locationName} in 7 Days: Complete Itinerary`,
    `Best Things to Do in ${locationName}`,
    `${locationName}: A Complete Travel Guide`
  )

  return variations.slice(0, 5)
}


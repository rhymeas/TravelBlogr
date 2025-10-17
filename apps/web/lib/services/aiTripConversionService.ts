/**
 * AI Trip Conversion Service
 * Converts AI-generated itinerary plans into trip database format
 */

import { getBrowserSupabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

/**
 * Clean location name by removing common prefixes like "Travel to"
 * This prevents location cards from being created with trip-like titles
 */
function cleanLocationName(location: string): string {
  if (!location) return location

  // Remove "Travel to " prefix (case insensitive)
  let cleaned = location.replace(/^travel\s+to\s+/i, '')

  // Remove "Traveling to " prefix
  cleaned = cleaned.replace(/^traveling\s+to\s+/i, '')

  // Remove "Journey to " prefix
  cleaned = cleaned.replace(/^journey\s+to\s+/i, '')

  // Remove "Trip to " prefix
  cleaned = cleaned.replace(/^trip\s+to\s+/i, '')

  // Trim whitespace
  cleaned = cleaned.trim()

  return cleaned || location // Return original if cleaning resulted in empty string
}

interface AIDay {
  day: number
  date: string
  location: string
  type?: string
  items: Array<{
    type: 'activity' | 'meal' | 'travel' | 'accommodation'
    title: string
    description?: string
    time?: string
    duration?: string
    costEstimate?: number
    image?: string
    location?: string
    address?: string
    bookingLink?: string
  }>
}

interface AIPlan {
  title: string
  days: AIDay[]
  stats?: {
    totalDays: number
    totalCost: number
  }
  tips?: string[]
  transportMode?: string
  interests?: string[]
  budget?: string
}

interface TripData {
  title: string
  description: string
  slug: string
  cover_image?: string
  status: 'draft'
  start_date: string
  end_date: string
  user_id: string
  location_data?: Record<string, any>
}

/**
 * Convert AI plan to trip data format
 */
export function convertAIPlanToTrip(plan: AIPlan, userId: string): TripData {
  const firstDay = plan.days[0]
  const lastDay = plan.days[plan.days.length - 1]

  // Extract unique locations for destination (clean location names)
  const locations = [...new Set(plan.days.map(day => cleanLocationName(day.location)))]
  const destination = locations.length === 1
    ? locations[0]
    : `${locations[0]} to ${locations[locations.length - 1]}`

  // Generate slug from title
  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + nanoid(6)

  // Create description from first few activities
  const highlights = plan.days
    .slice(0, 3)
    .flatMap(day => day.items.filter(item => item.type === 'activity'))
    .slice(0, 3)
    .map(item => item.title)
  
  const description = highlights.length > 0
    ? `Explore ${destination} with highlights including ${highlights.join(', ')}`
    : `A ${plan.days.length}-day adventure through ${destination}`

  // Store AI metadata in location_data JSONB field
  const locationData = {
    aiGenerated: true,
    transportMode: plan.transportMode,
    interests: plan.interests,
    budget: plan.budget,
    totalCost: plan.stats?.totalCost,
    tips: plan.tips,
    destination, // Store destination in location_data
    durationDays: plan.days.length // Store duration in location_data
  }

  return {
    title: plan.title,
    description,
    slug,
    status: 'draft',
    start_date: firstDay.date,
    end_date: lastDay.date,
    user_id: userId,
    location_data: locationData
  }
}

/**
 * Save AI-generated trip to database
 */
export async function saveAIGeneratedTrip(
  plan: AIPlan,
  userId: string,
  locationImages?: Record<string, string>
): Promise<{ success: boolean; tripId?: string; error?: string }> {
  try {
    console.log('💾 Starting saveAIGeneratedTrip...', { userId, planTitle: plan.title })
    const supabase = getBrowserSupabase()

    // Convert plan to trip data
    console.log('🔄 Converting plan to trip data...')
    const tripData = convertAIPlanToTrip(plan, userId)
    console.log('✅ Trip data converted:', tripData)

    // Get cover image from location images or first activity image
    console.log('🖼️ Available location images:', locationImages)
    console.log('🖼️ First day location:', plan.days[0].location)

    // Try to find image with flexible matching
    let coverImage = locationImages?.[plan.days[0].location]

    // If not found, try cleaned location name
    if (!coverImage) {
      const cleanedFirstLocation = cleanLocationName(plan.days[0].location)
      coverImage = locationImages?.[cleanedFirstLocation]
      console.log('🖼️ Trying cleaned location name:', cleanedFirstLocation, '→', coverImage)
    }

    // If still not found, try any location image
    if (!coverImage && locationImages) {
      const firstImageKey = Object.keys(locationImages)[0]
      if (firstImageKey) {
        coverImage = locationImages[firstImageKey]
        console.log('🖼️ Using first available image from:', firstImageKey, '→', coverImage)
      }
    }

    // Fallback to activity image or placeholder
    if (!coverImage) {
      coverImage = plan.days[0].items.find(item => item.image)?.image || '/placeholder-trip.jpg'
    }

    console.log('🖼️ Final cover image:', coverImage)

    // Create trip
    console.log('📝 Inserting trip into database...')
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        ...tripData,
        cover_image: coverImage
      })
      .select()
      .single()

    if (tripError) {
      console.error('❌ Error creating trip:', tripError)
      return { success: false, error: tripError.message }
    }

    console.log('✅ Trip created successfully:', trip.id)

    // Create posts for each day
    console.log('📄 Creating posts for', plan.days.length, 'days...')
    const posts = plan.days.map((day, index) => {
      const activities = day.items.filter(item => item.type === 'activity')
      const meals = day.items.filter(item => item.type === 'meal')
      const travel = day.items.filter(item => item.type === 'travel')

      // Clean location name to avoid "Travel to X" in post titles
      const cleanedLocation = cleanLocationName(day.location)

      // Build post content
      let content = `# Day ${day.day}: ${cleanedLocation}\n\n`

      if (travel.length > 0) {
        content += `## 🚗 Travel\n${travel.map(t => `- ${t.title}${t.duration ? ` (${t.duration})` : ''}`).join('\n')}\n\n`
      }

      if (activities.length > 0) {
        content += `## 🎯 Activities\n${activities.map(a => `- **${a.title}**${a.description ? `: ${a.description}` : ''}`).join('\n')}\n\n`
      }

      if (meals.length > 0) {
        content += `## 🍽️ Meals\n${meals.map(m => `- ${m.title}${m.location ? ` at ${m.location}` : ''}`).join('\n')}\n\n`
      }

      return {
        trip_id: trip.id,
        user_id: userId, // ✅ CRITICAL: Add user_id for posts table
        title: `Day ${day.day}: ${cleanedLocation}`,
        content,
        excerpt: `Day ${day.day} in ${cleanedLocation} - ${activities.length} activities`, // ✅ Add excerpt
        post_date: day.date,
        order_index: index,
        featured_image: locationImages?.[cleanedLocation] ||
          locationImages?.[day.location] ||
          day.items.find(item => item.image)?.image ||
          null // ✅ Ensure null instead of undefined
        // Note: metadata column doesn't exist in posts table
        // Day-specific data is stored in the content markdown
      }
    })

    console.log('📝 Inserting', posts.length, 'posts into database...')
    const { error: postsError } = await supabase
      .from('posts')
      .insert(posts)

    if (postsError) {
      console.error('❌ Error creating posts:', postsError)
      // Don't fail the whole operation if posts fail
    } else {
      console.log('✅ Posts created successfully')
    }

    console.log('🎉 Trip saved successfully! Trip ID:', trip.id)
    return { success: true, tripId: trip.id }
  } catch (error) {
    console.error('Error saving AI trip:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get trip preview data for animation
 */
export function getTripPreviewData(plan: AIPlan, locationImages?: Record<string, string>) {
  // Clean all location names
  const locations = [...new Set(plan.days.map(day => cleanLocationName(day.location)))]
  const totalActivities = plan.days.reduce(
    (sum, day) => sum + day.items.filter(item => item.type === 'activity').length,
    0
  )

  const firstDayLocation = cleanLocationName(plan.days[0].location)

  return {
    title: plan.title,
    destination: locations.length === 1
      ? locations[0]
      : `${locations[0]} → ${locations[locations.length - 1]}`,
    duration: `${plan.days.length} days`,
    activities: totalActivities,
    coverImage: locationImages?.[firstDayLocation] ||
      locationImages?.[plan.days[0].location] ||
      plan.days[0].items.find(item => item.image)?.image ||
      '/placeholder-trip.jpg',
    startDate: plan.days[0].date,
    endDate: plan.days[plan.days.length - 1].date
  }
}


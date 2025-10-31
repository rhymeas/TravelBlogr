/**
 * Trip Image Service
 * 
 * Applies optimized Brave API query strategies to fetch contextual hero images for trips.
 * Based on /test/brave-strategies research and BRAVE_QUERY_FINAL_STRATEGY.md
 * 
 * CRITICAL RULES:
 * - ALWAYS use thumbnail || url pattern for Brave images
 * - NEVER default to gradient placeholders
 * - Try multiple query strategies in priority order
 * - Use trip destination/title to build contextual queries
 */

interface BraveImageResult {
  title: string
  url: string           // Source page URL - NOT the image!
  thumbnail: string     // Actual image URL from Brave CDN ✅
  source: string
  properties: {
    url: string
    width: number
    height: number
  }
}

interface TripImageOptions {
  tripTitle: string
  destination?: string
  tripType?: string
  isWellKnown?: boolean
}

/**
 * Build optimized Brave API queries based on trip data
 * Uses Tier 1 strategies from /test/brave-strategies
 */
function buildTripImageQueries(options: TripImageOptions): string[] {
  const { tripTitle, destination, tripType, isWellKnown } = options
  const queries: string[] = []

  // Extract location parts
  const city = destination?.split(',')[0]?.trim() || ''
  const fullLocation = destination || ''

  // TIER 1: EXCELLENT Strategies (based on test results)
  
  if (isWellKnown) {
    // For well-known destinations (Eiffel Tower, Taj Mahal, etc.)
    queries.push(tripTitle) // 1. Activity Name Only
    if (fullLocation) {
      queries.push(`${tripTitle} in ${fullLocation}`) // 2. Activity "in" Location
    }
    if (city) {
      queries.push(`${tripTitle} ${city}`) // 3. Activity + City
    }
  } else {
    // For lesser-known destinations
    if (fullLocation) {
      queries.push(`${tripTitle} in ${fullLocation}`) // 2. Activity "in" Location
    }
    if (city) {
      queries.push(`${tripTitle} ${city}`) // 3. Activity + City
    }
    queries.push(tripTitle) // 1. Activity Name Only (fallback)
  }

  // Additional strategies
  if (city && tripType) {
    queries.push(`${tripTitle} ${city} ${tripType}`) // 4. Activity + City + Type
  }
  if (fullLocation && tripType) {
    queries.push(`${tripTitle} ${fullLocation} ${tripType}`) // 5. Activity + Full Location + Type
  }
  if (city) {
    queries.push(`${tripTitle} near ${city}`) // 6. Activity "near" City
  }

  // Fallback to destination only if trip title doesn't work
  if (fullLocation && fullLocation !== tripTitle) {
    queries.push(fullLocation)
    if (city && city !== fullLocation) {
      queries.push(city)
    }
  }

  return queries
}

/**
 * Fetch trip hero image using Brave API with optimized query strategies
 * 
 * @param options - Trip data for building contextual queries
 * @returns Image URL or null if no suitable image found
 */
export async function fetchTripHeroImage(options: TripImageOptions): Promise<string | null> {
  const queries = buildTripImageQueries(options)

  console.log(`🖼️ Fetching trip hero image for: "${options.tripTitle}"`)
  console.log(`📍 Destination: ${options.destination || 'N/A'}`)
  console.log(`🎯 Type: ${options.tripType || 'N/A'}`)
  console.log(`🔍 Query strategies (${queries.length}):`, queries)

  // Try each query strategy in priority order
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    console.log(`\n🔍 Strategy ${i + 1}/${queries.length}: "${query}"`)

    try {
      const response = await fetch(`/api/brave/activity-image?query=${encodeURIComponent(query)}&limit=15`)
      
      if (!response.ok) {
        console.warn(`⚠️ Strategy ${i + 1} failed: ${response.status} ${response.statusText}`)
        continue
      }

      const data = await response.json()
      const images: BraveImageResult[] = data.images || []

      console.log(`📊 Strategy ${i + 1} returned ${images.length} images`)

      if (images.length >= 5) {
        // Success! Use first image (thumbnail first, then url fallback)
        const imageUrl = images[0].thumbnail || images[0].url
        console.log(`✅ SUCCESS! Using image from strategy ${i + 1}: ${imageUrl}`)
        return imageUrl
      } else if (images.length > 0) {
        console.log(`⚠️ Strategy ${i + 1} returned only ${images.length} images (< 5), trying next strategy...`)
      } else {
        console.log(`❌ Strategy ${i + 1} returned 0 images, trying next strategy...`)
      }

    } catch (error) {
      console.error(`❌ Strategy ${i + 1} error:`, error)
      continue
    }
  }

  console.warn(`⚠️ All ${queries.length} strategies exhausted. No suitable image found.`)
  return null
}

/**
 * Detect if a destination is well-known (famous landmarks, major cities)
 * This helps prioritize query strategies
 */
export function isWellKnownDestination(destination: string): boolean {
  const wellKnownKeywords = [
    // Famous landmarks
    'eiffel tower', 'taj mahal', 'great wall', 'colosseum', 'statue of liberty',
    'big ben', 'sydney opera', 'burj khalifa', 'machu picchu', 'christ redeemer',
    
    // Major cities
    'paris', 'london', 'new york', 'tokyo', 'dubai', 'rome', 'barcelona',
    'amsterdam', 'venice', 'prague', 'istanbul', 'bangkok', 'singapore',
    'hong kong', 'sydney', 'san francisco', 'los angeles', 'chicago',
    
    // Famous regions
    'bali', 'maldives', 'santorini', 'iceland', 'swiss alps', 'grand canyon'
  ]

  const lowerDest = destination.toLowerCase()
  return wellKnownKeywords.some(keyword => lowerDest.includes(keyword))
}

/**
 * Update trip cover image in database
 */
export async function updateTripCoverImage(tripId: string, imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_image: imageUrl })
    })

    return response.ok
  } catch (error) {
    console.error('Error updating trip cover image:', error)
    return false
  }
}

/**
 * Ensure trip has a hero image - fetch and update if missing
 * This should be called when displaying trip cards
 */
export async function ensureTripHeroImage(trip: {
  id: string
  title: string
  slug: string
  cover_image?: string
  destination?: string
  trip_type?: string
}): Promise<string | null> {
  // If trip already has a cover image, return it
  if (trip.cover_image) {
    return trip.cover_image
  }

  console.log(`🔄 Trip "${trip.title}" has no cover image. Fetching...`)

  // Determine if destination is well-known
  const isWellKnown = trip.destination ? isWellKnownDestination(trip.destination) : false

  // Fetch hero image using Brave strategies
  const imageUrl = await fetchTripHeroImage({
    tripTitle: trip.title,
    destination: trip.destination,
    tripType: trip.trip_type,
    isWellKnown
  })

  if (imageUrl) {
    // Update trip in database
    const updated = await updateTripCoverImage(trip.id, imageUrl)
    if (updated) {
      console.log(`✅ Trip cover image updated successfully`)
      return imageUrl
    } else {
      console.warn(`⚠️ Failed to update trip cover image in database`)
      return imageUrl // Still return the image even if DB update failed
    }
  }

  console.warn(`⚠️ Could not fetch hero image for trip "${trip.title}"`)
  return null
}


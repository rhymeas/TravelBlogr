#!/usr/bin/env tsx
/**
 * Background Enrichment Script for Location Activities
 * 
 * Leverages V2 Trip Planner's proven enrichment logic:
 * - Brave API for activity images and links
 * - GROQ fallback for descriptions and URLs
 * - Reddit ULTRA image engine for high-quality visuals
 * 
 * Usage:
 *   npm run enrich-activities              # Enrich all locations
 *   npm run enrich-activities --limit 10   # Enrich first 10 locations
 *   npm run enrich-activities --location-id <uuid>  # Enrich specific location
 */

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!BRAVE_API_KEY) {
  console.warn('⚠️ Missing BRAVE_SEARCH_API_KEY - will skip Brave enrichment')
}

if (!GROQ_API_KEY) {
  console.warn('⚠️ Missing GROQ_API_KEY - will skip GROQ fallback')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null

// Stats tracking
const stats = {
  locationsProcessed: 0,
  activitiesEnriched: 0,
  activitiesSkipped: 0,
  imagesAdded: 0,
  linksAdded: 0,
  errors: 0,
  startTime: Date.now()
}

interface Activity {
  id: string
  name: string
  description?: string
  category?: string
  image_url?: string
  link_url?: string
  link_source?: string
  [key: string]: any
}

interface Location {
  id: string
  name: string
  slug: string
  country?: string
  activities: Activity[]
}

/**
 * Fetch activity enrichment from Brave API (includes images!)
 * Priority: Brave images FIRST, then links
 */
async function fetchBraveEnrichment(
  activityName: string,
  locationName: string
): Promise<{ image?: string; link?: string; description?: string } | null> {
  if (!BRAVE_API_KEY) return null

  try {
    // Search for both web results AND images
    const query = `${activityName} ${locationName}`

    // Fetch web results and images in parallel
    const [webResponse, imageResponse] = await Promise.all([
      // Web search for links
      fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' official website booking')}&count=3`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': BRAVE_API_KEY
          }
        }
      ),
      // Image search for high-quality photos
      fetch(
        `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=3`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': BRAVE_API_KEY
          }
        }
      )
    ])

    let link = null
    let description = null
    let image = null

    // Extract link from web results
    if (webResponse.ok) {
      const webData = await webResponse.json()
      const results = webData?.web?.results || []

      if (results.length > 0) {
        const bestResult = results.find((r: any) =>
          r.url?.includes('official') ||
          r.url?.includes('booking') ||
          r.url?.includes('.gov') ||
          r.url?.includes('.org')
        ) || results[0]

        link = bestResult.url
        description = bestResult.description
      }
    }

    // Extract image from image results (PRIORITY!)
    if (imageResponse.ok) {
      const imageData = await imageResponse.json()
      const images = imageData?.results || []

      if (images.length > 0) {
        // Get first high-quality image
        const bestImage = images.find((img: any) =>
          img.properties?.url &&
          !img.properties.url.includes('placeholder') &&
          !img.properties.url.includes('icon')
        ) || images[0]

        image = bestImage?.properties?.url || bestImage?.thumbnail?.src
      }
    }

    if (!link && !image) return null

    return { image, link, description }
  } catch (error) {
    console.error(`❌ Brave API error for "${activityName}":`, error)
    return null
  }
}

/**
 * Fetch activity image from Reddit ULTRA engine (FALLBACK ONLY)
 * Only called if Brave images fail
 */
async function fetchRedditImage(
  activityName: string,
  locationName: string
): Promise<string | null> {
  try {
    // Use same image discovery API as V2 planner (Reddit ULTRA)
    const response = await fetch(
      `http://localhost:3001/api/images/discover?query=${encodeURIComponent(`${activityName} ${locationName}`)}&limit=1&context=activity`
    )

    if (!response.ok) return null

    const data = await response.json()
    const images = data?.images || []

    if (images.length === 0) return null

    return images[0].url
  } catch (error) {
    console.error(`❌ Reddit image fetch error for "${activityName}":`, error)
    return null
  }
}

/**
 * GROQ fallback for description and URL (V2 Trip Planner logic)
 */
async function fetchGroqFallback(
  activityName: string,
  locationName: string
): Promise<{ description?: string; url?: string } | null> {
  if (!groq) return null

  try {
    const prompt = `You are a travel expert. Generate a concise, contextual 2-line description for this travel activity.

Activity: ${activityName}
Location: ${locationName}

Requirements:
- Maximum 2 sentences (about 30-40 words total)
- Practical and informative
- Include relevant details (duration, cost, booking info, etc.)
- Natural, conversational tone
- No marketing fluff

Return ONLY the description, no extra text.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100
    })

    const description = completion.choices[0]?.message?.content?.trim()

    // Try to get URL from Brave
    let url = null
    if (BRAVE_API_KEY) {
      try {
        const searchQuery = `${activityName} ${locationName} booking information`
        const braveResponse = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=1`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'X-Subscription-Token': BRAVE_API_KEY
            }
          }
        )
        
        if (braveResponse.ok) {
          const braveData = await braveResponse.json()
          url = braveData?.web?.results?.[0]?.url || null
        }
      } catch {}
    }

    return { description, url }
  } catch (error) {
    console.error(`❌ GROQ error for "${activityName}":`, error)
    return null
  }
}

/**
 * Enrich a single activity with images and links
 * Priority: Brave images > Reddit ULTRA > GROQ fallback
 */
async function enrichActivity(
  activity: Activity,
  locationName: string
): Promise<Activity> {
  const needsImage = !activity.image_url || activity.image_url.includes('placeholder')
  const needsLink = !activity.link_url

  if (!needsImage && !needsLink) {
    stats.activitiesSkipped++
    return activity
  }

  console.log(`  🔍 Enriching: ${activity.name}`)

  let enriched = { ...activity }

  // Step 1: Try Brave API FIRST (images + links in one call!)
  const braveData = await fetchBraveEnrichment(activity.name, locationName)

  // Extract Brave image (PRIORITY!)
  if (needsImage && braveData?.image) {
    enriched.image_url = braveData.image
    stats.imagesAdded++
    console.log(`    ✅ Image (Brave): ${braveData.image.substring(0, 60)}...`)
  }

  // Extract Brave link
  if (needsLink && braveData?.link) {
    enriched.link_url = braveData.link
    enriched.link_source = 'brave'
    stats.linksAdded++
    console.log(`    ✅ Link (Brave): ${braveData.link}`)
  }

  // Extract Brave description
  if (braveData?.description && !enriched.description) {
    enriched.description = braveData.description
  }

  // Step 2: Reddit ULTRA fallback (ONLY if Brave image failed)
  if (needsImage && !enriched.image_url) {
    const redditImage = await fetchRedditImage(activity.name, locationName)
    if (redditImage) {
      enriched.image_url = redditImage
      stats.imagesAdded++
      console.log(`    ✅ Image (Reddit): ${redditImage.substring(0, 60)}...`)
    }
  }

  // Step 3: GROQ fallback (ONLY if still missing link)
  if (!enriched.link_url && groq) {
    const groqData = await fetchGroqFallback(activity.name, locationName)
    if (groqData?.url) {
      enriched.link_url = groqData.url
      enriched.link_source = 'groq'
      stats.linksAdded++
      console.log(`    ✅ Link (GROQ): ${groqData.url}`)
    }
    if (groqData?.description && !enriched.description) {
      enriched.description = groqData.description
    }
  }

  if (enriched.link_url || enriched.image_url !== activity.image_url) {
    stats.activitiesEnriched++
  } else {
    stats.activitiesSkipped++
  }

  // Rate limiting: 200ms delay to stay under 20 calls/second
  // (Brave makes 2 parallel calls, so 200ms = max 10 activities/sec = 20 API calls/sec)
  await new Promise(resolve => setTimeout(resolve, 200))

  return enriched
}

/**
 * Enrich all activities for a location
 */
async function enrichLocation(location: Location): Promise<void> {
  console.log(`\n📍 Processing: ${location.name} (${location.activities?.length || 0} activities)`)

  if (!location.activities || location.activities.length === 0) {
    console.log('  ⏭️  No activities to enrich')
    return
  }

  const enrichedActivities: Activity[] = []

  for (const activity of location.activities) {
    try {
      const enriched = await enrichActivity(activity, location.name)
      enrichedActivities.push(enriched)
    } catch (error) {
      console.error(`  ❌ Error enriching "${activity.name}":`, error)
      enrichedActivities.push(activity) // Keep original
      stats.errors++
    }
  }

  // Update location in database
  const { error } = await supabase
    .from('locations')
    .update({
      activities: enrichedActivities,
      updated_at: new Date().toISOString()
    })
    .eq('id', location.id)

  if (error) {
    console.error(`  ❌ Failed to update location:`, error)
    stats.errors++
  } else {
    console.log(`  ✅ Updated ${location.name}`)
    stats.locationsProcessed++
  }
}

/**
 * Main enrichment function
 */
async function main() {
  console.log('🚀 Starting Location Activity Enrichment\n')
  console.log('Using V2 Trip Planner enrichment logic:')
  console.log('  - Brave API for links and descriptions')
  console.log('  - Reddit ULTRA for high-quality images')
  console.log('  - GROQ fallback for missing data\n')

  // Parse CLI arguments
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf('--limit')
  const locationIdIndex = args.indexOf('--location-id')
  
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined
  const locationId = locationIdIndex !== -1 ? args[locationIdIndex + 1] : undefined

  // Fetch locations
  let query = supabase
    .from('locations')
    .select('id, name, slug, country, activities')
    .not('activities', 'is', null)

  if (locationId) {
    query = query.eq('id', locationId)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data: locations, error } = await query

  if (error) {
    console.error('❌ Failed to fetch locations:', error)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('ℹ️  No locations found to enrich')
    process.exit(0)
  }

  console.log(`📊 Found ${locations.length} location(s) to process\n`)

  // Process each location
  for (const location of locations as Location[]) {
    await enrichLocation(location)
  }

  // Print final stats
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1)
  console.log('\n' + '='.repeat(60))
  console.log('✅ Enrichment Complete!')
  console.log('='.repeat(60))
  console.log(`📊 Stats:`)
  console.log(`  - Locations processed: ${stats.locationsProcessed}`)
  console.log(`  - Activities enriched: ${stats.activitiesEnriched}`)
  console.log(`  - Activities skipped: ${stats.activitiesSkipped}`)
  console.log(`  - Images added: ${stats.imagesAdded}`)
  console.log(`  - Links added: ${stats.linksAdded}`)
  console.log(`  - Errors: ${stats.errors}`)
  console.log(`  - Duration: ${duration}s`)
  console.log('='.repeat(60))
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})


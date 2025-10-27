import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

/**
 * Cron Job: Enrich Location Activities
 * 
 * Runs periodically to enrich activities with:
 * - High-quality images (Reddit ULTRA engine)
 * - Official links (Brave API)
 * - Contextual descriptions (GROQ)
 * 
 * Usage:
 *   GET /api/cron/enrich-activities?secret=<CRON_SECRET>
 *   GET /api/cron/enrich-activities?secret=<CRON_SECRET>&limit=10
 *   GET /api/cron/enrich-activities?secret=<CRON_SECRET>&location_id=<uuid>
 */

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production'

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null

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
    console.error(`Brave API error for "${activityName}":`, error)
    return null
  }
}

/**
 * Fetch activity image from Reddit ULTRA engine (FALLBACK ONLY)
 */
async function fetchRedditImage(
  activityName: string,
  locationName: string,
  baseUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${baseUrl}/api/images/discover?query=${encodeURIComponent(`${activityName} ${locationName}`)}&limit=1&context=activity`
    )

    if (!response.ok) return null

    const data = await response.json()
    const images = data?.images || []

    if (images.length === 0) return null

    return images[0].url
  } catch (error) {
    console.error(`Reddit image fetch error for "${activityName}":`, error)
    return null
  }
}

/**
 * GROQ fallback for description and URL
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
    console.error(`GROQ error for "${activityName}":`, error)
    return null
  }
}

/**
 * Enrich a single activity
 * Priority: Brave images > Reddit ULTRA > GROQ fallback
 */
async function enrichActivity(
  activity: Activity,
  locationName: string,
  baseUrl: string,
  stats: any
): Promise<Activity> {
  const needsImage = !activity.image_url || activity.image_url.includes('placeholder')
  const needsLink = !activity.link_url

  if (!needsImage && !needsLink) {
    stats.activitiesSkipped++
    return activity
  }

  let enriched = { ...activity }

  // Step 1: Try Brave API FIRST (images + links in one call!)
  const braveData = await fetchBraveEnrichment(activity.name, locationName)

  // Extract Brave image (PRIORITY!)
  if (needsImage && braveData?.image) {
    enriched.image_url = braveData.image
    stats.imagesAdded++
  }

  // Extract Brave link
  if (needsLink && braveData?.link) {
    enriched.link_url = braveData.link
    enriched.link_source = 'brave'
    stats.linksAdded++
  }

  // Extract Brave description
  if (braveData?.description && !enriched.description) {
    enriched.description = braveData.description
  }

  // Step 2: Reddit ULTRA fallback (ONLY if Brave image failed)
  if (needsImage && !enriched.image_url) {
    const redditImage = await fetchRedditImage(activity.name, locationName, baseUrl)
    if (redditImage) {
      enriched.image_url = redditImage
      stats.imagesAdded++
    }
  }

  // Step 3: GROQ fallback (ONLY if still missing link)
  if (!enriched.link_url && groq) {
    const groqData = await fetchGroqFallback(activity.name, locationName)
    if (groqData?.url) {
      enriched.link_url = groqData.url
      enriched.link_source = 'groq'
      stats.linksAdded++
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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = {
    locationsProcessed: 0,
    activitiesEnriched: 0,
    activitiesSkipped: 0,
    imagesAdded: 0,
    linksAdded: 0,
    errors: 0
  }

  try {
    const supabase = createServiceSupabase()
    
    // Parse query params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const locationId = request.nextUrl.searchParams.get('location_id')
    
    // Get base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3001'
    const baseUrl = `${protocol}://${host}`

    // Fetch locations
    let query = supabase
      .from('locations')
      .select('id, name, slug, country, activities')
      .not('activities', 'is', null)

    if (locationId) {
      query = query.eq('id', locationId)
    } else {
      query = query.limit(limit)
    }

    const { data: locations, error } = await query

    if (error) {
      throw new Error(`Failed to fetch locations: ${error.message}`)
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No locations found to enrich',
        stats
      })
    }

    // Process each location
    for (const location of locations as Location[]) {
      if (!location.activities || location.activities.length === 0) continue

      const enrichedActivities: Activity[] = []

      for (const activity of location.activities) {
        try {
          const enriched = await enrichActivity(activity, location.name, baseUrl, stats)
          enrichedActivities.push(enriched)
        } catch (error) {
          console.error(`Error enriching "${activity.name}":`, error)
          enrichedActivities.push(activity)
          stats.errors++
        }
      }

      // Update location
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          activities: enrichedActivities,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        console.error(`Failed to update location ${location.name}:`, updateError)
        stats.errors++
      } else {
        stats.locationsProcessed++
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      message: 'Enrichment complete',
      stats: {
        ...stats,
        duration: `${duration}s`
      }
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats
      },
      { status: 500 }
    )
  }
}


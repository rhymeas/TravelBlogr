/**
 * Activity Link Service
 * Finds relevant links for activities using multiple sources
 * 
 * Priority:
 * 1. Provider Website (official)
 * 2. Brave Search (most relevant)
 * 3. Wikipedia/Wikivoyage
 * 4. Google Maps (fallback)
 */

export interface ActivityLinkResult {
  url: string
  source: 'official' | 'brave' | 'wikipedia' | 'wikivoyage' | 'google_maps'
  type: 'official' | 'guide' | 'booking' | 'search'
  title?: string
  confidence?: number
}

/**
 * Fetch activity link using Brave Search API
 */
async function fetchBraveSearchLink(
  activityName: string,
  locationName: string,
  country: string
): Promise<ActivityLinkResult | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not set, skipping Brave search')
    return null
  }

  try {
    const query = `${activityName} ${locationName} ${country} official website`
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    })

    if (!response.ok) {
      console.error(`Brave Search API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.web?.results && data.web.results.length > 0) {
      const topResult = data.web.results[0]
      
      // Filter out generic sites
      const genericDomains = ['wikipedia.org', 'tripadvisor.com', 'booking.com', 'google.com']
      const isGeneric = genericDomains.some(domain => topResult.url.includes(domain))

      if (!isGeneric) {
        console.log(`✅ Brave Search found: ${topResult.url}`)
        return {
          url: topResult.url,
          source: 'brave',
          type: 'official',
          title: topResult.title,
          confidence: 0.9
        }
      }
    }

    return null
  } catch (error) {
    console.error('Brave Search error:', error)
    return null
  }
}

/**
 * Fetch Wikipedia link
 */
async function fetchWikipediaLink(
  activityName: string,
  locationName: string
): Promise<ActivityLinkResult | null> {
  try {
    const query = `${activityName} ${locationName}`
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`

    const response = await fetch(url)
    const data = await response.json()

    if (data && data[3] && data[3][0]) {
      console.log(`✅ Wikipedia found: ${data[3][0]}`)
      return {
        url: data[3][0],
        source: 'wikipedia',
        type: 'guide',
        title: data[1][0],
        confidence: 0.7
      }
    }

    return null
  } catch (error) {
    console.error('Wikipedia search error:', error)
    return null
  }
}

/**
 * Fetch Wikivoyage link
 */
async function fetchWikivoyageLink(
  activityName: string,
  locationName: string
): Promise<ActivityLinkResult | null> {
  try {
    const query = `${activityName} ${locationName}`
    const url = `https://en.wikivoyage.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`

    const response = await fetch(url)
    const data = await response.json()

    if (data && data[3] && data[3][0]) {
      console.log(`✅ Wikivoyage found: ${data[3][0]}`)
      return {
        url: data[3][0],
        source: 'wikivoyage',
        type: 'guide',
        title: data[1][0],
        confidence: 0.8
      }
    }

    return null
  } catch (error) {
    console.error('Wikivoyage search error:', error)
    return null
  }
}

/**
 * Generate Google Maps search link (fallback)
 */
function generateGoogleMapsLink(
  activityName: string,
  locationName: string,
  country: string
): ActivityLinkResult {
  const query = `${activityName} ${locationName} ${country}`
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`

  return {
    url,
    source: 'google_maps',
    type: 'search',
    title: `${activityName} on Google Maps`,
    confidence: 0.5
  }
}

/**
 * Main function to fetch activity link
 * Tries multiple sources in priority order
 */
export async function fetchActivityLink(
  activityName: string,
  locationName: string,
  country: string
): Promise<ActivityLinkResult | null> {
  console.log(`🔍 Fetching link for: ${activityName} in ${locationName}, ${country}`)

  // Try Brave Search first (best quality)
  const braveLink = await fetchBraveSearchLink(activityName, locationName, country)
  if (braveLink) return braveLink

  // Try Wikivoyage (travel-specific)
  const wikivoyageLink = await fetchWikivoyageLink(activityName, locationName)
  if (wikivoyageLink) return wikivoyageLink

  // Try Wikipedia (general knowledge)
  const wikipediaLink = await fetchWikipediaLink(activityName, locationName)
  if (wikipediaLink) return wikipediaLink

  // Fallback to Google Maps
  console.log('⚠️ No specific link found, using Google Maps fallback')
  return generateGoogleMapsLink(activityName, locationName, country)
}

/**
 * Batch fetch activity links
 */
export async function fetchActivityLinks(
  activities: Array<{ name: string; locationName: string; country: string }>
): Promise<Map<string, ActivityLinkResult>> {
  const results = new Map<string, ActivityLinkResult>()

  for (const activity of activities) {
    try {
      const link = await fetchActivityLink(
        activity.name,
        activity.locationName,
        activity.country
      )

      if (link) {
        results.set(activity.name, link)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Failed to fetch link for ${activity.name}:`, error)
    }
  }

  return results
}


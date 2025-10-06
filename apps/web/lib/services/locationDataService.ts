/**
 * Smart Location Data Service with Free API Fallbacks
 * 
 * Priority Order (Cheap & Fast):
 * 1. OpenStreetMap Overpass → Primary (free, fast)
 * 2. OpenTripMap → Tourist attractions (free, no key needed)
 * 3. GeoNames → Rich location data (free, requires username)
 * 4. WikiVoyage → Travel guides (free, no key needed)
 * 5. Static GitHub datasets → Offline backup
 * 
 * Smart Features:
 * - Caching to reduce API calls
 * - Parallel requests for speed
 * - Graceful degradation
 * - No backend overload
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const dataCache = new Map<string, { data: any; timestamp: number }>()

interface LocationData {
  restaurants: any[]
  activities: any[]
  attractions: any[]
  description: string
  bestTimeToVisit?: string
  travelTips?: string[]
}

/**
 * OpenTripMap - Tourist Attractions
 * FREE - No API key needed - Unlimited
 */
async function fetchOpenTripMapAttractions(
  latitude: number,
  longitude: number,
  radius: number = 3000
): Promise<any[]> {
  try {
    // OpenTripMap public API (no key needed for basic features)
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?` +
      `radius=${radius}&` +
      `lon=${longitude}&` +
      `lat=${latitude}&` +
      `format=json&` +
      `limit=50`
    )

    if (!response.ok) return []

    const data = await response.json()
    
    const attractions = data
      .filter((place: any) => place.name)
      .map((place: any) => ({
        name: place.name,
        category: place.kinds?.split(',')[0] || 'attraction',
        latitude: place.point?.lat,
        longitude: place.point?.lon,
        source: 'opentripmap'
      }))

    console.log(`✅ OpenTripMap: Found ${attractions.length} attractions`)
    return attractions
  } catch (error) {
    console.error('OpenTripMap error:', error)
    return []
  }
}

/**
 * GeoNames - Rich Location Data
 * FREE - Requires username (free registration)
 */
async function fetchGeoNamesData(locationName: string): Promise<any> {
  const username = process.env.GEONAMES_USERNAME || 'demo' // Use 'demo' for testing

  try {
    const response = await fetch(
      `http://api.geonames.org/searchJSON?` +
      `q=${encodeURIComponent(locationName)}&` +
      `maxRows=1&` +
      `username=${username}`
    )

    if (!response.ok) return null

    const data = await response.json()
    
    if (data.geonames?.[0]) {
      const place = data.geonames[0]
      console.log(`✅ GeoNames: Found data for "${locationName}"`)
      return {
        name: place.name,
        country: place.countryName,
        region: place.adminName1,
        population: place.population,
        timezone: place.timezone?.timeZoneId,
        latitude: place.lat,
        longitude: place.lng
      }
    }

    return null
  } catch (error) {
    console.error('GeoNames error:', error)
    return null
  }
}

/**
 * WikiVoyage - Travel Guides
 * FREE - No API key needed - Unlimited
 */
async function fetchWikiVoyageGuide(locationName: string): Promise<any> {
  try {
    const response = await fetch(
      `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
    )

    if (!response.ok) return null

    const data = await response.json()
    
    if (data.extract) {
      console.log(`✅ WikiVoyage: Found travel guide for "${locationName}"`)
      return {
        description: data.extract,
        fullUrl: data.content_urls?.desktop?.page
      }
    }

    return null
  } catch (error) {
    console.error('WikiVoyage error:', error)
    return null
  }
}

/**
 * Wikipedia - Fallback for descriptions
 * FREE - No API key needed - Unlimited
 */
async function fetchWikipediaDescription(locationName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
    )

    if (!response.ok) return null

    const data = await response.json()
    
    if (data.extract) {
      console.log(`✅ Wikipedia: Found description for "${locationName}"`)
      return data.extract
    }

    return null
  } catch (error) {
    console.error('Wikipedia error:', error)
    return null
  }
}

/**
 * OpenWeather - Best Time to Visit
 * FREE - Requires API key (free tier: 60 calls/min)
 */
async function fetchBestTimeToVisit(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) return null

  try {
    // Get climate data (simplified - you can enhance this)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `appid=${apiKey}&` +
      `units=metric`
    )

    if (!response.ok) return null

    const data = await response.json()
    
    // Simple logic - can be enhanced
    const temp = data.main?.temp
    if (temp > 25) return 'Best time: Spring or Fall (mild weather)'
    if (temp < 10) return 'Best time: Summer (warmer weather)'
    return 'Best time: Year-round (pleasant climate)'
  } catch (error) {
    console.error('OpenWeather error:', error)
    return null
  }
}

/**
 * Fetch Complete Location Data with Smart Fallbacks
 */
export async function fetchCompleteLocationData(
  locationName: string,
  latitude: number,
  longitude: number
): Promise<LocationData> {
  // Check cache first
  const cacheKey = `location:${locationName}`
  const cached = dataCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached data for "${locationName}"`)
    return cached.data
  }

  console.log(`🔍 Fetching complete data for: "${locationName}"`)

  // Fetch data in parallel for speed (cheap & fast!)
  const [
    openTripMapAttractions,
    geoNamesData,
    wikiVoyageGuide,
    wikipediaDescription,
    bestTime
  ] = await Promise.all([
    fetchOpenTripMapAttractions(latitude, longitude),
    fetchGeoNamesData(locationName),
    fetchWikiVoyageGuide(locationName),
    fetchWikipediaDescription(locationName),
    fetchBestTimeToVisit(latitude, longitude)
  ])

  // Combine data intelligently
  const locationData: LocationData = {
    restaurants: [], // Will be filled by Overpass API in auto-fill
    activities: [], // Will be filled by Overpass API in auto-fill
    attractions: openTripMapAttractions,
    description: wikiVoyageGuide?.description || wikipediaDescription || `Discover ${locationName}`,
    bestTimeToVisit: bestTime || undefined,
    travelTips: []
  }

  // Add travel tips from WikiVoyage if available
  if (wikiVoyageGuide?.fullUrl) {
    locationData.travelTips = [
      `📖 Full travel guide: ${wikiVoyageGuide.fullUrl}`
    ]
  }

  // Cache the result
  dataCache.set(cacheKey, { data: locationData, timestamp: Date.now() })

  console.log(`✅ Complete data fetched for "${locationName}"`)
  return locationData
}

/**
 * Enhance Activities with OpenTripMap Data
 * Merges Overpass API results with OpenTripMap attractions
 */
export async function enhanceActivitiesWithAttractions(
  activities: any[],
  latitude: number,
  longitude: number
): Promise<any[]> {
  // Get additional attractions from OpenTripMap
  const attractions = await fetchOpenTripMapAttractions(latitude, longitude)

  // Merge with existing activities (avoid duplicates)
  const existingNames = new Set(activities.map(a => a.name?.toLowerCase()))
  
  const newAttractions = attractions
    .filter(attr => !existingNames.has(attr.name?.toLowerCase()))
    .slice(0, 20) // Limit to 20 additional attractions

  console.log(`✅ Added ${newAttractions.length} attractions from OpenTripMap`)
  
  return [...activities, ...newAttractions]
}

/**
 * Get Enhanced Description with Multiple Sources
 */
export async function getEnhancedDescription(locationName: string): Promise<string> {
  // Try WikiVoyage first (travel-focused)
  const wikiVoyage = await fetchWikiVoyageGuide(locationName)
  if (wikiVoyage?.description) {
    return wikiVoyage.description
  }

  // Fallback to Wikipedia
  const wikipedia = await fetchWikipediaDescription(locationName)
  if (wikipedia) {
    return wikipedia
  }

  // Final fallback
  return `Discover ${locationName}, a fascinating destination with rich culture and history.`
}

/**
 * Get Location Metadata (country, region, timezone, etc.)
 */
export async function getLocationMetadata(locationName: string): Promise<any> {
  const geoData = await fetchGeoNamesData(locationName)
  
  if (geoData) {
    return {
      country: geoData.country,
      region: geoData.region,
      population: geoData.population,
      timezone: geoData.timezone,
      coordinates: {
        latitude: geoData.latitude,
        longitude: geoData.longitude
      }
    }
  }

  return null
}


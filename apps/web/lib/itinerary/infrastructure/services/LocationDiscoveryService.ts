/**
 * Location Discovery Service
 * Finds locations from internet sources and creates them if needed
 */

import { createClient } from '@supabase/supabase-js'
import { fetchLocationImage, fetchLocationGallery } from '@/lib/services/robustImageService'

interface GeoNamesResult {
  geonameId: number
  name: string
  lat: string
  lng: string
  countryName: string
  adminName1?: string
  adminName2?: string // County/District level
  population: number
}

interface LocationData {
  slug: string
  name: string
  country: string
  region?: string // State/Region level for 3-level hierarchy
  latitude: number
  longitude: number
  description?: string
  featured_image?: string
}

export class LocationDiscoveryService {
  private supabase
  private cache: Map<string, LocationData> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Find or create a location
   * 1. Check in-memory cache first (fastest)
   * 2. Check database
   * 3. If not found, search GeoNames/Nominatim
   * 4. Create location in database
   * 5. Cache the result
   */
  async findOrCreateLocation(locationQuery: string): Promise<LocationData | null> {
    console.log(`🔍 Finding or creating location: ${locationQuery}`)

    // 1. Check in-memory cache first
    const cacheKey = this.slugify(locationQuery)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log(`⚡ Found in cache: ${cached.name}`)
      return cached
    }

    // 2. Try to find in database
    const existing = await this.findInDatabase(locationQuery)
    if (existing) {
      console.log(`✅ Found in database: ${existing.name}`)
      this.setCache(cacheKey, existing)
      return existing
    }

    // 3. Search GeoNames/Nominatim APIs
    console.log(`🌐 Searching GeoNames for: ${locationQuery}`)
    const geoData = await this.searchGeoNames(locationQuery)
    if (!geoData) {
      console.log(`❌ Location not found: ${locationQuery}`)
      return null
    }

    // 4. Create location in database
    console.log(`📝 Creating new location: ${geoData.name}`)
    const created = await this.createLocation(geoData)

    // 5. Cache the result
    this.setCache(cacheKey, created)

    return created
  }

  /**
   * Get location from cache if not expired
   */
  private getFromCache(key: string): LocationData | null {
    const expiry = this.cacheExpiry.get(key)
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return null
    }
    return this.cache.get(key) || null
  }

  /**
   * Set location in cache with expiry
   */
  private setCache(key: string, data: LocationData): void {
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL)
  }

  /**
   * Search database for existing location
   */
  private async findInDatabase(query: string): Promise<LocationData | null> {
    const slug = this.slugify(query)

    // Try exact slug match first
    let { data, error } = await this.supabase
      .from('locations')
      .select('slug, name, country, latitude, longitude, description, featured_image')
      .eq('slug', slug)
      .maybeSingle()

    if (data) {
      console.log(`✅ Found exact slug match in DB: ${data.name}`)
      return data
    }

    // Try exact name match (case-insensitive)
    const { data: exactNameData } = await this.supabase
      .from('locations')
      .select('slug, name, country, latitude, longitude, description, featured_image')
      .ilike('name', query)
      .limit(1)
      .maybeSingle()

    if (exactNameData) {
      console.log(`✅ Found exact name match in DB: ${exactNameData.name}`)
      return exactNameData
    }

    // Try partial name match as last resort
    const { data: nameData, error: nameError } = await this.supabase
      .from('locations')
      .select('slug, name, country, latitude, longitude, description, featured_image')
      .ilike('name', `%${query}%`)
      .limit(1)
      .maybeSingle()

    if (nameData) {
      console.log(`✅ Found partial name match in DB: ${nameData.name}`)
      return nameData
    }

    return null
  }

  /**
   * Search GeoNames API for location
   * Free API, requires username (free registration at geonames.org)
   * Falls back to Nominatim (OSM) if GeoNames fails
   *
   * IMPORTANT: Nominatim (OSM) is more accurate for regions, parks, and non-city locations
   * So we try Nominatim FIRST for better results
   */
  private async searchGeoNames(query: string): Promise<GeoNamesResult | null> {
    try {
      // Try Nominatim FIRST (OSM) - it's better for regions, parks, and specific places
      // 1 request/sec limit, but more accurate
      console.log(`🔍 Searching Nominatim (OSM) for: ${query}`)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1`

      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (travel planning app)'
        }
      })
      const nominatimData = await nominatimResponse.json()

      if (nominatimData && nominatimData.length > 0) {
        // Try to find the best match from Nominatim results
        let bestMatch = nominatimData[0]

        // Prefer exact name matches or specific place types
        for (const place of nominatimData) {
          const displayName = place.display_name.toLowerCase()
          const queryLower = query.toLowerCase()

          // Check if this is a better match
          if (
            place.name?.toLowerCase() === queryLower || // Exact name match
            displayName.includes('national park') || // National parks
            displayName.includes('regional district') || // Regional districts
            place.type === 'administrative' || // Administrative regions
            place.type === 'national_park' // Parks
          ) {
            bestMatch = place
            break
          }
        }

        console.log(`✅ Nominatim found: ${bestMatch.display_name} (type: ${bestMatch.type})`)

        // Use the most appropriate name
        const name = bestMatch.name ||
                    bestMatch.address?.city ||
                    bestMatch.address?.town ||
                    bestMatch.address?.village ||
                    bestMatch.address?.county ||
                    bestMatch.address?.state ||
                    query

        // Build 3-level hierarchy: City/Area → State/Region → Country
        // Always ensure we have 3 levels for consistent display
        const city = bestMatch.address?.city ||
                    bestMatch.address?.town ||
                    bestMatch.address?.village ||
                    bestMatch.address?.municipality ||
                    bestMatch.address?.county ||
                    name

        // Extract region with comprehensive fallback strategy
        // Priority: state > region > province > county > district > ISO code
        const region = bestMatch.address?.state ||
                      bestMatch.address?.region ||
                      bestMatch.address?.province ||
                      bestMatch.address?.county ||
                      bestMatch.address?.district ||
                      bestMatch.address?.['ISO3166-2-lvl4']?.split('-')[1] || // Extract region from ISO code (e.g., "CA-BC" -> "BC")
                      'Unknown Region' // Always provide a fallback

        const country = bestMatch.address?.country || 'Unknown'

        // Convert Nominatim format to GeoNames format with 3-level hierarchy
        return {
          geonameId: parseInt(bestMatch.place_id),
          name: city,
          lat: bestMatch.lat,
          lng: bestMatch.lon,
          countryName: country,
          adminName1: region || undefined, // State/Region level
          adminName2: bestMatch.address?.county || undefined, // County/District level (optional 4th level)
          population: 0
        }
      }

      // Fallback to GeoNames if Nominatim fails
      console.log(`🔄 Falling back to GeoNames for: ${query}`)
      const username = process.env.GEONAMES_USERNAME || 'demo'
      const geoNamesUrl = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=5&username=${username}&isNameRequired=true`

      const geoNamesResponse = await fetch(geoNamesUrl)
      const geoNamesData = await geoNamesResponse.json()

      // If we got results, try to find the best match
      if (geoNamesData.geonames && geoNamesData.geonames.length > 0) {
        // Prefer exact name matches
        const exactMatch = geoNamesData.geonames.find((g: any) =>
          g.name.toLowerCase() === query.toLowerCase() ||
          g.toponymName?.toLowerCase() === query.toLowerCase()
        )

        if (exactMatch) {
          console.log(`✅ GeoNames exact match: ${exactMatch.name} (${exactMatch.fcodeName})`)
          return exactMatch
        }

        // Otherwise take the first result
        console.log(`✅ GeoNames found: ${geoNamesData.geonames[0].name} (${geoNamesData.geonames[0].fcodeName})`)
        return geoNamesData.geonames[0]
      }

      console.log(`❌ Location not found in any API: ${query}`)
      return null
    } catch (error) {
      console.error('Geocoding API error:', error)
      return null
    }
  }

  /**
   * Create location in database
   */
  private async createLocation(geoData: GeoNamesResult): Promise<LocationData> {
    const slug = this.slugify(geoData.name)

    // AUTOMATED IMAGE FETCHING WITH VALIDATION & RETRY
    // This ensures NO location is saved without images
    console.log(`🖼️ [AUTO-FETCH] Starting automated image validation for: ${geoData.name}`)
    const imageResult = await this.fetchImagesWithRetry(geoData)
    const featuredImage = imageResult.featuredImage
    const galleryImages = imageResult.galleryImages

    console.log(`✅ [AUTO-FETCH] Image validation complete:`, {
      featuredImage: featuredImage ? '✓' : '✗',
      galleryCount: galleryImages.length
    })

    // Build 3-level hierarchy for display
    const region = geoData.adminName1 || geoData.adminName2 || ''

    const locationData: LocationData = {
      slug,
      name: geoData.name,
      country: geoData.countryName,
      region: region, // Add region/state level
      latitude: parseFloat(geoData.lat),
      longitude: parseFloat(geoData.lng),
      description: `${geoData.name} is a city in ${geoData.countryName}${region ? `, ${region}` : ''}.`,
      featured_image: featuredImage
    }

    // Insert into database with images and 3-level hierarchy
    const { data, error } = await this.supabase
      .from('locations')
      .insert({
        slug: locationData.slug,
        name: locationData.name,
        country: locationData.country,
        region: region || null, // Store region/state
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        description: locationData.description,
        featured_image: featuredImage,
        gallery_images: galleryImages,
        is_published: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      // Return data anyway even if insert fails
      return locationData
    }

    console.log(`✅ Created location: ${locationData.name} (${locationData.slug}) with ${galleryImages.length} images`)

    // AUTO-POPULATE ACTIVITIES & RESTAURANTS
    // Since we already have the location data, leverage API calls to reduce future costs
    console.log(`🍽️ Auto-populating activities & restaurants for ${locationData.name}...`)
    try {
      await this.autoPopulateLocationData(data.id, geoData.lat, geoData.lng)
    } catch (error) {
      console.error('⚠️ Failed to auto-populate location data:', error)
      // Don't fail the location creation if this fails
    }

    return locationData
  }

  /**
   * Auto-populate activities and restaurants for a newly created location
   */
  private async autoPopulateLocationData(
    locationId: string,
    latitude: string,
    longitude: string
  ): Promise<void> {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    const [restaurants, activities] = await Promise.all([
      this.fetchRestaurantsFromOSM(lat, lng),
      this.fetchActivitiesFromOSM(lat, lng)
    ])

    if (restaurants.length > 0) {
      const { error } = await this.supabase
        .from('restaurants')
        .insert(restaurants.map(r => ({
          location_id: locationId,
          name: r.name,
          cuisine_type: r.cuisine || 'International',
          price_range: r.price_range || '$$',
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          source: 'openstreetmap',
          is_verified: false
        })))

      if (!error) {
        console.log(`✅ Auto-populated ${restaurants.length} restaurants`)
      }
    }

    if (activities.length > 0) {
      const { error} = await this.supabase
        .from('activities')
        .insert(activities.map(a => ({
          location_id: locationId,
          name: a.name,
          description: a.description,
          category: a.category || 'attraction',
          address: a.address,
          latitude: a.latitude,
          longitude: a.longitude,
          source: 'openstreetmap',
          is_verified: false
        })))

      if (!error) {
        console.log(`✅ Auto-populated ${activities.length} activities`)
      }
    }
  }

  private async fetchRestaurantsFromOSM(lat: number, lng: number): Promise<any[]> {
    try {
      const query = `[out:json][timeout:15];(node["amenity"="restaurant"](around:3000,${lat},${lng});node["amenity"="cafe"](around:3000,${lat},${lng}););out body 30;`
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.elements.filter((el: any) => el.tags?.name).map((el: any) => ({
        name: el.tags.name,
        cuisine: el.tags.cuisine,
        address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : undefined,
        latitude: el.lat,
        longitude: el.lon,
        price_range: '$$'
      }))
    } catch { return [] }
  }

  private async fetchActivitiesFromOSM(lat: number, lng: number): Promise<any[]> {
    try {
      const query = `[out:json][timeout:15];(node["tourism"="attraction"](around:3000,${lat},${lng});node["tourism"="museum"](around:3000,${lat},${lng});node["leisure"="park"](around:3000,${lat},${lng}););out body 30;`
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.elements.filter((el: any) => el.tags?.name).map((el: any) => ({
        name: el.tags.name,
        description: el.tags.description || el.tags.tourism || el.tags.leisure,
        category: el.tags.tourism || el.tags.leisure || 'attraction',
        address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : undefined,
        latitude: el.lat,
        longitude: el.lon
      }))
    } catch { return [] }
  }

  /**
   * Create URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Fetch activities for location from OpenTripMap
   * Free API, requires key but has generous free tier
   */
  async fetchActivities(latitude: number, longitude: number): Promise<any[]> {
    try {
      // OpenTripMap free API (5000 requests/day)
      // You can get a free key at: https://opentripmap.io/product
      const apiKey = process.env.OPENTRIPMAP_API_KEY || '5ae2e3f221c38a28845f05b6c4b0e0e0c4e4e4e4e4e4e4e4e4e4e4e4'
      
      const radius = 5000 // 5km radius
      const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${longitude}&lat=${latitude}&kinds=interesting_places,tourist_facilities&limit=20&apikey=${apiKey}`
      
      const response = await fetch(url)
      const data = await response.json()

      return data.features || []
    } catch (error) {
      console.error('OpenTripMap API error:', error)
      return []
    }
  }

  /**
   * Get location suggestions for autocomplete
   * Combines database + popular cities
   */
  async getLocationSuggestions(query: string): Promise<LocationData[]> {
    if (!query || query.length < 2) return []

    // Search database
    const { data, error } = await this.supabase
      .from('locations')
      .select('slug, name, country, latitude, longitude')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }

    return data || []
  }

  /**
   * AUTOMATED IMAGE VALIDATION & RETRY SYSTEM
   * Ensures every location has images before being saved
   *
   * Features:
   * - Multiple search term strategies
   * - Automatic retry with exponential backoff
   * - Fallback to placeholder if all sources fail
   * - Validation of image URLs
   * - Logging for debugging
   */
  private async fetchImagesWithRetry(geoData: GeoNamesResult): Promise<{
    featuredImage: string | null
    galleryImages: string[]
  }> {
    const maxRetries = 3
    let featuredImage: string | null = null
    let galleryImages: string[] = []

    // Strategy 1: Multiple search terms with priority
    const searchTerms = [
      `${geoData.name} ${geoData.countryName} cityscape`,
      `${geoData.name} ${geoData.countryName} landmark`,
      `${geoData.name} ${geoData.adminName1 || geoData.countryName}`,
      `${geoData.name} aerial view`,
      `${geoData.name} skyline`,
      `${geoData.name} downtown`,
      geoData.name
    ]

    console.log(`🔍 [AUTO-FETCH] Trying ${searchTerms.length} search strategies...`)

    // Try each search term
    for (let i = 0; i < searchTerms.length && !featuredImage; i++) {
      const term = searchTerms[i]
      console.log(`  📸 [${i + 1}/${searchTerms.length}] Trying: "${term}"`)

      for (let retry = 0; retry < maxRetries && !featuredImage; retry++) {
        try {
          featuredImage = await fetchLocationImage(term)

          if (featuredImage) {
            // Validate the image URL
            const isValid = await this.validateImageUrl(featuredImage)
            if (isValid) {
              console.log(`  ✅ [SUCCESS] Found valid image with: "${term}" (attempt ${retry + 1})`)
              break
            } else {
              console.log(`  ⚠️ [INVALID] Image URL failed validation, retrying...`)
              featuredImage = null
            }
          }
        } catch (error) {
          console.error(`  ❌ [ERROR] Attempt ${retry + 1} failed:`, error)
          if (retry < maxRetries - 1) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retry) * 1000
            console.log(`  ⏳ Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
    }

    // Strategy 2: Fetch gallery images automatically with hierarchical fallback
    // This ensures new locations have the same quality as manually updated ones
    console.log(`  🖼️ [GALLERY] Fetching gallery images (target: 20) with hierarchical fallback...`)
    try {
      // Use enhanced service with region/country fallback
      const { fetchLocationGalleryHighQuality } = await import('@/lib/services/enhancedImageService')
      galleryImages = await fetchLocationGalleryHighQuality(
        geoData.name,
        20,
        geoData.adminName1, // Region/state
        geoData.countryName // Country
      )
      console.log(`  ✅ [GALLERY] Fetched ${galleryImages.length} images`)
    } catch (error) {
      console.error(`  ⚠️ [GALLERY] Failed to fetch gallery:`, error)
      galleryImages = []
    }

    // Strategy 3: Fallback to placeholder if all else fails
    if (!featuredImage) {
      console.log(`  ⚠️ [FALLBACK] All image sources failed, using placeholder`)
      featuredImage = this.getPlaceholderImage(geoData.name)
    }

    return { featuredImage, galleryImages }
  }

  /**
   * Validate image URL by checking if it's accessible
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return response.ok && response.headers.get('content-type')?.startsWith('image/')
    } catch (error) {
      console.error(`  ⚠️ Image validation failed for ${url}:`, error)
      return false
    }
  }

  /**
   * Get a high-quality placeholder image
   */
  private getPlaceholderImage(locationName: string): string {
    // Use Lorem Picsum with a seed based on location name for consistency
    const seed = locationName.toLowerCase().replace(/\s+/g, '-')
    return `https://picsum.photos/seed/${seed}/1200/800`
  }
}


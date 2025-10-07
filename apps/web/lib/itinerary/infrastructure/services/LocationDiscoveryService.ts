/**
 * Location Discovery Service
 * Finds locations from internet sources and creates them if needed
 */

import { createClient } from '@supabase/supabase-js'

interface GeoNamesResult {
  geonameId: number
  name: string
  lat: string
  lng: string
  countryName: string
  adminName1?: string
  population: number
}

interface LocationData {
  slug: string
  name: string
  country: string
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

        // Convert Nominatim format to GeoNames format
        return {
          geonameId: parseInt(bestMatch.place_id),
          name: name,
          lat: bestMatch.lat,
          lng: bestMatch.lon,
          countryName: bestMatch.address?.country || 'Unknown',
          adminName1: bestMatch.address?.state || bestMatch.address?.region,
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
    
    const locationData: LocationData = {
      slug,
      name: geoData.name,
      country: geoData.countryName,
      latitude: parseFloat(geoData.lat),
      longitude: parseFloat(geoData.lng),
      description: `${geoData.name} is a city in ${geoData.countryName}${geoData.adminName1 ? `, ${geoData.adminName1}` : ''}.`,
      featured_image: null
    }

    // Insert into database
    const { data, error } = await this.supabase
      .from('locations')
      .insert({
        slug: locationData.slug,
        name: locationData.name,
        country: locationData.country,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        description: locationData.description,
        featured_image: locationData.featured_image,
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

    console.log(`✅ Created location: ${locationData.name} (${locationData.slug})`)
    return locationData
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
}


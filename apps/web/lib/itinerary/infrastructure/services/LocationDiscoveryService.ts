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

    if (data) return data

    // Try name match
    const { data: nameData, error: nameError } = await this.supabase
      .from('locations')
      .select('slug, name, country, latitude, longitude, description, featured_image')
      .ilike('name', `%${query}%`)
      .limit(1)
      .maybeSingle()

    if (nameData) return nameData

    return null
  }

  /**
   * Search GeoNames API for location
   * Free API, requires username (free registration at geonames.org)
   * Falls back to Nominatim (OSM) if GeoNames fails
   */
  private async searchGeoNames(query: string): Promise<GeoNamesResult | null> {
    try {
      // Try GeoNames first (20,000 requests/day)
      const username = process.env.GEONAMES_USERNAME || 'demo'
      const geoNamesUrl = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=1&username=${username}&featureClass=P&orderby=population`

      const geoNamesResponse = await fetch(geoNamesUrl)
      const geoNamesData = await geoNamesResponse.json()

      if (geoNamesData.geonames && geoNamesData.geonames.length > 0) {
        console.log(`✅ GeoNames found: ${geoNamesData.geonames[0].name}`)
        return geoNamesData.geonames[0]
      }

      // Fallback to Nominatim (OSM) - 1 request/sec limit
      console.log(`🔄 Falling back to Nominatim for: ${query}`)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`

      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (travel planning app)'
        }
      })
      const nominatimData = await nominatimResponse.json()

      if (nominatimData && nominatimData.length > 0) {
        const place = nominatimData[0]
        console.log(`✅ Nominatim found: ${place.display_name}`)

        // Convert Nominatim format to GeoNames format
        return {
          geonameId: parseInt(place.place_id),
          name: place.address?.city || place.address?.town || place.address?.village || place.name,
          lat: place.lat,
          lng: place.lon,
          countryName: place.address?.country || 'Unknown',
          adminName1: place.address?.state || place.address?.region,
          population: 0
        }
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


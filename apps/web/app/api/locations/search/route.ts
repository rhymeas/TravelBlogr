import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

// Force dynamic rendering for search routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface LocationSearchResult {
  id?: string
  name: string
  slug?: string
  country: string
  region: string
  latitude: number
  longitude: number
  displayName: string
  source: 'database' | 'geocoding'
  importance?: number
}

/**
 * Enhanced Location Search API
 * Returns disambiguated results with country/region info
 * 
 * GET /api/locations/search?q=sunshine+coast&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    // OPTIMIZATION: Cache search results in Upstash for 7 days
    const searchResults = await getOrSet(
      CacheKeys.locationSearch(query.toLowerCase(), limit),
      async () => {
        console.log(`🔍 Searching locations for: "${query}"`)

        // ONLY return geocoding results for autocomplete
        // Backend will check database when generating trip to avoid duplicates
        const geocodingResults = await searchGeocodingAPI(query, limit)

        // Deduplicate and sort by importance
        const uniqueResults = deduplicateResults(geocodingResults)
        uniqueResults.sort((a, b) => (b.importance || 0) - (a.importance || 0))

        return uniqueResults.slice(0, limit)
      },
      CacheTTL.VERY_LONG // 7 days (search results don't change often)
    )

    console.log(`✅ Location search for "${query}": ${searchResults.length} results (< 10ms from Upstash)`)

    return NextResponse.json({
      success: true,
      data: searchResults,
      count: searchResults.length,
      hasMultiple: searchResults.length > 1
    })

  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search locations'
    }, { status: 500 })
  }
}

/**
 * Search Nominatim geocoding API
 */
async function searchGeocodingAPI(query: string, limit: number): Promise<LocationSearchResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=${limit * 2}` + // Get more to filter
      `&addressdetails=1` +
      `&accept-language=en`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0'
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText)
      return []
    }

    const results = await response.json()

    // Filter and format results
    return results
      .filter((r: any) => {
        // Only show cities, towns, villages, or notable places
        const validTypes = ['city', 'town', 'village', 'municipality', 'county', 'state', 'region', 'administrative']
        return validTypes.includes(r.type) || validTypes.includes(r.class)
      })
      .map((r: any) => ({
        name: r.name || r.display_name.split(',')[0],
        country: r.address?.country || 'Unknown',
        region: r.address?.state || r.address?.region || r.address?.county || '',
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        displayName: r.display_name,
        source: 'geocoding' as const,
        importance: r.importance || 0
      }))
  } catch (error) {
    console.error('Geocoding API error:', error)
    return []
  }
}

/**
 * Remove duplicate locations with ULTRA-STRICT fuzzy matching
 * Handles cases like "Berlin", "Berlin, Berlin", "Berlin, Brandenburg", "Berlin, Germany"
 * Also removes locations that are very close to each other (< 5km)
 *
 * CRITICAL: This prevents duplicate suggestions in autocomplete dropdown
 */
function deduplicateResults(results: LocationSearchResult[]): LocationSearchResult[] {
  const seen = new Map<string, LocationSearchResult>()
  const seenCoordinates: Array<{ lat: number; lng: number; result: LocationSearchResult }> = []

  for (const loc of results) {
    // ULTRA-STRICT normalization: remove ALL variations
    const normalizedName = loc.name
      .toLowerCase()
      .replace(/,.*$/, '') // Remove everything after comma: "Berlin, Germany" → "Berlin"
      .replace(/\s+(city|town|village|municipality|county|state|region|district|province)$/i, '') // Remove administrative suffixes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    const country = loc.country.toLowerCase().trim()

    // CRITICAL FIX: Check if this location is very close to any existing location
    // This prevents duplicates like "Braak, Lower Saxony" and "Braak, Schleswig-Holstein"
    // when they're actually the same small village
    let isDuplicate = false
    for (const existing of seenCoordinates) {
      const distance = calculateDistance(
        existing.lat, existing.lng,
        loc.latitude, loc.longitude
      )

      // If locations are very close (< 1km) and have same name, it's a duplicate
      if (distance < 1 && normalizedName === existing.result.name.toLowerCase().replace(/,.*$/, '').trim()) {
        isDuplicate = true
        // Keep the one with higher importance
        if ((loc.importance || 0) > (existing.result.importance || 0)) {
          // Replace existing with this one
          const existingKey = `${normalizedName}|${existing.result.country.toLowerCase()}`
          seen.set(existingKey, loc)
          existing.lat = loc.latitude
          existing.lng = loc.longitude
          existing.result = loc
        }
        break
      }
    }

    if (isDuplicate) {
      continue // Skip this duplicate
    }

    // Create unique key: normalized name + country
    const key = `${normalizedName}|${country}`

    // Check if we already have this exact location
    const existing = seen.get(key)
    if (existing) {
      // PRIORITY RULES:
      // 1. Database results ALWAYS win over geocoding results
      if (existing.source === 'database') {
        continue // Keep database result, skip geocoding duplicate
      }

      // 2. If both are geocoding results, check proximity
      const distance = calculateDistance(
        existing.latitude, existing.longitude,
        loc.latitude, loc.longitude
      )

      // If locations are very close (< 5km), keep the one with higher importance
      if (distance < 5) {
        if ((loc.importance || 0) > (existing.importance || 0)) {
          seen.set(key, loc) // Replace with higher importance
          // Update coordinates tracking
          const coordIndex = seenCoordinates.findIndex(c => c.result === existing)
          if (coordIndex >= 0) {
            seenCoordinates[coordIndex] = { lat: loc.latitude, lng: loc.longitude, result: loc }
          }
        }
        // Otherwise keep existing
      } else {
        // Different locations with same name in same country (rare but possible)
        // Keep both by creating a unique key with coordinates
        const uniqueKey = `${normalizedName}|${country}|${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`
        seen.set(uniqueKey, loc)
        seenCoordinates.push({ lat: loc.latitude, lng: loc.longitude, result: loc })
      }
    } else {
      seen.set(key, loc)
      seenCoordinates.push({ lat: loc.latitude, lng: loc.longitude, result: loc })
    }
  }

  return Array.from(seen.values())
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}


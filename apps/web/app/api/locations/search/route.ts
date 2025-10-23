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

        // 1. Search database first
        const { data: dbResults, error: dbError } = await supabase
          .from('locations')
          .select('id, name, slug, country, region, latitude, longitude')
          .or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%`)
          .limit(limit)

        const databaseResults: LocationSearchResult[] = (dbResults || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          country: loc.country,
          region: loc.region,
          latitude: loc.latitude,
          longitude: loc.longitude,
          displayName: `${loc.name}, ${loc.region ? loc.region + ', ' : ''}${loc.country}`,
          source: 'database' as const,
          importance: 1.0
        }))

        // 2. If we have enough database results, return them
        if (databaseResults.length >= 3) {
          return databaseResults
        }

        // 3. Otherwise, search geocoding API for more options
        const geocodingResults = await searchGeocodingAPI(query, limit)

        // 4. Combine and deduplicate results
        const allResults = [...databaseResults, ...geocodingResults]
        const uniqueResults = deduplicateResults(allResults)

        // 5. Sort by importance (database results first, then by geocoding importance)
        uniqueResults.sort((a, b) => {
          if (a.source === 'database' && b.source !== 'database') return -1
          if (a.source !== 'database' && b.source === 'database') return 1
          return (b.importance || 0) - (a.importance || 0)
        })

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
 * Remove duplicate locations (same name + country)
 */
function deduplicateResults(results: LocationSearchResult[]): LocationSearchResult[] {
  const seen = new Set<string>()
  return results.filter(loc => {
    const key = `${loc.name.toLowerCase()}-${loc.country.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}


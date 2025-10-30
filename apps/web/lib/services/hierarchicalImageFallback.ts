/**
 * Hierarchical Image Fallback System
 * 
 * Searches for contextual images at different geographic levels:
 * Local → District → County → Regional → National → Continental → Global
 * 
 * This ensures we always get the most contextual images possible before
 * falling back to generic country/continent images.
 * 
 * Smart API usage:
 * - Fetches 1-5 images per level (not 20+)
 * - Stops when we have enough contextual images
 * - Only queries APIs once per level
 * - Caches results to avoid repeated calls
 */

// Import APIs dynamically to avoid circular dependencies
async function fetchBraveImages(
  locationName: string,
  count: number,
  country?: string,
  region?: string
): Promise<string[]> {
  try {
    // 🎯 BRAVE API QUERY STRATEGY
    // This uses simple query concatenation (not optimized strategy)
    // For POI/activity images, use searchActivity() from braveSearchService
    //
    // 📚 See docs/BRAVE_QUERY_FINAL_STRATEGY.md for optimized approach
    const { searchImages } = await import('./braveSearchService')

    // Build context-aware search query
    // TODO: Consider using buildBraveQuery() for better results
    let searchQuery = locationName
    if (region && region !== locationName && !locationName.includes(region)) {
      searchQuery += ` ${region}`
    }
    if (country && country !== locationName && !locationName.includes(country)) {
      searchQuery += ` ${country}`
    }
    searchQuery += ' cityscape travel'

    const results = await searchImages(searchQuery, count)
    return results.map(r => r.thumbnail || r.url).filter(url => url && url.startsWith('http'))
  } catch (error) {
    console.error('Brave API error:', error)
    return []
  }
}

async function fetchRedditImages(
  locationName: string,
  count: number,
  country?: string,
  region?: string
): Promise<string[]> {
  try {
    const { fetchRedditImages: fetchReddit } = await import('./enhancedImageService')
    return await fetchReddit(locationName, count, country, region)
  } catch (error) {
    console.error('Reddit API error:', error)
    return []
  }
}

// Minimum images needed per level before moving up hierarchy
const MIN_IMAGES_PER_LEVEL = 3

// Maximum images to fetch per level (to avoid overwhelming APIs)
const MAX_IMAGES_PER_LEVEL = 5

// Cache for hierarchical searches (avoid repeated API calls)
const hierarchyCache = new Map<string, { images: string[]; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

/**
 * Geographic hierarchy levels
 */
export enum GeographicLevel {
  LOCAL = 'local',           // City/Town/Municipality
  DISTRICT = 'district',     // Neighborhood/Suburb/District
  COUNTY = 'county',         // County/Administrative subdivision
  REGIONAL = 'regional',     // State/Province/Region
  NATIONAL = 'national',     // Country
  CONTINENTAL = 'continental', // Continent
  GLOBAL = 'global'          // Fallback to generic travel images
}

/**
 * Location hierarchy data structure
 */
export interface LocationHierarchy {
  local?: string          // e.g., "Marrakesh"
  district?: string       // e.g., "Marrakesh District"
  county?: string         // e.g., "Marrakesh Prefecture"
  regional?: string       // e.g., "Marrakech-Safi" (region/state/province)
  national?: string       // e.g., "Morocco"
  continental?: string    // e.g., "Africa"
}

/**
 * Result from hierarchical search
 */
export interface HierarchicalImageResult {
  images: string[]
  level: GeographicLevel
  searchTerm: string
  source: 'brave' | 'reddit' | 'fallback'
}

/**
 * Parse location data into hierarchy
 * Handles different country naming conventions
 */
export function parseLocationHierarchy(
  locationName: string,
  region?: string,
  country?: string,
  additionalData?: {
    district?: string
    county?: string
    continent?: string
  }
): LocationHierarchy {
  const hierarchy: LocationHierarchy = {
    local: locationName,
    national: country
  }

  // Add regional level (state/province/region)
  if (region && region !== locationName) {
    hierarchy.regional = region
  }

  // Add district/county if provided
  if (additionalData?.district) {
    hierarchy.district = additionalData.district
  }
  if (additionalData?.county) {
    hierarchy.county = additionalData.county
  }

  // Add continent if provided, otherwise infer from country
  if (additionalData?.continent) {
    hierarchy.continental = additionalData.continent
  } else if (country) {
    hierarchy.continental = inferContinent(country)
  }

  return hierarchy
}

/**
 * Infer continent from country name
 */
function inferContinent(country: string): string {
  const continentMap: Record<string, string> = {
    // Africa
    'Morocco': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa', 'Kenya': 'Africa',
    'Tanzania': 'Africa', 'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Ghana': 'Africa',
    
    // Asia
    'Japan': 'Asia', 'China': 'Asia', 'India': 'Asia', 'Thailand': 'Asia',
    'Vietnam': 'Asia', 'Indonesia': 'Asia', 'Malaysia': 'Asia', 'Singapore': 'Asia',
    'South Korea': 'Asia', 'Philippines': 'Asia', 'Nepal': 'Asia', 'Sri Lanka': 'Asia',
    
    // Europe
    'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
    'United Kingdom': 'Europe', 'Greece': 'Europe', 'Portugal': 'Europe', 'Netherlands': 'Europe',
    'Switzerland': 'Europe', 'Austria': 'Europe', 'Norway': 'Europe', 'Sweden': 'Europe',
    
    // North America
    'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
    
    // South America
    'Brazil': 'South America', 'Argentina': 'South America', 'Peru': 'South America',
    'Chile': 'South America', 'Colombia': 'South America',
    
    // Oceania
    'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania'
  }

  return continentMap[country] || 'World'
}

/**
 * Fetch images at a specific geographic level
 * Uses smart API calls (1-5 images per level)
 */
async function fetchImagesAtLevel(
  searchTerm: string,
  level: GeographicLevel,
  maxImages: number = MAX_IMAGES_PER_LEVEL,
  country?: string,
  region?: string
): Promise<HierarchicalImageResult> {
  // Check cache first
  const cacheKey = `hierarchy:${level}:${searchTerm}`
  const cached = hierarchyCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ [CACHE HIT] ${level}: "${searchTerm}" (${cached.images.length} images)`)
    return {
      images: cached.images,
      level,
      searchTerm,
      source: 'brave' // Assume cached from Brave
    }
  }

  console.log(`🔍 [${level.toUpperCase()}] Searching for: "${searchTerm}" (max ${maxImages} images)`)

  const images: string[] = []
  let source: 'brave' | 'reddit' | 'fallback' = 'fallback'

  // Priority #1: Brave Search API (fantastic quality, limited to maxImages)
  try {
    const braveImages = await fetchBraveImages(searchTerm, maxImages, country, region)
    if (braveImages.length > 0) {
      images.push(...braveImages.slice(0, maxImages))
      source = 'brave'
      console.log(`✅ [BRAVE] Found ${images.length} images at ${level} level`)
    }
  } catch (error) {
    console.error(`❌ [BRAVE] Error at ${level} level:`, error)
  }

  // Priority #2: Reddit ULTRA (if Brave didn't find enough)
  if (images.length < MIN_IMAGES_PER_LEVEL) {
    try {
      const redditImages = await fetchRedditImages(searchTerm, maxImages, country, region)
      if (redditImages.length > 0) {
        images.push(...redditImages.slice(0, maxImages - images.length))
        source = images.length > 0 ? 'brave' : 'reddit' // Mixed or pure Reddit
        console.log(`✅ [REDDIT] Found ${redditImages.length} images at ${level} level`)
      }
    } catch (error) {
      console.error(`❌ [REDDIT] Error at ${level} level:`, error)
    }
  }

  // Cache results
  if (images.length > 0) {
    hierarchyCache.set(cacheKey, { images, timestamp: Date.now() })
  }

  return {
    images,
    level,
    searchTerm,
    source
  }
}

/**
 * Fetch images with hierarchical fallback
 * Searches from most specific (local) to least specific (global)
 * 
 * Strategy:
 * 1. Try local level (city) - fetch 1-5 images
 * 2. If < 3 images, try district level - fetch 1-5 more
 * 3. If < 3 images, try county level - fetch 1-5 more
 * 4. If < 3 images, try regional level - fetch 1-5 more
 * 5. If < 3 images, try national level - fetch 1-5 more
 * 6. If < 3 images, try continental level - fetch 1-5 more
 * 7. If still < 3 images, use global fallback
 * 
 * This ensures we get the most contextual images without overwhelming APIs
 */
export async function fetchImagesWithHierarchicalFallback(
  hierarchy: LocationHierarchy,
  targetCount: number = 20
): Promise<HierarchicalImageResult[]> {
  console.log(`\n🌍 HIERARCHICAL IMAGE FALLBACK`)
  console.log(`   Target: ${targetCount} images`)
  console.log(`   Hierarchy:`, hierarchy)

  const results: HierarchicalImageResult[] = []
  let totalImages = 0

  // Define search order (most specific → least specific)
  const searchLevels: Array<{ level: GeographicLevel; term?: string }> = [
    { level: GeographicLevel.LOCAL, term: hierarchy.local },
    { level: GeographicLevel.DISTRICT, term: hierarchy.district },
    { level: GeographicLevel.COUNTY, term: hierarchy.county },
    { level: GeographicLevel.REGIONAL, term: hierarchy.regional },
    { level: GeographicLevel.NATIONAL, term: hierarchy.national },
    { level: GeographicLevel.CONTINENTAL, term: hierarchy.continental }
  ]

  // Search each level until we have enough images
  for (const { level, term } of searchLevels) {
    if (!term) continue // Skip if level not provided
    if (totalImages >= targetCount) break // Stop if we have enough

    // Fetch 1-5 images at this level with country/region context
    const result = await fetchImagesAtLevel(
      term,
      level,
      MAX_IMAGES_PER_LEVEL,
      hierarchy.national, // Pass country for disambiguation
      hierarchy.regional  // Pass region for additional context
    )

    if (result.images.length > 0) {
      results.push(result)
      totalImages += result.images.length
      console.log(`✅ [${level.toUpperCase()}] Added ${result.images.length} images (total: ${totalImages})`)
    } else {
      console.log(`⚠️ [${level.toUpperCase()}] No images found, moving up hierarchy...`)
    }

    // If we have at least MIN_IMAGES_PER_LEVEL, we can stop
    // (unless we're still far from target)
    if (totalImages >= MIN_IMAGES_PER_LEVEL && totalImages >= targetCount * 0.5) {
      console.log(`✅ Found ${totalImages} contextual images, stopping hierarchy search`)
      break
    }
  }

  // If still not enough images, add global fallback
  if (totalImages < MIN_IMAGES_PER_LEVEL) {
    console.log(`⚠️ Only ${totalImages} images found, adding global fallback...`)
    const globalResult = await fetchImagesAtLevel('travel destination landscape', GeographicLevel.GLOBAL, 5)
    if (globalResult.images.length > 0) {
      results.push(globalResult)
      totalImages += globalResult.images.length
    }
  }

  console.log(`\n📊 HIERARCHICAL SEARCH COMPLETE`)
  console.log(`   Total images: ${totalImages}`)
  console.log(`   Levels used: ${results.map(r => r.level).join(' → ')}`)

  return results
}

/**
 * Flatten hierarchical results into a single array
 * Prioritizes images from more specific levels
 */
export function flattenHierarchicalResults(
  results: HierarchicalImageResult[],
  maxImages: number = 20
): string[] {
  const allImages: string[] = []

  // Add images from most specific to least specific
  for (const result of results) {
    allImages.push(...result.images)
    if (allImages.length >= maxImages) break
  }

  // Remove duplicates and limit to maxImages
  const uniqueImages = Array.from(new Set(allImages))
  return uniqueImages.slice(0, maxImages)
}


/**
 * Country Metadata Service
 * Provides continent, region, and subregion data for countries
 * Uses restcountries.com API (free, no auth required)
 */

interface CountryMetadata {
  name: string
  continent: string
  region: string
  subregion: string
  alpha2Code: string
  alpha3Code: string
}

// In-memory cache to avoid repeated API calls
const metadataCache = new Map<string, CountryMetadata>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const cacheExpiry = new Map<string, number>()

/**
 * Get country metadata including continent, region, and subregion
 * @param countryName - Country name (e.g., "Timor-Leste", "United States")
 * @returns Country metadata or null if not found
 */
export async function getCountryMetadata(countryName: string): Promise<CountryMetadata | null> {
  try {
    // Check cache first
    const cacheKey = countryName.toLowerCase()
    const cached = metadataCache.get(cacheKey)
    const expiry = cacheExpiry.get(cacheKey)
    
    if (cached && expiry && Date.now() < expiry) {
      console.log(`📦 Country metadata cache hit: ${countryName}`)
      return cached
    }

    // Fetch from restcountries.com API
    console.log(`🌍 Fetching country metadata for: ${countryName}`)
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=false`,
      { next: { revalidate: 604800 } } // Cache for 7 days
    )

    if (!response.ok) {
      console.log(`⚠️ Country not found in restcountries API: ${countryName}`)
      return null
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      return null
    }

    // Take the first match (usually the most relevant)
    const country = data[0]

    const metadata: CountryMetadata = {
      name: country.name.common,
      continent: country.continents?.[0] || 'Unknown',
      region: country.region || 'Unknown',
      subregion: country.subregion || country.region || 'Unknown',
      alpha2Code: country.cca2,
      alpha3Code: country.cca3
    }

    // Cache the result
    metadataCache.set(cacheKey, metadata)
    cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL)

    console.log(`✅ Country metadata fetched:`, {
      country: metadata.name,
      continent: metadata.continent,
      region: metadata.region,
      subregion: metadata.subregion
    })

    return metadata
  } catch (error) {
    console.error(`❌ Error fetching country metadata for ${countryName}:`, error)
    return null
  }
}

/**
 * Get a smart region fallback for countries without administrative divisions
 * Returns subregion (e.g., "South-Eastern Asia") instead of "Unknown Region"
 * 
 * @param countryName - Country name
 * @returns Subregion or null
 */
export async function getRegionFallback(countryName: string): Promise<string | null> {
  const metadata = await getCountryMetadata(countryName)
  
  if (!metadata) {
    return null
  }

  // For small countries without regions, use subregion
  // Examples:
  // - Timor-Leste → "South-Eastern Asia"
  // - Singapore → "South-Eastern Asia"
  // - Monaco → "Western Europe"
  // - Vatican City → "Southern Europe"
  
  return metadata.subregion !== 'Unknown' ? metadata.subregion : metadata.region
}

/**
 * Check if a country typically has administrative divisions (states/provinces)
 * Small countries and city-states usually don't have regions
 */
export async function hasAdministrativeDivisions(countryName: string): Promise<boolean> {
  // Countries that typically don't have administrative divisions
  const noRegionCountries = [
    'singapore',
    'monaco',
    'vatican city',
    'san marino',
    'liechtenstein',
    'andorra',
    'malta',
    'barbados',
    'grenada',
    'saint lucia',
    'antigua and barbuda',
    'seychelles',
    'maldives',
    'bahrain',
    'nauru',
    'tuvalu',
    'palau',
    'marshall islands',
    'micronesia'
  ]

  return !noRegionCountries.includes(countryName.toLowerCase())
}


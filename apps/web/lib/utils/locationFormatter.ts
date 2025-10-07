/**
 * Utility functions for formatting location names
 */

export interface FormattedLocation {
  short: string
  region?: string
  country?: string
}

/**
 * Shorten long location names for better UI display
 * Examples:
 * - "Regional District of Central Okanagan" → "Central Okanagan"
 * - "Squamish-Lillooet Regional District" → "Squamish-Lillooet"
 * - "Sunshine Coast Regional District" → "Sunshine Coast"
 */
export function formatLocationName(name: string): FormattedLocation {
  let short = name
  let region: string | undefined
  let country: string | undefined

  // Remove "Regional District of" prefix
  if (name.includes('Regional District of')) {
    short = name.replace('Regional District of ', '')
  }
  
  // Remove "Regional District" suffix
  if (name.endsWith('Regional District')) {
    short = name.replace(' Regional District', '')
  }

  // Extract country and region from comma-separated format
  // e.g., "Kelowna, British Columbia, Canada"
  const parts = name.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    short = parts[0]
    region = parts[1]
    if (parts.length >= 3) {
      country = parts[2]
    }
  }

  return { short, region, country }
}

/**
 * Format location with region/country in gray
 * Returns JSX-ready object
 */
export function formatLocationDisplay(name: string): {
  main: string
  secondary?: string
} {
  const formatted = formatLocationName(name)
  
  let secondary: string | undefined
  if (formatted.region || formatted.country) {
    const parts = []
    if (formatted.region) parts.push(formatted.region)
    if (formatted.country) parts.push(formatted.country)
    secondary = parts.join(', ')
  }

  return {
    main: formatted.short,
    secondary
  }
}


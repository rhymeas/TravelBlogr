/**
 * Utility functions for formatting location names
 * Includes automatic translation support for non-Latin scripts
 */

import { hasNonLatinCharacters } from '@/lib/services/translationService'

export interface FormattedLocation {
  short: string
  region?: string
  country?: string
  needsTranslation?: boolean
  originalShort?: string
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
  let needsTranslation = false
  let originalShort: string | undefined

  // Check if the name contains non-Latin characters
  needsTranslation = hasNonLatinCharacters(name)

  // If name contains translation in format "English (Original)", extract both
  const translationMatch = name.match(/^(.+?)\s*\((.+?)\)$/)
  if (translationMatch) {
    short = translationMatch[1].trim() // English translation
    originalShort = translationMatch[2].trim() // Original script
    needsTranslation = true
  }

  // Remove "Regional District of" prefix
  if (short.includes('Regional District of')) {
    short = short.replace('Regional District of ', '')
  }

  // Remove "Regional District" suffix
  if (short.endsWith('Regional District')) {
    short = short.replace(' Regional District', '')
  }

  // Extract country and region from comma-separated format
  // e.g., "Kelowna, British Columbia, Canada"
  const rawParts = short.split(',').map(p => p.trim())
  // Remove postal codes and numeric-only segments like "24553"
  const parts = rawParts.filter(p => p && !/^\d+$/.test(p) && !/[0-9]/.test(p))
  if (parts.length >= 2) {
    short = parts[0]
    region = parts[1]
    if (parts.length >= 3) {
      country = parts[2]
    }
  }

  return { short, region, country, needsTranslation, originalShort }
}

/**
 * Format location with region/country in gray
 * Returns JSX-ready object with translation support
 */
export function formatLocationDisplay(name: string): {
  main: string
  secondary?: string
  needsTranslation?: boolean
  originalName?: string
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
    secondary,
    needsTranslation: formatted.needsTranslation,
    originalName: formatted.originalShort
  }
}

/**
 * Format region and country for display
 * Handles null/undefined region gracefully
 *
 * @example
 * formatRegionCountry('Liaoning', 'China') // "Liaoning, China"
 * formatRegionCountry(null, 'South Korea') // "South Korea"
 * formatRegionCountry('', 'Japan') // "Japan"
 */
export function formatRegionCountry(
  region: string | null | undefined,
  country: string
): string {
  if (!region || region.trim() === '') {
    return country
  }
  return `${region}, ${country}`
}

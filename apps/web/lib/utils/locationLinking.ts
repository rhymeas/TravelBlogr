/**
 * Location Linking Utility
 * 
 * Automatically detects location names in text and creates links to location detail pages
 * Used in blog posts to link mentioned locations to their detail pages
 */

/**
 * Convert location name to URL slug
 * Example: "Tokyo, Japan" → "tokyo-japan"
 */
import { nameToCanonicalSlug } from '@/lib/utils/locationSlug'

export function locationToSlug(locationName: string): string {
  return nameToCanonicalSlug(locationName)
}

/**
 * Check if a location exists in the database
 * Returns the location slug if found, null otherwise
 */
export async function findLocationSlug(locationName: string): Promise<string | null> {
  try {
    // Try exact match first
    const exactSlug = locationToSlug(locationName)
    
    // In a real implementation, query the database
    // For now, return the generated slug
    // TODO: Add database lookup
    
    return exactSlug
  } catch (error) {
    console.error('Error finding location slug:', error)
    return null
  }
}

/**
 * Detect location names in text and wrap them in links
 * 
 * @param text - Text to process
 * @param knownLocations - Array of known location names to link
 * @returns Text with location names wrapped in link markup
 */
export function linkLocationsInText(
  text: string,
  knownLocations: string[]
): string {
  if (!text || knownLocations.length === 0) return text

  let linkedText = text

  // Sort locations by length (longest first) to avoid partial matches
  const sortedLocations = [...knownLocations].sort((a, b) => b.length - a.length)

  for (const location of sortedLocations) {
    const slug = locationToSlug(location)
    const regex = new RegExp(`\\b${location}\\b`, 'gi')
    
    // Replace with link markup (will be rendered as Link component)
    linkedText = linkedText.replace(
      regex,
      `[${location}](/locations/${slug})`
    )
  }

  return linkedText
}

/**
 * Extract location names from blog post content
 * Returns array of unique location names mentioned in the post
 */
export function extractLocationsFromContent(content: any): string[] {
  const locations = new Set<string>()

  // Extract from destination
  if (content.destination) {
    locations.add(content.destination)
  }

  // Extract from days
  if (content.days) {
    content.days.forEach((day: any) => {
      if (day.location?.name) {
        locations.add(day.location.name)
      }
      if (day.title) {
        // Try to extract location from title
        // Example: "Exploring Tokyo" → "Tokyo"
        const titleWords = day.title.split(' ')
        titleWords.forEach((word: string) => {
          if (word.length > 3 && /^[A-Z]/.test(word)) {
            locations.add(word)
          }
        })
      }
    })
  }

  // Extract from POIs
  if (content.days) {
    content.days.forEach((day: any) => {
      if (day.location?.pois) {
        day.location.pois.forEach((poi: any) => {
          if (poi.name) {
            locations.add(poi.name)
          }
        })
      }
    })
  }

  return Array.from(locations)
}

/**
 * Auto-link locations in blog post content
 * Processes all text fields and adds location links
 */
export function autoLinkLocations(content: any): any {
  const knownLocations = extractLocationsFromContent(content)

  return {
    ...content,
    introduction: content.introduction
      ? linkLocationsInText(content.introduction, knownLocations)
      : content.introduction,
    days: content.days?.map((day: any) => ({
      ...day,
      description: day.description
        ? linkLocationsInText(day.description, knownLocations)
        : day.description,
      tips: day.tips
        ? linkLocationsInText(day.tips, knownLocations)
        : day.tips
    }))
  }
}


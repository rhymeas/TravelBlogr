/**
 * Wikipedia API Client
 * 100% FREE - Unlimited requests
 * 
 * Gets location descriptions and facts
 */

interface WikipediaSummary {
  title: string
  extract: string
  description: string
  thumbnail?: {
    source: string
    width: number
    height: number
  }
  content_urls: {
    desktop: {
      page: string
    }
  }
}

/**
 * Fetch location description from Wikipedia
 */
export async function fetchLocationDescriptionFromWikipedia(
  locationName: string
): Promise<{ description: string; facts: string[]; image?: string } | null> {
  try {
    // Clean location name for Wikipedia search
    const searchTerm = locationName.replace(/\s+/g, '_')
    
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )

    if (!response.ok) {
      console.warn(`Wikipedia page not found for: ${locationName}`)
      return null
    }

    const data: WikipediaSummary = await response.json()

    // Extract key facts from the description
    const facts = extractFacts(data.extract)

    return {
      description: data.extract,
      facts,
      image: data.thumbnail?.source
    }
  } catch (error) {
    console.error('Error fetching from Wikipedia:', error)
    return null
  }
}

/**
 * Extract interesting facts from Wikipedia text
 */
function extractFacts(text: string): string[] {
  const sentences = text.split(/\.\s+/)
  const facts: string[] = []

  // Look for sentences with interesting keywords
  const keywords = [
    'known for',
    'famous for',
    'established',
    'founded',
    'located',
    'population',
    'area',
    'elevation',
    'climate',
    'UNESCO',
    'national park',
    'world heritage'
  ]

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    if (keywords.some(keyword => lowerSentence.includes(keyword))) {
      facts.push(sentence.trim() + '.')
    }
  }

  return facts.slice(0, 5) // Return top 5 facts
}

/**
 * Search Wikipedia for location
 */
export async function searchWikipedia(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`
    )

    if (!response.ok) {
      throw new Error(`Wikipedia search error: ${response.statusText}`)
    }

    const data = await response.json()
    return data[1] || [] // Returns array of page titles
  } catch (error) {
    console.error('Error searching Wikipedia:', error)
    return []
  }
}


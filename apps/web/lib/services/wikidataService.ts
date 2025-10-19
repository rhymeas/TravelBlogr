/**
 * Wikidata SPARQL Service
 * Free, no rate limits
 */

import type { ComprehensivePOI } from './comprehensivePOIService'

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql'

export async function getWikidataPOIs(
  lat: number,
  lon: number,
  radius: number = 5000
): Promise<ComprehensivePOI[]> {
  try {
    const radiusKm = radius / 1000
    
    const query = `
      SELECT DISTINCT ?place ?placeLabel ?coord ?instanceLabel ?image ?article WHERE {
        SERVICE wikibase:around {
          ?place wdt:P625 ?coord.
          bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral.
          bd:serviceParam wikibase:radius "${radiusKm}".
        }
        ?place wdt:P31 ?instance.
        OPTIONAL { ?place wdt:P18 ?image. }
        OPTIONAL {
          ?article schema:about ?place.
          ?article schema:isPartOf <https://en.wikipedia.org/>.
        }
        FILTER(?instance IN (
          wd:Q570116,  # tourist attraction
          wd:Q33506,   # museum
          wd:Q23413,   # castle
          wd:Q16970,   # church
          wd:Q44539,   # temple
          wd:Q811979,  # architectural structure
          wd:Q41176,   # building
          wd:Q4989906, # monument
          wd:Q22698,   # park
          wd:Q35127,   # website
          wd:Q174782   # square
        ))
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 50
    `

    const response = await fetch(WIKIDATA_SPARQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'TravelBlogr/1.0'
      },
      body: `query=${encodeURIComponent(query)}`
    })

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`)
    }

    const data = await response.json()
    
    return (data.results?.bindings || []).map((item: any) => {
      const coordStr = item.coord?.value || ''
      const coordMatch = coordStr.match(/Point\(([^ ]+) ([^ ]+)\)/)
      const itemLon = coordMatch ? parseFloat(coordMatch[1]) : lon
      const itemLat = coordMatch ? parseFloat(coordMatch[2]) : lat

      return {
        id: `wikidata_${item.place?.value?.split('/').pop()}`,
        name: item.placeLabel?.value || 'Unknown',
        category: mapWikidataCategory(item.instanceLabel?.value),
        lat: itemLat,
        lon: itemLon,
        description: item.instanceLabel?.value || '',
        address: '',
        source: 'wikidata',
        relevanceScore: 65,
        metadata: {
          wikidataId: item.place?.value,
          image: item.image?.value,
          wikipedia: item.article?.value,
          type: item.instanceLabel?.value
        }
      }
    })
  } catch (error) {
    console.error('Wikidata API error:', error)
    return []
  }
}

function mapWikidataCategory(type?: string): string {
  if (!type) return 'other'
  
  const lower = type.toLowerCase()
  
  if (lower.includes('museum')) return 'museum'
  if (lower.includes('castle') || lower.includes('palace')) return 'monument'
  if (lower.includes('church') || lower.includes('temple') || lower.includes('cathedral')) return 'religion'
  if (lower.includes('park') || lower.includes('garden')) return 'nature'
  if (lower.includes('monument') || lower.includes('memorial')) return 'monument'
  if (lower.includes('building') || lower.includes('structure')) return 'architecture'
  if (lower.includes('square') || lower.includes('plaza')) return 'viewpoint'
  if (lower.includes('attraction')) return 'attraction'
  
  return 'other'
}


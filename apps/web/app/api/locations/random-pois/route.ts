import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { searchActivity } from '@/lib/services/braveSearchService'

const GROQ_API_KEY = process.env.GROQ_API_KEY!

interface POI {
  title: string
  description: string
  tags: string[]
  image: string
  link: string
  category: 'attraction' | 'restaurant' | 'activity' | 'cultural' | 'nature'
}

/**
 * GET /api/locations/random-pois
 * 
 * Fetch 3 random POIs for a location with:
 * - Title
 * - Short description
 * - Tags (what it's about)
 * - Image (from Brave API)
 * - Link (official website or info page)
 * 
 * Query params:
 * - location: Location name (e.g., "Tokyo, Japan")
 * - count: Number of POIs (default: 3)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const count = parseInt(searchParams.get('count') || '3')

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location parameter required' },
        { status: 400 }
      )
    }

    console.log(`🎯 Fetching ${count} random POIs for: ${location}`)

    // Step 1: Use GROQ to generate POI suggestions
    const pois = await generatePOIsWithGROQ(location, count)

    // Step 2: Enrich each POI with image and link using smart Brave service
    const enrichedPOIs = await Promise.all(
      pois.map(async (poi) => {
        try {
          // Use searchActivity which has smart query strategy for both images AND links
          const { images, links } = await searchActivity(poi.title, location)

          return {
            ...poi,
            // CRITICAL: Use thumbnail (Brave CDN URL) first
            image: images[0]?.thumbnail || images[0]?.url || '',
            // Use first link (already prioritized by smart strategy)
            link: links[0]?.url || ''
          }
        } catch (error) {
          console.error(`Failed to enrich POI "${poi.title}":`, error)
          return {
            ...poi,
            image: '',
            link: ''
          }
        }
      })
    )

    console.log(`✅ Successfully enriched ${enrichedPOIs.length} POIs`)

    return NextResponse.json({
      success: true,
      location,
      count: enrichedPOIs.length,
      pois: enrichedPOIs
    })

  } catch (error) {
    console.error('❌ Random POIs error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch POIs' 
      },
      { status: 500 }
    )
  }
}

/**
 * Generate POI suggestions using GROQ AI
 */
async function generatePOIsWithGROQ(location: string, count: number): Promise<POI[]> {
  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY })

    const prompt = `You are a travel expert. Generate ${count} diverse, interesting points of interest (POIs) for ${location}.

REQUIREMENTS:
1. Mix different categories: attractions, restaurants, activities, cultural sites, nature spots
2. Include both famous landmarks AND hidden gems
3. Provide accurate, real places that exist
4. Keep descriptions SHORT (1-2 sentences max)
5. Add relevant tags (3-5 tags per POI)

Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "title": "Exact name of the place",
    "description": "Short 1-2 sentence description",
    "tags": ["tag1", "tag2", "tag3"],
    "category": "attraction" | "restaurant" | "activity" | "cultural" | "nature"
  }
]

EXAMPLE for Tokyo, Japan:
[
  {
    "title": "Senso-ji Temple",
    "description": "Tokyo's oldest Buddhist temple with iconic Thunder Gate and bustling Nakamise shopping street.",
    "tags": ["temple", "historic", "cultural", "shopping", "photography"],
    "category": "cultural"
  },
  {
    "title": "Tsukiji Outer Market",
    "description": "Famous seafood market offering fresh sushi, street food, and authentic Japanese culinary experiences.",
    "tags": ["food", "market", "seafood", "sushi", "local"],
    "category": "restaurant"
  },
  {
    "title": "TeamLab Borderless",
    "description": "Immersive digital art museum with interactive installations and stunning light displays.",
    "tags": ["art", "museum", "interactive", "modern", "instagram"],
    "category": "attraction"
  }
]

Now generate ${count} POIs for ${location}:`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8, // Higher temperature for more variety
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from GROQ')
    }

    // Parse response - handle both array and object with array
    let parsed: any
    try {
      parsed = JSON.parse(response)
    } catch (e) {
      // Try to extract JSON array from markdown
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse GROQ response')
      }
    }

    // Handle both direct array and object with pois/results key
    const poisArray = Array.isArray(parsed) 
      ? parsed 
      : parsed.pois || parsed.results || parsed.data || []

    console.log(`✅ GROQ generated ${poisArray.length} POIs`)
    return poisArray.slice(0, count)

  } catch (error) {
    console.error('GROQ POI generation error:', error)
    // Fallback to empty array
    return []
  }
}




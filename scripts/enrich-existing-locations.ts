/**
 * Script to enrich existing locations with:
 * - AI-generated descriptions
 * - Auto-populated activities from OpenStreetMap
 * - Auto-populated restaurants from OpenStreetMap
 * - Translated activity and restaurant names
 */

import { createClient } from '@supabase/supabase-js'
import { translateLocationName, getDisplayName, hasNonLatinCharacters } from '../apps/web/lib/services/translationService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const groqApiKey = process.env.GROQ_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Generate AI description for a location
 */
async function generateLocationDescription(
  locationName: string,
  country: string,
  region: string | null
): Promise<string | null> {
  try {
    if (!groqApiKey) {
      console.log('⚠️ GROQ_API_KEY not found')
      return null
    }

    const locationContext = region 
      ? `${locationName}, ${region}, ${country}`
      : `${locationName}, ${country}`

    const prompt = `Write a compelling 2-3 sentence description for ${locationContext}. Focus on what makes this place special, its main attractions, culture, or unique characteristics. Keep it informative and engaging for travelers. Write in English only.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch (error) {
    console.error('Error generating description:', error)
    return null
  }
}

/**
 * Fetch restaurants from OpenStreetMap
 */
async function fetchRestaurants(lat: number, lng: number): Promise<any[]> {
  try {
    const query = `[out:json][timeout:15];(node["amenity"="restaurant"](around:3000,${lat},${lng});node["amenity"="cafe"](around:3000,${lat},${lng}););out body 30;`
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.elements.filter((el: any) => el.tags?.name).map((el: any) => ({
      name: el.tags.name,
      cuisine: el.tags.cuisine,
      address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : undefined,
      latitude: el.lat,
      longitude: el.lon
    }))
  } catch {
    return []
  }
}

/**
 * Fetch activities from OpenStreetMap
 */
async function fetchActivities(lat: number, lng: number): Promise<any[]> {
  try {
    const query = `[out:json][timeout:15];(node["tourism"="attraction"](around:3000,${lat},${lng});node["tourism"="museum"](around:3000,${lat},${lng});node["leisure"="park"](around:3000,${lat},${lng}););out body 30;`
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.elements.filter((el: any) => el.tags?.name).map((el: any) => ({
      name: el.tags.name,
      description: el.tags.description,
      category: el.tags.tourism || el.tags.leisure || 'attraction',
      address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : undefined,
      latitude: el.lat,
      longitude: el.lon
    }))
  } catch {
    return []
  }
}

async function enrichLocations() {
  console.log('🌟 Starting location enrichment...\n')

  // Get locations that need enrichment
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, region, latitude, longitude, description')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let enrichedCount = 0
  let skippedCount = 0

  for (const location of locations) {
    console.log(`\n🔍 Processing: ${location.name}`)

    let needsUpdate = false
    const updates: any = {}

    // 1. Generate AI description if needed
    const hasBasicDescription = location.description?.includes('is a city in')
    if (!location.description || hasBasicDescription) {
      console.log(`   📝 Generating AI description...`)
      const aiDescription = await generateLocationDescription(
        location.name,
        location.country,
        location.region
      )
      
      if (aiDescription) {
        console.log(`      ✅ ${aiDescription.substring(0, 80)}...`)
        updates.description = aiDescription
        needsUpdate = true
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 2. Check if location has activities
    const { data: existingActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('location_id', location.id)
      .limit(1)

    if (!existingActivities || existingActivities.length === 0) {
      console.log(`   🎯 Fetching activities from OpenStreetMap...`)
      const activities = await fetchActivities(location.latitude, location.longitude)
      
      if (activities.length > 0) {
        // Translate activity names
        const translatedActivities = await Promise.all(
          activities.slice(0, 10).map(async (a) => {
            const nameTranslation = await translateLocationName(a.name)
            const translatedName = getDisplayName(nameTranslation.original, nameTranslation.translated)
            
            return {
              location_id: location.id,
              name: translatedName,
              description: a.description,
              category: a.category,
              address: a.address,
              latitude: a.latitude,
              longitude: a.longitude,
              source: 'openstreetmap',
              is_verified: false
            }
          })
        )

        const { error: actError } = await supabase
          .from('activities')
          .insert(translatedActivities)

        if (!actError) {
          console.log(`      ✅ Added ${translatedActivities.length} activities`)
          needsUpdate = true
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 3. Check if location has restaurants
    const { data: existingRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .eq('location_id', location.id)
      .limit(1)

    if (!existingRestaurants || existingRestaurants.length === 0) {
      console.log(`   🍽️ Fetching restaurants from OpenStreetMap...`)
      const restaurants = await fetchRestaurants(location.latitude, location.longitude)
      
      if (restaurants.length > 0) {
        // Translate restaurant names
        const translatedRestaurants = await Promise.all(
          restaurants.slice(0, 10).map(async (r) => {
            const nameTranslation = await translateLocationName(r.name)
            const translatedName = getDisplayName(nameTranslation.original, nameTranslation.translated)
            
            return {
              location_id: location.id,
              name: translatedName,
              cuisine_type: r.cuisine || 'International',
              price_range: '$$',
              address: r.address,
              latitude: r.latitude,
              longitude: r.longitude,
              source: 'openstreetmap',
              is_verified: false
            }
          })
        )

        const { error: restError } = await supabase
          .from('restaurants')
          .insert(translatedRestaurants)

        if (!restError) {
          console.log(`      ✅ Added ${translatedRestaurants.length} restaurants`)
          needsUpdate = true
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 4. Update location if needed
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', location.id)

      if (updateError) {
        console.error(`   ❌ Error updating:`, updateError.message)
      } else {
        console.log(`   💾 Updated location`)
      }
    }

    if (needsUpdate) {
      enrichedCount++
    } else {
      console.log(`   ⏭️  Already enriched`)
      skippedCount++
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Enriched: ${enrichedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   📍 Total: ${locations.length}`)
}

// Run the script
enrichLocations()
  .then(() => {
    console.log('\n✅ Enrichment complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })


import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})
import { createServerSupabase } from '@/lib/supabase-server'


export async function POST(request: NextRequest) {
  try {
    const { location, tripType, transportMode, previousLocation, nextLocation } = await request.json()

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log('📍 Generating day data for:', location)
    console.log('   Trip type:', tripType)
    console.log('   Transport:', transportMode)
    console.log('   Previous location:', previousLocation)
    console.log('   Next location:', nextLocation)

    // Use GROQ to generate comprehensive day data
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a travel planning expert. Generate a complete day itinerary for a location with:
- Location coordinates (latitude, longitude)
- 4-6 activities/stops with times, descriptions, and types (activity, food, culture, nature, shopping)
- 2-3 highlights (must-see attractions)
- Accommodation suggestion
- 2-3 travel tips
- Location emoji
- Hero image description

Return ONLY valid JSON in this exact format:
{
  "location": "Location Name",
  "locationMetadata": {
    "latitude": 0.0,
    "longitude": 0.0
  },
  "emoji": "🏛️",
  "stops": [
    {
      "time": "09:00",
      "title": "Activity name",
      "description": "Brief description",
      "type": "activity"
    }
  ],
  "highlights": ["Highlight 1", "Highlight 2"],
  "accommodation": {
    "name": "Hotel name",
    "type": "hotel",
    "priceRange": "$$"
  },
  "travelTips": ["Tip 1", "Tip 2"],
  "gallery": []
}`
        },
        {
          role: 'user',
          content: `Generate a complete day itinerary for ${location}.
Trip type: ${tripType}
Transport mode: ${transportMode}
${previousLocation ? `Coming from: ${previousLocation}` : ''}
${nextLocation ? `Going to: ${nextLocation}` : ''}

Include realistic coordinates, diverse activities, and practical tips.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    console.log('🤖 GROQ response:', responseText.substring(0, 200) + '...')

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in GROQ response')
      return NextResponse.json(
        { success: false, error: 'Failed to generate valid day data' },
        { status: 500 }
      )
    }

    let dayData
    try {
      dayData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse day data' },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!dayData.location || !dayData.locationMetadata?.latitude || !dayData.locationMetadata?.longitude) {
      console.error('❌ Missing required fields in day data')
      return NextResponse.json(
        { success: false, error: 'Incomplete day data generated' },
        { status: 500 }
      )
    }

    console.log('✅ Day data generated successfully for:', dayData.location)

    // Enrich: fetch gallery images for the location (Brave + Reddit ULTRA stack)
    let gallery: string[] = []
    try {
      const { fetchLocationGalleryHighQuality } = await import('@/lib/services/enhancedImageService')
      gallery = await fetchLocationGalleryHighQuality(dayData.location, 12)
    } catch (e) {
      console.warn('⚠️ Failed to fetch gallery images for new day:', e)
      gallery = []
    }

    // Map stops -> items (ResultsView expects day.items)
    const baseItems = Array.isArray(dayData.stops) ? dayData.stops : []
    const items = baseItems.map((s: any) => ({
      time: s.time || '10:00',
      title: s.title,
      type: s.type === 'meal' ? 'meal' : (s.type === 'travel' ? 'travel' : 'activity'),
      duration: s.duration
    }))

    // Enrich each item with a 16:9 image (Brave Activity) and cache in DB for reuse
    try {
      const { fetchActivityImage } = await import('@/lib/services/braveActivityService')
      const supabase = await createServerSupabase()

      await Promise.all(
        items.map(async (it: any) => {
          const img = await fetchActivityImage(it.title, dayData.location).catch(() => null)
          if (img) {
            it.image = img
            // Cache in poi_images for reuse across users
            try {
              await supabase
                .from('poi_images')
                .upsert({
                  poi_name: it.title,
                  location: dayData.location,
                  category: it.type,
                  image_url: img,
                  source: 'brave'
                }, { onConflict: 'poi_name,location' })
            } catch (cacheErr) {
              console.warn('Non-critical: failed to cache POI image', cacheErr)
            }
          }
        })
      )
    } catch (e) {
      console.warn('⚠️ Failed to fetch activity images for new day:', e)
    }

    // Attach images to location metadata
    dayData.locationMetadata = dayData.locationMetadata || {}
    dayData.locationMetadata.images = {
      featured: gallery[0] || null,
      gallery
    }

    // Normalize structure for client
    dayData.items = items

    return NextResponse.json({
      success: true,
      day: dayData
    })
  } catch (error) {
    console.error('❌ Error generating day data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { success: false, error: `Failed to generate day data: ${errorMessage}` },
      { status: 500 }
    )
  }
}


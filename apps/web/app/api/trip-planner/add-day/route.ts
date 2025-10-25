import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

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


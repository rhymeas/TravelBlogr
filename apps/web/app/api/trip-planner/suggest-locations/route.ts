import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// Transport mode daily distance ranges (in km)
const TRANSPORT_RANGES = {
  bike: { min: 40, max: 100, optimal: 60 },
  foot: { min: 15, max: 30, optimal: 20 },
  car: { min: 150, max: 400, optimal: 250 },
  train: { min: 200, max: 600, optimal: 350 },
  bus: { min: 100, max: 300, optimal: 180 },
  flight: { min: 500, max: 3000, optimal: 1000 },
  mixed: { min: 100, max: 400, optimal: 200 }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      previousLocation, 
      previousCoords, 
      nextLocation, 
      nextCoords, 
      transportMode = 'car',
      tripType = 'leisure'
    } = await request.json()

    if (!previousLocation) {
      return NextResponse.json(
        { success: false, error: 'Previous location is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Suggesting locations between:', previousLocation, '→', nextLocation || 'end')
    console.log('   Transport:', transportMode)
    console.log('   Trip type:', tripType)

    // Get transport range
    const range = TRANSPORT_RANGES[transportMode as keyof typeof TRANSPORT_RANGES] || TRANSPORT_RANGES.car

    // Calculate distance between previous and next if both exist
    let totalDistance = null
    if (previousCoords && nextCoords) {
      const R = 6371 // Earth's radius in km
      const dLat = (nextCoords.latitude - previousCoords.latitude) * Math.PI / 180
      const dLon = (nextCoords.longitude - previousCoords.longitude) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(previousCoords.latitude * Math.PI / 180) * 
        Math.cos(nextCoords.latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      totalDistance = Math.round(R * c)
      console.log('   Total distance:', totalDistance, 'km')
    }

    // Build context for GROQ
    let context = `Previous location: ${previousLocation}`
    if (nextLocation) {
      context += `\nNext location: ${nextLocation}`
    }
    if (totalDistance) {
      context += `\nTotal distance: ${totalDistance} km`
    }
    context += `\nTransport mode: ${transportMode}`
    context += `\nDaily travel range: ${range.min}-${range.max} km (optimal: ${range.optimal} km)`
    context += `\nTrip type: ${tripType}`

    // Use GROQ to suggest locations
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a travel route planning expert. Suggest 4-6 locations that make sense as stops between two points based on:
- Transport mode and realistic daily travel distances
- Geographic route (locations should be along the way, not detours)
- Trip type and traveler interests
- Popular attractions and worthwhile stops

For bike trips: Suggest locations 40-100 km apart (optimal 60 km)
For foot trips: Suggest locations 15-30 km apart (optimal 20 km)
For car trips: Suggest locations 150-400 km apart (optimal 250 km)
For train trips: Suggest locations 200-600 km apart (optimal 350 km)

Return ONLY a JSON array of location names (strings), no explanations:
["Location 1", "Location 2", "Location 3", "Location 4"]`
        },
        {
          role: 'user',
          content: `Suggest 4-6 locations to add between these points:\n\n${context}\n\nReturn only the JSON array of location names.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 300
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    console.log('🤖 GROQ response:', responseText)

    // Parse JSON array
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('❌ No JSON array found in GROQ response')
      return NextResponse.json(
        { success: false, error: 'Failed to generate suggestions' },
        { status: 500 }
      )
    }

    let suggestions
    try {
      suggestions = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse suggestions' },
        { status: 500 }
      )
    }

    // Validate array
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('❌ Invalid suggestions array')
      return NextResponse.json(
        { success: false, error: 'No valid suggestions generated' },
        { status: 500 }
      )
    }

    // Filter to strings only and limit to 6
    const validSuggestions = suggestions
      .filter(s => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 6)

    console.log('✅ Suggestions generated:', validSuggestions)

    return NextResponse.json({
      success: true,
      suggestions: validSuggestions,
      context: {
        transportMode,
        range,
        totalDistance
      }
    })
  } catch (error) {
    console.error('❌ Error generating location suggestions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { success: false, error: `Failed to generate suggestions: ${errorMessage}` },
      { status: 500 }
    )
  }
}


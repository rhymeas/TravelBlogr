import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locations, tripData, currentPlan } = body

    console.log('📥 Alternative route request:', { locations, hasCurrentPlan: !!currentPlan })

    if (!locations || locations.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Need at least 2 locations to generate alternative route' },
        { status: 400 }
      )
    }

    if (!currentPlan || !currentPlan.days) {
      return NextResponse.json(
        { success: false, error: 'Current plan is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Generating alternative route for:', locations)

    // Generate alternative route order using GROQ
    const prompt = `You are a travel planning expert. Given these locations for a trip, generate an alternative route order that:
1. Keeps the same start and end points (first and last locations)
2. Reorders the middle locations for a more efficient or interesting route
3. Considers geographical proximity and travel efficiency

Current route: ${locations.join(' → ')}

Trip context:
- Trip type: ${tripData.tripType || 'general'}
- Transport mode: ${tripData.transportMode || 'car'}
- Duration: ${tripData.dateRange ? Math.ceil((new Date(tripData.dateRange.endDate).getTime() - new Date(tripData.dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 'unknown'} days
- Budget: ${tripData.budget || 'mid-range'}

Respond with ONLY a JSON object in this format:
{
  "alternativeRoute": ["Location1", "Location2", "Location3"],
  "reasoning": "Brief explanation of why this order is better"
}

Make sure the first and last locations match the original route.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log('🤖 GROQ response:', responseText.substring(0, 200))

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in GROQ response:', responseText)
      return NextResponse.json(
        { success: false, error: 'AI failed to generate valid route format' },
        { status: 500 }
      )
    }

    let alternativeRoute, reasoning
    try {
      const parsed = JSON.parse(jsonMatch[0])
      alternativeRoute = parsed.alternativeRoute
      reasoning = parsed.reasoning
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    if (!alternativeRoute || !Array.isArray(alternativeRoute)) {
      console.error('❌ Invalid alternativeRoute:', alternativeRoute)
      return NextResponse.json(
        { success: false, error: 'AI generated invalid route' },
        { status: 500 }
      )
    }

    console.log('✅ Alternative route generated:', alternativeRoute)
    console.log('📝 Reasoning:', reasoning)

    // Reorder the days in the current plan based on the new route
    const locationToDay = new Map()
    currentPlan.days.forEach((day: any) => {
      locationToDay.set(day.location.toLowerCase(), day)
    })

    // Create new days array in alternative order
    const newDays = alternativeRoute.map((location: string, index: number) => {
      const originalDay = locationToDay.get(location.toLowerCase())
      if (!originalDay) {
        console.warn(`⚠️ Location not found in original plan: ${location}`)
        return null
      }

      return {
        ...originalDay,
        day: index + 1 // Renumber days
      }
    }).filter(Boolean)

    if (newDays.length === 0) {
      console.error('❌ No valid days in alternative route')
      return NextResponse.json(
        { success: false, error: 'Failed to match locations to plan' },
        { status: 500 }
      )
    }

    console.log(`✅ Created ${newDays.length} days in alternative route`)

    // Return the alternative plan
    return NextResponse.json({
      success: true,
      plan: {
        ...currentPlan,
        days: newDays,
        title: currentPlan.title || 'Your Trip',
        summary: currentPlan.summary ? `${currentPlan.summary}\n\nAlternative route: ${reasoning}` : reasoning
      }
    })
  } catch (error) {
    console.error('❌ Error generating alternative route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { success: false, error: `Failed to generate alternative route: ${errorMessage}` },
      { status: 500 }
    )
  }
}


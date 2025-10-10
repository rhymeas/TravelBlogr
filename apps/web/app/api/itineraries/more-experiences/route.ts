/**
 * API Route: Generate More Experiences for a Location
 * Uses Groq AI to suggest additional activities
 */

import { NextRequest, NextResponse } from 'next/server'
import { createGroqClient } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Initialize Groq client at runtime (not build time)
    const groq = createGroqClient()

    const body = await request.json()
    const { location, interests, budget, existingActivities } = body

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log(`🎯 Generating more experiences for: ${location}`)

    // Build prompt for Groq
    const prompt = `You are a travel expert. Generate 5 unique, exciting activities for ${location}.

${interests && interests.length > 0 ? `User interests: ${interests.join(', ')}` : ''}
${budget ? `Budget level: ${budget}` : ''}

${existingActivities && existingActivities.length > 0 ? `
IMPORTANT: Do NOT suggest these activities (already in plan):
${existingActivities.map((a: string) => `- ${a}`).join('\n')}
` : ''}

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Activity name",
    "description": "Brief description (1-2 sentences)",
    "duration": 2.5,
    "costEstimate": 45,
    "type": "activity",
    "time": "10:00"
  }
]

Requirements:
- Each activity must be unique and different from existing ones
- Include mix of popular attractions and hidden gems
- Duration in hours (decimal)
- Cost in USD
- Time in 24h format
- Type must be "activity"
- Make them exciting and specific to ${location}

Return ONLY the JSON array, no other text.`

    // Call Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning expert. Return only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log('🤖 Groq response:', responseText.substring(0, 200))

    // Parse JSON response
    let activities
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        activities = JSON.parse(jsonMatch[0])
      } else {
        activities = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Validate activities
    if (!Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No activities generated' },
        { status: 500 }
      )
    }

    console.log(`✅ Generated ${activities.length} new experiences`)

    return NextResponse.json({
      success: true,
      data: activities
    })

  } catch (error: any) {
    console.error('❌ Error generating experiences:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate experiences' 
      },
      { status: 500 }
    )
  }
}


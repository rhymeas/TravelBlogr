/**
 * API Route: Generate Activity Description
 * POST /api/groq/activity-description
 * 
 * Generates contextual 2-line descriptions for trip activities using GROQ AI
 */

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { activityName, location, tripType, context } = body

    if (!activityName || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating GROQ description for:', activityName, 'in', location)

    const prompt = `You are a travel expert. Generate a concise, contextual 2-line description for this travel activity.

Activity: ${activityName}
Location: ${location}
${tripType ? `Trip Type: ${tripType}` : ''}
${context ? `Context: ${context}` : ''}

Requirements:
- Maximum 2 sentences (about 30-40 words total)
- Practical and informative
- Include relevant details (duration, cost, booking info, etc.)
- Natural, conversational tone
- No marketing fluff

Example format:
"Ferry from Spain to Morocco, 35-minute crossing. Book tickets online in advance to avoid queues."

Generate ONLY the description, no additional text:`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
      top_p: 1,
      stream: false
    })

    const description = completion.choices[0]?.message?.content?.trim() || ''

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'No description generated' },
        { status: 500 }
      )
    }

    console.log('✅ GROQ description generated:', description)

    // Try to generate a relevant URL using Brave search
    let url = null
    try {
      const searchQuery = `${activityName} ${location} booking information`
      const braveResponse = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=1`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
          }
        }
      )
      
      if (braveResponse.ok) {
        const braveData = await braveResponse.json()
        url = braveData?.web?.results?.[0]?.url || null
      }
    } catch (urlError) {
      console.warn('⚠️ Could not fetch URL:', urlError)
    }

    return NextResponse.json({
      success: true,
      description,
      url
    })

  } catch (error) {
    console.error('❌ Error generating activity description:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}


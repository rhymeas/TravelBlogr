import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log('📝 Fetching description for:', location)

    // Use GROQ to generate a concise 2-3 sentence description
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a travel expert who writes concise, engaging location descriptions. Write exactly 2-3 sentences that capture the essence of a location - what makes it special, what travelers should know, and why it\'s worth visiting. Be informative but brief. Focus on the most interesting and unique aspects.'
        },
        {
          role: 'user',
          content: `Write a 2-3 sentence description about ${location} for travelers. Make it engaging and informative.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200
    })

    const description = completion.choices[0]?.message?.content?.trim() || ''

    if (!description) {
      throw new Error('No description generated')
    }

    console.log('✅ Description generated:', description.substring(0, 100) + '...')

    return NextResponse.json({
      success: true,
      description
    })
  } catch (error) {
    console.error('❌ Error generating location description:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { success: false, error: `Failed to generate description: ${errorMessage}` },
      { status: 500 }
    )
  }
}


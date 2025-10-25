import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { highlight, location } = await request.json()

    if (!highlight || !location) {
      return NextResponse.json(
        { error: 'Missing highlight or location' },
        { status: 400 }
      )
    }

    const prompt = `Generate a brief, engaging 1-2 sentence description (max 15 words) for this attraction/activity that would appear in a travel guide.

Attraction: ${highlight}
Location: ${location}

Requirements:
- Be concise and descriptive
- Highlight what makes it special or unique
- Use simple, accessible language
- No marketing jargon
- Focus on the experience or what visitors will see

Example format: "Historic cathedral with stunning Gothic architecture and panoramic city views from the bell tower."

Respond with ONLY the description, nothing else.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const description = completion.choices[0]?.message?.content?.trim() || ''

    if (!description) {
      throw new Error('No description generated')
    }

    return NextResponse.json({
      success: true,
      description
    })
  } catch (error) {
    console.error('❌ Error generating highlight description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}


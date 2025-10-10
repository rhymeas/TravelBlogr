import { NextRequest, NextResponse } from 'next/server'
import { createGroqClient } from '@/lib/groq'

// Force dynamic rendering for AI routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Initialize Groq client at runtime (not build time)
    const groq = createGroqClient()

    const { title, startDate, endDate } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    let durationInfo = ''
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const month = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      durationInfo = `Duration: ${duration} days in ${month}`
    }

    const prompt = `Generate a compelling travel blog description for a trip titled "${title}".
${durationInfo ? `\n${durationInfo}` : ''}

Requirements:
- Keep it between 100-200 characters
- Make it engaging and inviting
- Focus on the experience and adventure
- Use vivid, descriptive language
- Don't use quotes
- Just return the description, nothing else

Examples of good descriptions:
- "An unforgettable journey through ancient temples, bustling markets, and serene gardens. Discovering the perfect blend of tradition and modernity."
- "Exploring breathtaking mountain peaks, crystal-clear lakes, and charming alpine villages. A nature lover's paradise."
- "Following the stunning coastline, savoring local cuisine, and soaking up the Mediterranean sun. Pure bliss."

Generate ONE compelling description:`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 150
    })

    const description = completion.choices[0]?.message?.content?.trim() || ''
    
    // Remove quotes if AI added them
    const cleanDescription = description.replace(/^["']|["']$/g, '')

    return NextResponse.json({ description: cleanDescription })

  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}


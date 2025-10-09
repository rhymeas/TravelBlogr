import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, description } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const month = start.toLocaleDateString('en-US', { month: 'long' })
    const year = start.getFullYear()

    const prompt = `Generate a creative and catchy travel blog title for a trip with these details:
- Duration: ${duration} days
- Month: ${month} ${year}
${description ? `- Description: ${description}` : ''}

Requirements:
- Keep it under 60 characters
- Make it engaging and memorable
- Include a sense of adventure or discovery
- Don't use quotes or special characters
- Just return the title, nothing else

Examples of good titles:
- "Summer Adventure in Japan"
- "10 Days Exploring the Swiss Alps"
- "Mediterranean Coast Road Trip"
- "Backpacking Through Southeast Asia"

Generate ONE creative title:`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 100
    })

    const title = completion.choices[0]?.message?.content?.trim() || ''
    
    // Remove quotes if AI added them
    const cleanTitle = title.replace(/^["']|["']$/g, '')

    return NextResponse.json({ title: cleanTitle })

  } catch (error) {
    console.error('Error generating title:', error)
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    )
  }
}


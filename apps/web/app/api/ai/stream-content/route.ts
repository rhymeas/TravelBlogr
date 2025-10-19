import { NextRequest } from 'next/server'
import { createGroqClient } from '@/lib/groq'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/stream-content
 * Stream blog post content generation in real-time
 * 
 * This provides better UX by showing content as it's generated
 * instead of waiting for the entire response.
 */
export async function POST(request: NextRequest) {
  try {
    const { destination, numberOfDays, contentType } = await request.json()

    if (!destination) {
      return new Response(
        JSON.stringify({ error: 'Destination is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🌊 Streaming ${contentType || 'content'} for: ${destination}`)

    // Get location intelligence first (our data)
    const intelligence = await getLocationIntelligence(destination, true)

    // Build context from our database
    const context = buildContext(intelligence, destination, numberOfDays)

    // Create prompt based on content type
    const prompt = buildPrompt(contentType || 'full', context, destination, numberOfDays)

    // Initialize GROQ client
    const groq = createGroqClient()

    // Create streaming response
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional travel writer who creates engaging, SEO-optimized blog content. You write in a friendly, informative tone and always provide practical value to readers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      stream: true // Enable streaming!
    })

    // Create a ReadableStream to send chunks to the client
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              // Send each chunk as it arrives
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    // Return streaming response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('Error in stream-content:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to stream content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Build context string from location intelligence
 */
function buildContext(intelligence: any, destination: string, numberOfDays?: number): string {
  const parts: string[] = []

  if (intelligence.location) {
    parts.push(`Location: ${intelligence.location.name}, ${intelligence.location.country}`)
    if (intelligence.location.description) {
      parts.push(`Description: ${intelligence.location.description}`)
    }
  }

  if (intelligence.pois.length > 0) {
    parts.push(`\nPOIs (${intelligence.pois.length}):`)
    intelligence.pois.slice(0, 10).forEach((poi: any) => {
      parts.push(`- ${poi.name} (${poi.category})${poi.description ? ': ' + poi.description.substring(0, 100) : ''}`)
    })
  }

  if (intelligence.activities.length > 0) {
    parts.push(`\nActivities (${intelligence.activities.length}):`)
    intelligence.activities.slice(0, 10).forEach((activity: any) => {
      parts.push(`- ${activity.name}${activity.description ? ': ' + activity.description.substring(0, 100) : ''}`)
    })
  }

  if (intelligence.suggestions.highlights.length > 0) {
    parts.push(`\nHighlights from existing content:`)
    intelligence.suggestions.highlights.slice(0, 5).forEach((highlight: string) => {
      parts.push(`- ${highlight}`)
    })
  }

  return parts.join('\n')
}

/**
 * Build prompt based on content type
 */
function buildPrompt(contentType: string, context: string, destination: string, numberOfDays?: number): string {
  const days = numberOfDays || 7

  switch (contentType) {
    case 'introduction':
      return `Write an engaging 2-3 paragraph introduction for a travel blog post about ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

Make it inspiring and informative. Hook the reader immediately.`

    case 'highlights':
      return `Generate 5 key highlights that make ${destination} special.

CONTEXT FROM OUR DATABASE:
${context}

Format as a simple list, one highlight per line.`

    case 'dayDescription':
      return `Write a brief, engaging description for a day in ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

Keep it concise (2-3 sentences) and exciting.`

    case 'practicalTips':
      return `Generate 5 practical travel tips for ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

Format as a simple list, one tip per line. Be specific and actionable.`

    case 'conclusion':
      return `Write a compelling conclusion for a travel blog post about ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

Inspire readers to visit and include a call-to-action.`

    default: // 'full'
      return `Generate engaging travel blog content for a ${days}-day trip to ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

Write in a friendly, informative tone. Include:
1. An engaging introduction (2-3 paragraphs)
2. Key highlights
3. Day-by-day suggestions
4. Practical tips
5. A compelling conclusion

Make it inspiring and practical.`
  }
}


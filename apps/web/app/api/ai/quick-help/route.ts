import { NextRequest, NextResponse } from 'next/server'
import { createGroqClient } from '@/lib/groq'
import { apiRateLimit, applyRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Use shared API rate limiter (100 req/min per IP) and apply per request

/**
 * POST /api/ai/quick-help
 * Quick AI assistance for editing content
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting via Upstash (shared instance)
    const limit = await applyRateLimit(request, apiRateLimit)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const { mode, context, currentValue, locationName, fieldType } = await request.json()

    if (!mode || !fieldType) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, fieldType' },
        { status: 400 }
      )
    }

    // Check if GROQ is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const groq = createGroqClient()

    // Build prompt based on mode and field type
    const prompt = buildPrompt(mode, fieldType, currentValue, locationName, context)

    console.log(`🤖 AI Quick Help: ${mode} for ${fieldType}`)

    // GROQ Prefilling: add an assistant-prefill to control output format
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: prompt }
    ]

    // Bullet lists (notes/highlights) → prefill with a bullet so the model continues the pattern
    if (fieldType === 'highlights' || fieldType === 'activities' || fieldType === 'restaurants') {
      messages.push({ role: 'assistant', content: '• ' })
    } else if (fieldType === 'description') {
      // Nudge model to start directly with prose (no preamble)
      messages.push({ role: 'assistant', content: '' })
    }

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: mode === 'improve' ? 0.5 : 0.7,
      max_tokens: fieldType === 'description' ? 500 : 200,
    })

    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({
      success: true,
      result: result.trim(),
      mode,
      fieldType
    })

  } catch (error: any) {
    console.error('AI Quick Help error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI suggestion' },
      { status: 500 }
    )
  }
}

function buildPrompt(
  mode: string,
  fieldType: string,
  currentValue: string,
  locationName?: string,
  context?: any
): string {
  const location = locationName || 'this location'

  // IMPROVE MODE
  if (mode === 'improve') {
    if (fieldType === 'description') {
      return `Improve this location description for ${location}. Make it more engaging, informative, and travel-focused. Keep it concise (2-3 paragraphs max).

Current description:
${currentValue || 'No description yet'}

Return ONLY the improved description, no explanations.`
    }

    if (fieldType === 'title') {
      return `Improve this trip title. Make it catchy, descriptive, and travel-focused.

Current title:
${currentValue || 'Untitled Trip'}

Return ONLY the improved title, no explanations.`
    }

    if (fieldType === 'highlights') {
      const kind = context?.noteType ? ` (type: ${context.noteType})` : ''
      return `Improve and refine these highlights for ${location}${kind}. Make them creative, specific, and actionable. Keep to max 6 bullets. Make bullets ultra-concise (8–12 words each).

Current highlights:
${Array.isArray(currentValue) ? currentValue.join('\n') : currentValue || 'No highlights yet'}

Return ONLY as a bullet list (max 6), one per line.`
    }
  }

  // GENERATE MODE
  if (mode === 'generate') {
    if (fieldType === 'description') {
      return `Write a compelling 2-3 paragraph description for ${location}. Include:
- What makes it special
- Key attractions or experiences
- Best time to visit or travel tips

Return ONLY the description, no explanations.`
    }

    if (fieldType === 'activities') {
      const kind = context?.noteType ? ` (type: ${context.noteType})` : ''
      return `Suggest up to 6 must-do activities in ${location}${kind}. Include a mix of:
- Cultural experiences
- Outdoor/outdoor-adjacent ideas
- Food & dining
- Local attractions

Return as a simple list (max 6), one activity per line, ultra-concise (8–12 words).`
    }

    if (fieldType === 'restaurants') {
      const kind = context?.noteType ? ` (type: ${context.noteType})` : ''
      return `Suggest up to 6 recommended restaurants in ${location}${kind}. Include a mix of:
- Local cuisine
- Different price ranges
- Various dining styles

Return as a simple list (max 6), each on one line, ultra-concise (8–12 words). Format: Name - Cuisine Type - Price Range ($ to $$$$)`
    }

    if (fieldType === 'highlights') {
      const kind = context?.noteType ? ` (type: ${context.noteType})` : ''
      return `Generate up to 6 creative bullet points for ${location}${kind}. Make them:
- Specific and actionable
- Diverse and insightful
- Useful for planning or remembering tips
- Ultra-concise (8–12 words each)

Return ONLY as a bullet list (max 6), one per line.`
    }
  }

  // EXPAND MODE
  if (mode === 'expand') {
    return `Expand this content with more details, examples, and travel tips:

${currentValue}

Make it more comprehensive and helpful for travelers. Return ONLY the expanded version.`
  }

  // SHORTEN MODE
  if (mode === 'shorten') {
    return `Make this content more concise while keeping the key information:

${currentValue}

Return ONLY the shortened version.`
  }

  // ADDRESSES MODE
  if (mode === 'addresses') {
    if (fieldType === 'restaurants') {
      return `For these restaurants in ${location}, provide realistic addresses:

${Array.isArray(currentValue) ? currentValue.map((r: any) => r.name).join('\n') : currentValue}

Return as: Restaurant Name - Full Address`
    }

    if (fieldType === 'activities') {
      return `For these activities in ${location}, provide realistic addresses or locations:

${Array.isArray(currentValue) ? currentValue.map((a: any) => a.name).join('\n') : currentValue}

Return as: Activity Name - Location/Address`
    }
  }

  // Default fallback
  return `Help improve this ${fieldType} for ${location}:

${currentValue}

Provide a better version.`
}


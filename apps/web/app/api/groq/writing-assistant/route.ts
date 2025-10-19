import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

type AssistantMode = 
  | 'improve' 
  | 'creative' 
  | 'title' 
  | 'introduction' 
  | 'seo'
  | 'storytelling'

const prompts: Record<AssistantMode, (text: string) => string> = {
  improve: (text) => `
Improve the following text to make it clearer, more engaging, and better structured. 
Maintain the original meaning but enhance readability and flow.

Text: ${text}

Provide only the improved version without explanations.
  `,
  
  creative: (text) => `
Rewrite the following text to be more creative, vivid, and engaging. 
Add descriptive language, sensory details, and emotional appeal.

Text: ${text}

Provide only the creative version without explanations.
  `,
  
  title: (text) => `
Generate 5 catchy, SEO-friendly blog post titles based on this topic or keywords.
Make them engaging, specific, and click-worthy (60-80 characters each).

Topic/Keywords: ${text}

Format as a numbered list.
  `,
  
  introduction: (text) => `
Write an engaging, emotional introduction paragraph (150-200 words) for a travel blog post.
Hook the reader immediately and make them want to continue reading.

Topic: ${text}

Provide only the introduction paragraph.
  `,
  
  seo: (text) => `
Optimize the following text for SEO while maintaining readability and engagement.
Include relevant keywords naturally and improve structure for search engines.

Text: ${text}

Provide only the optimized version without explanations.
  `,
  
  storytelling: (text) => `
Rewrite the following text with better narrative flow and storytelling elements.
Add transitions, build tension, and create a compelling story arc.

Text: ${text}

Provide only the storytelling version without explanations.
  `
}

export async function POST(request: NextRequest) {
  try {
    const { mode, text } = await request.json()

    if (!mode || !text) {
      return NextResponse.json(
        { error: 'Mode and text are required' },
        { status: 400 }
      )
    }

    if (!prompts[mode as AssistantMode]) {
      return NextResponse.json(
        { error: 'Invalid mode' },
        { status: 400 }
      )
    }

    const prompt = prompts[mode as AssistantMode](text)

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional travel writer and content creator. Provide high-quality, engaging content that inspires readers to travel.'
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

    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('No content generated')
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('GROQ API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}


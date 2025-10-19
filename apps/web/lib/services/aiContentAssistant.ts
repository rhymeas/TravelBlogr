/**
 * AI Content Assistant Service
 *
 * GROQ-powered content suggestions for blog posts:
 * - SEO optimization and keyword suggestions
 * - Headline variations
 * - Meta description generation
 * - Content improvement suggestions
 * - EEAT score checking
 * - Content generation based on location intelligence
 */

import Groq from 'groq-sdk'
import { LocationIntelligence } from './locationIntelligenceService'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface SEOAnalysis {
  score: number // 0-100
  keywords: string[]
  keywordDensity: { [key: string]: number }
  suggestions: string[]
  readabilityScore: number
  wordCount: number
}

export interface HeadlineVariation {
  headline: string
  score: number
  reason: string
  type: 'emotional' | 'curiosity' | 'benefit' | 'how-to' | 'list'
}

export interface MetaDescription {
  description: string
  length: number
  includesKeywords: boolean
  callToAction: boolean
}

export interface ContentSuggestion {
  type: 'add' | 'improve' | 'remove'
  section: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}

export interface EEATScore {
  experience: number // 0-100
  expertise: number // 0-100
  authoritativeness: number // 0-100
  trustworthiness: number // 0-100
  overall: number // 0-100
  suggestions: string[]
}

/**
 * Analyze SEO of blog post content
 */
export async function analyzeSEO(
  title: string,
  content: string,
  targetKeywords?: string[]
): Promise<SEOAnalysis> {
  const prompt = `Analyze this blog post for SEO optimization:

Title: ${title}
Content: ${content.substring(0, 2000)}
Target Keywords: ${targetKeywords?.join(', ') || 'Not specified'}

Provide:
1. SEO score (0-100)
2. Top 10 keywords found in content
3. Keyword density for each
4. 5 specific SEO improvement suggestions
5. Readability score (0-100)
6. Word count

Return as JSON with this structure:
{
  "score": number,
  "keywords": string[],
  "keywordDensity": { "keyword": number },
  "suggestions": string[],
  "readabilityScore": number,
  "wordCount": number
}`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('SEO analysis error:', error)
    // Return fallback analysis
    return {
      score: 50,
      keywords: extractKeywords(content),
      keywordDensity: {},
      suggestions: ['Add more descriptive headings', 'Include target keywords naturally'],
      readabilityScore: 60,
      wordCount: content.split(/\s+/).length
    }
  }
}

/**
 * Generate headline variations
 */
export async function generateHeadlineVariations(
  currentTitle: string,
  destination: string,
  keywords?: string[]
): Promise<HeadlineVariation[]> {
  const prompt = `Generate 5 compelling headline variations for a travel blog post:

Current Title: ${currentTitle}
Destination: ${destination}
Keywords: ${keywords?.join(', ') || 'travel, guide, tips'}

Create variations that are:
1. Emotional (evokes feelings)
2. Curiosity-driven (makes readers want to click)
3. Benefit-focused (clear value proposition)
4. How-to style (actionable)
5. List-based (numbered)

For each, provide:
- The headline
- Score (0-100) for click-worthiness
- Reason why it works
- Type

Return as JSON array:
[{
  "headline": string,
  "score": number,
  "reason": string,
  "type": "emotional" | "curiosity" | "benefit" | "how-to" | "list"
}]`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('Headline generation error:', error)
    // Return fallback variations
    return [
      {
        headline: `Ultimate ${destination} Travel Guide`,
        score: 75,
        reason: 'Clear and comprehensive',
        type: 'benefit'
      },
      {
        headline: `${destination}: Everything You Need to Know`,
        score: 70,
        reason: 'Promises complete information',
        type: 'how-to'
      }
    ]
  }
}

/**
 * Generate meta description
 */
export async function generateMetaDescription(
  title: string,
  content: string,
  keywords?: string[]
): Promise<MetaDescription> {
  const prompt = `Generate an SEO-optimized meta description for this blog post:

Title: ${title}
Content Summary: ${content.substring(0, 500)}
Keywords: ${keywords?.join(', ') || 'travel'}

Requirements:
- 150-160 characters
- Include primary keyword naturally
- Include a call-to-action
- Compelling and click-worthy
- Accurately represents content

Return as JSON:
{
  "description": string,
  "length": number,
  "includesKeywords": boolean,
  "callToAction": boolean
}`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('Meta description generation error:', error)
    // Return fallback
    const fallbackDesc = `Discover ${title}. Complete travel guide with tips, recommendations, and insider advice.`
    return {
      description: fallbackDesc,
      length: fallbackDesc.length,
      includesKeywords: true,
      callToAction: true
    }
  }
}

/**
 * Get content improvement suggestions
 */
export async function getContentSuggestions(
  title: string,
  content: string,
  destination: string
): Promise<ContentSuggestion[]> {
  const prompt = `Analyze this travel blog post and suggest improvements:

Title: ${title}
Destination: ${destination}
Content: ${content.substring(0, 2000)}

Provide 5-7 specific, actionable suggestions to improve:
- Content depth and value
- Reader engagement
- Practical usefulness
- SEO optimization
- Structure and flow

For each suggestion, specify:
- Type: "add", "improve", or "remove"
- Section: which part of the post
- Suggestion: specific action to take
- Priority: "high", "medium", or "low"

Return as JSON array:
[{
  "type": "add" | "improve" | "remove",
  "section": string,
  "suggestion": string,
  "priority": "high" | "medium" | "low"
}]`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('Content suggestions error:', error)
    return [
      {
        type: 'add',
        section: 'Introduction',
        suggestion: 'Add a personal anecdote to connect with readers',
        priority: 'medium'
      }
    ]
  }
}

/**
 * Calculate EEAT score
 */
export async function calculateEEATScore(
  title: string,
  content: string,
  authorBio?: string
): Promise<EEATScore> {
  const prompt = `Evaluate this travel blog post for Google's EEAT criteria:

Title: ${title}
Content: ${content.substring(0, 2000)}
Author Bio: ${authorBio || 'Not provided'}

Rate each dimension (0-100):
1. Experience: Does the author demonstrate first-hand experience?
2. Expertise: Does the content show deep knowledge?
3. Authoritativeness: Is the author credible in this topic?
4. Trustworthiness: Is the information accurate and reliable?

Provide:
- Score for each dimension
- Overall EEAT score
- 3-5 specific suggestions to improve EEAT

Return as JSON:
{
  "experience": number,
  "expertise": number,
  "authoritativeness": number,
  "trustworthiness": number,
  "overall": number,
  "suggestions": string[]
}`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from GROQ')

    return JSON.parse(response)
  } catch (error) {
    console.error('EEAT calculation error:', error)
    return {
      experience: 50,
      expertise: 50,
      authoritativeness: 50,
      trustworthiness: 50,
      overall: 50,
      suggestions: ['Add personal experiences', 'Include expert quotes', 'Cite sources']
    }
  }
}

/**
 * Generate SEO keyword suggestions based on location intelligence
 */
export async function generateKeywordSuggestions(
  destination: string,
  intelligence: LocationIntelligence
): Promise<{ primary: string[], secondary: string[], longTail: string[] }> {
  console.log(`🔍 Generating keyword suggestions for ${destination}...`)

  const context = buildContextFromIntelligence(intelligence)

  const prompt = `You are an SEO expert specializing in travel content.

DESTINATION: ${destination}

CONTEXT FROM OUR DATABASE:
${context}

TASK: Generate SEO keywords for a travel blog post about ${destination}.

Provide:
1. Primary keywords (3-5): High-volume, competitive keywords
2. Secondary keywords (5-7): Medium-volume, less competitive
3. Long-tail keywords (7-10): Specific, low-competition phrases

Format as JSON:
{
  "primary": ["travel to ${destination}", "..."],
  "secondary": ["best time to visit ${destination}", "..."],
  "longTail": ["${destination} 7 day itinerary for first timers", "..."]
}

Base keywords on actual attractions, activities, and content from our database.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert who generates highly relevant, search-optimized keywords for travel content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No keywords generated')
    }

    const keywords = JSON.parse(content)
    console.log('✅ Keywords generated:', keywords.primary.length + keywords.secondary.length + keywords.longTail.length, 'total')
    return keywords
  } catch (error) {
    console.error('Error generating keywords:', error)
    // Fallback keywords
    return {
      primary: [`${destination} travel guide`, `visit ${destination}`, `${destination} tourism`],
      secondary: [`best time to visit ${destination}`, `${destination} attractions`, `${destination} hotels`],
      longTail: [`${destination} 7 day itinerary`, `things to do in ${destination}`, `${destination} travel tips`]
    }
  }
}

/**
 * Generate content suggestions based on location intelligence
 */
export async function generateContentFromIntelligence(
  destination: string,
  intelligence: LocationIntelligence,
  numberOfDays?: number
): Promise<{
  introduction: string
  highlights: string[]
  dayDescriptions: string[]
  practicalTips: string[]
  conclusion: string
}> {
  console.log(`🤖 Generating content suggestions for ${destination}...`)

  const context = buildContextFromIntelligence(intelligence)

  const prompt = `You are a professional travel writer creating a blog post about ${destination}.

CONTEXT FROM OUR DATABASE:
${context}

TASK: Generate engaging travel blog content for a ${numberOfDays || 7}-day trip to ${destination}.

Please provide:
1. An engaging introduction (2-3 paragraphs)
2. 5 key highlights that make this destination special
3. Brief descriptions for each day (${numberOfDays || 7} days)
4. 5 practical tips for travelers
5. A compelling conclusion

Format your response as JSON:
{
  "introduction": "...",
  "highlights": ["...", "...", ...],
  "dayDescriptions": ["Day 1: ...", "Day 2: ...", ...],
  "practicalTips": ["...", "...", ...],
  "conclusion": "..."
}

Keep the tone friendly, informative, and inspiring. Use the context from our database to make it authentic.`

  try {
    const completion = await groq.chat.completions.create({
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
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    const suggestions = JSON.parse(content)
    console.log('✅ Content suggestions generated')
    return suggestions
  } catch (error) {
    console.error('Error generating content suggestions:', error)
    throw error
  }
}

/**
 * Helper: Build context string from intelligence data
 */
function buildContextFromIntelligence(intelligence: LocationIntelligence): string {
  const parts: string[] = []

  if (intelligence.location) {
    parts.push(`Location: ${intelligence.location.name}, ${intelligence.location.country}`)
    if (intelligence.location.description) {
      parts.push(`Description: ${intelligence.location.description}`)
    }
  }

  if (intelligence.pois.length > 0) {
    parts.push(`\nPOIs (${intelligence.pois.length}):`)
    intelligence.pois.slice(0, 10).forEach(poi => {
      parts.push(`- ${poi.name} (${poi.category})${poi.description ? ': ' + poi.description.substring(0, 100) : ''}`)
    })
  }

  if (intelligence.activities.length > 0) {
    parts.push(`\nActivities (${intelligence.activities.length}):`)
    intelligence.activities.slice(0, 10).forEach(activity => {
      parts.push(`- ${activity.name}${activity.description ? ': ' + activity.description.substring(0, 100) : ''}`)
    })
  }

  if (intelligence.suggestions.highlights.length > 0) {
    parts.push(`\nHighlights from existing content:`)
    intelligence.suggestions.highlights.slice(0, 5).forEach(highlight => {
      parts.push(`- ${highlight}`)
    })
  }

  return parts.join('\n')
}

/**
 * Helper: Extract keywords from content
 */
function extractKeywords(content: string): string[] {
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || []
  const frequency: { [key: string]: number } = {}

  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}


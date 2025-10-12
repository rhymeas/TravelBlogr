/**
 * Groq AI Client Helper
 *
 * Centralized Groq client creation for API routes.
 * Always initialize at runtime (inside route handlers), never at module level.
 *
 * Supports Helicone monitoring for zero-cost AI request tracking.
 *
 * Usage:
 * ```typescript
 * import { createGroqClient } from '@/lib/groq'
 *
 * export async function POST(request: NextRequest) {
 *   const groq = createGroqClient()
 *   const response = await groq.chat.completions.create({ ... })
 * }
 * ```
 */

import Groq from 'groq-sdk'

/**
 * Create a Groq client instance with optional Helicone monitoring
 *
 * @returns Groq client configured with API key from environment
 * @throws Error if GROQ_API_KEY is not set
 */
export function createGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  const heliconeKey = process.env.HELICONE_API_KEY

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY environment variable is missing. ' +
      'Please set it in your .env.local file or Railway environment variables.'
    )
  }

  // If Helicone is configured, use it for monitoring
  if (heliconeKey) {
    return new Groq({
      apiKey,
      baseURL: 'https://groq.helicone.ai/v1',
      defaultHeaders: {
        'Helicone-Auth': `Bearer ${heliconeKey}`,
      },
    })
  }

  // Otherwise, use standard Groq client
  return new Groq({
    apiKey,
  })
}

/**
 * Create a Groq client instance with optional API key override
 * Useful for testing or multi-tenant scenarios
 * 
 * @param apiKey - Optional API key override
 * @returns Groq client configured with provided or environment API key
 */
export function createGroqClientWithKey(apiKey?: string): Groq {
  const key = apiKey || process.env.GROQ_API_KEY

  if (!key) {
    throw new Error(
      'GROQ_API_KEY must be provided or set in environment variables.'
    )
  }

  return new Groq({
    apiKey: key,
  })
}

/**
 * Check if Groq API key is configured
 * Useful for conditional feature availability
 * 
 * @returns true if GROQ_API_KEY is set
 */
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}


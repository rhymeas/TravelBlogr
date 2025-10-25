/**
 * Test API route to check environment variables
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasBraveKey: !!process.env.BRAVE_SEARCH_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    braveKeyLength: process.env.BRAVE_SEARCH_API_KEY?.length || 0,
    groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV
  })
}


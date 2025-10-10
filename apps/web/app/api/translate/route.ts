/**
 * Translation API Endpoint
 * Provides translation services for location names
 */

import { NextRequest, NextResponse } from 'next/server'
import { translateLocationName, translateLocationNames } from '@/lib/services/translationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, texts } = body

    // Single translation
    if (text) {
      const result = await translateLocationName(text)
      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // Batch translation
    if (texts && Array.isArray(texts)) {
      const results = await translateLocationNames(texts)
      
      // Convert Map to object for JSON response
      const resultsObject: Record<string, string> = {}
      results.forEach((translated, original) => {
        resultsObject[original] = translated
      })

      return NextResponse.json({
        success: true,
        data: resultsObject
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing required field: text or texts'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text')

  if (!text) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameter: text'
      },
      { status: 400 }
    )
  }

  try {
    const result = await translateLocationName(text)
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


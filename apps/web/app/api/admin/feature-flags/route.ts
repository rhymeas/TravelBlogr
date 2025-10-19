/**
 * API Route: Update Feature Flags
 * 
 * Updates .env.local file with new feature flag values.
 * Note: Changes to NEXT_PUBLIC_* vars require server restart.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin access
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // For now, any authenticated user can update flags (development only)

    // 2. Parse request
    const { key, value } = await request.json()

    if (!key || typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: key and value (boolean) required' },
        { status: 400 }
      )
    }

    // 3. Validate flag key
    const validFlags = [
      'NEXT_PUBLIC_ENABLE_SMART_POI',
      'NEXT_PUBLIC_ENABLE_GROQ_VALIDATION',
      'NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING',
      'NEXT_PUBLIC_ENABLE_BATCH_PROCESSING'
    ]

    if (!validFlags.includes(key)) {
      return NextResponse.json(
        { error: 'Invalid flag key' },
        { status: 400 }
      )
    }

    // 4. Update .env.local file
    const envPath = path.join(process.cwd(), '.env.local')
    
    try {
      // Read current .env.local
      let envContent = ''
      try {
        envContent = await fs.readFile(envPath, 'utf-8')
      } catch (error) {
        // File doesn't exist, create it
        envContent = ''
      }

      // Parse env file
      const lines = envContent.split('\n')
      const flagLine = `${key}=${value}`
      
      // Check if flag exists
      const flagIndex = lines.findIndex(line => line.startsWith(`${key}=`))
      
      if (flagIndex >= 0) {
        // Update existing flag
        lines[flagIndex] = flagLine
      } else {
        // Add new flag
        lines.push(flagLine)
      }

      // Write back to file
      await fs.writeFile(envPath, lines.join('\n'), 'utf-8')

      console.log(`✅ Feature flag updated: ${key}=${value}`)

      return NextResponse.json({
        success: true,
        message: `Feature flag ${key} updated to ${value}`,
        requiresRestart: key.startsWith('NEXT_PUBLIC_')
      })
    } catch (error) {
      console.error('Error updating .env.local:', error)
      return NextResponse.json(
        { error: 'Failed to update .env.local file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Feature flags API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current flag states
    const flags = {
      NEXT_PUBLIC_ENABLE_SMART_POI: process.env.NEXT_PUBLIC_ENABLE_SMART_POI === 'true',
      NEXT_PUBLIC_ENABLE_GROQ_VALIDATION: process.env.NEXT_PUBLIC_ENABLE_GROQ_VALIDATION === 'true',
      NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING: process.env.NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING === 'true',
      NEXT_PUBLIC_ENABLE_BATCH_PROCESSING: process.env.NEXT_PUBLIC_ENABLE_BATCH_PROCESSING === 'true'
    }

    return NextResponse.json({ flags })
  } catch (error) {
    console.error('Feature flags API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


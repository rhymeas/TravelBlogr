import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json()

    if (!slug || !password) {
      return NextResponse.json(
        { error: 'Missing slug or password' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Fetch trip with password
    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, privacy, privacy_password')
      .eq('slug', slug)
      .single()

    if (error || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Verify password
    if (trip.privacy === 'password' && trip.privacy_password === password) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Incorrect password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


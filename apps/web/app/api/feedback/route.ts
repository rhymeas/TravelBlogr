import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, email, user_id, page_url, user_agent } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabase()

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        message: message.trim(),
        email: email?.trim() || null,
        user_id: user_id || null,
        page_url: page_url || null,
        user_agent: user_agent || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting feedback:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, email, user_id, page_url, user_agent } = body

    console.log('[Feedback API] Received:', { message: message?.substring(0, 50), email, user_id, page_url })

    if (!message || !message.trim()) {
      console.error('[Feedback API] Message is empty')
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
      console.error('[Feedback API] Database error:', error)
      return NextResponse.json(
        { error: `Failed to save feedback: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('[Feedback API] Success:', data?.id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Feedback API] Exception:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}


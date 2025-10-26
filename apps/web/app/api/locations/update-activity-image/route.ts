import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerSupabase()
    const supabaseAdmin = createServiceSupabase()

    // Auth required
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { locationId, activityId, imageUrl } = await request.json()

    if (!locationId || !activityId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If activityId is not a real UUID (e.g., temp-123), skip DB update but return OK so UI flow continues
    if (!isUUID(activityId)) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const { error } = await supabaseAdmin
      .from('activities')
      .update({ image_url: imageUrl })
      .eq('id', activityId)
      .eq('location_id', locationId)

    if (error) {
      console.error('Failed to update activity image:', error)
      return NextResponse.json({ error: 'Failed to update image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('update-activity-image error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


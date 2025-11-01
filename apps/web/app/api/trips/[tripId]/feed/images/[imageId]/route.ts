import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// DELETE: remove an image from a trip feed
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tripId: string; imageId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId, imageId } = params

    // Load image
    const { data: image, error: imgErr } = await supabase
      .from('trip_feed_images')
      .select('id, trip_id, user_id')
      .eq('id', imageId)
      .eq('trip_id', tripId)
      .single()

    if (imgErr || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Load trip to check ownership
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check collaborator (admin) permissions
    let isAdminCollaborator = false
    {
      const { data: collab } = await supabase
        .from('trip_collaborators')
        .select('role, status')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single()
      if (collab && collab.status === 'accepted' && (collab.role === 'admin')) {
        isAdminCollaborator = true
      }
    }

    const canDelete = (
      image.user_id === user.id ||
      trip.user_id === user.id ||
      isAdminCollaborator
    )

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: delErr } = await supabase
      .from('trip_feed_images')
      .delete()
      .eq('id', imageId)
      .eq('trip_id', tripId)

    if (delErr) {
      console.error('Delete trip_feed_images failed', delErr)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/trips/[tripId]/feed/images/[imageId] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


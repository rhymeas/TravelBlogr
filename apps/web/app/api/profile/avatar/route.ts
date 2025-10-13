import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST /api/profile/avatar
 * Update user's profile avatar URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { avatarUrl } = body

    if (!avatarUrl) {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 })
    }

    console.log('📸 Updating avatar for user:', user.id)

    // Update profile with new avatar URL
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating avatar:', error)
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }

    console.log('✅ Avatar updated successfully')

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


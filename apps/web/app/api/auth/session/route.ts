import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST /api/auth/session
 * Sync Supabase auth session from client to server cookies.
 * This allows API routes to authenticate using cookie-based SSR client.
 */
export async function POST(req: NextRequest) {
  try {
    const { event, session } = await req.json()

    const supabase = await createServerSupabase()

    // CRITICAL: Only sign out on explicit SIGNED_OUT event
    // Do NOT sign out on INITIAL_SESSION with null session - this is normal on page load
    if (event === 'SIGNED_OUT') {
      console.log('🔐 API: Signing out - SIGNED_OUT event received')
      await supabase.auth.signOut()
      return NextResponse.json({ ok: true })
    }

    // If no session but not a sign-out event, just skip (don't sign out)
    // This handles INITIAL_SESSION with null session on page load
    if (!session) {
      console.log('🔐 API: No session provided, event:', event, '- skipping')
      return NextResponse.json({ ok: true })
    }

    const access_token = session?.access_token as string | undefined
    const refresh_token = session?.refresh_token as string | undefined

    if (!access_token || !refresh_token) {
      console.log('🔐 API: Missing tokens in session')
      return NextResponse.json(
        { ok: false, error: 'Missing tokens' },
        { status: 400 }
      )
    }

    console.log('🔐 API: Setting session for event:', event)
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('🔐 API: Error setting session:', error.message)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      )
    }

    console.log('🔐 API: Session synced successfully')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Auth session sync error:', e)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


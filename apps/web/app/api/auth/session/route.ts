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

    // Handle sign-out or missing session: clear cookies
    if (event === 'SIGNED_OUT' || !session) {
      await supabase.auth.signOut()
      return NextResponse.json({ ok: true })
    }

    const access_token = session?.access_token as string | undefined
    const refresh_token = session?.refresh_token as string | undefined

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing tokens' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Auth session sync error:', e)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


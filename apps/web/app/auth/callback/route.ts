import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /auth/callback
 * Handle OAuth callback from providers (Google, GitHub, etc.)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=oauth_failed', requestUrl.origin))
    }
  }

  // Handle implicit flow (tokens in URL) - just redirect and let client handle it
  // Supabase client will automatically pick up tokens from URL hash
  if (accessToken || refreshToken) {
    console.log('OAuth tokens detected in URL, redirecting to allow client-side session setup')
  }

  // Redirect to the next URL or dashboard (clean URL without tokens)
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}


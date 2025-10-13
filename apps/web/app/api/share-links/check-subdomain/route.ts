import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// GET /api/share-links/check-subdomain?subdomain=example
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter required' }, { status: 400 })
    }

    // Validate subdomain format
    const cleanSubdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63)

    if (cleanSubdomain.length < 3) {
      return NextResponse.json({ 
        available: false, 
        error: 'Subdomain must be at least 3 characters' 
      })
    }

    // Reserved subdomains
    const reservedSubdomains = [
      'www', 'api', 'app', 'admin', 'dashboard', 'blog', 'help', 'support',
      'mail', 'email', 'ftp', 'cdn', 'static', 'assets', 'media', 'images',
      'js', 'css', 'fonts', 'files', 'docs', 'dev', 'test', 'staging',
      'prod', 'production', 'beta', 'alpha', 'demo', 'sandbox', 'preview',
      'travelblogr', 'travel', 'trip', 'trips', 'share', 'link', 'links',
      'public', 'private', 'secure', 'ssl', 'tls', 'http', 'https',
      'subdomain', 'domain', 'host', 'server', 'client', 'user', 'users',
      'account', 'accounts', 'profile', 'profiles', 'settings', 'config',
      'status', 'health', 'ping', 'metrics', 'analytics', 'stats',
      'login', 'logout', 'signin', 'signup', 'register', 'auth', 'oauth',
      'callback', 'webhook', 'webhooks', 'api-docs', 'swagger', 'graphql',
      'rest', 'soap', 'rpc', 'grpc', 'websocket', 'ws', 'wss',
      'mobile', 'ios', 'android', 'app-store', 'play-store',
      'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok',
      'google', 'apple', 'microsoft', 'amazon', 'netflix', 'spotify'
    ]

    if (reservedSubdomains.includes(cleanSubdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'This subdomain is reserved' 
      })
    }

    const supabase = await createServerSupabase()

    // Check if subdomain exists
    const { data: existingLink, error } = await supabase
      .from('share_links')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking subdomain:', error)
      return NextResponse.json({ error: 'Failed to check subdomain availability' }, { status: 500 })
    }

    const available = !existingLink

    return NextResponse.json({ 
      available,
      subdomain: cleanSubdomain,
      ...(available ? {} : { error: 'Subdomain is already taken' })
    })
  } catch (error) {
    console.error('Error in subdomain check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

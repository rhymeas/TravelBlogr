import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = ['/dashboard']
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/callback']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // For now, skip Supabase auth checks until we set up the database
  // const supabase = createMiddlewareClient({ req, res })

  // Get hostname and check for subdomain
  const hostname = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  // Handle subdomain routing for share links
  if (hostname.includes('.travelblogr.com') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0]

    // Skip API routes and static files
    if (!url.pathname.startsWith('/api') &&
        !url.pathname.startsWith('/_next') &&
        !url.pathname.includes('.')) {

      // Rewrite to subdomain page
      url.pathname = `/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Skip auth checks for now - will be enabled once Supabase is configured
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // For now, allow all routes until Supabase is configured
  // const isProtectedRoute = protectedRoutes.some(route =>
  //   pathname.startsWith(route)
  // )

  // const isAuthRoute = authRoutes.some(route =>
  //   pathname.startsWith(route)
  // )

  // Redirect authenticated users away from auth pages
  // if (session && isAuthRoute) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  // Redirect unauthenticated users from protected routes
  // if (!session && isProtectedRoute) {
  //   const redirectUrl = new URL('/auth/signin', req.url)
  //   redirectUrl.searchParams.set('redirectTo', pathname)
  //   return NextResponse.redirect(redirectUrl)
  // }

  // Skip database-dependent features until Supabase is configured
  // Handle role-based access control for admin routes
  // if (pathname.startsWith('/admin')) {
  //   if (!session) {
  //     return NextResponse.redirect(new URL('/auth/signin', req.url))
  //   }

  //   // Get user profile to check role
  //   const { data: profile } = await supabase
  //     .from('users')
  //     .select('role')
  //     .eq('id', session.user.id)
  //     .single()

  //   if (!profile || profile.role !== 'admin') {
  //     return NextResponse.redirect(new URL('/dashboard', req.url))
  //   }
  // }

  // Handle share link access control
  // if (pathname.startsWith('/share/')) {
  //   const shareToken = pathname.split('/share/')[1]

  //   if (shareToken) {
  //     // Verify share link exists and is active
  //     const { data: shareLink } = await supabase
  //       .from('share_links')
  //       .select(`
  //         *,
  //         trips (
  //           id,
  //           title,
  //           user_id,
  //           status
  //         )
  //       `)
  //       .eq('token', shareToken)
  //       .eq('is_active', true)
  //       .single()

  //     if (!shareLink) {
  //       return NextResponse.redirect(new URL('/404', req.url))
  //     }

  //     // Check if trip is published (unless it's the owner)
  //     if (shareLink.trips.status !== 'published' &&
  //         (!session || session.user.id !== shareLink.trips.user_id)) {
  //       return NextResponse.redirect(new URL('/404', req.url))
  //     }

  //     // Increment view count (fire and forget)
  //     supabase
  //       .from('share_links')
  //       .update({
  //         view_count: shareLink.view_count + 1,
  //         last_accessed: new Date().toISOString()
  //       })
  //       .eq('id', shareLink.id)
  //       .then(() => {})
  //       .catch(console.error)
  //   }
  // }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

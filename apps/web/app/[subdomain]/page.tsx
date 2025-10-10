import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { SharedTripView } from '@/components/share/SharedTripView'
import { ShareLinkAnalytics } from '@/components/share/ShareLinkAnalytics'

interface SubdomainPageProps {
  params: {
    subdomain: string
  }
  searchParams: {
    password?: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SubdomainPageProps): Promise<Metadata> {
  const supabase = createServerSupabase()
  
  const { data: shareLink } = await supabase
    .from('share_links')
    .select(`
      *,
      trips (
        title,
        description,
        cover_image,
        user_id,
        users (
          full_name,
          username
        )
      )
    `)
    .eq('subdomain', params.subdomain)
    .eq('is_active', true)
    .single()

  if (!shareLink || !shareLink.trips) {
    return {
      title: 'Trip Not Found | TravelBlogr',
      description: 'The requested travel story could not be found.'
    }
  }

  const trip = shareLink.trips
  const customMeta = shareLink.customization?.metaTags || {}
  const authorName = trip.users?.full_name || trip.users?.username || 'Anonymous'

  return {
    title: customMeta.title || `${trip.title} - ${authorName}'s Travel Story | TravelBlogr`,
    description: customMeta.description || trip.description || `Follow ${authorName}'s journey in ${trip.title}. Discover amazing places, experiences, and travel insights.`,
    keywords: `travel, ${trip.title}, ${authorName}, travel blog, journey, adventure`,
    authors: [{ name: authorName }],
    openGraph: {
      title: customMeta.title || `${trip.title} - ${authorName}'s Travel Story`,
      description: customMeta.description || trip.description || `Follow ${authorName}'s journey in ${trip.title}`,
      images: customMeta.image ? [customMeta.image] : trip.cover_image ? [trip.cover_image] : [],
      type: 'article',
      url: `https://${params.subdomain}.travelblogr.com`,
      siteName: 'TravelBlogr'
    },
    twitter: {
      card: 'summary_large_image',
      title: customMeta.title || `${trip.title} - ${authorName}'s Travel Story`,
      description: customMeta.description || trip.description || `Follow ${authorName}'s journey in ${trip.title}`,
      images: customMeta.image ? [customMeta.image] : trip.cover_image ? [trip.cover_image] : [],
      creator: `@${trip.users?.username || authorName}`
    },
    robots: shareLink.settings?.seoEnabled ? 'index,follow' : 'noindex,nofollow',
    alternates: {
      canonical: `https://${params.subdomain}.travelblogr.com`
    }
  }
}

export default async function SubdomainPage({ params, searchParams }: SubdomainPageProps) {
  const supabase = createServerSupabase()
  
  // Get share link with trip data
  const { data: shareLink, error } = await supabase
    .from('share_links')
    .select(`
      *,
      trips (
        *,
        users (
          id,
          full_name,
          username,
          avatar_url,
          bio
        ),
        posts (
          *
        )
      )
    `)
    .eq('subdomain', params.subdomain)
    .eq('is_active', true)
    .single()

  if (error || !shareLink || !shareLink.trips) {
    notFound()
  }

  // Check if link has expired
  if (shareLink.settings?.expiresAt && new Date(shareLink.settings.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">This travel story is no longer available.</p>
        </div>
      </div>
    )
  }

  // Check password protection
  const requiresPassword = shareLink.settings?.requirePassword && shareLink.settings?.passwordHash
  const providedPassword = searchParams.password
  
  if (requiresPassword && !providedPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Password Protected</h1>
            <p className="text-gray-600 mb-4">This travel story is password protected.</p>
            <form method="GET" className="space-y-4">
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Access Story
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Verify password if provided
  if (requiresPassword && providedPassword) {
    const bcrypt = await import('bcryptjs')
    const isValidPassword = await bcrypt.compare(providedPassword, shareLink.settings.passwordHash)

    if (!isValidPassword) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Password</h1>
            <p className="text-gray-600 mb-4">The password you entered is incorrect.</p>
            <a
              href={`/${params.subdomain}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </a>
          </div>
        </div>
      )
    }
  }

  // Increment view count (fire and forget)
  // Fire-and-forget analytics update (no error handling needed)
  supabase
    .from('share_links')
    .update({
      view_count: shareLink.view_count + 1,
      last_accessed: new Date().toISOString()
    })
    .eq('id', shareLink.id)
    .then(() => {})

  // Track analytics if enabled
  const shouldTrackAnalytics = shareLink.settings?.enableAnalytics !== false

  return (
    <>
      {shouldTrackAnalytics && (
        <ShareLinkAnalytics 
          shareLinkId={shareLink.id}
          subdomain={params.subdomain}
        />
      )}
      
      <SharedTripView 
        shareLink={shareLink}
        trip={shareLink.trips}
        subdomain={params.subdomain}
      />
    </>
  )
}

// Generate static params for popular subdomains (optional optimization)
export async function generateStaticParams() {
  const supabase = createServerSupabase()
  
  // Get most popular share links for pre-generation
  const { data: popularLinks } = await supabase
    .from('share_links')
    .select('subdomain')
    .eq('is_active', true)
    .order('view_count', { ascending: false })
    .limit(100)

  return popularLinks?.map((link) => ({
    subdomain: link.subdomain
  })) || []
}

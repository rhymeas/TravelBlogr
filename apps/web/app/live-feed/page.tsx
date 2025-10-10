'use client'

// Force client-side rendering to avoid SSR document access issues
export const dynamic = 'force-dynamic'

import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'

// Dynamically import feed components with SSR disabled (like Facebook/Instagram feeds)
const Footer = dynamic(() => import('@/components/layout/Footer').then(mod => ({ default: mod.Footer })), { ssr: false })
const AuthAwareHeader = dynamic(() => import('@/components/layout/AuthAwareHeader').then(mod => ({ default: mod.AuthAwareHeader })), { ssr: false })
const LocationFilters = dynamic(() => import('@/components/feed/LocationFilters').then(mod => ({ default: mod.LocationFilters })), { ssr: false })
const FeedPost = dynamic(() => import('@/components/feed/FeedPost').then(mod => ({ default: mod.FeedPost })), { ssr: false })
const AuthenticatedLiveFeed = dynamic(() => import('@/components/feed/AuthenticatedLiveFeed').then(mod => ({ default: mod.AuthenticatedLiveFeed })), { ssr: false })
const InlineFeedPrompt = dynamic(() => import('@/components/auth/SignUpPrompt').then(mod => ({ default: mod.InlineFeedPrompt })), { ssr: false })
const StickySignUpPrompt = dynamic(() => import('@/components/auth/SignUpPrompt').then(mod => ({ default: mod.StickySignUpPrompt })), { ssr: false })

// Import data (safe for SSR)
import { feedPosts, locationFilters } from '@/lib/data/feedData'

export default function LiveFeedPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const handleFilterChange = (filterId: string) => {
    console.log('Filter changed:', filterId)
  }

  const handleLike = (postId: string) => {
    console.log('Liked post:', postId)
  }

  const handleBookmark = (postId: string) => {
    console.log('Bookmarked post:', postId)
  }

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthAwareHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rausch-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthAwareHeader />

      {/* Marketing Copy Section */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            This is what your travel live feed could look like
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Share your journey moments in real-time. Discover authentic travel experiences through our Instagram-style feed with advanced gallery features.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Live Updates
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Image Galleries
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Video Stories
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Interactive Carousels
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isAuthenticated ? (
        <AuthenticatedLiveFeed
          onLike={handleLike}
          onBookmark={handleBookmark}
          onComment={handleComment}
        />
      ) : (
        <div className="max-w-lg mx-auto">
          {/* Location Filters */}
          <LocationFilters
            filters={locationFilters}
            onFilterChange={handleFilterChange}
          />

          {/* Feed Posts with Sign-up Prompts */}
          <div className="space-y-0">
            {feedPosts.slice(0, 2).map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onComment={handleComment}
                showFollowButton={false}
              />
            ))}

            {/* Inline Sign-up Prompt */}
            <InlineFeedPrompt />

            {feedPosts.slice(2, 4).map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onComment={handleComment}
                showFollowButton={false}
              />
            ))}

            {/* Sign-up to see more */}
            <div className="p-8 text-center bg-white border-t border-airbnb-border">
              <div className="mb-4">
                <h3 className="text-title-medium text-airbnb-black mb-2">See More Stories</h3>
                <p className="text-body-medium text-airbnb-gray">
                  Join TravelBlogr to discover unlimited travel stories and connect with adventurers worldwide
                </p>
              </div>
              <button className="px-8 py-3 text-rausch-500 border border-rausch-500 rounded-lg hover:bg-rausch-50 transition-colors">
                Sign Up to Continue
              </button>
            </div>
          </div>

          {/* Sticky Sign-up Prompt for Mobile */}
          <StickySignUpPrompt />
        </div>
      )}

      <Footer />
    </div>
  )
}

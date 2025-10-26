'use client'

export const dynamic = 'force-dynamic'


/**
 * Blog Homepage - Redesigned
 *
 * Modern, sleek, minimal design with integrated monetization
 * Features: Blog cards, Google Ads, affiliate CTAs, planning promotion
 */

import Link from 'next/link'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { BlogPostCard, BlogPostCardSkeleton } from '@/components/blog/BlogPostCard'
import { useBlogPosts } from '@/hooks/useBlogData'
import { ArrowRight, Sparkles, DollarSign, Zap, TrendingUp } from 'lucide-react'

export default function BlogHomepage() {
  // Fetch latest blog posts
  const { posts: latestPosts, isLoading: loadingLatest } = useBlogPosts({
    status: 'published',
    limit: 6
  })

  // Fetch featured posts
  const { posts: featuredPosts, isLoading: loadingFeatured } = useBlogPosts({
    status: 'published',
    limit: 2
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Beautiful and Spacey */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rausch-50 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-rausch-500" />
                <span className="text-xs font-medium text-rausch-700">Share Your Journey, Earn Money</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Turn your travels into
                <span className="block text-rausch-500">inspiring stories</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Create beautiful trip guides in minutes with our AI-powered tools. Share your adventures, inspire others, and earn money through our affiliate program. It's that simple.
              </p>

              {/* Value Props */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Create stunning trip guides with AI assistance</p>
                    <p className="text-xs text-gray-600">Our smart tools help you write engaging content in minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Earn 70% commission on affiliate sales</p>
                    <p className="text-xs text-gray-600">Get paid when readers book through your recommendations</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 bg-rausch-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-rausch-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Join a community of passionate travelers</p>
                    <p className="text-xs text-gray-600">Share tips, get feedback, and grow together</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rausch-500 text-white rounded-full text-sm font-medium hover:bg-rausch-600 transition-all hover:scale-105 shadow-lg shadow-rausch-500/30"
                >
                  Start Creating Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/blog/posts"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Read Stories
                </Link>
              </div>
            </div>

            {/* Right: Image Collage */}
            <div className="relative h-[480px]">
              {/* Large Image */}
              <div className="absolute top-0 right-0 w-3/4 h-3/5 rounded-2xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"
                  alt="Mountain landscape"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Small Image 1 */}
              <div className="absolute bottom-20 left-0 w-2/5 h-2/5 rounded-2xl overflow-hidden shadow-xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400"
                  alt="Beach sunset"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Small Image 2 */}
              <div className="absolute bottom-0 right-12 w-1/3 h-1/4 rounded-3xl overflow-hidden shadow-xl">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"
                  alt="City skyline"
                  width={250}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-display-medium font-bold text-sleek-black mb-4">
              Featured Stories
            </h2>
            <p className="text-body-medium text-sleek-dark-gray">
              Handpicked travel stories that inspire
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {loadingFeatured ? (
              <>
                <BlogPostCardSkeleton featured />
                <BlogPostCardSkeleton featured />
              </>
            ) : (
              featuredPosts.slice(0, 2).map((post: any) => {
                const content = typeof post.content === 'string'
                  ? JSON.parse(post.content)
                  : post.content

                return (
                  <BlogPostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt || ''}
                    featuredImage={post.featured_image || '/images/placeholder-trip.jpg'}
                    author={{
                      name: post.profiles?.full_name || post.profiles?.username || 'Anonymous',
                      avatar: post.profiles?.avatar_url
                    }}
                    destination={content?.destination || 'Unknown'}
                    duration={content?.days?.length ? `${content.days.length} days` : undefined}
                    tags={post.tags || []}
                    stats={{
                      views: post.view_count || 0,
                      likes: 0,
                      shares: 0
                    }}
                    publishedAt={post.published_at || post.created_at}
                    featured
                  />
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Latest Adventures */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-display-medium font-bold text-sleek-black mb-4">
              Latest Adventures
            </h2>
            <p className="text-body-medium text-sleek-dark-gray">
              Fresh stories from travelers around the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingLatest ? (
              <>
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
                <BlogPostCardSkeleton />
              </>
            ) : (
              latestPosts.map((post: any) => {
                const content = typeof post.content === 'string'
                  ? JSON.parse(post.content)
                  : post.content

                return (
                  <BlogPostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt || ''}
                    featuredImage={post.featured_image || '/images/placeholder-trip.jpg'}
                    author={{
                      name: post.profiles?.full_name || post.profiles?.username || 'Anonymous',
                      avatar: post.profiles?.avatar_url
                    }}
                    destination={content?.destination || 'Unknown'}
                    duration={content?.days?.length ? `${content.days.length} days` : undefined}
                    tags={post.tags || []}
                    stats={{
                      views: post.view_count || 0,
                      likes: 0
                    }}
                    publishedAt={post.published_at || post.created_at}
                  />
                )
              })
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/blog/posts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105"
            >
              View All Stories
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Planning CTA - Promote Trip Planner */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 lg:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
              <Zap className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">AI-Powered Planning</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Plan Your Next Adventure in Minutes
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Our AI trip planner creates personalized itineraries with activities, restaurants, and hidden gems. Turn your plan into a blog post and start earning.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/plan"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all hover:scale-105"
              >
                Start Planning Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                See Examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Monetization Features */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-display-medium font-bold text-sleek-black mb-4">
              Earn Money from Your Stories
            </h2>
            <p className="text-body-medium text-sleek-dark-gray">
              Multiple ways to monetize your travel content
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Affiliate Commissions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <DollarSign className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">70% Affiliate Commission</h3>
              <p className="text-gray-600 mb-4">
                Earn when readers book hotels, tours, or flights through your recommendations. Integrated with Booking.com, sleek, GetYourGuide, and more.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Hotels: 25-40% commission
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Tours: 8-12% commission
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Flights: Up to 70% commission
                </li>
              </ul>
            </div>

            {/* Google Ads */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Google AdSense Revenue</h3>
              <p className="text-gray-600 mb-4">
                Automatically placed ads on your blog posts. Earn $2-5 per 1,000 views with strategic ad placement that doesn't disrupt reading experience.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Automatic ad optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Non-intrusive placement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Monthly payouts
                </li>
              </ul>
            </div>

            {/* Premium Features */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Buy Credits for AI Features</h3>
              <p className="text-gray-600 mb-4">
                Unlock advanced AI writing, unlimited trip planning, and premium analytics. Pay only for what you use with our flexible credit system.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  AI content generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Unlimited planning
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Advanced analytics
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105"
            >
              Start Earning Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA - Simple and Clean */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of travel creators earning money from their journeys. Start creating your first trip guide today—it's completely free.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105"
            >
              Create Your First Trip
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all"
            >
              View Dashboard
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • 70% commission rate • Free to start
          </p>
        </div>
      </section>
    </div>
  )
}


'use client'

/**
 * Blog Posts List Page - Redesigned
 *
 * Sleek, bubbly, emotional, spacey Airbnb-inspired design
 * Minimal colors, lots of white space, beautiful grid layout
 */

import { useState } from 'react'
import { useBlogPosts } from '@/hooks/useBlogData'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { Calendar, Eye, Search, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BlogPostsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [currentPage, setCurrentPage] = useState(0)
  const postsPerPage = 12

  const { posts, total, isLoading } = useBlogPosts({
    status: 'published',
    category: selectedCategory,
    limit: postsPerPage,
    offset: currentPage * postsPerPage
  })

  // Filter posts by search query (client-side)
  const filteredPosts = posts.filter((post: any) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(total / postsPerPage)

  const categories = [
    { id: 'all', label: 'All Stories', emoji: '✨' },
    { id: 'Family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { id: 'Adventure', label: 'Adventure', emoji: '🏔️' },
    { id: 'Beach', label: 'Beach', emoji: '🏖️' },
    { id: 'Cultural', label: 'Cultural', emoji: '🎭' },
    { id: 'Road Trip', label: 'Road Trip', emoji: '🚗' },
    { id: 'Travel Guide', label: 'Guides', emoji: '📖' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Minimal and Spacey */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Travel Stories
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Real journeys. Real experiences. Real inspiration.
            </p>

            {/* Search Bar - Sleek and Minimal */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-rausch-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 text-lg border-2 border-gray-200 rounded-full focus:border-rausch-500 focus:outline-none transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters - Bubbly Pills */}
      <section className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === 'all' ? undefined : cat.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all
                  ${(!selectedCategory && cat.id === 'all') || selectedCategory === cat.id
                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }
                `}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid - Beautiful Masonry-Style Layout */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-72 bg-gray-100 rounded-3xl" />
                <div className="h-6 bg-gray-100 rounded-full w-3/4" />
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post: any, index: number) => (
                <Link
                  key={post.id}
                  href={`/blog/posts/${post.slug}`}
                  className="group block"
                >
                  <article className="h-full space-y-4">
                    {/* Featured Image - Rounded and Elevated */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                      {post.featured_image ? (
                        <OptimizedImage
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          preset="thumbnail"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <MapPin className="h-16 w-16 text-gray-300" />
                        </div>
                      )}

                      {/* Category Badge - Floating */}
                      {post.category && (
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900 shadow-lg">
                            {categories.find(c => c.id === post.category)?.emoji || '✨'}
                            {post.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3 px-1">
                      <h3 className="text-2xl font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-rausch-600 transition-colors">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-gray-600 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta Info - Minimal and Clean */}
                      <div className="flex items-center gap-6 text-sm text-gray-500 pt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{post.view_count || 0} views</span>
                        </div>
                      </div>

                      {/* Author - Subtle */}
                      {post.profiles && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          {post.profiles.avatar_url ? (
                            <img
                              src={post.profiles.avatar_url}
                              alt={post.profiles.full_name || post.profiles.username}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {(post.profiles.full_name || post.profiles.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {post.profiles.full_name || post.profiles.username}
                          </span>
                        </div>
                      )}

                      {/* Read More - Appears on Hover */}
                      <div className="flex items-center gap-2 text-rausch-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Read story</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination - Minimal and Sleek */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16 pt-8 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-6 py-3 rounded-full font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                    if (pageNum >= totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`
                          w-10 h-10 rounded-full font-medium transition-all
                          ${currentPage === pageNum
                            ? 'bg-gray-900 text-white shadow-lg scale-110'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-6 py-3 rounded-full font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section - Inspire to Create */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Ready to share your story?
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Join thousands of travelers turning their adventures into inspiring content—and earning money while doing it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-8 py-4 bg-rausch-500 text-white rounded-full font-medium hover:bg-rausch-600 transition-all hover:scale-105 shadow-lg shadow-rausch-500/30"
            >
              Start Creating Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}


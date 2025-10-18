'use client'

/**
 * Blog Posts List Page
 * 
 * Browse all blog posts with filtering, search, and pagination.
 */

import { useState } from 'react'
import { useBlogPosts } from '@/hooks/useBlogData'
import { BlogLayout, BlogSection } from '@/components/blog/BlogLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { Calendar, Clock, Eye, Search } from 'lucide-react'
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

  return (
    <BlogLayout maxWidth="2xl">
      {/* Header */}
      <BlogSection className="pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Travel Stories & Guides
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover inspiring travel stories, destination guides, and tips from our community
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </BlogSection>

      {/* Filters */}
      <BlogSection className="pb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(undefined)}
          >
            All Posts
          </Button>
          {['Destinations', 'Travel Tips', 'Guides', 'Stories', 'Food & Drink'].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </BlogSection>

      {/* Posts Grid */}
      <BlogSection className="pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 text-lg">No posts found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post: any) => (
                <Link key={post.id} href={`/blog/posts/${post.slug}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    {/* Featured Image */}
                    {post.featured_image && (
                      <div className="relative h-48 overflow-hidden bg-gray-200">
                        <OptimizedImage
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          preset="thumbnail"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {post.category && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 text-gray-900 border-0 shadow-lg">
                              {post.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-rausch-600 transition-colors">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.view_count || 0}</span>
                        </div>
                      </div>

                      {/* Author */}
                      {post.profiles && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                          {post.profiles.avatar_url && (
                            <img
                              src={post.profiles.avatar_url}
                              alt={post.profiles.full_name || post.profiles.username}
                              className="h-6 w-6 rounded-full"
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {post.profiles.full_name || post.profiles.username}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                    if (pageNum >= totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </BlogSection>
    </BlogLayout>
  )
}


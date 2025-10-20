'use client'

/**
 * Author Modal - Shows author profile and their blog posts
 * Triggered by clicking author avatar in blog posts
 */

import { useState, useEffect } from 'react'
import { X, MapPin, Calendar, Eye, ExternalLink } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import Link from 'next/link'

interface AuthorModalProps {
  isOpen: boolean
  onClose: () => void
  author: {
    id: string
    name: string
    username?: string
    avatar?: string
    bio?: string
    expertise?: string[]
    writing_style?: any
    travel_preferences?: any
  }
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string
  published_at: string
  category: string
  view_count: number
  tags: string[]
}

export function AuthorModal({ isOpen, onClose, author }: AuthorModalProps) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && author.id) {
      loadAuthorPosts()
    }
  }, [isOpen, author.id])

  const loadAuthorPosts = async () => {
    setLoading(true)
    try {
      const supabase = getBrowserSupabase()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, published_at, category, view_count, tags')
        .eq('author_id', author.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading author posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Get persona type from writing style
  const personaType = author.writing_style?.tone || 'explorer'
  const travelStyle = author.travel_preferences?.travel_style || 'adventurous'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Author Header */}
            <div className="relative bg-gradient-to-br from-rausch-500 to-kazan-500 text-white p-8 pb-12">
              <div className="flex items-start gap-6">
                {/* Large Avatar */}
                <div className="relative">
                  <Avatar
                    src={author.avatar}
                    alt={author.name}
                    size="xl"
                    fallback={author.name[0]}
                    className="ring-4 ring-white/30"
                  />
                  {/* Persona Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {personaType}
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{author.name}</h2>
                  {author.username && (
                    <p className="text-white/80 mb-3">@{author.username}</p>
                  )}
                  {author.bio && (
                    <p className="text-white/90 text-lg mb-4 leading-relaxed">
                      {author.bio}
                    </p>
                  )}

                  {/* Expertise Tags */}
                  {author.expertise && author.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {author.expertise.slice(0, 5).map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Travel Style */}
              {travelStyle && (
                <div className="mt-6 flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    Travel Style: <span className="font-semibold capitalize">{travelStyle}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Posts Section */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Stories by {author.name.split(' ')[0]}
                </h3>
                <span className="text-sm text-gray-500">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rausch-500" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No published posts yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/posts/${post.slug}`}
                      onClick={onClose}
                      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Post Image */}
                      <div className="relative aspect-video overflow-hidden bg-gray-100">
                        {post.featured_image ? (
                          <OptimizedImage
                            src={post.featured_image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <MapPin className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        {/* Category Badge */}
                        {post.category && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 text-gray-900 shadow-lg">
                              {post.category}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-rausch-600 transition-colors">
                          {post.title}
                        </h4>
                        {post.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {post.view_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.view_count}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* View All Link */}
              {posts.length >= 6 && (
                <div className="text-center mt-8">
                  <Link
                    href={`/blog/author/${author.username || author.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-rausch-600 hover:text-rausch-700 font-semibold"
                  >
                    View all posts by {author.name.split(' ')[0]}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


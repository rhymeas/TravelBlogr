'use client'

/**
 * Blog Post Page
 * 
 * Individual blog post page with content, author info, and related posts.
 */

import { use } from 'react'
import { useBlogPost } from '@/hooks/useBlogData'
import { BlogLayout, BlogSection } from '@/components/blog/BlogLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { BlogCommentSection } from '@/components/blog/BlogCommentSection'
import { SocialShare } from '@/components/blog/SocialShare'
import { Calendar, Clock, Eye } from 'lucide-react'

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { post, isLoading, error } = useBlogPost(slug)

  if (isLoading) {
    return (
      <BlogLayout maxWidth="lg">
        <div className="animate-pulse space-y-8 py-12">
          <div className="h-12 bg-gray-200 rounded w-3/4" />
          <div className="h-96 bg-gray-200 rounded" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </BlogLayout>
    )
  }

  if (error || !post) {
    return (
      <BlogLayout maxWidth="lg">
        <div className="text-center py-24">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <a href="/blog" className="text-rausch-600 hover:underline">
            ← Back to Blog
          </a>
        </div>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout maxWidth="lg">
      <article className="py-12">
        {/* Header */}
        <header className="mb-12">
          {/* Category/Tags */}
          {post.category && (
            <div className="mb-4">
              <Badge className="bg-rausch-100 text-rausch-700 border-0">
                {post.category}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>5 min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.view_count || 0} views</span>
            </div>
          </div>

          {/* Author */}
          {post.profiles && (
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
              <Avatar
                src={post.profiles.avatar_url}
                alt={post.profiles.full_name || post.profiles.username}
                fallback={(post.profiles.full_name || post.profiles.username || 'U')[0]}
                className="h-12 w-12"
              />
              <div>
                <p className="font-medium text-gray-900">
                  {post.profiles.full_name || post.profiles.username}
                </p>
                <p className="text-sm text-gray-600">Author</p>
              </div>
            </div>
          )}
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-12 rounded-2xl overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {/* TODO: Render rich content from Novel editor */}
          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Social Share */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <SocialShare
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={post.title}
            description={post.excerpt}
            hashtags={post.tags || []}
            variant="buttons"
          />
        </div>
      </article>

      {/* Comments Section */}
      <BlogSection className="pb-16">
        <BlogCommentSection postId={post.id} />
      </BlogSection>
    </BlogLayout>
  )
}


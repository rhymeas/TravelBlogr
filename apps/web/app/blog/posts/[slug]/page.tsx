'use client'

/**
 * Blog Post Page
 *
 * Individual blog post page using BlogPostTemplate with maps, itinerary, and rich content.
 * Renders trip-based blog posts with day-by-day timeline and interactive features.
 */

import { useBlogPost } from '@/hooks/useBlogData'
import { BlogPostTemplate } from '@/components/blog/BlogPostTemplate'
import Head from 'next/head'

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { post, isLoading, error } = useBlogPost(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-[500px] bg-gray-200" />
          <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
            <div className="h-12 bg-gray-200 rounded w-3/4" />
            <div className="h-96 bg-gray-200 rounded" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-24 px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <a href="/blog/posts" className="text-rausch-600 hover:underline">
            ← Back to Blog
          </a>
        </div>
      </div>
    )
  }

  // Parse content from JSONB structure
  const content = typeof post.content === 'string'
    ? JSON.parse(post.content)
    : post.content

  // Extract trip data from content
  const tripData = {
    destination: content.destination || 'Unknown Destination',
    durationDays: content.days?.length || 0,
    tripType: post.category?.toLowerCase().replace(' ', '-') || 'adventure',
    budget: content.budget,
    highlights: content.highlights || [],
    days: content.days || []
  }

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.featured_image || '',
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.profiles?.full_name || post.profiles?.username || 'Anonymous',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TravelBlogr',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': typeof window !== 'undefined' ? window.location.href : '',
    },
  }

  return (
    <>
      {/* Structured Data */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <BlogPostTemplate
        title={post.title}
        excerpt={post.excerpt || ''}
        coverImage={post.featured_image || '/images/placeholder-trip.jpg'}
        publishedAt={post.published_at || post.created_at}
        readTime={content.readTime || 10}
        author={{
          name: post.profiles?.full_name || post.profiles?.username || 'Anonymous',
          avatar: post.profiles?.avatar_url,
          bio: post.profiles?.bio
        }}
        trip={tripData}
        introduction={content.introduction}
        practicalInfo={content.practicalInfo}
        tags={post.tags || []}
        category={post.category}
        viewCount={post.view_count || 0}
        likeCount={0}
      />
    </>
  )
}


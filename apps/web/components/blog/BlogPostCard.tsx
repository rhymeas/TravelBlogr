'use client'

/**
 * BlogPostCard Component
 * 
 * Beautiful blog post card matching the /examples page style
 * Used in blog listings and "More Inspiring Stories" sections
 */

import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, Share2, MapPin, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

interface BlogPostCardProps {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage: string
  author: {
    name: string
    avatar?: string
  }
  destination: string
  duration?: string
  tags: string[]
  stats: {
    views: number
    likes: number
    shares?: number
  }
  publishedAt: string
  featured?: boolean
  className?: string
}

export function BlogPostCard({
  id,
  title,
  slug,
  excerpt,
  featuredImage,
  author,
  destination,
  duration,
  tags,
  stats,
  publishedAt,
  featured = false,
  className = ''
}: BlogPostCardProps) {
  const postUrl = `/blog/posts/${slug}`

  if (featured) {
    // Featured card - larger, more prominent
    return (
      <Link href={postUrl} className={`group cursor-pointer block ${className}`}>
        <div className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden">
          <div className="relative h-64 lg:h-80">
            <OptimizedImage
              src={featuredImage}
              alt={title}
              fill
              preset="hero"
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h3 className="text-title-large font-bold text-white mb-2">
                {title}
              </h3>
              <p className="text-body-medium text-white/90 mb-3 line-clamp-2">
                {excerpt}
              </p>
              <div className="flex items-center justify-between text-white/80 text-body-small">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {destination}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-body-medium text-airbnb-dark-gray mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-body-small text-airbnb-gray">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {stats.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {stats.likes.toLocaleString()}
                </span>
                {stats.shares && (
                  <span className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    {stats.shares}
                  </span>
                )}
              </div>
              <p className="text-body-small text-airbnb-gray">
                by {author.name}
              </p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Regular card - compact grid layout
  return (
    <Link href={postUrl} className={`group cursor-pointer block ${className}`}>
      <div className="card-elevated hover:shadow-airbnb-large transition-all duration-300 overflow-hidden h-full">
        <div className="relative h-48">
          <OptimizedImage
            src={featuredImage}
            alt={title}
            fill
            preset="card"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h4 className="text-body-large font-semibold text-white mb-1 line-clamp-2">
              {title}
            </h4>
            <p className="text-body-small text-white/90">
              {destination} {duration && `• ${duration}`}
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-body-small text-airbnb-dark-gray mb-3 line-clamp-2">
            {excerpt}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-body-small text-airbnb-gray">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {stats.views >= 1000 ? `${(stats.views / 1000).toFixed(1)}k` : stats.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {stats.likes}
              </span>
            </div>
            <p className="text-xs truncate max-w-[100px]">
              {author.name}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * BlogPostCardSkeleton - Loading state
 */
export function BlogPostCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="card-elevated overflow-hidden">
        <div className="relative h-64 lg:h-80 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-rausch-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-elevated overflow-hidden h-full">
      <div className="relative h-48 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-rausch-500"></div>
      </div>
    </div>
  )
}


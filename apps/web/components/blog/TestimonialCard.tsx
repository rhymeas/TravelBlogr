'use client'

/**
 * TestimonialCard - Blog Testimonial Card Component
 * 
 * A card component for displaying user testimonials and reviews.
 * Follows existing TravelBlogr design patterns with avatar, quote, rating, and author info.
 * 
 * Use cases:
 * - Testimonials section on blog homepage
 * - User reviews on trip pages
 * - Social proof sections
 */

import { Star, Quote } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

export interface TestimonialData {
  id: string
  content: string
  author: {
    name: string
    role?: string
    location?: string
    avatar?: string
  }
  rating?: number
  trip?: string
  date?: string
}

interface TestimonialCardProps {
  testimonial: TestimonialData
  variant?: 'default' | 'compact' | 'featured'
  showQuoteIcon?: boolean
  className?: string
}

export function TestimonialCard({
  testimonial,
  variant = 'default',
  showQuoteIcon = true,
  className = ''
}: TestimonialCardProps) {
  const { content, author, rating, trip, date } = testimonial

  // Compact variant - minimal design
  if (variant === 'compact') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Avatar
            src={author.avatar}
            alt={author.name}
            fallback={author.name.split(' ').map(n => n[0]).join('')}
            className="h-10 w-10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 italic line-clamp-2">
              "{content}"
            </p>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">{author.name}</p>
              {author.role && (
                <p className="text-xs text-gray-500">{author.role}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Featured variant - large with extra details
  if (variant === 'featured') {
    return (
      <Card className={`p-8 relative group hover:shadow-xl transition-all duration-300 ${className}`}>
        {/* Quote Icon */}
        {showQuoteIcon && (
          <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
            <Quote className="h-12 w-12 text-rausch-500" />
          </div>
        )}

        {/* Rating */}
        {rating && (
          <div className="flex items-center mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < rating
                    ? 'text-amber-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 italic">
          "{content}"
        </blockquote>

        {/* Trip Reference */}
        {trip && (
          <div className="mb-6 p-4 bg-gradient-to-r from-rausch-50 to-kazan-50 rounded-lg border border-rausch-100/50">
            <p className="text-sm text-rausch-700 font-medium">
              ✨ {trip}
            </p>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-4">
          <Avatar
            src={author.avatar}
            alt={author.name}
            fallback={author.name.split(' ').map(n => n[0]).join('')}
            className="h-14 w-14 ring-2 ring-rausch-100"
          />
          <div>
            <p className="font-semibold text-gray-900">{author.name}</p>
            {author.role && (
              <p className="text-sm text-gray-600">{author.role}</p>
            )}
            {author.location && (
              <p className="text-sm text-gray-500">{author.location}</p>
            )}
          </div>
        </div>

        {/* Date */}
        {date && (
          <p className="text-xs text-gray-400 mt-4">{date}</p>
        )}
      </Card>
    )
  }

  // Default variant - standard testimonial card
  return (
    <Card className={`p-6 relative group hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Quote Icon */}
      {showQuoteIcon && (
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Quote className="h-8 w-8 text-rausch-500" />
        </div>
      )}

      {/* Rating */}
      {rating && (
        <div className="flex items-center mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating
                  ? 'text-amber-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <blockquote className="text-gray-700 leading-relaxed mb-4 italic">
        "{content}"
      </blockquote>

      {/* Trip Reference */}
      {trip && (
        <div className="mb-4 p-3 bg-gradient-to-r from-rausch-50 to-kazan-50 rounded-lg border border-rausch-100/50">
          <p className="text-sm text-rausch-700 font-medium">
            ✨ {trip}
          </p>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar
          src={author.avatar}
          alt={author.name}
          fallback={author.name.split(' ').map(n => n[0]).join('')}
          className="h-12 w-12 ring-2 ring-rausch-100"
        />
        <div>
          <p className="font-medium text-gray-900">{author.name}</p>
          {author.role && (
            <p className="text-sm text-gray-600">{author.role}</p>
          )}
          {author.location && (
            <p className="text-sm text-gray-500">{author.location}</p>
          )}
        </div>
      </div>

      {/* Date */}
      {date && (
        <p className="text-xs text-gray-400 mt-3">{date}</p>
      )}
    </Card>
  )
}

/**
 * TestimonialCardSkeleton - Loading state for TestimonialCard
 */
export function TestimonialCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <Card className="p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  const padding = variant === 'featured' ? 'p-8' : 'p-6'

  return (
    <Card className={`${padding} animate-pulse`}>
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Example Usage:
 * 
 * // Default variant
 * <TestimonialCard testimonial={{
 *   id: '1',
 *   content: 'TravelBlogr made planning our honeymoon so easy!',
 *   author: {
 *     name: 'Sarah Johnson',
 *     role: 'Travel Enthusiast',
 *     location: 'New York, USA',
 *     avatar: '/avatars/sarah.jpg'
 *   },
 *   rating: 5,
 *   trip: 'Bali Honeymoon Adventure'
 * }} />
 * 
 * // Featured variant
 * <TestimonialCard 
 *   testimonial={testimonialData} 
 *   variant="featured" 
 * />
 * 
 * // Compact variant
 * <TestimonialCard 
 *   testimonial={testimonialData} 
 *   variant="compact" 
 *   showQuoteIcon={false} 
 * />
 */


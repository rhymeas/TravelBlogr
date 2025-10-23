'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Camera, 
  ArrowRight, 
  Clock,
  Star,
  Heart,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useFeaturedContent, FeaturedTrip } from '@/hooks/useFeaturedContent'

// Timeline item component
function JourneyTimelineItem({ 
  trip, 
  index, 
  isLast 
}: { 
  trip: FeaturedTrip
  index: number
  isLast: boolean 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate) return 'Dates TBD'
    
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null
    
    if (end) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }
    return format(start, 'MMM d, yyyy')
  }

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-8 top-24 w-0.5 h-32 bg-gradient-to-b from-rausch-500 to-rausch-300 z-0"></div>
      )}
      
      {/* Timeline dot */}
      <div className="absolute left-6 top-8 w-4 h-4 bg-rausch-500 rounded-full border-4 border-white shadow-sleek-medium z-10"></div>
      
      {/* Content card */}
      <div className="ml-16 mb-16">
        <div className="card-elevated overflow-hidden hover:shadow-sleek-xl transition-all duration-500 group">
          {/* Image section */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={trip.cover_image || '/placeholder-trip.jpg'}
              alt={trip.title}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Image overlay with date */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-sleek-small px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-rausch-500" />
                <span className="font-medium text-sleek-black">
                  {formatDateRange(trip.start_date, trip.end_date)}
                </span>
              </div>
            </div>

            {/* Duration badge */}
            {trip.duration && (
              <div className="absolute top-4 right-4 bg-rausch-500 text-white rounded-sleek-small px-3 py-2">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  {trip.duration} days
                </div>
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-title-medium text-sleek-black mb-2 group-hover:text-rausch-500 transition-colors">
                  {trip.title}
                </h3>
                <p className="text-body-large text-sleek-dark-gray leading-relaxed line-clamp-2">
                  {trip.description || 'An amazing journey awaits...'}
                </p>
              </div>
              
              {/* Author info */}
              <div className="flex items-center gap-2 ml-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {trip.author.avatar_url ? (
                    <Image
                      src={trip.author.avatar_url}
                      alt={trip.author.full_name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {trip.author.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-sleek-black">{trip.author.full_name}</p>
                  <p className="text-sleek-dark-gray">@{trip.author.username || 'traveler'}</p>
                </div>
              </div>
            </div>

            {/* Trip stats */}
            <div className="flex items-center gap-6 mb-4 text-sm text-sleek-dark-gray">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{trip.postsCount} locations</span>
              </div>
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                <span>{trip.posts.reduce((acc, post) => acc + (post.view_count || 0), 0)} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{trip.posts.reduce((acc, post) => acc + (post.like_count || 0), 0)} likes</span>
              </div>
              {trip.totalDistance && (
                <div className="flex items-center gap-1">
                  <span>🛣️</span>
                  <span>{trip.totalDistance.toLocaleString()} km</span>
                </div>
              )}
            </div>

            {/* Featured posts preview */}
            {trip.posts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-body-medium font-semibold text-sleek-black mb-3">
                  📖 Recent Stories
                </h4>
                <div className="space-y-2">
                  {trip.posts.slice(0, 2).map((post) => (
                    <div key={post.id} className="flex items-center gap-3 p-2 rounded-sleek-small hover:bg-gray-50 transition-colors">
                      {post.featured_image && (
                        <div className="w-12 h-12 rounded-sleek-small overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-medium font-medium text-sleek-black truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-3 text-body-small text-sleek-dark-gray">
                          <span>{format(new Date(post.post_date), 'MMM d')}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.view_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* "Did you know?" fact box - Kanada Reise style */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-sleek-small p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-800 text-sm">💡</span>
                </div>
                <div>
                  <p className="text-body-medium font-semibold text-yellow-800 mb-1">
                    Did you know?
                  </p>
                  <p className="text-body-small text-yellow-700">
                    This journey covers {trip.postsCount} unique destinations and has inspired {trip.posts.reduce((acc, post) => acc + (post.like_count || 0), 0)} fellow travelers!
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <Link
              href={`/trips/${trip.slug}`}
              className="btn-primary w-full justify-center hover:scale-105 transition-transform"
            >
              View Journey Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturedJourneys() {
  const { trips, isLoading, error } = useFeaturedContent()

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sleek-dark-gray">Unable to load featured journeys at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-display-small text-sleek-black mb-4">
            Featured Journeys
          </h2>
          <p className="text-body-large text-sleek-dark-gray max-w-2xl mx-auto leading-relaxed">
            Discover inspiring travel stories from our community. Each journey tells a unique story 
            of adventure, discovery, and unforgettable memories.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-rausch-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sleek-dark-gray">Loading amazing journeys...</p>
          </div>
        )}

        {/* Timeline */}
        {!isLoading && trips.length > 0 && (
          <div className="relative max-w-4xl mx-auto">
            {trips.map((trip, index) => (
              <JourneyTimelineItem
                key={trip.id}
                trip={trip}
                index={index}
                isLast={index === trips.length - 1}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && trips.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-title-small text-sleek-black mb-2">No featured journeys yet</h3>
            <p className="text-sleek-dark-gray mb-6">Be the first to share your amazing travel story!</p>
            <Link href="/auth/signup" className="btn-primary">
              Start Your Journey
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && trips.length > 0 && (
          <div className="text-center mt-16">
            <Link
              href="/locations"
              className="btn-secondary px-8 py-4 text-body-large font-semibold rounded-sleek-small hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Explore All Destinations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

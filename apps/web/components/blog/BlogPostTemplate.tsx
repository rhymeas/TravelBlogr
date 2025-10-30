'use client'

/**
 * BlogPostTemplate - Consistent template for trip-based blog posts
 *
 * Inspired by /trips-library/family-tokyo-adventure
 * Features:
 * - Beautiful hero with cover image
 * - Trip metadata (duration, destination, type)
 * - Day-by-day itinerary with timeline
 * - Interactive map integration (TripOverviewMap)
 * - User-editable content sections
 * - Affiliate links integration
 * - Social sharing
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { AuthorModal } from '@/components/blog/AuthorModal'
import { AccommodationCTA } from '@/components/blog/AccommodationCTA'
import { ActivitiesCTA } from '@/components/blog/ActivitiesCTA'
import { AuthorMonetizationPromo } from '@/components/blog/AuthorMonetizationPromo'
import { BlogPostCard, BlogPostCardSkeleton } from '@/components/blog/BlogPostCard'
import { HorizontalAd, VerticalAd, RectangularAd } from '@/components/ads/GoogleAd'
import { generateTravelpayoutsActivitiesLink, trackAffiliateClick } from '@/lib/utils/affiliateLinks'
import { generateSmartLinksForActivities } from '@/lib/utils/smartAffiliateLinks'
import { useBlogPosts } from '@/hooks/useBlogData'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Compass,
  Bus,
  Train,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { AddToTripModal } from '@/components/blog/AddToTripModal'


// Dynamically import TripOverviewMap to avoid SSR issues
const TripOverviewMap = dynamic(
  () => import('@/components/itinerary/TripOverviewMap').then(mod => ({ default: mod.TripOverviewMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-rausch-500"></div>
      </div>
    )
  }
)

interface TripDay {
  day_number: number
  title: string
  description: string
  activities: string[]
  tips?: string
  images?: Array<{
    url: string
    alt: string
    caption?: string
    size: 'small' | 'medium' | 'large' | 'full'
    aspectRatio: '16:9' | '4:3' | '1:1'
    position: number
  }>
  location?: {
    name: string
    translatedName?: string
    originalName?: string
    coordinates?: { lat: number; lng: number }
    image?: string
    pois?: Array<{
      name: string
      translatedName?: string
      originalName?: string
      category: string
      description?: string
      coordinates?: { lat: number; lng: number }
    }>
    transportation?: {
      providers?: string[]
      tips?: string
    }
  }
  smartAffiliateLinks?: Array<{
    url: string
    text: string
    provider: string
    icon?: string
  }>
}

interface BlogPostTemplateProps {
  // Post metadata
  title: string
  excerpt: string
  coverImage: string
  publishedAt: string
  readTime?: number

  // Author info
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

  // Trip data
  trip: {
    destination: string
    durationDays: number
    tripType: string
    budget?: string
    highlights: string[]
    days: TripDay[]
  }

  // Content sections (user-editable)
  introduction?: string
  practicalInfo?: {
    bestTime?: string
    budget?: string
    packing?: string[]
    customs?: string[]
  }

  // Engagement
  tags?: string[]
  category?: string
  viewCount?: number
  likeCount?: number

  // Business elements
  postId?: string
  enableAffiliateLinks?: boolean
  enableGoogleAds?: boolean
}

export function BlogPostTemplate({
  title,
  excerpt,
  coverImage,
  publishedAt,
  readTime = 10,
  author,
  trip,
  introduction,
  practicalInfo,
  tags = [],
  category,
  viewCount = 0,
  likeCount = 0,
  postId,
  enableAffiliateLinks = true,
  enableGoogleAds = true
}: BlogPostTemplateProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]) // First day expanded by default
  const [showMapModal, setShowMapModal] = useState(false)
  const [showAuthorModal, setShowAuthorModal] = useState(false)

  // Add-to-Trip modal state
  const [addOpen, setAddOpen] = useState(false)
  const [addItems, setAddItems] = useState<Array<{ title: string; type?: 'activity'|'meal'|'travel'|'note'; image?: string }>>([])

  // Fetch related blog posts (same category or tags)
  const { posts: relatedPosts, isLoading: loadingRelated } = useBlogPosts({
    status: 'published',
    category,
    limit: 6
  })

  // Filter out current post and limit to 3
  const moreStories = relatedPosts
    .filter((post: any) => post.id !== postId)
    .slice(0, 3)

  // Debug: Log trip data to see what we're getting
  console.log('BlogPostTemplate - Trip data:', {
    daysCount: trip.days.length,
    firstDay: trip.days[0],
    hasImages: trip.days.some(d => d.images && d.images.length > 0),
    hasLocationImages: trip.days.some(d => d.location?.image)
  })

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev =>
      prev.includes(dayNumber)
        ? prev.filter(d => d !== dayNumber)
        : [...prev, dayNumber]
    )
  }

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
  }

  return (
    <article className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <OptimizedImage
          src={coverImage}
          alt={title}
          fill
          preset="hero"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 pb-12 w-full">
            {/* Category Badge */}
            {category && (
              <Badge className="mb-4 bg-white/90 text-gray-900 border-0 shadow-lg">
                {category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-white/90 mb-6 max-w-3xl">
              {excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">{trip.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{trip.durationDays} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{readTime} min read</span>
              </div>
              {trip.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="capitalize">{trip.budget}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT COLUMN - Main Content (2/3 width) - CENTERED */}
        <div className="lg:col-span-2 mx-auto w-full max-w-3xl">
          {/* Author Info - Clickable */}
          <div className="flex items-center justify-between mb-12 pb-8 border-b border-gray-200">
          <button
            onClick={() => setShowAuthorModal(true)}
            className="flex items-center gap-4 group hover:bg-gray-50 -m-2 p-2 rounded-lg transition-all"
          >
            <div className="relative">
              <Avatar
                src={author.avatar}
                alt={author.name}
                size="lg"
                fallback={author.name[0]}
                className="ring-2 ring-transparent group-hover:ring-rausch-500 transition-all"
              />
              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-full bg-rausch-500/0 group-hover:bg-rausch-500/10 transition-all" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 group-hover:text-rausch-600 transition-colors">
                {author.name}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-rausch-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                View all posts →
              </p>
            </div>
          </button>

            {/* Engagement Stats */}
            <div className="flex items-center gap-6 text-gray-600">
              <button className="flex items-center gap-2 hover:text-rausch-500 transition-colors">
                <Heart className="h-5 w-5" />
                <span className="text-sm">{likeCount}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-rausch-500 transition-colors">
                <Share2 className="h-5 w-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>

          {/* Trip Type Badge */}
          <div className="mb-8">
            <span className={`inline-flex items-center gap-2 px-4 py-2 ${tripTypeColors[trip.tripType] || 'bg-gray-100 text-gray-700'} rounded-full font-semibold capitalize`}>
              <Compass className="h-4 w-4" />
              {trip.tripType.replace('-', ' ')} Trip
            </span>
          </div>

          {/* Introduction */}
          {introduction && (
            <div className="prose prose-lg max-w-none mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why This Trip is Special</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{introduction}</p>
            </div>
          )}

        {/* Google Ad - Top Horizontal */}
        {enableGoogleAds && (
          <div className="mb-12">
            <HorizontalAd slot="blog-top-horizontal" />
          </div>
        )}

        {/* Affiliate - Accommodation CTA */}
        {enableAffiliateLinks && (
          <div className="mb-12">
            <AccommodationCTA
              destination={trip.destination}
              postId={postId}
            />
          </div>
        )}

        {/* Trip Highlights */}
        {trip.highlights && trip.highlights.length > 0 && (
          <Card className="p-8 mb-12 bg-gradient-to-br from-rausch-50 to-orange-50 border-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-rausch-500 fill-rausch-500" />
              Trip Highlights
            </h3>
            <ul className="grid md:grid-cols-2 gap-4">
              {trip.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rausch-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-gray-800 font-medium">{highlight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

          {/* Day-by-Day Itinerary */}
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Day-by-Day Itinerary</h2>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
            {trip.days.map((day) => {
              const isExpanded = expandedDays.includes(day.day_number)

              return (
                <Card key={day.day_number} className="overflow-hidden">
                  {/* Day Header - Always Visible */}
                  <button
                    onClick={() => toggleDay(day.day_number)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-rausch-500 text-white rounded-full flex items-center justify-center font-bold">
                        {day.day_number}
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-gray-900">{day.title}</h3>
                        {day.location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {day.location.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400" />
                    )}
                  </button>

                  {/* Day Content - Expandable */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Day Images - from BlogPostEnhancer */}
                      {day.images && day.images.length > 0 && (
                        <div className="space-y-4 mb-6 mt-6">
                          {day.images.map((image: any, imgIndex: number) => (
                            <div
                              key={imgIndex}
                              className={`relative rounded-lg overflow-hidden ${
                                image.size === 'full' ? 'h-96' :
                                image.size === 'large' ? 'h-72' :
                                image.size === 'medium' ? 'h-56' : 'h-40'
                              }`}
                            >
                              <OptimizedImage
                                src={image.url}
                                alt={image.alt || day.title}
                                fill
                                className="object-cover"
                              />
                              {image.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                  <p className="text-white text-sm">{image.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fallback: Location Image */}
                      {(!day.images || day.images.length === 0) && day.location?.image && (
                        <div className="relative h-56 rounded-lg overflow-hidden mb-6 mt-6">
                          <OptimizedImage
                            src={day.location.image}
                            alt={day.location.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {day.location?.translatedName || day.location.name}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-gray-700 leading-relaxed mb-6 mt-6">{day.description}</p>

                      {/* POIs - Points of Interest */}
                      {day.location?.pois && day.location.pois.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Compass className="h-5 w-5 text-rausch-500" />
                            Places to Explore
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {day.location.pois.map((poi, index) => (
                              <div key={index} className="flex items-stretch gap-2">
                                <Link
                                  href={`/locations/${encodeURIComponent(poi.name.toLowerCase().replace(/\s+/g, '-'))}`}
                                  className="flex-1 flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-rausch-300 hover:bg-rausch-50 transition-all group"
                                >
                                  <div className="flex-shrink-0 w-10 h-10 bg-rausch-100 rounded-lg flex items-center justify-center group-hover:bg-rausch-200 transition-colors">
                                    <MapPin className="h-5 w-5 text-rausch-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 group-hover:text-rausch-600 transition-colors flex items-center gap-1">
                                      {poi.translatedName || poi.name}
                                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    {poi.originalName && poi.originalName !== poi.name && (
                                      <p className="text-xs text-gray-500 mt-0.5">{poi.originalName}</p>
                                    )}
                                    {poi.description && (
                                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{poi.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{poi.category}</p>
                                  </div>
                                </Link>
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddItems([{ title: (poi.translatedName || poi.name), type: 'activity' }]); setAddOpen(true) }}
                                  className="self-start px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                  aria-label="Add to Trip"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities with Smart Affiliate Links */}
                      {day.activities && day.activities.length > 0 && (() => {
                        // Use pre-generated smart links from BlogPostEnhancer if available
                        // Otherwise generate them on-the-fly (for backward compatibility)
                        const smartLinks = day.smartAffiliateLinks || generateSmartLinksForActivities(
                          day.activities,
                          day.location?.name || trip.destination
                        )

                        return (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">🎯 Top Activities</h4>

                            {/* Activity List with Inline Links */}
                            <ul className="space-y-3">
                              {day.activities.map((activity, index) => {
                                const activityLink = generateSmartLinksForActivities(
                                  [activity],
                                  day.location?.name || trip.destination
                                )[0]

                                return (
                                  <li key={index} className="flex items-start gap-2 text-gray-700">
                                    <span className="text-rausch-500 mt-1">•</span>
                                    <div className="flex-1">
                                      <span>{activity}</span>
                                      {activityLink && (
                                        <a
                                          href={activityLink.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => {
                                            trackAffiliateClick(
                                              activityLink.provider,
                                              day.location?.name || trip.destination,
                                              'blog_post_activity_inline',
                                              postId
                                            )
                                          }}
                                          className="ml-2 text-xs text-rausch-600 hover:text-rausch-700 underline underline-offset-2"
                                        >
                                          {activityLink.icon} {activityLink.text} →
                                        </a>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>

                            {/* Smart Link Buttons */}
                            {smartLinks.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {smartLinks.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                      trackAffiliateClick(
                                        link.provider,
                                        day.location?.name || trip.destination,
                                        'blog_post_smart_link',
                                        postId
                                      )
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    <span>{link.icon}</span>
                                    <span>{link.text}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Transportation Info */}
                      {day.location?.transportation && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Bus className="h-5 w-5" />
                            Getting Around
                          </h4>
                          {day.location.transportation.providers && day.location.transportation.providers.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-blue-800 mb-2">Public Transportation:</p>
                              <div className="flex flex-wrap gap-2">
                                {day.location.transportation.providers.map((provider, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-700"
                                  >
                                    <Train className="h-3 w-3" />
                                    {provider}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {day.location.transportation.tips && (
                            <p className="text-sm text-blue-700">{day.location.transportation.tips}</p>
                          )}
                        </div>
                      )}

                      {/* Pro Tips */}
                      {day.tips && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                          <p className="font-semibold text-yellow-900 mb-1">💡 Pro Tip</p>
                          <p className="text-yellow-800 text-sm">{day.tips}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Business Elements - After Day 3 */}
                  {day.day_number === 3 && (
                    <>
                      {/* Google Ad - Middle Rectangular */}
                      {enableGoogleAds && (
                        <div className="my-8">
                          <RectangularAd slot="blog-middle-rectangular" />
                        </div>
                      )}

                      {/* Affiliate - Activities CTA */}
                      {enableAffiliateLinks && (
                        <div className="my-8">
                          <ActivitiesCTA
                            destination={trip.destination}
                            postId={postId}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {/* Practical Information */}
        {practicalInfo && (
          <Card className="p-8 mb-12 bg-gray-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Practical Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {practicalInfo.bestTime && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-rausch-500" />
                    Best Time to Visit
                  </h3>
                  <p className="text-gray-700">{practicalInfo.bestTime}</p>
                </div>
              )}
              {practicalInfo.budget && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-rausch-500" />
                    Budget Estimate
                  </h3>
                  <p className="text-gray-700">{practicalInfo.budget}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Google Ad - Bottom Horizontal */}
        {enableGoogleAds && (
          <div className="mb-12">
            <HorizontalAd slot="blog-bottom-horizontal" />
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Author Monetization Promo - Inline */}
        <div className="mb-12">
          <AuthorMonetizationPromo variant="inline" />
        </div>

          {/* CTA - Plan Your Trip */}
          <Card className="p-8 bg-gradient-to-br from-rausch-500 to-kazan-500 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Plan Your Own Adventure?</h3>
            <p className="text-white/90 mb-6">
              Use our AI-powered trip planner to create your perfect itinerary in minutes
            </p>
            <Link
              href="/plan"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rausch-600 rounded-full font-semibold hover:bg-gray-100 transition-all hover:scale-105"
            >
              Start Planning Free
            </Link>
          </Card>
        </div>

        {/* RIGHT COLUMN - Sidebar (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Interactive Map - Sleek Design */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Journey Map</h3>
                  <p className="text-xs text-gray-500">{trip.days.length} stops</p>
                </div>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
                >
                  Expand
                </button>
              </div>
              <div className="relative">
                <TripOverviewMap
                  locations={trip.days
                    .filter(day => day.location?.coordinates)
                    .map((day) => ({
                      name: day.location?.translatedName || day.title,
                      latitude: day.location!.coordinates!.lat,
                      longitude: day.location!.coordinates!.lng
                    }))}
                  transportMode="car"
                  className="h-[calc(100vh-200px)] min-h-[600px]"
                />
              </div>
            </div>

            {/* Google Ad - Vertical Sidebar */}
            {enableGoogleAds && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2 text-center">Advertisement</p>
                <VerticalAd slot="sidebar-ad-1" />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* More Inspiring Stories Section */}
      {moreStories.length > 0 && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-rausch-50/30 to-kazan-50/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-display-medium font-bold text-sleek-black mb-4">
                More Inspiring Stories
              </h3>
              <p className="text-body-medium text-sleek-dark-gray">
                Discover more travel experiences from our community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingRelated ? (
                <>
                  <BlogPostCardSkeleton />
                  <BlogPostCardSkeleton />
                  <BlogPostCardSkeleton />
                </>
              ) : (
                moreStories.map((post: any) => {
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
                    />
                  )
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* Author Modal */}
      <AuthorModal
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
        author={author}
      />

      {/* Map Modal - Expandable Full Screen */}
      {showMapModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMapModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Journey Map</h3>
                <p className="text-sm text-gray-600">{trip.destination} • {trip.days.length} stops</p>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TripOverviewMap
              locations={trip.days
                .filter(day => day.location?.coordinates)
                .map((day) => ({
                  name: day.location?.translatedName || day.title,
                  latitude: day.location!.coordinates!.lat,
                  longitude: day.location!.coordinates!.lng
                }))}
              transportMode="car"
              className="h-[calc(90vh-80px)]"
            />
          </div>
        </div>
      )}
      {/* Add-to-Trip Modal */}
      <AddToTripModal open={addOpen} onClose={() => setAddOpen(false)} items={addItems} />

    </article>
  )
}


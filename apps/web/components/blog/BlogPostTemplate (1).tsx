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
  Compass
} from 'lucide-react'
import Link from 'next/link'

// Dynamically import TripOverviewMap to avoid SSR issues
const TripOverviewMap = dynamic(
  () => import('@/components/itinerary/TripOverviewMap').then(mod => ({ default: mod.TripOverviewMap })),
  { ssr: false, loading: () => <div className="h-[600px] bg-gray-100 animate-pulse rounded-lg" /> }
)

interface TripDay {
  day_number: number
  title: string
  description: string
  activities: string[]
  tips?: string
  location?: {
    name: string
    coordinates?: { lat: number; lng: number }
  }
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
    name: string
    avatar?: string
    bio?: string
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
  likeCount = 0
}: BlogPostTemplateProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]) // First day expanded by default
  const [showMap, setShowMap] = useState(false)

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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Author Info */}
        <div className="flex items-center justify-between mb-12 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Avatar
              src={author.avatar}
              alt={author.name}
              size="lg"
              fallback={author.name[0]}
            />
            <div>
              <p className="font-semibold text-gray-900">{author.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
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
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Day-by-Day Itinerary</h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
            >
              <MapPin className="h-4 w-4" />
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {/* Interactive Map */}
          {showMap && (
            <Card className="p-6 mb-8 bg-white shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Journey Map</h3>
                <p className="text-sm text-gray-600">Explore all {trip.days.length} stops on the interactive map</p>
              </div>
              <TripOverviewMap
                locations={trip.days
                  .filter(day => day.location?.coordinates)
                  .map((day) => ({
                    name: day.title,
                    latitude: day.location!.coordinates!.lat,
                    longitude: day.location!.coordinates!.lng
                  }))}
                transportMode="car"
                className="h-[600px] rounded-lg"
              />
            </Card>
          )}

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
                      <p className="text-gray-700 leading-relaxed mb-6 mt-6">{day.description}</p>
                      
                      {/* Activities */}
                      {day.activities && day.activities.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">🎯 Top Activities</h4>
                          <ul className="space-y-2">
                            {day.activities.map((activity, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <span className="text-rausch-500 mt-1">•</span>
                                <span>{activity}</span>
                              </li>
                            ))}
                          </ul>
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

        {/* CTA */}
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
    </article>
  )
}


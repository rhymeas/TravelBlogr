'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, Star, Eye, ArrowRight, Globe, Lock, MoreVertical, Edit, Trash2, Share2 } from 'lucide-react'

interface Trip {
  id: string
  title: string
  slug: string
  description?: string
  cover_image?: string
  destination?: string
  duration_days?: number
  trip_type?: string
  highlights?: string[]
  is_featured?: boolean
  is_public_template?: boolean
  status: 'draft' | 'published' | 'archived'
  trip_stats?: {
    total_views: number
    unique_views: number
  }
  share_links?: any[]
  posts?: any[]
}

interface UnifiedTripCardV2Props {
  trip: Trip
  context: 'dashboard' | 'my-trips' | 'public-library'
  onEdit?: (tripId: string) => void
  onDelete?: (tripId: string) => void
  onShare?: (tripId: string) => void
}

export function UnifiedTripCardV2({ trip, context, onEdit, onDelete, onShare }: UnifiedTripCardV2Props) {
  const [showMenu, setShowMenu] = useState(false)

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
    solo: 'bg-indigo-100 text-indigo-700',
    romantic: 'bg-pink-100 text-pink-700',
  }

  // Determine link URL based on context
  const isPublicTemplate = trip.is_public_template
  const isPublished = trip.status === 'published'
  const isUserTrip = context === 'dashboard' || context === 'my-trips'
  
  // User trips go to CMS editor, public templates go to public view
  const linkUrl = isUserTrip 
    ? `/dashboard/trips/${trip.id}` 
    : `/trips/${trip.slug}`

  const viewCount = trip.trip_stats?.total_views || 0

  return (
    <Link href={linkUrl}>
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden">
          {trip.cover_image ? (
            <Image
              src={trip.cover_image}
              alt={trip.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rausch-400 to-babu-500 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white opacity-50" />
            </div>
          )}

          {/* Badges on image - EXACTLY like trips-library */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {/* Trip Type Badge */}
            {trip.trip_type && (
              <span className={`px-2.5 py-1 ${tripTypeColors[trip.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize backdrop-blur-sm`}>
                {trip.trip_type.replace('-', ' ')}
              </span>
            )}

            {/* Featured Badge - only show if featured */}
            {trip.is_featured && (
              <span className="px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-900" />
                Featured
              </span>
            )}
          </div>

          {/* Actions Menu for User Trips */}
          {isUserTrip && (onEdit || onDelete || onShare) && (
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setShowMenu(!showMenu)
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-700" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px] z-10">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        onEdit(trip.id)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Trip
                    </button>
                  )}
                  {onShare && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        onShare(trip.id)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        if (confirm('Are you sure you want to delete this trip?')) {
                          onDelete(trip.id)
                        }
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-rausch-500 transition-colors">
            {trip.title}
          </h3>

          <div className="flex items-center gap-3 text-gray-600 mb-3 text-sm">
            {trip.destination && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{trip.destination}</span>
              </div>
            )}
            {trip.duration_days && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{trip.duration_days} days</span>
              </div>
            )}
          </div>

          {trip.description && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-1">
              {trip.description}
            </p>
          )}

          {/* Highlights */}
          {trip.highlights && trip.highlights.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1.5">
                {trip.highlights.slice(0, 3).map((highlight, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {highlight}
                  </span>
                ))}
                {trip.highlights.length > 3 && (
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                    +{trip.highlights.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Eye className="h-4 w-4" />
              <span>{viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-rausch-500 font-semibold group-hover:gap-2 transition-all text-sm">
              <span>{isUserTrip ? 'Edit Trip' : 'View Guide'}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}


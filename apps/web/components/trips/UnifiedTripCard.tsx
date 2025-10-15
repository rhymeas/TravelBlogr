'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  MapPin,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Globe,
  Lock,
  Star,
  Copy,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ViewCountBadge } from '@/components/analytics/ViewCount'

interface UnifiedTripCardProps {
  trip: {
    id: string
    title: string
    description?: string
    slug: string
    cover_image?: string
    status: 'draft' | 'published' | 'archived'
    start_date?: string
    end_date?: string
    created_at: string
    updated_at: string
    destination?: string
    is_public_template?: boolean
    is_featured?: boolean
    view_count?: number
    posts?: any[]
    share_links?: any[]
  }
  context: 'dashboard' | 'my-trips' | 'public-library'
  onEdit?: () => void
  onDelete?: (tripId: string) => void
  onCopy?: (tripId: string) => void
}

export function UnifiedTripCard({ trip, context, onEdit, onDelete, onCopy }: UnifiedTripCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isUserTrip = context === 'my-trips' || context === 'dashboard'
  const isPublicTemplate = trip.is_public_template
  const postsCount = trip.posts?.length || 0
  const shareLinksCount = trip.share_links?.length || 0

  // Determine link URL based on context
  const linkUrl = isPublicTemplate 
    ? `/trips/${trip.slug}` 
    : `/dashboard/trips/${trip.id}`

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete trip')
      }

      onDelete?.(trip.id)
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    } finally {
      setIsDeleting(false)
    }
  }

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  return (
    <Link href={linkUrl} className="block">
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          {/* Cover Image */}
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
            {trip.cover_image ? (
              <img
                src={trip.cover_image}
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blue-400" />
              </div>
            )}
          </div>

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Featured Badge */}
            {trip.is_featured && (
              <Badge className="bg-purple-500 text-white">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Featured
              </Badge>
            )}

            {/* Status Badge - Only for user trips */}
            {isUserTrip && !isPublicTemplate && (
              <Badge className={statusColors[trip.status]}>
                {trip.status === 'published' ? (
                  <><Globe className="h-3 w-3 mr-1" /> Published</>
                ) : trip.status === 'draft' ? (
                  <><Lock className="h-3 w-3 mr-1" /> Draft</>
                ) : (
                  'Archived'
                )}
              </Badge>
            )}

            {/* Template Badge */}
            {isPublicTemplate && (
              <Badge className="bg-blue-100 text-blue-800">
                <FileText className="h-3 w-3 mr-1" />
                Template
              </Badge>
            )}
          </div>

          {/* View Count Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <ViewCountBadge tripId={trip.id} />
          </div>

          {/* Menu - Top Right - Only for user trips */}
          {isUserTrip && !isPublicTemplate && (
            <div className="absolute top-3 right-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowMenu(false)
                          onEdit?.()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Trip
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowMenu(false)
                          handleDelete()
                        }}
                        disabled={isDeleting}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Trip'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Copy Button - For public templates */}
          {isPublicTemplate && onCopy && (
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onCopy(trip.id)
                }}
                className="h-8 px-3 bg-white/80 hover:bg-white"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {trip.title}
            </h3>

            {/* Destination */}
            {trip.destination && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{trip.destination}</span>
              </div>
            )}

            {/* Description */}
            {trip.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {trip.description}
              </p>
            )}

            {/* Date Range */}
            {trip.start_date && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(trip.start_date).toLocaleDateString()}
                {trip.end_date && trip.end_date !== trip.start_date && (
                  <span> - {new Date(trip.end_date).toLocaleDateString()}</span>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{postsCount} post{postsCount !== 1 ? 's' : ''}</span>
              {!isPublicTemplate && (
                <span>{shareLinksCount} share link{shareLinksCount !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye className="h-3 w-3" />
              <span>{trip.view_count?.toLocaleString() || 0} views</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>

        {/* Click outside to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
        )}
      </Card>
    </Link>
  )
}


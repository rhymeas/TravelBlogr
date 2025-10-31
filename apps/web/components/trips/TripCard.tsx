'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  MapPin,
  Calendar,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Globe,
  Heart,
  Briefcase,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { DuplicateTripButton } from './DuplicateTripButton'
import { ViewCountBadge } from '@/components/analytics/ViewCount'
import { ensureTripHeroImage } from '@/lib/services/tripImageService'

interface Trip {
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
  posts?: any[]
  share_links?: any[]
}

interface TripCardProps {
  trip: Trip
  onUpdate?: (trip: Trip) => void
  onDelete?: (tripId: string) => void
}

export function TripCard({ trip, onUpdate, onDelete }: TripCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(trip.cover_image || null)
  const [loadingImage, setLoadingImage] = useState(false)

  // Fetch hero image if missing
  useEffect(() => {
    if (!trip.cover_image && !loadingImage) {
      setLoadingImage(true)
      ensureTripHeroImage({
        id: trip.id,
        title: trip.title,
        slug: trip.slug,
        cover_image: trip.cover_image,
        destination: trip.description, // Use description as destination fallback
        trip_type: undefined
      }).then(imageUrl => {
        if (imageUrl) {
          setHeroImage(imageUrl)
        }
      }).finally(() => {
        setLoadingImage(false)
      })
    }
  }, [trip.id, trip.cover_image, trip.title, trip.slug, trip.description, loadingImage])
  const [newTitle, setNewTitle] = useState(`${trip.title} (Copy)`)

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  const shareLinksCount = trip.share_links?.length || 0
  const postsCount = trip.posts?.length || 0

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

  const handleDuplicate = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a title for the duplicated trip')
      return
    }

    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newTitle: newTitle.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate trip')
      }

      setShowDuplicateModal(false)
      window.location.reload() // Refresh to show new trip
    } catch (error) {
      console.error('Error duplicating trip:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate trip')
    } finally {
      setIsDuplicating(false)
    }
  }

  const getShareLinkIcon = (type: string) => {
    switch (type) {
      case 'public': return <Globe className="h-3 w-3" />
      case 'family': return <Heart className="h-3 w-3" />
      case 'friends': return <Users className="h-3 w-3" />
      case 'professional': return <Briefcase className="h-3 w-3" />
      default: return <Share2 className="h-3 w-3" />
    }
  }

  return (
    <Link href={`/dashboard/trips/${trip.id}`} className="block">
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          {/* Cover Image */}
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
            {heroImage ? (
              <img
                src={heroImage}
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : loadingImage ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blue-400" />
              </div>
            )}
          </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trip.status]}`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        {/* View Count Badge */}
        <div className="absolute bottom-3 left-3">
          <ViewCountBadge tripId={trip.id} />
        </div>

        {/* Menu */}
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
                  <Link
                    href={`/dashboard/trips/${trip.slug}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/trips/${trip.slug}/edit`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Trip
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDuplicateModal(true)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Trip
                  </button>
                  <button
                    onClick={() => {
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
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {trip.title}
          </h3>

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
            <span>{shareLinksCount} share link{shareLinksCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between w-full">
          {/* Share Links Preview */}
          <div className="flex items-center gap-1">
            {trip.share_links?.slice(0, 4).map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-6 h-6 bg-white rounded border text-gray-600"
                title={`${link.link_type} view`}
              >
                {getShareLinkIcon(link.link_type)}
              </div>
            ))}
            {shareLinksCount > 4 && (
              <span className="text-xs text-gray-500 ml-1">+{shareLinksCount - 4}</span>
            )}
          </div>

          {/* Last Updated */}
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardFooter>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Duplicate Trip
            </h2>

            <p className="text-gray-600 mb-4">
              This will create a copy of "{trip.title}" in your account.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  New Trip Title
                </label>
                <input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter title for duplicated trip"
                  disabled={isDuplicating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDuplicateModal(false)}
                  disabled={isDuplicating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDuplicate}
                  disabled={isDuplicating || !newTitle.trim()}
                >
                  {isDuplicating ? (
                    <>Duplicating...</>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </Card>
    </Link>
  )
}

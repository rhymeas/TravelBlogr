'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  MoreVertical, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface TripHeaderProps {
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
    posts?: any[]
    share_links?: any[]
  }
}

export function TripHeader({ trip }: TripHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    published: 'bg-green-100 text-green-800 border-green-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200'
  }

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

      toast.success('Trip deleted successfully')
      router.push('/dashboard/trips')
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error('Failed to delete trip')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = trip.status === 'published' ? 'draft' : 'published'
    
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update trip status')
      }

      toast.success(`Trip ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
      router.refresh()
    } catch (error) {
      console.error('Error updating trip status:', error)
      toast.error('Failed to update trip status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Cover Image */}
      {trip.cover_image && (
        <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100">
          <img
            src={trip.cover_image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header Content */}
      <div className="p-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/dashboard/trips">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
          </Link>
        </div>

        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {trip.title}
              </h1>
              <Badge className={statusColors[trip.status]}>
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
            </div>

            {trip.description && (
              <p className="text-gray-600 mt-2 line-clamp-2">
                {trip.description}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
              {trip.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(trip.start_date)}
                    {trip.end_date && trip.end_date !== trip.start_date && (
                      <> - {formatDate(trip.end_date)}</>
                    )}
                  </span>
                </div>
              )}
              
              {trip.posts && trip.posts.length > 0 && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.posts.length} {trip.posts.length === 1 ? 'post' : 'posts'}</span>
                </div>
              )}

              {trip.share_links && trip.share_links.length > 0 && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{trip.share_links.length} {trip.share_links.length === 1 ? 'share link' : 'share links'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              variant="outline"
              size="sm"
            >
              {trip.status === 'published' ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>

            <Link href={`/dashboard/trips/${trip.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>

            <Link href={`/dashboard/trips/${trip.id}/share`}>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </Link>

            {/* More Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {showMenu && (
                <>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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

                  {/* Click outside to close */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


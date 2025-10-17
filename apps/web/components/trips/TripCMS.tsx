'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TripEditModal } from './TripEditModal'
import { PostEditModal } from './PostEditModal'
import {
  Edit2,
  Plus,
  MapPin,
  Calendar,
  GripVertical,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { SmartImage as Image } from '@/components/ui/SmartImage'

interface Post {
  id?: string
  title: string
  content: string
  featured_image?: string
  location?: string
  post_date: string
  order_index: number
}

interface TripCMSProps {
  tripId: string
  userId: string
  trip: any
  posts: Post[]
  onUpdate: () => void
  canEdit: boolean
}

export function TripCMS({ tripId, userId, trip, posts, onUpdate, canEdit }: TripCMSProps) {
  const [showTripEditModal, setShowTripEditModal] = useState(false)
  const [showPostEditModal, setShowPostEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  if (!canEdit) {
    return null
  }

  const handleEditTrip = () => {
    setShowTripEditModal(true)
  }

  const handleAddPost = () => {
    setEditingPost(null)
    setShowPostEditModal(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setShowPostEditModal(true)
  }

  const handleClosePostModal = () => {
    setShowPostEditModal(false)
    setEditingPost(null)
  }

  const sortedPosts = [...posts].sort((a, b) => a.order_index - b.order_index)

  return (
    <>
      {/* CMS Header Card */}
      <Card className="p-6 bg-gradient-to-r from-rausch-50 to-orange-50 border-rausch-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Trip Content Manager
            </h3>
            <p className="text-sm text-gray-600">
              Edit trip details and manage your itinerary
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleEditTrip}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Trip
            </Button>
            <Button
              onClick={handleAddPost}
              size="sm"
              className="bg-rausch-600 hover:bg-rausch-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
      </Card>

      {/* Trip Overview */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {trip.cover_image && (
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={trip.cover_image}
                alt={trip.title}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {trip.title}
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {trip.destination && (
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {trip.destination}
                </Badge>
              )}
              {trip.duration_days && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {trip.duration_days} days
                </Badge>
              )}
              {trip.trip_type && (
                <Badge variant="secondary">
                  {trip.trip_type}
                </Badge>
              )}
            </div>
            {trip.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Locations/Posts List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Itinerary ({sortedPosts.length} locations)
          </h3>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No locations added yet</p>
            <Button
              onClick={handleAddPost}
              size="sm"
              className="bg-rausch-600 hover:bg-rausch-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map((post, index) => (
              <div
                key={post.id || index}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-rausch-300 hover:bg-gray-50 transition-colors group"
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                </div>

                {/* Order Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rausch-100 text-rausch-700 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Featured Image */}
                {post.featured_image && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {post.title}
                  </h4>
                  {post.location && (
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {post.location}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {post.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(post.post_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => handleEditPost(post)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <TripEditModal
        isOpen={showTripEditModal}
        onClose={() => setShowTripEditModal(false)}
        trip={trip}
        onUpdate={onUpdate}
      />

      <PostEditModal
        isOpen={showPostEditModal}
        onClose={handleClosePostModal}
        tripId={tripId}
        userId={userId}
        post={editingPost}
        onUpdate={onUpdate}
        nextOrderIndex={posts.length + 1}
      />
    </>
  )
}


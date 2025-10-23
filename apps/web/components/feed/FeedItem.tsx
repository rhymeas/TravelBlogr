'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { 
  Heart, MessageCircle, Share2, MapPin, Camera, 
  Plane, User, Star, Clock, ExternalLink,
  TrendingUp, Zap
} from 'lucide-react'

interface FeedActivity {
  id: string
  user_id: string
  type: string
  data: any
  created_at: string
  user: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

interface FeedItemProps {
  activity: FeedActivity
  isNew?: boolean
}

export function FeedItem({ activity, isNew = false }: FeedItemProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(activity.data?.like_count || 0)

  const handleLike = async () => {
    setLiked(!liked)
    setLikeCount((prev: number) => liked ? prev - 1 : prev + 1)
    // TODO: Implement actual like functionality
  }

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'trip_created':
        return <Plane className="h-4 w-4 text-blue-600" />
      case 'post_published':
        return <Camera className="h-4 w-4 text-green-600" />
      case 'location_visited':
        return <MapPin className="h-4 w-4 text-red-600" />
      case 'user_followed':
        return <User className="h-4 w-4 text-purple-600" />
      case 'trip_liked':
        return <Heart className="h-4 w-4 text-pink-600" />
      case 'location_reviewed':
        return <Star className="h-4 w-4 text-yellow-600" />
      default:
        return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityTitle = () => {
    switch (activity.type) {
      case 'trip_created':
        return `created a new trip "${activity.data.trip_title}"`
      case 'post_published':
        return `shared a new story "${activity.data.post_title}"`
      case 'location_visited':
        return `visited ${activity.data.location_name}`
      case 'user_followed':
        return `started following ${activity.data.followed_user_name}`
      case 'trip_liked':
        return `liked "${activity.data.trip_title}"`
      case 'location_reviewed':
        return `reviewed ${activity.data.location_name}`
      case 'media_uploaded':
        return `uploaded ${activity.data.media_count} new photo${activity.data.media_count > 1 ? 's' : ''}`
      default:
        return 'had some activity'
    }
  }

  const getActivityContent = () => {
    switch (activity.type) {
      case 'trip_created':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.data.destination}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{activity.data.duration} days</span>
            </div>
            {activity.data.description && (
              <p className="text-gray-700 text-sm line-clamp-2">
                {activity.data.description}
              </p>
            )}
            {activity.data.cover_image && (
              <div className="mt-3 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src={activity.data.cover_image}
                  alt={activity.data.trip_title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )

      case 'post_published':
        return (
          <div className="mt-3">
            {activity.data.excerpt && (
              <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                {activity.data.excerpt}
              </p>
            )}
            {activity.data.featured_image && (
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={activity.data.featured_image}
                  alt={activity.data.post_title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{activity.data.like_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{activity.data.comment_count || 0}</span>
              </div>
            </div>
          </div>
        )

      case 'location_visited':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.data.country}</span>
              {activity.data.coordinates && (
                <>
                  <span>•</span>
                  <span>📍 Live location</span>
                </>
              )}
            </div>
            {activity.data.notes && (
              <p className="text-gray-700 text-sm">
                {activity.data.notes}
              </p>
            )}
          </div>
        )

      case 'location_reviewed':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < activity.data.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {activity.data.rating}/5 stars
              </span>
            </div>
            {activity.data.review && (
              <p className="text-gray-700 text-sm line-clamp-3">
                {activity.data.review}
              </p>
            )}
          </div>
        )

      case 'media_uploaded':
        return (
          <div className="mt-3">
            {activity.data.media_urls && activity.data.media_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {activity.data.media_urls.slice(0, 4).map((url: string, index: number) => (
                  <div key={index} className="relative h-24 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && activity.data.media_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{activity.data.media_urls.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getActionLink = () => {
    switch (activity.type) {
      case 'trip_created':
        return `/dashboard/trips/${activity.data.trip_id}`
      case 'post_published':
        return `/dashboard/trips/${activity.data.trip_id}#post-${activity.data.post_id}`
      case 'location_visited':
        return `/locations/${activity.data.location_slug}`
      case 'user_followed':
        return `/users/${activity.data.followed_user_username}`
      default:
        return null
    }
  }

  return (
    <Card className={`transition-all duration-300 ${isNew ? 'ring-2 ring-rausch-500 bg-rausch-50/30' : 'hover:shadow-sleek-medium'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Link href={`/users/${activity.user.username}`} className="flex-shrink-0">
            <Image
              src={activity.user.avatar_url || '/default-avatar.png'}
              alt={activity.user.name}
              width={48}
              height={48}
              className="rounded-full shadow-sleek-light hover:shadow-sleek-medium transition-all"
            />
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
          {/* Activity Header */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
              {getActivityIcon()}
            </div>
            <Link
              href={`/users/${activity.user.username}`}
              className="text-body-large font-semibold text-sleek-black hover:text-rausch-500 transition-colors"
            >
              {activity.user.name}
            </Link>
            <span className="text-body-medium text-sleek-dark-gray">
              {getActivityTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-body-small text-sleek-dark-gray">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
            {isNew && (
              <div className="bg-rausch-500 text-white text-body-small px-2 py-1 rounded-sleek-small flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                New
              </div>
            )}
          </div>

          {/* Action Link */}
          {getActionLink() && (
            <Link href={getActionLink()!}>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {getActivityContent()}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${liked ? 'text-red-600' : 'text-gray-600'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-600' : ''}`} />
            <span>{likeCount}</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

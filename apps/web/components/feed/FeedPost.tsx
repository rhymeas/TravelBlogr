'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  MapPin, Clock, Play, ChevronLeft, ChevronRight, UserPlus
} from 'lucide-react'
import { FeedPost as FeedPostType } from '@/lib/data/feedData'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { PostCommentsModal } from './PostCommentsModal'
import { ActivityLikeButton } from '@/components/social/ActivityLikeButton'

interface FeedPostProps {
  post: FeedPostType
  onLike?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onComment?: (postId: string) => void
  showFollowButton?: boolean
}

export function FeedPost({ post, onLike, onBookmark, onComment, showFollowButton = false }: FeedPostProps) {
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.(post.id)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? `Unfollowed ${post.user.name}` : `Following ${post.user.name}`)
  }

  const nextImage = () => {
    if (post.media.items.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.media.items.length)
    }
  }

  const prevImage = () => {
    if (post.media.items.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.media.items.length) % post.media.items.length)
    }
  }

  const renderMedia = () => {
    const currentItem = post.media.items[currentImageIndex]
    const hasMultipleItems = post.media.items.length > 1

    return (
      <div className="relative aspect-square">
        <img
          src={currentItem.url}
          alt={`${post.caption} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {currentItem.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Navigation arrows for carousel */}
        {hasMultipleItems && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Pagination dots */}
        {hasMultipleItems && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {post.media.items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-lg mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img
              src={post.user.avatar}
              alt={post.user.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{post.user.username}</span>
              {post.user.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {post.locationSlug ? (
                <Link
                  href={`/locations/${post.locationSlug}`}
                  className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                >
                  {post.location}
                </Link>
              ) : (
                <span>{post.location}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showFollowButton && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollow}
              className={isFollowing ? "btn-secondary" : "btn-primary"}
            >
              {isFollowing ? (
                "Following"
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Content */}
      {renderMedia()}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <ActivityLikeButton
              activityId={post.id}
              initialLikeCount={post.likes}
              initialUserLiked={post.isLiked}
              showCount={false}
              showAnimation={true}
            />
            <button
              onClick={() => {
                setShowCommentsModal(true)
                onComment?.(post.id)
              }}
              className="hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-6 h-6 text-gray-700" />
            </button>
            <button className="hover:scale-110 transition-transform">
              <Send className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          <button
            onClick={handleBookmark}
            className="hover:scale-110 transition-transform"
          >
            <Bookmark
              className={`w-6 h-6 ${isBookmarked ? 'text-gray-900 fill-current' : 'text-gray-700'}`}
            />
          </button>
        </div>

        {/* Caption */}
        <div className="mb-2">
          <span className="font-semibold text-sm mr-2">{post.user.username}</span>
          <span className="text-sm">{post.caption}</span>
        </div>

        {/* Comments */}
        {post.comments > 0 && (
          <button
            onClick={() => {
              setShowCommentsModal(true)
              onComment?.(post.id)
            }}
            className="text-sm text-gray-500 mb-2 hover:text-gray-700"
          >
            View all {post.comments} comments
          </button>
        )}

        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{post.timeAgo}</span>
        </div>
      </div>

      {/* Comments Modal */}
      <PostCommentsModal
        postId={post.id}
        postOwnerId={post.user.username}
        postCaption={post.caption}
        postAuthor={post.user.username}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
      />
    </article>
  )
}

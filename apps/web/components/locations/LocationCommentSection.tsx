'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeComments } from '@/hooks/useRealtimeComments'
import { CustomCommentSection } from '@/components/comments/CustomCommentSection'
import toast from 'react-hot-toast'

interface LocationCommentSectionProps {
  locationSlug: string
  className?: string
}

interface Comment {
  id: string
  userId: string
  fullName: string
  avatarUrl: string
  userProfile?: string
  text: string
  timestamp: string
  replies: Comment[]
}

export function LocationCommentSection({
  locationSlug,
  className = ''
}: LocationCommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [locationSlug])

  // Subscribe to real-time comment updates
  useRealtimeComments({
    type: 'location',
    entityId: locationSlug,
    onCommentAdded: async () => {
      await fetchComments()
    },
    onCommentUpdated: async () => {
      await fetchComments()
    },
    onCommentDeleted: async () => {
      await fetchComments()
    },
    showToasts: true
  })

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`)
      const data = await response.json()

      if (response.ok) {
        const transformedComments = data.comments.map((comment: any) => ({
          id: comment.id,
          userId: comment.user_id,
          fullName: comment.user?.full_name || 'Anonymous',
          avatarUrl: comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.full_name || 'User')}&background=random`,
          userProfile: `/~${comment.user?.username}`,
          text: comment.content,
          timestamp: comment.created_at,
          replies: comment.replies?.map((reply: any) => ({
            id: reply.id,
            userId: reply.user_id,
            fullName: reply.user?.full_name || 'Anonymous',
            avatarUrl: reply.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.full_name || 'User')}&background=random`,
            userProfile: `/~${reply.user?.username}`,
            text: reply.content,
            timestamp: reply.created_at,
            replies: []
          })) || []
        }))

        setComments(transformedComments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (text: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: text,
          parentId: parentId || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post comment')
      }

      toast.success('Comment posted!')
      await fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post comment')
      throw error
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete comment')
      }

      toast.success('Comment deleted!')
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  }

  const handleEditComment = async (commentId: string, text: string) => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: text
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to edit comment')
      }

      toast.success('Comment updated!')
      await fetchComments()
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to edit comment')
      throw error
    }
  }

  return (
    <div className={`${className} bg-white rounded-xl border border-gray-200 p-6 prevent-overflow`}>
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          💬 Community Discussion
        </h3>
        <p className="text-sm text-gray-600">
          Share your experiences and ask questions about this location
        </p>
      </div>

      {/* Custom Comment Section */}
      <CustomCommentSection
        comments={comments}
        currentUser={user ? {
          id: user.id,
          fullName: user.user_metadata?.full_name || 'User',
          avatarUrl: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}&background=random`
        } : undefined}
        onSubmit={handleSubmitComment}
        onEdit={handleEditComment}
        onDelete={handleDeleteComment}
        onSignIn={() => {
          window.location.href = `/auth/signin?redirect=/locations/${locationSlug}`
        }}
        isLoading={isLoading}
      />
    </div>
  )
}

// Default export for dynamic import
export default LocationCommentSection

'use client'

import { useState, useEffect } from 'react'
import { CommentSection } from 'react-comments-section'
import 'react-comments-section/dist/index.css'
import '@/styles/comments-override.css'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface LocationCommentSectionProps {
  locationSlug: string
  className?: string
}

interface Comment {
  userId: string
  comId: string
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

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`)
      const data = await response.json()

      if (response.ok) {
        const transformedComments = data.comments.map((comment: any) => ({
          userId: comment.user_id,
          comId: comment.id,
          fullName: comment.user?.full_name || 'Anonymous',
          avatarUrl: comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.full_name || 'User')}&background=random`,
          userProfile: `/~${comment.user?.username}`,
          text: comment.content,
          timestamp: comment.created_at,
          replies: comment.replies?.map((reply: any) => ({
            userId: reply.user_id,
            comId: reply.id,
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

  const handleSubmitComment = async (data: {
    userId: string
    comId: string
    avatarUrl: string
    userProfile?: string
    fullName: string
    text: string
    replies: any
    commentId?: string
  }) => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: data.text,
          parentId: data.commentId || null
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

  const handleEditComment = async (data: {
    comId: string
    text: string
  }) => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments/${data.comId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: data.text
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
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <CommentSection
        currentUser={user ? {
          currentUserId: user.id,
          currentUserImg: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}&background=random`,
          currentUserProfile: `/~${user.user_metadata?.username}`,
          currentUserFullName: user.user_metadata?.full_name || 'User'
        } : null}
        logIn={{
          onLogin: () => {
            window.location.href = `/auth/signin?redirect=/locations/${locationSlug}`
          },
          signUpLink: '/auth/signup'
        }}
        commentData={comments}
        onSubmitAction={handleSubmitComment}
        onDeleteAction={(data: any) => handleDeleteComment(data.comIdToDelete)}
        onEditAction={handleEditComment}
        currentData={(data: any) => {
          console.log('Current comment data:', data)
        }}
        placeholder="Share your thoughts about this location..."
        customNoComment={() => (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>
        )}
      />
    </div>
  )
}


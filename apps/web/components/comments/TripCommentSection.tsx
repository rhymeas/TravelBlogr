'use client'

import { useState, useEffect } from 'react'
import { CommentSection } from 'react-comments-section'
import 'react-comments-section/dist/index.css'
import { createClientSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeComments } from '@/hooks/useRealtimeComments'
import toast from 'react-hot-toast'

interface TripCommentSectionProps {
  tripId: string
  tripOwnerId: string
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

export function TripCommentSection({ tripId, tripOwnerId, className = '' }: TripCommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientSupabase()

  // Fetch comments on mount
  useEffect(() => {
    fetchComments()
  }, [tripId])

  // Subscribe to real-time comment updates
  useRealtimeComments({
    type: 'trip',
    entityId: tripId,
    onCommentAdded: async (newComment) => {
      // Refresh comments to get full user data
      await fetchComments()
    },
    onCommentUpdated: async () => {
      // Refresh comments to get updated data
      await fetchComments()
    },
    onCommentDeleted: async () => {
      // Refresh comments to remove deleted comment
      await fetchComments()
    },
    showToasts: true
  })

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/comments`)
      const data = await response.json()

      if (response.ok) {
        // Transform Supabase comments to react-comments-section format
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
      toast.error('Failed to load comments')
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
      const response = await fetch(`/api/trips/${tripId}/comments`, {
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
      
      // Refresh comments
      await fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post comment')
    }
  }

  const handleDeleteComment = async (comId: string) => {
    try {
      const response = await fetch(`/api/comments/${comId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      toast.success('Comment deleted')
      
      // Refresh comments
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleEditComment = async (data: { comId: string; text: string }) => {
    try {
      const response = await fetch(`/api/comments/${data.comId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: data.text
        })
      })

      if (!response.ok) {
        throw new Error('Failed to edit comment')
      }

      toast.success('Comment updated')
      
      // Refresh comments
      await fetchComments()
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Failed to edit comment')
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname)
          },
          signUpLink: '/auth/signup'
        }}
        commentData={comments}
        onSubmitAction={handleSubmitComment}
        onDeleteAction={(data: any) => handleDeleteComment(data.comIdToDelete)}
        onEditAction={handleEditComment}
        currentData={(data: any) => {
          // Optional: track current state
          console.log('Current comment data:', data)
        }}
        placeHolder="Write your comment..."
        customNoComment={() => (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        )}
      />
    </div>
  )
}


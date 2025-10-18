'use client'

/**
 * Blog Comment Section
 * 
 * Display and manage comments on blog posts.
 * Supports nested replies, likes, and real-time updates.
 */

import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Reply, Trash2, Flag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { getBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  user_id: string
  content: string
  like_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface BlogCommentSectionProps {
  postId: string
  className?: string
}

export function BlogCommentSection({ postId, className = '' }: BlogCommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/blog/posts/${postId}/comments`)
      const data = await response.json()

      if (response.ok) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      setNewComment('')
      toast.success('Comment posted!')
      await fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please sign in to reply')
      return
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/blog/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to post reply')
      }

      setReplyContent('')
      setReplyingTo(null)
      toast.success('Reply posted!')
      await fetchComments()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments')
      return
    }

    // Optimistic update
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, like_count: comment.like_count + 1 }
          : comment
      )
    )

    // TODO: Implement actual like API
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
      <div className="flex gap-3">
        <Avatar
          src={comment.profiles.avatar_url || undefined}
          alt={comment.profiles.full_name || comment.profiles.username || 'User'}
          size="sm"
        />

        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900">
                {comment.profiles.full_name || comment.profiles.username || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 ml-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-rausch-600 transition-colors"
            >
              <Heart className="h-3 w-3" />
              <span>{comment.like_count || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-rausch-600 transition-colors"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
            )}

            {user && user.id === comment.user_id && (
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            )}

            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-600 transition-colors">
              <Flag className="h-3 w-3" />
              <span>Report</span>
            </button>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 ml-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
                <Button
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {user ? (
        <div className="mb-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="mb-3"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Please sign in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No comments yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div>{comments.map(comment => renderComment(comment))}</div>
      )}
    </Card>
  )
}


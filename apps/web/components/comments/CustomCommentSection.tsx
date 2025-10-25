'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { MessageCircle, Send, Trash2, Edit2, X, Check, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface LocationCommentSectionProps {
  locationSlug: string
  className?: string
}

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

export function CustomCommentSection({ 
  locationSlug,
  className = '' 
}: LocationCommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [locationSlug])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`)
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
    if (!newComment.trim()) return
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to post comment')

      toast.success('Comment posted!')
      setNewComment('')
      await fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return
    if (!user) {
      toast.error('Please sign in to reply')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyText.trim(),
          parentId 
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to post reply')

      toast.success('Reply posted!')
      setReplyText('')
      setReplyingTo(null)
      await fetchComments()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/locations/${locationSlug}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText.trim() })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to edit comment')

      toast.success('Comment updated!')
      setEditingId(null)
      setEditText('')
      await fetchComments()
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to edit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id
    const isOwner = user?.id === comment.user_id

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.user.avatar_url ? (
              <img 
                src={comment.user.avatar_url} 
                alt={comment.user.full_name || 'User'} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rausch-500 to-kazan-500 flex items-center justify-center text-white font-medium text-sm">
                {getInitials(comment.user.full_name)}
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-sleek-background-secondary rounded-sleek-medium p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-body-medium font-semibold text-sleek-black">
                    {comment.user.full_name || 'Anonymous'}
                  </p>
                  <p className="text-body-small text-sleek-gray">
                    {formatDate(comment.created_at)}
                    {comment.updated_at !== comment.created_at && ' (edited)'}
                  </p>
                </div>
                
                {isOwner && !isEditing && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditText(comment.content)
                      }}
                      className="p-1.5 text-sleek-gray hover:text-sleek-black hover:bg-white rounded-sleek-small transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 text-sleek-gray hover:text-red-500 hover:bg-white rounded-sleek-small transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-sleek-border rounded-sleek-small focus:outline-none focus:ring-2 focus:ring-rausch-500 resize-none"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditComment(comment.id)}
                      disabled={isSubmitting || !editText.trim()}
                      size="sm"
                      className="btn-primary"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null)
                        setEditText('')
                      }}
                      size="sm"
                      variant="outline"
                      className="btn-secondary"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-body-medium text-sleek-dark-gray whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>

            {/* Reply Button */}
            {!isReply && !isEditing && (
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please sign in to reply')
                    return
                  }
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  setReplyText('')
                }}
                className="mt-2 text-body-small text-sleek-gray hover:text-sleek-black transition-colors font-medium"
              >
                Reply
              </button>
            )}

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-sleek-border rounded-sleek-small focus:outline-none focus:ring-2 focus:ring-rausch-500"
                  maxLength={1000}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitReply(comment.id)
                    }
                  }}
                />
                <Button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyText.trim()}
                  size="sm"
                  className="btn-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
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
      {/* Comment Input */}
      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt={user.user_metadata?.full_name || 'You'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rausch-500 to-kazan-500 flex items-center justify-center text-white font-medium text-sm">
                  {getInitials(user.user_metadata?.full_name)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this location..."
                className="w-full px-4 py-3 border border-sleek-border rounded-sleek-medium focus:outline-none focus:ring-2 focus:ring-rausch-500 resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-body-small text-sleek-gray">
                  {newComment.length}/1000
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="btn-primary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-sleek-background-secondary rounded-sleek-medium border border-sleek-border">
          <p className="text-body-medium text-sleek-dark-gray mb-3">
            <MessageCircle className="w-5 h-5 inline mr-2" />
            Sign in to join the conversation
          </p>
          <div className="flex gap-2">
            <Link href={`/auth/signin?redirect=/locations/${locationSlug}`}>
              <Button className="btn-primary">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="btn-secondary">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 mx-auto text-sleek-gray mb-3" />
          <p className="text-title-small font-medium text-sleek-dark-gray">No comments yet</p>
          <p className="text-body-medium text-sleek-gray mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState } from 'react'
import { MessageSquare, LogIn } from 'lucide-react'
import { CommentItem } from './CommentItem'
import { CommentInput } from './CommentInput'
import { Button } from '@/components/ui/Button'

interface Comment {
  id: string
  userId: string
  fullName: string
  avatarUrl: string
  userProfile?: string
  text: string
  timestamp: string
  replies?: Comment[]
}

interface CustomCommentSectionProps {
  comments: Comment[]
  currentUser?: {
    id: string
    fullName: string
    avatarUrl: string
  }
  onSubmit: (text: string, parentId?: string) => Promise<void>
  onEdit: (commentId: string, text: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onSignIn: () => void
  isLoading?: boolean
}

export function CustomCommentSection({
  comments,
  currentUser,
  onSubmit,
  onEdit,
  onDelete,
  onSignIn,
  isLoading = false
}: CustomCommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)

  const handleReply = (commentId: string) => {
    const comment = findComment(comments, commentId)
    if (comment) {
      setReplyingTo({ id: commentId, name: comment.fullName })
    }
  }

  const handleSubmitReply = async (text: string) => {
    if (replyingTo) {
      await onSubmit(text, replyingTo.id)
      setReplyingTo(null)
    }
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Helper to find a comment by ID (including nested replies)
  const findComment = (commentList: Comment[], id: string): Comment | null => {
    for (const comment of commentList) {
      if (comment.id === id) return comment
      if (comment.replies) {
        const found = findComment(comment.replies, id)
        if (found) return found
      }
    }
    return null
  }

  const totalComments = comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0)
  }, 0)

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading comments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          {totalComments === 0 ? 'No comments yet' : `${totalComments} ${totalComments === 1 ? 'Comment' : 'Comments'}`}
        </h3>
      </div>

      {/* Comment Input */}
      {currentUser ? (
        <div className="space-y-4">
          {!replyingTo && (
            <CommentInput
              currentUser={currentUser}
              onSubmit={(text) => onSubmit(text)}
              placeholder="Share your thoughts about this location..."
            />
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Join the conversation
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Sign in to share your experiences and connect with other travelers
          </p>
          <Button onClick={onSignIn} className="bg-gray-900 hover:bg-gray-800">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In to Comment
          </Button>
        </div>
      )}

      {/* Reply Input (shown when replying) */}
      {replyingTo && currentUser && (
        <CommentInput
          currentUser={currentUser}
          onSubmit={handleSubmitReply}
          onCancel={handleCancelReply}
          placeholder={`Reply to ${replyingTo.name}...`}
          replyingTo={replyingTo.name}
          autoFocus
        />
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              onReply={handleReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        !currentUser && (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900">No comments yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Be the first to share your experience!
            </p>
          </div>
        )
      )}
    </div>
  )
}


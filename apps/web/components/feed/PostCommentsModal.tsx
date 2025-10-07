'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PostCommentSection } from '@/components/comments/PostCommentSection'
import { Button } from '@/components/ui/Button'

interface PostCommentsModalProps {
  postId: string
  postOwnerId: string
  postCaption?: string
  postAuthor?: string
  isOpen: boolean
  onClose: () => void
}

export function PostCommentsModal({
  postId,
  postOwnerId,
  postCaption,
  postAuthor,
  isOpen,
  onClose
}: PostCommentsModalProps) {
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      // Fetch comment count
      fetchCommentCount()
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, postId])

  const fetchCommentCount = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      const data = await response.json()
      if (response.ok) {
        // Count top-level comments + replies
        const total = data.comments.reduce((acc: number, comment: any) => {
          return acc + 1 + (comment.replies?.length || 0)
        }, 0)
        setCommentCount(total)
      }
    } catch (error) {
      console.error('Error fetching comment count:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
              {commentCount > 0 && (
                <p className="text-sm text-gray-500">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Post Caption */}
          {postCaption && (
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-2">
                {postAuthor && (
                  <span className="font-semibold text-sm">{postAuthor}</span>
                )}
                <span className="text-sm text-gray-700">{postCaption}</span>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <PostCommentSection
              postId={postId}
              postOwnerId={postOwnerId}
              compact={false}
            />
          </div>
        </div>
      </div>
    </>
  )
}


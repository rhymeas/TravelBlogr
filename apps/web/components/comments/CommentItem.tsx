'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CommentItemProps {
  comment: {
    id: string
    userId: string
    fullName: string
    avatarUrl: string
    userProfile?: string
    text: string
    timestamp: string
    replies?: any[]
  }
  currentUserId?: string
  onReply: (commentId: string) => void
  onEdit: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
  isReply?: boolean
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isReply = false
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [showReplies, setShowReplies] = useState(true)

  const isOwner = currentUserId === comment.userId
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(comment.id, editText.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(comment.text)
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`group ${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 flex-shrink-0">
          <img
            src={comment.avatarUrl}
            alt={comment.fullName}
            className="h-10 w-10 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              // Fallback to initials on error
              const target = e.currentTarget
              target.style.display = 'none'
              const fallback = document.createElement('div')
              fallback.className = 'h-10 w-10 rounded-full bg-gray-200 text-gray-600 text-sm font-semibold flex items-center justify-center'
              fallback.textContent = getInitials(comment.fullName)
              target.parentElement?.appendChild(fallback)
            }}
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <a
              href={comment.userProfile}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm"
            >
              {comment.fullName}
            </a>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
            </span>
          </div>

          {/* Comment Text or Edit Form */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={1000}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || editText === comment.text}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {comment.text}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2">
                {!isReply && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Reply
                  </button>
                )}

                {isOwner && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(comment.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Replies */}
          {hasReplies && (
            <div className="mt-4 space-y-4">
              {showReplies && comment.replies!.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


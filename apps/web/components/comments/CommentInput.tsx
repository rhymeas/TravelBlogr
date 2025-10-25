'use client'

import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CommentInputProps {
  currentUser?: {
    id: string
    fullName: string
    avatarUrl: string
  }
  onSubmit: (text: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  replyingTo?: string
  autoFocus?: boolean
}

export function CommentInput({
  currentUser,
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts...',
  replyingTo,
  autoFocus = false
}: CommentInputProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const charCount = text.length
  const maxChars = 1000
  const isNearLimit = charCount > maxChars * 0.8

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            Replying to <span className="font-semibold">{replyingTo}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        {currentUser && (
          <div className="h-10 w-10 flex-shrink-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="h-10 w-10 rounded-full object-cover bg-gray-200"
              onError={(e) => {
                // Fallback to initials on error
                const target = e.currentTarget
                target.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'h-10 w-10 rounded-full bg-gray-200 text-gray-600 text-sm font-semibold flex items-center justify-center'
                fallback.textContent = getInitials(currentUser.fullName)
                target.parentElement?.appendChild(fallback)
              }}
            />
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            rows={3}
            maxLength={maxChars}
            autoFocus={autoFocus}
            disabled={isSubmitting}
          />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {charCount > 0 && (
                <span className={isNearLimit ? 'text-amber-600 font-medium' : ''}>
                  {charCount} / {maxChars}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!text.trim() || isSubmitting || charCount > maxChars}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}


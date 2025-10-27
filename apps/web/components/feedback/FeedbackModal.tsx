'use client'

import { useState } from 'react'
import { X, MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setError('Please enter your feedback')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        message: message.trim(),
        email: email.trim() || null,
        user_id: user?.id || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      }

      console.log('Submitting feedback:', payload)

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()
      console.log('Feedback response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit feedback')
      }

      setIsSuccess(true)
      setMessage('')
      setEmail('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setIsSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Feedback error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send Feedback</h2>
                <p className="text-xs text-gray-600">Help us improve TravelBlogr</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 font-semibold mb-1">Thank you!</div>
                <div className="text-sm text-green-700">Your feedback has been sent successfully.</div>
              </div>
            </div>
          )}

          {/* Form */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Message */}
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback *
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think, report a bug, or suggest a feature..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={5}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email {user ? '(auto-filled)' : '(optional)'}
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!user}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use this to follow up with you
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
                  'text-white shadow-lg',
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                )}
                style={{
                  backgroundColor: isSubmitting ? undefined : '#2B5F9E',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}


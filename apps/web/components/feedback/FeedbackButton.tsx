'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

export function FeedbackButton() {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <>
      {/* Floating Feedback Button - Desktop Only */}
      <button
        onClick={() => setShowFeedback(true)}
        className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
        style={{
          backgroundColor: '#2B5F9E',
        }}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-5 w-5 text-white" />
        <span className="text-white font-medium text-sm">Feedback</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import {
  Plus,
  X,
  Camera,
  MapPin,
  MessageSquare,
  Upload,
  PlusCircle,
} from 'lucide-react'

interface MobileActionMenuProps {
  className?: string
}

export function MobileActionMenu({ className = '' }: MobileActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { showSignIn } = useAuthModal()

  // Close menu when clicking outside or on backdrop
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        // Close if clicking outside the menu container OR on the backdrop
        if (!target.closest('.action-menu-popup') && !target.closest('.action-menu-button')) {
          setIsOpen(false)
        }
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleAction = (action: string) => {
    setIsOpen(false)

    switch (action) {
      case 'create-trip':
        if (!isAuthenticated) {
          showSignIn()
          return
        }
        router.push('/dashboard/trips/new')
        break
      case 'upload-content':
        if (!isAuthenticated) {
          showSignIn()
          return
        }
        router.push('/dashboard/upload')
        break
      case 'feedback':
        // Open feedback modal (no auth required)
        setShowFeedback(true)
        break
    }
  }

  const actions = [
    {
      id: 'create-trip',
      label: 'Create New Trip',
      icon: PlusCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-white',
      description: 'Start planning your next adventure',
    },
    {
      id: 'upload-content',
      label: 'Upload to Trip',
      icon: Upload,
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-white',
      description: 'Add photos and stories to your trips',
    },
    {
      id: 'feedback',
      label: 'Leave Feedback',
      icon: MessageSquare,
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-white',
      description: 'Help us improve TravelBlogr',
    },
  ]

  return (
    <div className={cn('action-menu-container', className)}>
      {/* Backdrop - clicking it closes the menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Menu Popup */}
      {isOpen && (
        <div
          className="action-menu-popup fixed bottom-20 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[90%] max-w-sm"
          style={{
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Quick Actions</h3>
                  <p className="text-xs text-blue-100">What would you like to do?</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group"
                    style={{
                      animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className={cn(
                      'p-3 rounded-xl transition-transform group-hover:scale-110',
                      action.color
                    )}>
                      <Icon className={cn('h-6 w-6', action.iconColor)} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            {!isAuthenticated && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                   
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'action-menu-button relative flex items-center justify-center',
          'w-20 h-11 rounded-full',
          'text-white shadow-lg',
          'hover:shadow-xl',
          'transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-blue-300',
          isOpen && 'rotate-45'
        )}
        style={{
          backgroundColor: '#2B5F9E', // TravelBlogr blue from logo
        }}
        aria-label="Quick actions menu"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  )
}


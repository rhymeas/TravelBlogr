'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Lock, Sparkles, Share2, BarChart3, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export type PromptReason = 
  | 'trip_limit'
  | 'save_trip'
  | 'publish_trip'
  | 'cms_access'
  | 'analytics'
  | 'sharing'
  | 'advanced_features'

interface SignInPromptModalProps {
  isOpen: boolean
  onClose: () => void
  reason: PromptReason
  tripCount?: number
}

const PROMPT_CONTENT = {
  trip_limit: {
    icon: Lock,
    title: "You've reached the guest limit",
    description: "Free users can create up to 3 trips. Sign in to create unlimited trips and unlock all features!",
    benefits: [
      "Create unlimited trips",
      "Save trips permanently",
      "Share with custom links",
      "Access analytics",
    ],
  },
  save_trip: {
    icon: Lock,
    title: "Sign in to save your trip",
    description: "Guest trips are temporary and stored only in your browser. Sign in to save your trip permanently!",
    benefits: [
      "Save trips permanently",
      "Access from any device",
      "Never lose your data",
      "Sync across browsers",
    ],
  },
  publish_trip: {
    icon: Globe,
    title: "Sign in to publish your trip",
    description: "Publishing requires an account. Create your free account to share your travel story with the world!",
    benefits: [
      "Publish to the world",
      "Get a custom trip URL",
      "Share on social media",
      "Track views & engagement",
    ],
  },
  cms_access: {
    icon: Sparkles,
    title: "Sign in to access the CMS",
    description: "The content management system is available for registered users. Sign in to edit your trips with our powerful editor!",
    benefits: [
      "Rich text editor",
      "Media management",
      "AI-powered suggestions",
      "Preview before publishing",
    ],
  },
  analytics: {
    icon: BarChart3,
    title: "Sign in to view analytics",
    description: "Track your trip's performance with detailed analytics. Sign in to see who's viewing your content!",
    benefits: [
      "View counts & trends",
      "Engagement metrics",
      "Visitor demographics",
      "Export reports",
    ],
  },
  sharing: {
    icon: Share2,
    title: "Sign in to share your trip",
    description: "Create custom share links and control who sees your trip. Sign in to unlock sharing features!",
    benefits: [
      "Custom subdomain URLs",
      "Privacy controls",
      "Multiple share links",
      "Password protection",
    ],
  },
  advanced_features: {
    icon: Sparkles,
    title: " ",
    description: "Get the full TravelBlogr experience with an account. It's free and takes less than a minute!",
    benefits: [
      "All features unlocked",
      "Unlimited trips",
      "Cloud storage",
      "Priority support",
    ],
  },
}

export function SignInPromptModal({ 
  isOpen, 
  onClose, 
  reason,
  tripCount = 0 
}: SignInPromptModalProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen) return null

  const content = PROMPT_CONTENT[reason]
  const Icon = content.icon

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const handleSignIn = () => {
    // Store current path to redirect back after sign-in
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname)
    }
    router.push('/auth/signin')
  }

  const handleSignUp = () => {
    // Store current path to redirect back after sign-up
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname)
    }
    router.push('/auth/signup')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card
          className={`w-full max-w-lg pointer-events-auto transform transition-all duration-200 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Header */}
          <div className="relative p-6 border-b">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h2>
                <p className="text-gray-600">
                  {content.description}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              What you'll get:
            </h3>
            <ul className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Trip count indicator */}
            {reason === 'trip_limit' && tripCount > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Good news!</strong> Your {tripCount} guest trip{tripCount > 1 ? 's' : ''} will be 
                  automatically imported to your account when you sign in.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50 space-y-3">
            <Button
              onClick={handleSignUp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Create Free Account
            </Button>
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
            <button
              onClick={handleClose}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Maybe later
            </button>
          </div>
        </Card>
      </div>
    </>
  )
}


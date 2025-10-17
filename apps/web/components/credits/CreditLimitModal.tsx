'use client'

/**
 * Credit Limit Modal - Redesigned
 *
 * Beautiful, emotional modal for purchasing credits.
 * Features hero image, simple pricing, and clear value proposition.
 */

import { X, Sparkles, Check, Heart } from 'lucide-react'
import Image from 'next/image'

interface CreditLimitModalProps {
  isOpen: boolean
  onClose: () => void
  reason: 'free_tier_limit' | 'no_credits'
  remainingFree?: number
  credits?: number
  costPerPlanning?: number // Cost in cents
  userCredits?: number // User's current credit balance
}

const CREDIT_PACKS = [
  {
    size: '10',
    credits: 10,
    price: 15,
    name: 'Starter',
    description: 'Perfect for trying out',
    emoji: '🌱'
  },
  {
    size: '25',
    credits: 25,
    price: 30,
    name: 'Explorer',
    description: 'Most popular choice',
    popular: true,
    savings: 'Save 25%',
    emoji: '✨'
  },
  {
    size: '50',
    credits: 50,
    price: 50,
    name: 'Adventurer',
    description: 'Best value',
    savings: 'Save 50%',
    emoji: '🚀'
  },
]

export function CreditLimitModal({
  isOpen,
  onClose,
  reason,
  remainingFree = 0,
  credits = 0,
  costPerPlanning = 50, // Default $0.50
  userCredits = 0,
}: CreditLimitModalProps) {
  const handlePurchase = async (packSize: string) => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSize }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error purchasing credits:', error)
      alert('Failed to start checkout. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 text-white/80 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Hero Image Section */}
        <div className="relative h-64 bg-gradient-to-br from-rausch-500 via-kazan-500 to-babu-500 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center text-white px-8 text-center">
            <div className="mb-4">
              <Heart className="h-16 w-16 mx-auto mb-4 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {reason === 'free_tier_limit'
                ? "Continue Your Journey"
                : "Keep Exploring"}
            </h2>
            <p className="text-white/90 text-lg max-w-md">
              {reason === 'free_tier_limit'
                ? "You've discovered the magic of AI trip planning. Let's keep the adventure going!"
                : "Your wanderlust knows no bounds. Unlock more amazing itineraries."}
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="p-8">
          {/* Current Balance */}
          {userCredits > 0 && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  You have <span className="font-bold">{userCredits}</span> credits
                </span>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.size}
                onClick={() => handlePurchase(pack.size)}
                className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  pack.popular
                    ? 'border-rausch-500 bg-gradient-to-br from-rausch-50 to-kazan-50 shadow-lg'
                    : 'border-gray-200 hover:border-rausch-300 bg-white'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-rausch-500 text-white text-xs font-semibold rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl mb-2">{pack.emoji}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${pack.price}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {pack.credits} Credits
                  </div>
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    {pack.description}
                  </div>
                  {pack.savings && (
                    <div className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      {pack.savings}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">Never Expire</div>
              <div className="text-xs text-gray-500">Use anytime</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">Instant AI</div>
              <div className="text-xs text-gray-500">Fast generation</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">Unlimited</div>
              <div className="text-xs text-gray-500">Plan freely</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


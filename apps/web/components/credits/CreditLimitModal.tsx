'use client'

/**
 * Credit Limit Modal
 * 
 * Shown when user hits free tier limit or runs out of credits.
 * Uses existing Dialog component from design system.
 */

import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Sparkles, Zap, TrendingUp, X } from 'lucide-react'

interface CreditLimitModalProps {
  isOpen: boolean
  onClose: () => void
  reason: 'free_tier_limit' | 'no_credits'
  remainingFree?: number
  credits?: number
}

const CREDIT_PACKS = [
  { size: '10', credits: 10, price: 15, name: 'Starter' },
  { size: '25', credits: 25, price: 30, name: 'Explorer', popular: true, savings: 'Save $7.50' },
  { size: '50', credits: 50, price: 50, name: 'Adventurer', savings: 'Save $25' },
]

export function CreditLimitModal({
  isOpen,
  onClose,
  reason,
  remainingFree = 0,
  credits = 0,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-rausch-100 to-kazan-100 rounded-full flex items-center justify-center mb-4">
              {reason === 'free_tier_limit' ? (
                <Sparkles className="h-6 w-6 text-rausch-600" />
              ) : (
                <Zap className="h-6 w-6 text-kazan-600" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-airbnb-black mb-2">
              {reason === 'free_tier_limit' 
                ? "You've Used Your Free Generations!" 
                : "Out of Credits"}
            </h2>
            
            <p className="text-sm text-muted-foreground">
              {reason === 'free_tier_limit'
                ? "You've used all 5 free AI itinerary generations this month. Purchase credits to keep planning amazing trips!"
                : "You've used all your credits. Purchase more to continue generating AI itineraries."}
            </p>
          </div>

          {/* Credit Packs */}
          <div className="space-y-2">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.size} className="relative">
                {pack.popular && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-rausch-500 text-white text-xs">
                    Most Popular
                  </Badge>
                )}
                
                <button
                  onClick={() => handlePurchase(pack.size)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-rausch-500 hover:bg-rausch-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-airbnb-black">
                        {pack.credits} Credits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pack.name} Pack
                      </div>
                      {pack.savings && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          {pack.savings}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-airbnb-black">
                        ${pack.price}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${(pack.price / pack.credits).toFixed(2)}/credit
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-airbnb-black mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rausch-500" />
              Why Purchase Credits?
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✓ Never expire - use anytime</li>
              <li>✓ Instant AI itinerary generation</li>
              <li>✓ Unlimited trip planning</li>
              <li>✓ Support TravelBlogr development</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}


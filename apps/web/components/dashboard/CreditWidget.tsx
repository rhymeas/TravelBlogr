'use client'

/**
 * Credit Widget Component
 * 
 * Displays user's credit balance, monthly usage, and purchase options.
 * Uses existing UI components from the design system.
 */

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Coins, Sparkles, TrendingUp, ShoppingCart } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CreditStats {
  totalPurchased: number
  totalUsed: number
  remaining: number
  lastPurchaseDate?: string
  monthlyUsage: number
  remainingFree: number
}

const CREDIT_PACKS = [
  {
    size: '10',
    credits: 10,
    price: 15,
    name: 'Starter',
    popular: false,
  },
  {
    size: '25',
    credits: 25,
    price: 30,
    name: 'Explorer',
    popular: true,
    savings: '$7.50',
  },
  {
    size: '50',
    credits: 50,
    price: 50,
    name: 'Adventurer',
    popular: false,
    savings: '$25',
  },
]

export function CreditWidget() {
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchCreditStats()
  }, [])

  const fetchCreditStats = async () => {
    try {
      const response = await fetch('/api/credits/balance')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching credit stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packSize: string) => {
    setPurchasing(packSize)
    
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
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error purchasing credits:', error)
      alert('Failed to start checkout. Please try again.')
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use 20 as the free tier limit for authenticated users (updated from 5)
  const freeUsagePercent = stats ? (stats.monthlyUsage / 20) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-kazan-500" />
          AI Credits
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Credit Balance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Available Credits</span>
            <span className="text-2xl font-bold text-airbnb-black">
              {stats?.remaining || 0}
            </span>
          </div>
          
          {stats && stats.totalPurchased > 0 && (
            <p className="text-xs text-muted-foreground">
              {stats.totalUsed} of {stats.totalPurchased} purchased credits used
            </p>
          )}
        </div>

        {/* Free Tier Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Free Tier This Month</span>
            <span className="text-sm font-medium text-airbnb-black">
              {stats?.monthlyUsage || 0} / 20 used
            </span>
          </div>
          
          <Progress value={freeUsagePercent} className="h-2" />
          
          {stats && stats.remainingFree > 0 ? (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {stats.remainingFree} free generations remaining
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Free tier exhausted. Purchase credits to continue!
            </p>
          )}
        </div>

        {/* Credit Packs */}
        <div>
          <h4 className="text-sm font-semibold text-airbnb-black mb-3">
            Purchase Credits
          </h4>
          
          <div className="space-y-2">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.size}
                className="relative"
              >
                {pack.popular && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-rausch-500 text-white">
                    Popular
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  className="w-full justify-between hover:border-rausch-500 hover:bg-rausch-50"
                  onClick={() => handlePurchase(pack.size)}
                  disabled={purchasing !== null}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold">
                        {pack.credits} Credits
                      </div>
                      {pack.savings && (
                        <div className="text-xs text-green-600">
                          Save {pack.savings}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold">${pack.price}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(pack.price / pack.credits).toFixed(2)}/credit
                    </div>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Credits never expire and can be used anytime for AI itinerary generation.
            Free tier resets monthly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


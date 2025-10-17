'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Loader2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUserCredits } from '@/hooks/useUserCredits'

const CREDIT_PACKS = [
  { size: '10', credits: 10, price: 15, name: 'Starter' },
  { size: '25', credits: 25, price: 30, name: 'Explorer', popular: true },
  { size: '50', credits: 50, price: 50, name: 'Adventurer' },
]

interface CreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const { credits, refresh: refreshCredits } = useUserCredits()
  const [couponCode, setCouponCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  const handlePurchase = async (packSize: string) => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ packSize }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast.error('Failed to start checkout. Please try again.')
    }
  }

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    setIsRedeeming(true)

    try {
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Failed to redeem coupon')
        return
      }

      // Success!
      if (data.type === 'credits') {
        toast.success(`${data.creditsGranted} credits added`)
      } else if (data.type === 'unlimited') {
        const until = new Date(data.unlimitedUntil).toLocaleDateString()
        toast.success(`Unlimited access until ${until}`)
      }

      setCouponCode('')
      refreshCredits()
    } catch (error) {
      console.error('Error redeeming coupon:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsRedeeming(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-12 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-md pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Credits</h2>
              <p className="text-sm text-gray-500 mt-0.5">Balance: {credits}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Coupon Section */}
            <div className="bg-gray-50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">Coupon Code</h3>
              </div>

              <form onSubmit={handleRedeemCoupon} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase text-sm flex-1"
                  disabled={isRedeeming}
                />
                <Button
                  type="submit"
                  disabled={isRedeeming || !couponCode.trim()}
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4"
                >
                  {isRedeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Redeem'
                  )}
                </Button>
              </form>
            </div>

            {/* Credit Packs */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Purchase Credits</h3>
              <div className="space-y-3">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.size}
                    className={`relative flex items-center justify-between p-4 rounded-lg border transition-all ${
                      pack.popular
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {pack.credits} Credits
                        </span>
                        {pack.popular && (
                          <span className="text-xs font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ${(pack.price / pack.credits).toFixed(2)}/credit
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        ${pack.price}
                      </span>
                      <Button
                        onClick={() => handlePurchase(pack.size)}
                        size="sm"
                        className={`${
                          pack.popular
                            ? 'bg-gray-900 hover:bg-gray-800'
                            : 'bg-gray-700 hover:bg-gray-600'
                        } text-white px-4`}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-2 pt-4 border-t border-gray-200">
              <p>• Credits never expire</p>
              <p>• Use for AI-powered itineraries</p>
              <p>• Manual trips are always free</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


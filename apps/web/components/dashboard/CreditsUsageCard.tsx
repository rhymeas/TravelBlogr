'use client'

/**
 * Credits Usage Card - Comprehensive credit tracking and management
 * Shows usage stats, warnings, and purchase options
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  CreditCard, ArrowRight, Sparkles, Calendar, Activity 
} from 'lucide-react'
import { getCreditStats, FREE_TIER_MONTHLY_LIMIT_AUTH } from '@/lib/services/creditService'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface CreditUsageStats {
  totalPurchased: number
  totalUsed: number
  remaining: number
  lastPurchaseDate?: string
  monthlyUsage: number
  remainingFree: number
}

export function CreditsUsageCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CreditUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadStats()
    }
  }, [user?.id])

  const loadStats = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const data = await getCreditStats(user.id)
      setStats(data)
      
      // Show warning if running low on credits or free tier
      const isLowOnCredits = data.remaining < 3
      const isLowOnFree = data.remainingFree < 3 && data.remainingFree > 0
      setShowWarning(isLowOnCredits || isLowOnFree)
    } catch (error) {
      console.error('Error loading credit stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const usagePercentage = (stats.monthlyUsage / FREE_TIER_MONTHLY_LIMIT_AUTH) * 100
  const hasCredits = stats.remaining > 0
  const isNearLimit = stats.remainingFree <= 5

  return (
    <div className="bg-gradient-to-br from-white to-teal-50/30 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Credits</h3>
              <p className="text-sm text-gray-600">Track your usage & balance</p>
            </div>
          </div>
          
          {hasCredits && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">{stats.remaining} credits</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200"
          >
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900">
                  {stats.remainingFree === 0 && stats.remaining === 0
                    ? '⚠️ Out of Credits!'
                    : stats.remainingFree <= 3
                    ? `Only ${stats.remainingFree} free generations left this month`
                    : `Only ${stats.remaining} credits remaining`}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {stats.remainingFree === 0 && stats.remaining === 0
                    ? 'Purchase credits to continue generating AI trip plans'
                    : 'Consider purchasing credits to avoid interruptions'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="p-6 space-y-6">
        {/* Monthly Usage Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">This Month</span>
            </div>
            <span className="text-sm text-gray-600">
              {stats.monthlyUsage} / {FREE_TIER_MONTHLY_LIMIT_AUTH} free
            </span>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                usagePercentage >= 100
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : usagePercentage >= 80
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600'
              }`}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {stats.remainingFree} free generations remaining
            </span>
            <span className="text-xs font-medium text-gray-700">
              {Math.round(usagePercentage)}% used
            </span>
          </div>
        </div>

        {/* Credit Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-teal-600">{stats.remaining}</div>
            <div className="text-xs text-gray-600 mt-1">Available</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsed}</div>
            <div className="text-xs text-gray-600 mt-1">Used</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPurchased}</div>
            <div className="text-xs text-gray-600 mt-1">Purchased</div>
          </div>
        </div>

        {/* Last Purchase */}
        {stats.lastPurchaseDate && (
          <div className="flex items-center gap-2 text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              Last purchase: {new Date(stats.lastPurchaseDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/credits/purchase"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm hover:shadow-md active:scale-98"
          >
            <CreditCard className="h-4 w-4" />
            <span>Buy Credits</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          
          <Link
            href="/dashboard/credits/history"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <Activity className="h-4 w-4" />
            <span>View History</span>
          </Link>
        </div>

        {/* Pro Tip */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-900">Pro Tip</p>
            <p className="text-xs text-purple-700 mt-1">
              Save your generated trips to reuse them later without using additional credits!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


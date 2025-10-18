'use client'

/**
 * Creator Earnings Dashboard
 * 
 * Track affiliate revenue, conversions, and payouts.
 * Shows 70/30 revenue split between creator and platform.
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, TrendingUp, Eye, MousePointerClick, CheckCircle, Clock } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface EarningsStats {
  totalEarnings: number
  availableBalance: number
  pendingEarnings: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
}

interface Earning {
  id: string
  total_commission: number
  creator_share: number
  platform_share: number
  currency: string
  status: string
  created_at: string
  post_id?: string
  trip_id?: string
  conversion_id?: string
}

export default function EarningsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    availableBalance: 0,
    pendingEarnings: 0,
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0
  })
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEarningsData()
    }
  }, [user])

  const fetchEarningsData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const supabase = getBrowserSupabase()

      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (earningsError) throw earningsError

      // Fetch clicks count
      const { count: clicksCount, error: clicksError } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (clicksError) throw clicksError

      // Fetch conversions count
      const { count: conversionsCount, error: conversionsError } = await supabase
        .from('affiliate_conversions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (conversionsError) throw conversionsError

      // Calculate stats
      const totalEarnings = earningsData?.reduce((sum, e) => sum + parseFloat(e.creator_share.toString()), 0) || 0
      const availableBalance = earningsData?.filter(e => e.status === 'available').reduce((sum, e) => sum + parseFloat(e.creator_share.toString()), 0) || 0
      const pendingEarnings = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_share.toString()), 0) || 0
      const conversionRate = clicksCount && clicksCount > 0 ? ((conversionsCount || 0) / clicksCount) * 100 : 0

      setStats({
        totalEarnings,
        availableBalance,
        pendingEarnings,
        totalClicks: clicksCount || 0,
        totalConversions: conversionsCount || 0,
        conversionRate
      })

      setEarnings(earningsData || [])
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to view your earnings.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your affiliate revenue and payouts</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${stats.availableBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${stats.pendingEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Being processed</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalClicks.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Affiliate link clicks</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalConversions}
                </p>
                <p className="text-xs text-gray-500 mt-1">Successful bookings</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.conversionRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Click to booking</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Split Info */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-rausch-50 to-kazan-50 border-rausch-200">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-rausch-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Revenue Split: 70/30</h3>
              <p className="text-sm text-gray-700">
                You earn <strong>70%</strong> of all affiliate commissions from your content.
                TravelBlogr keeps 30% to maintain the platform and provide you with tools to grow your audience.
              </p>
            </div>
          </div>
        </Card>

        {/* Earnings History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Earnings History</h2>
            <Button variant="outline" size="sm">
              Request Payout
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No earnings yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start creating content with affiliate links to earn commissions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Source</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commission</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Your Share (70%)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {earning.post_id ? 'Blog Post' : earning.trip_id ? 'Trip' : 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        ${parseFloat(earning.total_commission.toString()).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                        ${parseFloat(earning.creator_share.toString()).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            earning.status === 'paid' ? 'default' :
                            earning.status === 'available' ? 'secondary' :
                            'outline'
                          }
                        >
                          {earning.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


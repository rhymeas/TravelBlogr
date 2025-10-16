'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  ArrowRight,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CreditUsage {
  total_credits: number
  used_credits: number
  remaining_credits: number
  monthly_limit: number
  monthly_used: number
  last_purchase_date?: string
  next_reset_date: string
}

export default function CreditsPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [usage, setUsage] = useState<CreditUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchCreditUsage()
    }
  }, [user])

  const fetchCreditUsage = async () => {
    try {
      const response = await fetch('/api/credits/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching credit usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !isAuthenticated) {
    return null
  }

  const percentageUsed = usage 
    ? Math.round((usage.monthly_used / usage.monthly_limit) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Credits & Usage
          </h1>
          <p className="text-gray-600">
            Manage your credits and track your usage
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Credit Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Credits */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Available
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {usage?.remaining_credits || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Credits Remaining
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Usage */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      This Month
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {usage?.monthly_used || 0} / {usage?.monthly_limit || 20}
                  </div>
                  <div className="text-sm text-gray-600">
                    Free Plannings Used
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Reset */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Resets
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {usage?.next_reset_date 
                      ? new Date(usage.next_reset_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Free Tier Reset Date
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Credits Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Need More Credits?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-700 mb-2">
                      Purchase credit packs to continue planning trips beyond your free tier limit.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 10 Credits: $5.00 ($0.50 per planning)</li>
                      <li>• 25 Credits: $10.00 ($0.40 per planning)</li>
                      <li>• 50 Credits: $15.00 ($0.30 per planning)</li>
                    </ul>
                  </div>
                  <Button asChild className="bg-rausch-500 hover:bg-rausch-600 whitespace-nowrap">
                    <Link href="/pricing" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Purchase Credits
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Usage history coming soon</p>
                  <p className="text-sm mt-1">Track your credit usage over time</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}


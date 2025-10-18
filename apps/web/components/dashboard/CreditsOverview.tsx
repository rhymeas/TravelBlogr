'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getBrowserSupabase } from '@/lib/supabase'
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  getUserCredits, 
  getMonthlyAIUsage,
  FREE_TIER_MONTHLY_LIMIT_AUTH,
  FREE_TIER_MONTHLY_LIMIT_PRO
} from '@/lib/services/creditService'

interface CreditTransaction {
  id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund' | 'bonus'
  description: string
  created_at: string
  metadata?: any
}

interface TripPlanningHistory {
  id: string
  trip_title: string
  created_at: string
  credits_used: number
  mode: 'standard' | 'pro'
  trip_id?: string
}

export function CreditsOverview() {
  const { user } = useAuth()
  const [credits, setCredits] = useState(0)
  const [monthlyUsage, setMonthlyUsage] = useState(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [planningHistory, setPlanningHistory] = useState<TripPlanningHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadCreditData()
    }
  }, [user])

  const loadCreditData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = getBrowserSupabase()

      // Get credit balance
      const creditBalance = await getUserCredits(user.id)
      setCredits(creditBalance)

      // Get monthly usage
      const usage = await getMonthlyAIUsage(user.id)
      setMonthlyUsage(usage)

      // Get credit transactions
      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (txData) {
        setTransactions(txData)
      }

      // Get trip planning history from trip_plan table
      const { data: planData } = await supabase
        .from('trip_plan')
        .select(`
          id,
          trip_id,
          plan_data,
          created_at,
          trips!inner (
            title,
            user_id
          )
        `)
        .eq('trips.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (planData) {
        const history: TripPlanningHistory[] = planData.map((plan: any) => ({
          id: plan.id,
          trip_title: plan.trips?.title || 'Untitled Trip',
          created_at: plan.created_at,
          credits_used: 0, // Free tier for now
          mode: plan.plan_data?.mode || 'standard',
          trip_id: plan.trip_id
        }))
        setPlanningHistory(history)
      }

    } catch (error) {
      console.error('Error loading credit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const freeGenerationsRemaining = FREE_TIER_MONTHLY_LIMIT_AUTH - monthlyUsage
  const isFreeTierExhausted = freeGenerationsRemaining <= 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">Credit Balance</h3>
            </div>
          </div>
          <div className="text-3xl font-bold text-teal-600 mb-1">{credits}</div>
          <p className="text-xs text-gray-600">Available credits</p>
        </Card>

        {/* Monthly Usage */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Monthly Usage</h3>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {monthlyUsage} / {FREE_TIER_MONTHLY_LIMIT_AUTH}
          </div>
          <p className="text-xs text-gray-600">Free AI generations this month</p>
          {isFreeTierExhausted && (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Free tier exhausted
            </Badge>
          )}
        </Card>

        {/* Add Credits */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Need More?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Purchase credits to continue generating AI-powered trips
          </p>
          <Button
            variant="default"
            size="sm"
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={() => {
              // TODO: Implement Stripe checkout
              alert('Credit purchase coming soon!')
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Credits
          </Button>
        </Card>
      </div>

      {/* Trip Planning History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-600" />
            Trip Planning History
          </h3>
          <Badge variant="secondary">{planningHistory.length} trips</Badge>
        </div>

        {planningHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No trips planned yet</p>
            <p className="text-xs mt-1">Start planning your first adventure!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {planningHistory.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{plan.trip_title}</h4>
                    <Badge variant={plan.mode === 'pro' ? 'default' : 'secondary'} className="text-xs">
                      {plan.mode === 'pro' ? '⚡ Pro' : 'Standard'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(plan.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {plan.credits_used > 0 ? `${plan.credits_used} credits` : 'Free tier'}
                    </span>
                  </div>
                </div>
                {plan.trip_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/dashboard/trips/${plan.trip_id}`}
                  >
                    View Trip
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Credit Transactions */}
      {transactions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-teal-600" />
              Transaction History
            </h3>
            <Badge variant="secondary">{transactions.length} transactions</Badge>
          </div>

          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'purchase' ? 'bg-green-100' :
                    tx.type === 'usage' ? 'bg-orange-100' :
                    tx.type === 'refund' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {tx.type === 'purchase' && <Plus className="h-4 w-4 text-green-600" />}
                    {tx.type === 'usage' && <TrendingUp className="h-4 w-4 text-orange-600" />}
                    {tx.type === 'refund' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    {tx.type === 'bonus' && <DollarSign className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${
                  tx.type === 'usage' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {tx.type === 'usage' ? '-' : '+'}{Math.abs(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}


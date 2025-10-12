'use client'

import { useState, useEffect } from 'react'
import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { 
  Activity, 
  Zap, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AIStats {
  totalRequests: number
  avgLatency: number
  totalCost: number
  errorRate: number
  requestsToday: number
  requestsThisWeek: number
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

export default function AIMonitoringPage() {
  const [stats, setStats] = useState<AIStats>({
    totalRequests: 0,
    avgLatency: 0,
    totalCost: 0,
    errorRate: 0,
    requestsToday: 0,
    requestsThisWeek: 0,
  })
  const [heliconeConfigured, setHeliconeConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Helicone is configured
    const checkHelicone = async () => {
      try {
        // In a real implementation, this would check the backend
        // For now, we'll just show setup instructions
        setHeliconeConfigured(false)
        setLoading(false)
      } catch (error) {
        console.error('Error checking Helicone:', error)
        setLoading(false)
      }
    }

    checkHelicone()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!heliconeConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <AdminBreadcrumb currentPage="AI Monitoring" />
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
            AI Monitoring
          </h1>
          <p className="text-gray-600">
            Track AI requests, latency, and costs in real-time with Helicone
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Helicone Setup Required
              </h3>
              <p className="text-yellow-800 mb-4">
                To enable AI monitoring, you need to set up Helicone (100% free for up to 100K requests/month).
              </p>
              <div className="space-y-3 text-sm text-yellow-900">
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[24px]">1.</span>
                  <div>
                    <span className="font-medium">Sign up for Helicone:</span>
                    <a 
                      href="https://helicone.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      helicone.ai
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[24px]">2.</span>
                  <div>
                    <span className="font-medium">Get your API key</span> from the Helicone dashboard
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[24px]">3.</span>
                  <div>
                    <span className="font-medium">Add to environment variables:</span>
                    <pre className="mt-2 bg-yellow-100 p-3 rounded text-xs overflow-x-auto">
                      HELICONE_API_KEY=sk-helicone-your-key-here
                    </pre>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[24px]">4.</span>
                  <div>
                    <span className="font-medium">Restart your application</span> to apply changes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="p-2 bg-blue-50 rounded-lg w-fit mb-4">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-Time Monitoring
            </h3>
            <p className="text-sm text-gray-600">
              Track every AI request with detailed latency metrics and response times
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="p-2 bg-green-50 rounded-lg w-fit mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cost Tracking
            </h3>
            <p className="text-sm text-gray-600">
              Monitor AI costs and stay within free tier limits automatically
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="p-2 bg-purple-50 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Zero Cost
            </h3>
            <p className="text-sm text-gray-600">
              100% free for up to 100K requests per month - perfect for TravelBlogr
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="AI Monitoring" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          AI Monitoring
        </h1>
        <p className="text-gray-600">
          Real-time AI request tracking powered by Helicone
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon={Activity}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Avg Latency"
          value={`${stats.avgLatency}ms`}
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Total Cost"
          value={`$${stats.totalCost.toFixed(2)}`}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Error Rate"
          value={`${stats.errorRate.toFixed(1)}%`}
          icon={AlertCircle}
          color={stats.errorRate > 5 ? 'red' : 'green'}
        />
      </div>

      {/* Helicone Dashboard Embed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Helicone Dashboard
          </h2>
          <a
            href="https://helicone.ai/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Open in Helicone
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          View detailed analytics, request logs, and performance metrics in your Helicone dashboard.
        </p>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-700">
            Helicone is configured and monitoring your AI requests
          </p>
        </div>
      </div>
    </div>
  )
}


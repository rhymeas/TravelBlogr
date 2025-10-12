'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { DollarSign, TrendingDown, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function CostsAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Cost Tracking" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          Cost Tracking
        </h1>
        <p className="text-gray-600">
          Monitor service costs and free tier usage
        </p>
      </div>

      {/* Zero Cost Badge */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-2xl font-bold text-green-900">$0.00/month</h3>
            <p className="text-green-700">All services running on free tiers</p>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Groq API</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Free Tier</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usage:</span>
              <span className="text-gray-900">0 / Unlimited</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="text-gray-900 font-medium">$0.00</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Helicone</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-yellow-600 font-medium">Setup Required</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Free Tier:</span>
              <span className="text-gray-900">100K req/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="text-gray-900 font-medium">$0.00</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supabase</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Free Tier</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage:</span>
              <span className="text-gray-900">~50MB / 500MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="text-gray-900 font-medium">$0.00</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Railway</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credits:</span>
              <span className="text-gray-900">$5 free/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="text-gray-900 font-medium">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


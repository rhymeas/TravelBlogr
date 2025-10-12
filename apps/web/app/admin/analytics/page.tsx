'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AnalyticsAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Analytics" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          Platform Analytics
        </h1>
        <p className="text-gray-600">
          View platform analytics and insights
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="text-gray-600">
          Comprehensive analytics will be available in the next update
        </p>
      </div>
    </div>
  )
}


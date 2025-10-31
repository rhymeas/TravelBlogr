/**
 * Unified Billing & Credits Page
 * 
 * Combines:
 * - Credit balance and usage tracking
 * - Purchase credits functionality
 * - Invoice history with downloads
 * - Subscription management (if applicable)
 * - Payment method management
 */

import { Metadata } from 'next'
import { BillingDashboard } from '@/components/billing/BillingDashboard'

export const metadata: Metadata = {
  title: 'Billing & Credits - TravelBlogr',
  description: 'Manage your credits, view invoices, and handle billing',
}

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Credits</h1>
          <p className="text-gray-600">
            Manage your credits, view invoices, and handle all billing matters
          </p>
        </div>

        {/* Main Dashboard */}
        <BillingDashboard />
      </div>
    </div>
  )
}


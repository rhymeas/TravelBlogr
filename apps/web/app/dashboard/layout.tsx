'use client'

import { AuthAwareHeader } from '@/components/layout/AuthAwareHeader'
import { Footer } from '@/components/layout/Footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-airbnb-background-secondary">
      <AuthAwareHeader />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  )
}

'use client'

/**
 * Author Monetization Promo
 * Encourages users to create blog posts and earn money
 * Placed in sidebar or after main CTA
 */

import { DollarSign, TrendingUp, Users, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface AuthorMonetizationPromoProps {
  className?: string
  variant?: 'sidebar' | 'inline'
}

export function AuthorMonetizationPromo({
  className = '',
  variant = 'sidebar'
}: AuthorMonetizationPromoProps) {
  if (variant === 'inline') {
    return (
      <div className={`relative overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-12 ${className}`}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full mb-4">
            <DollarSign className="h-3 w-3" />
            Creator Program
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Share Your Travels, Earn Money
          </h3>

          <p className="text-gray-600 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Join our community of travel creators and earn 70% commission on all bookings from your posts.
            Free to start, track earnings in real-time.
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">70%</div>
              <div className="text-xs md:text-sm text-gray-600">Commission</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">$0</div>
              <div className="text-xs md:text-sm text-gray-600">Setup Fee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">24/7</div>
              <div className="text-xs md:text-sm text-gray-600">Tracking</div>
            </div>
          </div>

          <Link
            href="/blog/monetization"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            Start Earning Today
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    )
  }

  // Sidebar variant
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1 text-sm">
            Earn Money Blogging
          </h4>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Share your travel stories and earn 70% commission. Free to start.
          </p>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <TrendingUp className="h-3 w-3 text-gray-900 flex-shrink-0" />
              <span>Real-time tracking</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Users className="h-3 w-3 text-gray-900 flex-shrink-0" />
              <span>500+ creators</span>
            </div>
          </div>
          <Link
            href="/blog/monetization"
            className="group inline-flex items-center gap-1 text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            Learn more
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}


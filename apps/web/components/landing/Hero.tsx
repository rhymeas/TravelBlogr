'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight, Play, MapPin, Globe, Users, Camera } from 'lucide-react'
import Link from 'next/link'
import { useLandingStats } from '@/hooks/useFeaturedContent'
import { useEffect, useState } from 'react'

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value === 0) return

    const startTime = Date.now()
    const startValue = 0
    const endValue = value

    const updateCount = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart)

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

// Statistics card component
function StatCard({
  icon,
  value,
  label,
  suffix = '',
  isSpecial = false
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  suffix?: string
  isSpecial?: boolean
}) {
  return (
    <div className="card-elevated p-6 text-center hover:shadow-sleek-large transition-all duration-300 group">
      <div className="w-12 h-12 bg-gradient-to-r from-rausch-500 to-rausch-700 rounded-sleek-medium flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-2xl font-bold text-sleek-black mb-2">
        {isSpecial ? (
          value
        ) : (
          <>
            <AnimatedCounter value={typeof value === 'number' ? value : 0} />
            {suffix}
          </>
        )}
      </div>
      <div className="text-body-medium text-sleek-dark-gray">{label}</div>
    </div>
  )
}

export function Hero() {
  const { stats, isLoading } = useLandingStats()

  return (
    <section className="relative bg-white py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-gray-50 px-4 py-2 text-body-medium text-sleek-dark-gray border border-gray-200">
            <span className="mr-2">✨</span>
            Where shared stories become perfect plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>

          {/* Main Heading */}
          <h1 className="text-display-large text-sleek-black mb-6 leading-tight">
            Share Your Journey,{' '}
            <span className="bg-gradient-to-r from-rausch-500 to-rausch-700 bg-clip-text text-transparent">
              Plan Your Next Adventure
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-body-large text-sleek-dark-gray mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your travel experiences into inspiring stories that help fellow travelers plan unforgettable trips. Share detailed timelines and discover your next destination through authentic community experiences.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/auth/signup"
              className="btn-primary px-8 py-4 text-body-large font-semibold rounded-sleek-small w-full sm:w-auto hover:scale-105 transition-transform"
            >
               Share Your Journey
            </Link>
            <Link
              href="/locations"
              className="btn-secondary px-8 py-4 text-body-large font-semibold rounded-sleek-small w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Plan Your Trip
            </Link>
          </div>

          {/* Statistics Cards - Kanada Reise Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <StatCard
              icon={<MapPin className="h-6 w-6 text-white" />}
              value={stats?.totalTrips || 0}
              label="Active Journeys"
              isSpecial={false}
            />
            <StatCard
              icon={<Globe className="h-6 w-6 text-white" />}
              value={stats?.totalDestinations || 0}
              label="Destinations"
              isSpecial={false}
            />
            <StatCard
              icon={<Users className="h-6 w-6 text-white" />}
              value={stats?.totalDistance || 0}
              label="Kilometers"
              suffix=" km"
              isSpecial={false}
            />
            <StatCard
              icon={<Camera className="h-6 w-6 text-white" />}
              value="∞"
              label="Memories"
              isSpecial={true}
            />
          </div>

          {/* Hero Image/Preview */}
          <div className="relative mx-auto max-w-5xl">
            <div className="relative rounded-sleek-large overflow-hidden shadow-sleek-xl bg-gradient-to-br from-gray-50 to-gray-100 aspect-[16/10]">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-rausch-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <p className="text-title-small text-sleek-dark-gray">
                    Beautiful travel stories await
                  </p>
                </div>
              </div>

              {/* Loading overlay for stats */}
              {isLoading && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-sleek-small px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-sleek-dark-gray">
                    <div className="w-4 h-4 border-2 border-rausch-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading stats...
                  </div>
                </div>
              )}

              {/* Floating cards for visual interest */}
              <div className="absolute top-6 left-6 bg-white rounded-sleek-medium p-4 shadow-sleek-medium max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📍</span>
                  </div>
                  <div>
                    <p className="text-body-medium font-semibold text-sleek-black">Paris, France</p>
                    <p className="text-body-small text-sleek-dark-gray">Just checked in</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 bg-white rounded-sleek-medium p-4 shadow-sleek-medium max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📸</span>
                  </div>
                  <div>
                    <p className="text-body-medium font-semibold text-sleek-black">New photos shared</p>
                    <p className="text-body-small text-sleek-dark-gray">Family can now view</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

/**
 * FeatureList - Blog Feature List Component
 * 
 * A component for displaying feature lists with icons and descriptions.
 * Used in "Plan Your Trip With Us" and similar sections.
 * 
 * Use cases:
 * - Trip planning features section
 * - Service highlights
 * - Benefits list
 * - How it works steps
 */

import { LucideIcon, Check, MapPin, Calendar, Users, Sparkles, Shield, Zap } from 'lucide-react'

export interface FeatureItem {
  id: string
  icon?: LucideIcon
  iconColor?: string
  title: string
  description?: string
}

interface FeatureListProps {
  features: FeatureItem[]
  variant?: 'default' | 'compact' | 'grid' | 'checklist'
  columns?: 1 | 2 | 3
  iconSize?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FeatureList({
  features,
  variant = 'default',
  columns = 1,
  iconSize = 'md',
  className = ''
}: FeatureListProps) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  // Checklist variant - simple list with checkmarks
  if (variant === 'checklist') {
    return (
      <ul className={`space-y-3 ${className}`}>
        {features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-3">
            <Check className={`${iconSizes[iconSize]} text-green-600 flex-shrink-0 mt-0.5`} />
            <div>
              <span className="text-gray-900 font-medium">{feature.title}</span>
              {feature.description && (
                <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  // Grid variant - cards in grid layout
  if (variant === 'grid') {
    return (
      <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
        {features.map((feature) => {
          const Icon = feature.icon || Sparkles
          return (
            <div
              key={feature.id}
              className="p-6 rounded-xl border border-gray-200 hover:border-rausch-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className={`inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-br from-rausch-50 to-kazan-50 mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`${iconSizes[iconSize]} ${feature.iconColor || 'text-rausch-600'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              {feature.description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Compact variant - inline icons with text
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {features.map((feature) => {
          const Icon = feature.icon || Check
          return (
            <div key={feature.id} className="flex items-center gap-2">
              <Icon className={`${iconSizes[iconSize]} ${feature.iconColor || 'text-rausch-600'}`} />
              <span className="text-gray-900 font-medium">{feature.title}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Default variant - vertical list with icons
  return (
    <div className={`space-y-4 ${className}`}>
      {features.map((feature) => {
        const Icon = feature.icon || Sparkles
        return (
          <div key={feature.id} className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-rausch-50 to-kazan-50`}>
              <Icon className={`${iconSizes[iconSize]} ${feature.iconColor || 'text-rausch-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              {feature.description && (
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Pre-configured feature lists for common use cases
 */

export const TRIP_PLANNING_FEATURES: FeatureItem[] = [
  {
    id: '1',
    icon: MapPin,
    iconColor: 'text-rausch-600',
    title: 'Smart Destination Recommendations',
    description: 'AI-powered suggestions based on your preferences and travel style'
  },
  {
    id: '2',
    icon: Calendar,
    iconColor: 'text-kazan-600',
    title: 'Flexible Itinerary Planning',
    description: 'Drag-and-drop interface to customize your perfect trip timeline'
  },
  {
    id: '3',
    icon: Users,
    iconColor: 'text-babu-600',
    title: 'Collaborative Trip Planning',
    description: 'Invite friends and family to plan together in real-time'
  },
  {
    id: '4',
    icon: Shield,
    iconColor: 'text-green-600',
    title: 'Secure & Private',
    description: 'Your travel plans are protected with enterprise-grade security'
  }
]

export const PLATFORM_BENEFITS: FeatureItem[] = [
  {
    id: '1',
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed with instant search and real-time updates'
  },
  {
    id: '2',
    icon: MapPin,
    title: 'Global Coverage',
    description: 'Access information for destinations worldwide'
  },
  {
    id: '3',
    icon: Users,
    title: 'Community Driven',
    description: 'Learn from real travelers and share your experiences'
  },
  {
    id: '4',
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart recommendations tailored to your preferences'
  }
]

/**
 * Example Usage:
 * 
 * // Default variant
 * <FeatureList features={TRIP_PLANNING_FEATURES} />
 * 
 * // Grid variant with 3 columns
 * <FeatureList 
 *   features={PLATFORM_BENEFITS} 
 *   variant="grid" 
 *   columns={3} 
 * />
 * 
 * // Checklist variant
 * <FeatureList 
 *   features={[
 *     { id: '1', title: 'Free to use' },
 *     { id: '2', title: 'No credit card required' },
 *     { id: '3', title: 'Cancel anytime' }
 *   ]} 
 *   variant="checklist" 
 * />
 * 
 * // Compact variant
 * <FeatureList 
 *   features={PLATFORM_BENEFITS} 
 *   variant="compact" 
 *   iconSize="sm" 
 * />
 */


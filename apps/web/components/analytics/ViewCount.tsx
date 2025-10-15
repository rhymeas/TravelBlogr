'use client'

import { Eye } from 'lucide-react'
import { useSimpleViewCount } from '@/hooks/useViewCount'

interface ViewCountProps {
  tripId: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Display view count for a trip
 * Automatically fetches and updates the count
 * 
 * Usage:
 * <ViewCount tripId="123" />
 * <ViewCount tripId="123" size="lg" showIcon={true} />
 */
export function ViewCount({ 
  tripId, 
  className = '', 
  showIcon = true,
  size = 'md'
}: ViewCountProps) {
  const viewCount = useSimpleViewCount(tripId)

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  // Format large numbers (1000 -> 1K, 1000000 -> 1M)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className={`flex items-center gap-1 text-gray-600 ${sizeClasses[size]} ${className}`}>
      {showIcon && <Eye className={iconSizes[size]} />}
      <span>{formatCount(viewCount)}</span>
    </div>
  )
}

/**
 * Badge-style view count (for cards)
 */
export function ViewCountBadge({ tripId }: { tripId: string }) {
  const viewCount = useSimpleViewCount(tripId)

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
      <Eye className="h-3 w-3" />
      <span className="font-medium">{formatCount(viewCount)}</span>
    </div>
  )
}


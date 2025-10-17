'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StickyBottomCTAProps {
  children: ReactNode
  className?: string
  show?: boolean
}

/**
 * Sticky Bottom CTA Component
 *
 * A mobile-optimized sticky bottom CTA that:
 * - Respects iOS safe area (notch/home indicator)
 * - Respects bottom navigation bar (64px height)
 * - Has backdrop blur for better visibility
 * - Slides up smoothly
 * - Doesn't cover important content
 *
 * Usage:
 * <StickyBottomCTA>
 *   <Button>Generate Itinerary</Button>
 * </StickyBottomCTA>
 */
export function StickyBottomCTA({ children, className, show = true }: StickyBottomCTAProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Delay showing to allow for smooth animation
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className={cn(
        // Fixed positioning at bottom
        'fixed left-0 right-0 z-40',
        // Only show on mobile/tablet
        'lg:hidden',
        // Backdrop blur and shadow
        'bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg',
        // Animation
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full',
        className
      )}
      style={{
        // Position above bottom nav bar (64px) + safe area
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        paddingBottom: '0.5rem',
        paddingTop: '0.75rem'
      }}
    >
      <div className="px-4">
        {children}
      </div>
    </div>
  )
}

/**
 * Add this to your global CSS (globals.css) for iOS safe area support:
 * 
 * @supports (padding-bottom: env(safe-area-inset-bottom)) {
 *   .pb-safe {
 *     padding-bottom: env(safe-area-inset-bottom);
 *   }
 * }
 */


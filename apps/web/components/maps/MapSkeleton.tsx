/**
 * Map Loading Skeleton Component
 * 
 * 🚀 PERFORMANCE: Provides visual feedback while map loads (Phase 2 optimization - 2025-01-28)
 * DEPENDENCIES: None - pure CSS animation
 * CONTEXT: Prevents layout shift and improves perceived performance during lazy loading
 */

interface MapSkeletonProps {
  height?: string
  showSpinner?: boolean
  message?: string
}

export function MapSkeleton({ 
  height = '600px', 
  showSpinner = true,
  message = 'Loading interactive map...'
}: MapSkeletonProps) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
      style={{ height }}
    >
      <div className="text-center px-4">
        {showSpinner && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        <p className="text-gray-600 text-sm">{message}</p>
        
        {/* Subtle map-like background pattern */}
        <div className="mt-4 opacity-20">
          <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.5" />
            <line x1="25" y1="0" x2="25" y2="100" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="currentColor" strokeWidth="0.5" />
            
            {/* Map pin icon */}
            <circle cx="50" cy="40" r="8" fill="currentColor" opacity="0.3" />
            <path d="M 50 48 L 50 55" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact Map Skeleton (for smaller maps)
 */
export function CompactMapSkeleton({ height = '400px' }: { height?: string }) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-50 rounded border border-gray-200"
      style={{ height }}
    >
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
          <div className="h-3 w-24 bg-gray-300 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  )
}


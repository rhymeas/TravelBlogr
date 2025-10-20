'use client'

export function TripsDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title skeleton */}
          <div className="h-10 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-6" />

          {/* Search and filters skeleton */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search bar */}
              <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />

              {/* Filter buttons */}
              <div className="flex gap-2">
                <div className="h-12 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
                <div className="h-12 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
                <div className="h-12 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border shadow-sm">
              {/* Image skeleton with spinner */}
              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-rausch-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

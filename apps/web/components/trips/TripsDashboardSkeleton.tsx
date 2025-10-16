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
              {/* Image skeleton with shimmer effect */}
              <div className="aspect-[4/3] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />

              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4" />

                {/* Description lines */}
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-full" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-2/3" />
                </div>

                {/* Stats */}
                <div className="flex justify-between pt-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-20" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-24" />
                </div>
              </div>

              {/* Footer skeleton */}
              <div className="px-4 py-3 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="w-6 h-6 bg-gray-200 rounded" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

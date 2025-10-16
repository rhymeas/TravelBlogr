export function TripsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Actions Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="animate-pulse">
              {/* Image skeleton with proper aspect ratio */}
              <div className="w-full aspect-[16/9] bg-gray-200" />

              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />

                <div className="flex justify-between pt-2">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
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
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto w-12" />
              <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-4 max-w-md mx-auto"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-6 max-w-2xl mx-auto"></div>

            {/* Stats Skeleton */}
            <div className="flex justify-center gap-8">
              <div className="h-5 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              <div className="h-5 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              <div className="h-5 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg max-w-2xl mx-auto"></div>
      </div>

      {/* Tab Switcher Skeleton */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex justify-center gap-2 max-w-md mx-auto">
          <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
          <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
        </div>
      </div>

      {/* Grid Skeleton - Matches LocationsGrid 4-column layout */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Image skeleton with shimmer */}
              <div className="aspect-[4/3] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>

              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4"></div>

                {/* Location */}
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2"></div>

                {/* Description lines */}
                <div className="space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-5/6"></div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 pt-2">
                  <div className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
                  <div className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


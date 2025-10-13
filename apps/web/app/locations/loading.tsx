export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-4 max-w-md mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-6 max-w-2xl mx-auto"></div>

            {/* Stats Skeleton */}
            <div className="flex justify-center gap-8">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Image skeleton */}
              <div className="aspect-[4/3] bg-gray-200 animate-pulse"></div>

              {/* Content skeleton */}
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


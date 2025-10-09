export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-9 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="space-y-3">
        {/* Where to? */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Dates & Interests */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


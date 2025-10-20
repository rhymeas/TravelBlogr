export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rausch-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading trip planner...</p>
      </div>
    </div>
  )
}


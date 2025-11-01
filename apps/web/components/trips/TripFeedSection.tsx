"use client"

import { Card } from '@/components/ui/Card'
import { TripFeedImageUpload } from './TripFeedImageUpload'
import { TripFeedGallery } from './TripFeedGallery'

export function TripFeedSection({ tripId, canPost }: { tripId: string, canPost: boolean }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Live Trip Feed</h2>
        {/* Small note about privacy */}
        <span className="text-xs text-gray-500">Trip photos appear here; public trips also show in the global Live Feed</span>
      </div>

      {canPost && (
        <div className="mb-6">
          <TripFeedImageUpload tripId={tripId} onImagePosted={() => {/* gallery auto-refresh via parent (optional) */}} />
        </div>
      )}

      <TripFeedGallery tripId={tripId} isTripOwner={canPost} />
    </Card>
  )
}


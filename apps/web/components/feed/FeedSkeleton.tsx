'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {/* Avatar skeleton */}
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              
              {/* Header content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              
              {/* Action button skeleton */}
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              
              {/* Image skeleton */}
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              
              {/* Action buttons skeleton */}
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

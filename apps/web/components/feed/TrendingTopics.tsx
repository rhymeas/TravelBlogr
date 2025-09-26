'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Hash, ArrowRight } from 'lucide-react'

interface TrendingTopic {
  id: string
  name: string
  hashtag: string
  description: string
  post_count: number
  trend_score: number
  is_trending: boolean
}

interface TrendingTopicsProps {
  topics: TrendingTopic[]
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  if (!topics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No trending topics right now.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.slice(0, 8).map((topic, index) => (
          <div
            key={topic.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Trending Rank */}
              <div className="flex-shrink-0">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-yellow-500 text-white' : 
                    index === 1 ? 'bg-gray-400 text-white' : 
                    index === 2 ? 'bg-orange-600 text-white' : 
                    'bg-gray-200 text-gray-600'}
                `}>
                  {index + 1}
                </div>
              </div>

              {/* Topic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {topic.name}
                  </span>
                  {topic.is_trending && (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                      Hot
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{topic.post_count.toLocaleString()} posts</span>
                  <span>•</span>
                  <span>Score: {topic.trend_score.toFixed(1)}</span>
                </div>
                
                {topic.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {topic.description}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
            </div>
          </div>
        ))}

        {/* View All Link */}
        {topics.length > 8 && (
          <div className="pt-3 border-t">
            <Link 
              href="/trending" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all trending topics
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

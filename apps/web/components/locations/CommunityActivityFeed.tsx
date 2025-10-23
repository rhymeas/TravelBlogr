'use client'

import { useState, useEffect } from 'react'
import { Users, Edit, Edit2, Image as ImageIcon, Award, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { useAuth } from '@/hooks/useAuth'

interface Contribution {
  id: string
  contribution_type: string
  field_edited: string
  change_snippet: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    username: string
    avatar_url: string
  }
}

interface TopContributor {
  user_id: string
  full_name: string
  username: string
  avatar_url: string
  contribution_count: number
  last_contribution_at: string
}

interface CommunityActivityFeedProps {
  locationId: string
  locationName: string
}

export function CommunityActivityFeed({ locationId, locationName }: CommunityActivityFeedProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchContributions()
  }, [locationId])

  // Listen for location updates and refresh contributions
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      const { type } = event.detail

      // Refresh contributions when images or fields are changed
      if (type === 'featured-image-changed' || type === 'image-deleted' || type === 'field-updated') {
        console.log('🔄 Refreshing community activity after update...')
        setTimeout(() => {
          fetchContributions()
        }, 1000) // Wait 1s for contribution to be saved
      }
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'location-update' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue)
          const { type } = data

          if (type === 'featured-image-changed' || type === 'image-deleted' || type === 'field-updated') {
            console.log('🔄 Refreshing community activity from another tab...')
            setTimeout(() => {
              fetchContributions()
            }, 1000)
          }
        } catch (error) {
          console.error('Failed to parse location update event:', error)
        }
      }
    }

    window.addEventListener('location-updated', handleLocationUpdate as EventListener)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('location-updated', handleLocationUpdate as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  const fetchContributions = async () => {
    try {
      const response = await fetch(`/api/locations/contributions?locationId=${locationId}&limit=5`)
      const data = await response.json()
      
      if (data.success) {
        setContributions(data.contributions || [])
        setTopContributors(data.topContributors || [])
      }
    } catch (error) {
      console.error('Error fetching contributions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getContributionIcon = (type: string) => {
    if (type === 'edit') return <Edit className="h-3.5 w-3.5" />
    if (type === 'image_add') return <ImageIcon className="h-3.5 w-3.5" />
    if (type === 'image_featured') return <ImageIcon className="h-3.5 w-3.5" />
    if (type === 'image_delete') return <ImageIcon className="h-3.5 w-3.5" />
    return <Edit className="h-3.5 w-3.5" />
  }

  const getContributionText = (contribution: Contribution) => {
    const { contribution_type, field_edited, change_snippet } = contribution

    if (contribution_type === 'edit') {
      return `edited ${field_edited}`
    }
    if (contribution_type === 'image_add') {
      return 'added an image'
    }
    if (contribution_type === 'image_featured') {
      return 'set featured image'
    }
    if (contribution_type === 'image_delete') {
      return 'deleted an image'
    }
    return change_snippet || 'made a contribution'
  }

  if (loading) {
    return (
      <Card className="card-elevated p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="card-elevated p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          Community Activity
        </h3>
      </div>

      {/* Empty State - Encourage First Contribution */}
      {contributions.length === 0 && topContributors.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Edit2 className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Be the First Contributor!
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Help improve {locationName} by adding details, activities, or restaurants.
          </p>
          <p className="text-xs text-blue-600 font-medium">
            Sign in and click "Edit Page" to get started
          </p>
        </div>
      )}

      {/* Top Contributors - Compact */}
      {topContributors.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Top Contributors</span>
            <Award className="h-3.5 w-3.5 text-yellow-500" />
          </div>
          <div className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div key={contributor.user_id} className="flex items-center gap-2">
                {/* Rank Badge */}
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${index === 1 ? 'bg-gray-100 text-gray-600' : ''}
                  ${index === 2 ? 'bg-orange-100 text-orange-600' : ''}
                `}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="relative w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {contributor.avatar_url ? (
                    <Image
                      src={contributor.avatar_url}
                      alt={contributor.full_name || contributor.username}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-xs font-medium">
                      {(contributor.full_name || contributor.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name & Count */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {contributor.full_name || contributor.username || 'Anonymous'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {contributor.contribution_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity - Compact */}
      {contributions.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Recent Edits</span>
          </div>
          <div className="space-y-2">
            {contributions.map((contribution) => (
              <div key={contribution.id} className="flex items-start gap-2 text-xs">
                {/* Icon */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mt-0.5">
                  {getContributionIcon(contribution.contribution_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    <span className="font-medium">
                      {contribution.profiles?.full_name || contribution.profiles?.username || 'Someone'}
                    </span>
                    {' '}
                    <span className="text-gray-600">
                      {getContributionText(contribution)}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {getTimeAgo(contribution.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encourage Participation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {!isAuthenticated ? (
          <p className="text-xs text-gray-500 text-center">
            Help improve {locationName}! Sign in to contribute.
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {topContributors.slice(0, 3).map((c) => (
                <div key={c.user_id} className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden border border-white" title={c.full_name || c.username}>
                  {c.avatar_url ? (
                    <Image src={c.avatar_url} alt={c.full_name || c.username} width={28} height={28} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-xs font-medium">
                      {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">You could be here!</span>
          </div>
        )}
      </div>
    </Card>
  )
}


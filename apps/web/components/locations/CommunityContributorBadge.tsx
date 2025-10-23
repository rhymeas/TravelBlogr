'use client'

/**
 * Community Contributor Badge Component
 *
 * Shows top contributors for a location with avatar bubbles.
 * Opens modal with community info on click.
 * Monochrome design, non-intrusive.
 */

import { useState, useEffect } from 'react'
import { Users, Award, Image as ImageIcon, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SmartImage as Image } from '@/components/ui/SmartImage'

interface Contributor {
  id: string
  name: string
  avatar?: string
  contributions: number
  role?: 'creator' | 'curator' | 'contributor'
}

interface CommunityContributorBadgeProps {
  locationId: string
  locationName: string
  contributors?: Contributor[]
  className?: string
}

export function CommunityContributorBadge({
  locationId,
  locationName,
  contributors = [],
  className = ''
}: CommunityContributorBadgeProps) {
  const [showModal, setShowModal] = useState(false)
  const [realContributors, setRealContributors] = useState<Contributor[]>(contributors)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContributors()
  }, [locationId])

  const fetchContributors = async () => {
    try {
      const response = await fetch(`/api/locations/contributions?locationId=${locationId}&limit=10`)
      const data = await response.json()

      if (data.success && data.topContributors) {
        const mapped = data.topContributors.map((c: any) => ({
          id: c.user_id,
          name: c.full_name || c.username || 'Anonymous',
          avatar: c.avatar_url,
          contributions: c.contribution_count,
          role: c.contribution_count > 20 ? 'creator' : c.contribution_count > 10 ? 'curator' : 'contributor'
        }))
        setRealContributors(mapped)
      }
    } catch (error) {
      console.error('Error fetching contributors:', error)
    } finally {
      setLoading(false)
    }
  }

  const topContributors = realContributors.slice(0, 3)

  if (loading || topContributors.length === 0) {
    return null
  }

  return (
    <>
      {/* Badge - Top Right Corner */}
      <button
        onClick={() => setShowModal(true)}
        className={`
          group flex items-center gap-2 px-3 py-1.5 
          bg-gray-100 hover:bg-gray-200 
          border border-gray-300 
          rounded-full 
          transition-all duration-200
          ${className}
        `}
        title="View community contributors"
      >
        {/* Avatar Bubbles */}
        <div className="flex -space-x-2">
          {topContributors.map((contributor, index) => (
            <div
              key={contributor.id}
              className="relative w-6 h-6 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
              style={{ zIndex: topContributors.length - index }}
            >
              {contributor.avatar ? (
                <Image
                  src={contributor.avatar}
                  alt={contributor.name}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-xs font-medium">
                  {contributor.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Text */}
        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
          Community
        </span>

        {/* Icon */}
        <Users className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Community Contributors
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {locationName}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Info Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Become a Local Representative
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If your location doesn't exist yet, add it using the "Add Location" button. 
                  Share your knowledge of places you know best.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Contribute & Curate
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Anyone can:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Add images to any location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Curate galleries (add, delete, or set main images)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Help build authentic travel guides</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Community Recognition
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Each location shows top contributors with badges and recent editors, 
                  keeping everything transparent and collaborative.
                </p>
              </div>

              {/* Top Contributors List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Top Contributors
                </h3>
                <div className="space-y-2">
                  {realContributors.map((contributor, index) => (
                    <div
                      key={contributor.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                        {contributor.avatar ? (
                          <Image
                            src={contributor.avatar}
                            alt={contributor.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-sm font-medium">
                            {contributor.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {contributor.name}
                          </span>
                          {index === 0 && (
                            <Award className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contributor.contributions} contributions
                          {contributor.role && (
                            <span className="ml-2 text-gray-400">• {contributor.role}</span>
                          )}
                        </div>
                      </div>

                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Start exploring and contributing today!
                </p>
                <Button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


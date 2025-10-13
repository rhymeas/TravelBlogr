'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import { MapPin, Calendar, Star, Eye, ArrowRight, LayoutGrid, List, CheckCircle2 } from 'lucide-react'

interface SampleGuide {
  id: string
  title: string
  slug: string
  description: string
  cover_image: string
  destination: string
  duration_days: number
  trip_type: string
  highlights: string[]
  is_featured: boolean
  view_count: number
}

interface GalleryViewProps {
  guides: SampleGuide[]
}

export function GalleryView({ guides }: GalleryViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')

  const tripTypeColors: Record<string, string> = {
    family: 'bg-blue-100 text-blue-700',
    adventure: 'bg-green-100 text-green-700',
    beach: 'bg-orange-100 text-orange-700',
    cultural: 'bg-purple-100 text-purple-700',
    'road-trip': 'bg-red-100 text-red-700',
  }

  return (
    <div>
      {/* View Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {guides.length} Travel {guides.length === 1 ? 'Guide' : 'Guides'}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Handpicked family-friendly itineraries
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {/* Cards View - Alternating Left/Right Layout */}
      {viewMode === 'cards' && (
        <div className="space-y-8">
          {guides.map((guide, index) => {
            const isLeft = index % 2 === 0

            return (
              <Link key={guide.id} href={`/trips-gallery/${guide.slug}`}>
                <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                  <Card className="w-full md:w-[48%] overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Image */}
                      <div className="relative w-full md:w-48 h-40 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={guide.cover_image}
                          alt={guide.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />

                        {/* Badges on image */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          <span className={`px-2 py-0.5 ${tripTypeColors[guide.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize backdrop-blur-sm`}>
                            {guide.trip_type.replace('-', ' ')}
                          </span>
                          {guide.is_featured && (
                            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1 backdrop-blur-sm">
                              <Star className="h-3 w-3 fill-yellow-900" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-rausch-500 transition-colors">
                          {guide.title}
                        </h3>

                        <div className="flex items-center gap-3 text-gray-600 mb-2 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{guide.destination}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{guide.duration_days} days</span>
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {guide.description}
                        </p>

                        {/* Highlights */}
                        {guide.highlights && guide.highlights.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {guide.highlights.slice(0, 2).map((highlight, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                                >
                                  {highlight}
                                </span>
                              ))}
                              {guide.highlights.length > 2 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                  +{guide.highlights.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Eye className="h-3 w-3" />
                            <span>{guide.view_count.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-1 text-rausch-500 font-semibold group-hover:gap-2 transition-all text-xs">
                            <span>View Guide</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Timeline/List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Timeline Line */}
          <div className="relative">
            {guides.map((guide, index) => (
              <div key={guide.id} className="relative pb-8 last:pb-0">
                {/* Timeline connector */}
                {index !== guides.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-rausch-300 to-rausch-100" />
                )}
                
                <Link href={`/trips-gallery/${guide.slug}`}>
                  <Card className="hover:shadow-xl transition-all duration-300 group">
                    <div className="flex gap-4 p-4">
                      {/* Timeline Dot */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rausch-500 to-rausch-600 flex items-center justify-center text-white font-bold shadow-lg">
                          {index + 1}
                        </div>
                        {guide.is_featured && (
                          <div className="absolute -top-1 -right-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          {/* Text Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2.5 py-0.5 ${tripTypeColors[guide.trip_type] || 'bg-gray-100 text-gray-700'} text-xs font-semibold rounded-full capitalize`}>
                                {guide.trip_type.replace('-', ' ')}
                              </span>
                              <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Calendar className="h-3 w-3" />
                                <span>{guide.duration_days} days</span>
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1.5 group-hover:text-rausch-500 transition-colors">
                              {guide.title}
                            </h3>

                            <div className="flex items-center gap-1.5 text-gray-600 mb-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="text-sm">{guide.destination}</span>
                            </div>

                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                              {guide.description}
                            </p>

                            {/* Highlights as checklist */}
                            {guide.highlights && guide.highlights.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">Trip Highlights:</p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                  {guide.highlights.slice(0, 4).map((highlight, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                      <span>{highlight}</span>
                                    </li>
                                  ))}
                                </ul>
                                {guide.highlights.length > 4 && (
                                  <p className="text-xs text-gray-500 mt-1.5">
                                    +{guide.highlights.length - 4} more highlights
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{guide.view_count.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-rausch-500 font-semibold group-hover:gap-2.5 transition-all text-sm">
                                <span>View Full Guide</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </div>

                          {/* Thumbnail */}
                          <div className="hidden md:block flex-shrink-0">
                            <div className="relative w-48 h-32 rounded-lg overflow-hidden">
                              <Image
                                src={guide.cover_image}
                                alt={guide.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


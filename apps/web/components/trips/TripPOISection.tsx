'use client'

import { Card } from '@/components/ui/Card'
import { MapPin, Clock, Star, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface POI {
  name: string
  category: string
  latitude?: number
  longitude?: number
  rating?: number
  detourTimeMinutes?: number
  visitDurationMinutes?: number
  microExperience?: 'quick-stop' | 'coffee-break' | 'meal-break' | 'short-visit' | 'half-day' | 'full-day'
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
  score?: number
  description?: string
}

interface TripPOISectionProps {
  pois: POI[]
  title?: string
  showTopRankedOnly?: boolean
}

const getMicroExperienceColor = (type: string) => {
  switch (type) {
    case 'quick-stop': return 'bg-green-100 text-green-800'
    case 'coffee-break': return 'bg-yellow-100 text-yellow-800'
    case 'meal-break': return 'bg-orange-100 text-orange-800'
    case 'short-visit': return 'bg-blue-100 text-blue-800'
    case 'half-day': return 'bg-purple-100 text-purple-800'
    case 'full-day': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getMicroExperienceLabel = (type: string) => {
  switch (type) {
    case 'quick-stop': return 'Quick Stop'
    case 'coffee-break': return 'Coffee Break'
    case 'meal-break': return 'Meal Break'
    case 'short-visit': return 'Short Visit'
    case 'half-day': return 'Half Day'
    case 'full-day': return 'Full Day'
    default: return type
  }
}

export function TripPOISection({ pois, title = 'Recommended Stops Along the Way', showTopRankedOnly = false }: TripPOISectionProps) {
  if (!pois || pois.length === 0) {
    return null
  }

  // Filter and sort POIs
  const filteredPOIs = showTopRankedOnly 
    ? pois.filter(poi => (poi.score || 0) >= 70).sort((a, b) => (b.score || 0) - (a.score || 0))
    : pois.sort((a, b) => (b.score || 0) - (a.score || 0))

  if (filteredPOIs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {filteredPOIs.filter(p => (p.score || 0) >= 70).length > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Star className="h-3 w-3 mr-1" />
            {filteredPOIs.filter(p => (p.score || 0) >= 70).length} highly ranked
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPOIs.map((poi, index) => (
          <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{poi.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{poi.category}</p>
                </div>
                {poi.score !== undefined && (
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-600">{poi.score}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {poi.microExperience && (
                  <Badge variant="secondary" className={getMicroExperienceColor(poi.microExperience)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {getMicroExperienceLabel(poi.microExperience)}
                  </Badge>
                )}
                {poi.rating !== undefined && poi.rating > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Star className="h-3 w-3 mr-1" />
                    {poi.rating.toFixed(1)}
                  </Badge>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm text-gray-600">
                {poi.detourTimeMinutes !== undefined && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{poi.detourTimeMinutes} min detour from route</span>
                  </div>
                )}
                {poi.visitDurationMinutes !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{poi.visitDurationMinutes} min visit</span>
                  </div>
                )}
                {poi.bestTimeOfDay && poi.bestTimeOfDay !== 'anytime' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🌅</span>
                    <span className="capitalize">Best: {poi.bestTimeOfDay}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {poi.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{poi.description}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


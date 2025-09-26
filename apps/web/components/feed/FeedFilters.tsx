'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { 
  Filter, X, MapPin, Camera, Plane, 
  Heart, Star, Users, Clock 
} from 'lucide-react'

export function FeedFilters() {
  const [selectedType, setSelectedType] = useState('')
  const [selectedTimeframe, setSelectedTimeframe] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const activityTypes = [
    { value: 'trip_created', label: 'New Trips', icon: <Plane className="h-4 w-4" /> },
    { value: 'post_published', label: 'Stories', icon: <Camera className="h-4 w-4" /> },
    { value: 'location_visited', label: 'Check-ins', icon: <MapPin className="h-4 w-4" /> },
    { value: 'trip_liked', label: 'Likes', icon: <Heart className="h-4 w-4" /> },
    { value: 'location_reviewed', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { value: 'user_followed', label: 'Follows', icon: <Users className="h-4 w-4" /> },
  ]

  const timeframes = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last Week' },
    { value: '30d', label: 'Last Month' },
    { value: 'all', label: 'All Time' },
  ]

  const clearFilters = () => {
    setSelectedType('')
    setSelectedTimeframe('')
    setSelectedLocation('')
  }

  const activeFiltersCount = [selectedType, selectedTimeframe, selectedLocation].filter(Boolean).length

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filter Activity</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick Activity Type Filters */}
      <div className="flex flex-wrap gap-2">
        {activityTypes.slice(0, 4).map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedType(selectedType === type.value ? '' : type.value)
            }}
            className="flex items-center gap-2"
          >
            {type.icon}
            {type.label}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All activities</SelectItem>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((timeframe) => (
                    <SelectItem key={timeframe.value} value={timeframe.value}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {timeframe.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="usa">🇺🇸 United States</SelectItem>
                  <SelectItem value="france">🇫🇷 France</SelectItem>
                  <SelectItem value="italy">🇮🇹 Italy</SelectItem>
                  <SelectItem value="japan">🇯🇵 Japan</SelectItem>
                  <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2 text-gray-600"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
            
            <Button>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {selectedType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {activityTypes.find(t => t.value === selectedType)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedType('')}
              />
            </Badge>
          )}
          
          {selectedTimeframe && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {timeframes.find(t => t.value === selectedTimeframe)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedTimeframe('')}
              />
            </Badge>
          )}
          
          {selectedLocation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location: {selectedLocation}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedLocation('')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

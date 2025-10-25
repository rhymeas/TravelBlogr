'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, TrendingUp, Clock, Star, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { locations } from '@/lib/data/locationsData'

interface PublicDestinationSearchProps {
  placeholder?: string
  showTrending?: boolean
  className?: string
}

export function PublicDestinationSearch({
  placeholder = "Search destinations...",
  showTrending = true,
  className = ""
}: PublicDestinationSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<typeof locations>([])
  const [selectedLocation, setSelectedLocation] = useState<typeof locations[0] | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Trending destinations
  const trendingDestinations = locations
    .filter(loc => loc.is_featured)
    .slice(0, 6)

  // Recent searches (mock data)
  const recentSearches = [
    'Santorini, Greece',
    'Tokyo, Japan',
    'Banff National Park',
    'Machu Picchu, Peru'
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.country.toLowerCase().includes(query.toLowerCase()) ||
        location.region.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
      setResults(filtered)
    } else {
      setResults([])
    }
  }, [query])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setIsOpen(true)
    setSelectedLocation(null)
  }

  const handleResultClick = (location: typeof locations[0]) => {
    setSelectedLocation(location)
    setQuery(location.name)
    setIsOpen(false)
  }

  const handleExploreLocation = () => {
    if (selectedLocation) {
      router.push(`/locations/${selectedLocation.slug}`)
    }
  }

  const handlePlanWithAI = () => {
    if (selectedLocation) {
      // Prefill the AI planner with the selected location as destination
      router.push(`/plan?to=${selectedLocation.slug}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      const firstResult = results[0]
      handleResultClick(firstResult)
    }
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sleek-gray h-5 w-5" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyPress={handleKeyPress}
          className="w-full pl-12 pr-4 py-4 text-body-large border border-sleek-border rounded-sleek-large focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:border-transparent shadow-sleek-light hover:shadow-sleek-medium transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setSelectedLocation(null)
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sleek-gray hover:text-sleek-black transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected Location - Positive Message with CTAs */}
      {selectedLocation && !isOpen && (
        <div className="mt-3 bg-gradient-to-r from-rausch-50 to-kazan-50 border-2 border-rausch-200 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={selectedLocation.featured_image}
                alt={selectedLocation.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-rausch-500" />
                <h3 className="text-lg font-semibold text-sleek-black">
                  {selectedLocation.name}
                </h3>
              </div>
              <p className="text-sm text-rausch-600 font-medium mb-1">
                Amazing place! Let's explore the possibilities there.
              </p>
              <p className="text-xs text-sleek-gray">
                {selectedLocation.region}, {selectedLocation.country}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleExploreLocation}
              className="flex-1 bg-white hover:bg-gray-50 text-sleek-black border-2 border-gray-300 rounded-xl h-10 text-sm font-semibold"
            >
              <MapPin className="h-4 w-4 mr-1.5" />
              Explore
            </Button>
            <Button
              onClick={handlePlanWithAI}
              className="flex-1 bg-rausch-500 hover:bg-rausch-600 text-white rounded-xl h-10 text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Plan with AI
            </Button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sleek-border rounded-sleek-large shadow-sleek-xl z-50 max-h-96 overflow-y-auto">
          {query.trim() ? (
            // Search Results
            <div className="p-2">
              {results.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-body-small text-sleek-gray font-medium">
                    Search Results ({results.length})
                  </div>
                  {results.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleResultClick(location)}
                      className="w-full flex items-center gap-3 p-3 rounded-sleek-small hover:bg-sleek-background-secondary transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-sleek-small overflow-hidden flex-shrink-0">
                        <img
                          src={location.featured_image}
                          alt={location.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body-medium font-medium text-sleek-black group-hover:text-rausch-500 transition-colors">
                          {location.name}
                        </div>
                        <div className="text-body-small text-sleek-gray">
                          {location.country}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-body-small text-sleek-gray">{location.rating}</span>
                          </div>
                          {location.is_featured && (
                            <Badge className="bg-rausch-100 text-rausch-700 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-sleek-gray group-hover:text-rausch-500 transition-colors" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-6">
                  <div className="text-center mb-4">
                    <Sparkles className="h-8 w-8 text-rausch-500 mx-auto mb-3" />
                    <div className="text-lg font-semibold text-sleek-black mb-2">
                      {query}? Amazing choice!
                    </div>
                    <div className="text-sm text-sleek-gray mb-4">
                      We don't have detailed info yet, but our AI can help you plan an incredible trip there!
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        router.push(`/plan?to=${encodeURIComponent(query)}`)
                        setIsOpen(false)
                      }}
                      className="w-full bg-rausch-500 hover:bg-rausch-600 text-white rounded-xl h-12 text-base font-semibold"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Plan trip to {query} with AI
                    </Button>
                    <Button
                      onClick={() => {
                        setQuery('')
                        setResults([])
                        setIsOpen(true)
                      }}
                      variant="outline"
                      className="w-full border-2 border-gray-300 hover:bg-gray-50 text-sleek-black rounded-xl h-10 text-sm font-medium"
                    >
                      Try a different destination
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Default State - Trending & Recent
            <div className="p-2">
              {/* Recent Searches */}
              <div className="mb-4">
                <div className="px-3 py-2 text-body-small text-sleek-gray font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search.split(',')[0])}
                    className="w-full text-left p-3 rounded-sleek-small hover:bg-sleek-background-secondary transition-colors flex items-center gap-3"
                  >
                    <Clock className="h-4 w-4 text-sleek-gray" />
                    <span className="text-body-medium text-sleek-black">{search}</span>
                  </button>
                ))}
              </div>

              {/* Trending Destinations */}
              {showTrending && (
                <div>
                  <div className="px-3 py-2 text-body-small text-sleek-gray font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Destinations
                  </div>
                  {trendingDestinations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleResultClick(location)}
                      className="w-full flex items-center gap-3 p-3 rounded-sleek-small hover:bg-sleek-background-secondary transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-sleek-small overflow-hidden flex-shrink-0">
                        <img
                          src={location.featured_image}
                          alt={location.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-body-medium font-medium text-sleek-black group-hover:text-rausch-500 transition-colors">
                          {location.name}
                        </div>
                        <div className="text-body-small text-sleek-gray">
                          {location.country}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-body-small text-sleek-gray">{location.rating}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Browse All */}
              <div className="border-t border-sleek-border-light mt-2 pt-2">
                <Link
                  href="/locations"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 rounded-sleek-small hover:bg-sleek-background-secondary transition-colors text-rausch-500 font-medium"
                >
                  <MapPin className="h-4 w-4" />
                  Browse All Destinations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

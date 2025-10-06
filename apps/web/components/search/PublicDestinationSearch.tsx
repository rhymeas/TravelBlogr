'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react'
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
  const searchRef = useRef<HTMLDivElement>(null)

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
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-airbnb-gray h-5 w-5" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-4 py-4 text-body-large border border-airbnb-border rounded-airbnb-large focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:border-transparent shadow-airbnb-light hover:shadow-airbnb-medium transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-airbnb-gray hover:text-airbnb-black transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-airbnb-border rounded-airbnb-large shadow-airbnb-xl z-50 max-h-96 overflow-y-auto">
          {query.trim() ? (
            // Search Results
            <div className="p-2">
              {results.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-body-small text-airbnb-gray font-medium">
                    Search Results ({results.length})
                  </div>
                  {results.map((location) => (
                    <Link
                      key={location.id}
                      href={`/locations/${location.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 p-3 rounded-airbnb-small hover:bg-airbnb-background-secondary transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-airbnb-small overflow-hidden flex-shrink-0">
                        <img
                          src={location.featured_image}
                          alt={location.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body-medium font-medium text-airbnb-black group-hover:text-rausch-500 transition-colors">
                          {location.name}
                        </div>
                        <div className="text-body-small text-airbnb-gray">
                          {location.region}, {location.country}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-body-small text-airbnb-gray">{location.rating}</span>
                          </div>
                          {location.is_featured && (
                            <Badge className="bg-rausch-100 text-rausch-700 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-airbnb-gray group-hover:text-rausch-500 transition-colors" />
                    </Link>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-airbnb-gray mx-auto mb-2" />
                  <div className="text-body-medium text-airbnb-black mb-1">No destinations found</div>
                  <div className="text-body-small text-airbnb-gray">
                    Try searching for a different location
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Default State - Trending & Recent
            <div className="p-2">
              {/* Recent Searches */}
              <div className="mb-4">
                <div className="px-3 py-2 text-body-small text-airbnb-gray font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search.split(',')[0])}
                    className="w-full text-left p-3 rounded-airbnb-small hover:bg-airbnb-background-secondary transition-colors flex items-center gap-3"
                  >
                    <Clock className="h-4 w-4 text-airbnb-gray" />
                    <span className="text-body-medium text-airbnb-black">{search}</span>
                  </button>
                ))}
              </div>

              {/* Trending Destinations */}
              {showTrending && (
                <div>
                  <div className="px-3 py-2 text-body-small text-airbnb-gray font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Destinations
                  </div>
                  {trendingDestinations.map((location) => (
                    <Link
                      key={location.id}
                      href={`/locations/${location.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 p-3 rounded-airbnb-small hover:bg-airbnb-background-secondary transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-airbnb-small overflow-hidden flex-shrink-0">
                        <img
                          src={location.featured_image}
                          alt={location.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-body-medium font-medium text-airbnb-black group-hover:text-rausch-500 transition-colors">
                          {location.name}
                        </div>
                        <div className="text-body-small text-airbnb-gray">
                          {location.country}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-body-small text-airbnb-gray">{location.rating}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Browse All */}
              <div className="border-t border-airbnb-border-light mt-2 pt-2">
                <Link
                  href="/locations"
                  onClick={handleResultClick}
                  className="flex items-center justify-center gap-2 p-3 rounded-airbnb-small hover:bg-airbnb-background-secondary transition-colors text-rausch-500 font-medium"
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

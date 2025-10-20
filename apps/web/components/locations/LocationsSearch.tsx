'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
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
  Search, Filter, X, MapPin, Star, 
  Calendar, DollarSign, Users 
} from 'lucide-react'

interface LocationCategory {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

interface LocationsSearchProps {
  categories: LocationCategory[]
}

export function LocationsSearch({ categories }: LocationsSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '')
  const [selectedRating, setSelectedRating] = useState(searchParams.get('rating') || '')
  const [selectedBudget, setSelectedBudget] = useState(searchParams.get('budget') || '')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedCountry) params.set('country', selectedCountry)
    if (selectedRating) params.set('rating', selectedRating)
    if (selectedBudget) params.set('budget', selectedBudget)

    router.push(`/locations?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedCountry('')
    setSelectedRating('')
    setSelectedBudget('')
    router.push('/locations')
  }

  const activeFiltersCount = [
    selectedCategory,
    selectedCountry,
    selectedRating,
    selectedBudget
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Main Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search destinations, cities, countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        {/* Clear Button - Only show when there are active filters or search query */}
        {(searchQuery || activeFiltersCount > 0) && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
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

      {/* Quick Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 6).map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(
                selectedCategory === category.slug ? '' : category.slug
              )
            }}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All countries</SelectItem>
                  <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="usa">🇺🇸 United States</SelectItem>
                  <SelectItem value="france">🇫🇷 France</SelectItem>
                  <SelectItem value="italy">🇮🇹 Italy</SelectItem>
                  <SelectItem value="japan">🇯🇵 Japan</SelectItem>
                  <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                  <SelectItem value="germany">🇩🇪 Germany</SelectItem>
                  <SelectItem value="spain">🇪🇸 Spain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any rating</SelectItem>
                  <SelectItem value="4.5">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      4.5+ stars
                    </div>
                  </SelectItem>
                  <SelectItem value="4.0">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      4.0+ stars
                    </div>
                  </SelectItem>
                  <SelectItem value="3.5">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      3.5+ stars
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Level
              </label>
              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Any budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any budget</SelectItem>
                  <SelectItem value="budget">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Budget-friendly
                    </div>
                  </SelectItem>
                  <SelectItem value="mid-range">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                      Mid-range
                    </div>
                  </SelectItem>
                  <SelectItem value="luxury">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      Luxury
                    </div>
                  </SelectItem>
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
              Clear all filters
            </Button>
            
            <Button onClick={handleSearch}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {categories.find(c => c.slug === selectedCategory)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedCategory('')}
              />
            </Badge>
          )}
          
          {selectedCountry && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Country: {selectedCountry}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedCountry('')}
              />
            </Badge>
          )}
          
          {selectedRating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Rating: {selectedRating}+ stars
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedRating('')}
              />
            </Badge>
          )}
          
          {selectedBudget && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Budget: {selectedBudget}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedBudget('')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

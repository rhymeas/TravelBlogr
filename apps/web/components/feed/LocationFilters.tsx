'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LocationFilter } from '@/lib/data/feedData'

interface LocationFiltersProps {
  filters: LocationFilter[]
  onFilterChange?: (filterId: string) => void
}

export function LocationFilters({ filters, onFilterChange }: LocationFiltersProps) {
  const [activeFilter, setActiveFilter] = useState(filters.find(f => f.isActive)?.id || 'trending')

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId)
    onFilterChange?.(filterId)
  }

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className="flex-shrink-0 text-center group"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${
                activeFilter === filter.id 
                  ? 'bg-gradient-to-tr from-rausch-500 to-pink-500 scale-105' 
                  : 'bg-gray-200 group-hover:bg-gray-300'
              }`}>
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <img
                      src={filter.image}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-2xl drop-shadow-lg">{filter.emoji}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className={`text-xs mt-1 truncate w-16 transition-colors ${
                activeFilter === filter.id 
                  ? 'text-rausch-500 font-semibold' 
                  : 'text-gray-600'
              }`}>
                {filter.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

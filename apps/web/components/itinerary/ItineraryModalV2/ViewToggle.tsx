'use client'

import { List, Map } from 'lucide-react'
import { motion } from 'framer-motion'

interface ViewToggleProps {
  view: 'timeline' | 'map'
  onViewChange: (view: 'timeline' | 'map') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="px-8 md:px-12 py-4 border-b border-gray-200/50">
      <div className="inline-flex items-center gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-full shadow-sm">
        <button
          onClick={() => onViewChange('timeline')}
          className="relative px-6 py-2 rounded-full text-sm font-medium transition-colors"
        >
          {view === 'timeline' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={`relative z-10 flex items-center gap-2 ${view === 'timeline' ? 'text-white' : 'text-gray-600'}`}>
            <List className="h-4 w-4" />
            Timeline
          </span>
        </button>
        <button
          onClick={() => onViewChange('map')}
          className="relative px-6 py-2 rounded-full text-sm font-medium transition-colors"
        >
          {view === 'map' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={`relative z-10 flex items-center gap-2 ${view === 'map' ? 'text-white' : 'text-gray-600'}`}>
            <Map className="h-4 w-4" />
            Map
          </span>
        </button>
      </div>
    </div>
  )
}
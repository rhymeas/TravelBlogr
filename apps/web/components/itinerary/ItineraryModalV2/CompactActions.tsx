'use client'

import { Download, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CompactActionsProps {
  onClose: () => void
}

export function CompactActions({ onClose }: CompactActionsProps) {
  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          
          <button
            onClick={() => console.log('Share trip')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>

        <Button
          onClick={() => console.log('Save trip')}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-semibold px-5 py-2 h-auto"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Save Trip
        </Button>
      </div>
    </div>
  )
}
'use client'

import { motion } from 'framer-motion'
import { Download, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FloatingActionsProps {
  onClose: () => void
}

export function FloatingActions({ onClose }: FloatingActionsProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', bounce: 0.3 }}
      className="flex-shrink-0 border-t border-gray-200/50 bg-white/80 backdrop-blur-xl"
    >
      <div className="px-8 md:px-12 py-5 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600 font-medium hidden md:block">
          Ready to start your adventure?
        </div>
        
        <div className="flex items-center gap-3 flex-1 md:flex-initial justify-end">
          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="gap-2 hover:bg-gray-100"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => {
              // TODO: Implement share
              console.log('Share trip')
            }}
            className="gap-2 hover:bg-gray-100"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            onClick={() => {
              // TODO: Check auth, then save trip
              console.log('Save trip')
            }}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all gap-2 px-6"
          >
            <Sparkles className="h-4 w-4" />
            Save Trip
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
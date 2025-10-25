'use client'

/**
 * Image Selection Modal
 * 
 * Universal modal for selecting images from multiple sources:
 * - Your photos (Supabase storage)
 * - Database (cached location images)
 * - Search web (Brave Image Search)
 * - Reddit (Reddit Ultra Engine)
 * 
 * Used in:
 * - Trip planning (hover → edit photo)
 * - Location pages (change featured image)
 * - Restaurant/Activity cards (add/change photo)
 * - Blog posts (insert images)
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, Upload, Database, Globe, MessageSquare, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect: (imageUrl: string, source: string) => void
  defaultQuery?: string // Pre-fill search (e.g., "Tokyo Tower")
  context?: 'trip' | 'location' | 'restaurant' | 'activity' | 'blog'
}

interface DiscoveredImage {
  url: string
  thumbnail: string
  title: string
  source: 'brave' | 'reddit' | 'database' | 'upload'
  attribution?: {
    author?: string
    sourceUrl?: string
  }
  score?: number
}

export function ImageSelectionModal({
  open,
  onClose,
  onSelect,
  defaultQuery = '',
  context = 'location'
}: ImageSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState(defaultQuery)
  const [loading, setLoading] = useState(false)
  const [braveImages, setBraveImages] = useState<DiscoveredImage[]>([])
  const [redditImages, setRedditImages] = useState<DiscoveredImage[]>([])
  const [databaseImages, setDatabaseImages] = useState<DiscoveredImage[]>([])

  // Auto-search when modal opens with default query
  useEffect(() => {
    if (open && defaultQuery) {
      setSearchQuery(defaultQuery)
      handleSearch(defaultQuery)
    }
  }, [open, defaultQuery])

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return

    setLoading(true)

    try {
      // Parallel search across all sources
      const [braveRes, redditRes, dbRes] = await Promise.all([
        fetch(`/api/images/search?query=${encodeURIComponent(query)}&source=brave&limit=20`),
        fetch(`/api/images/search?query=${encodeURIComponent(query)}&source=reddit&limit=15`),
        fetch(`/api/images/search?query=${encodeURIComponent(query)}&source=database&limit=10`),
      ])

      const [braveData, redditData, dbData] = await Promise.all([
        braveRes.json(),
        redditRes.json(),
        dbRes.json(),
      ])

      setBraveImages(braveData.images || [])
      setRedditImages(redditData.images || [])
      setDatabaseImages(dbData.images || [])
    } catch (error) {
      console.error('Image search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (image: DiscoveredImage) => {
    onSelect(image.url, image.source)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Select Photo
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex gap-2 pb-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for images..."
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={loading || !searchQuery.trim()}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="web" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="web" className="gap-2">
              <Globe className="h-4 w-4" />
              Web ({braveImages.length})
            </TabsTrigger>
            <TabsTrigger value="reddit" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Reddit ({redditImages.length})
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Database ({databaseImages.length})
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Web Images (Brave) */}
          <TabsContent value="web" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : braveImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {braveImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectImage(img)}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-900 transition-all"
                  >
                    <Image
                      src={img.thumbnail}
                      alt={img.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                      <p className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                        {img.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Globe className="h-12 w-12 mb-3 text-gray-300" />
                <p>Search for images from the web</p>
                <p className="text-sm text-gray-400 mt-1">Powered by Brave Search</p>
              </div>
            )}
          </TabsContent>

          {/* Reddit Images */}
          <TabsContent value="reddit" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : redditImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {redditImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectImage(img)}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-900 transition-all"
                  >
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-start justify-end p-2">
                      <p className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                        {img.title}
                      </p>
                      {img.attribution?.author && (
                        <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          by u/{img.attribution.author} • {img.score} ↑
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                <p>Search for authentic travel photos from Reddit</p>
                <p className="text-sm text-gray-400 mt-1">User-generated content</p>
              </div>
            )}
          </TabsContent>

          {/* Database Images */}
          <TabsContent value="database" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : databaseImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {databaseImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectImage(img)}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-900 transition-all"
                  >
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Database className="h-12 w-12 mb-3 text-gray-300" />
                <p>Cached images from our database</p>
                <p className="text-sm text-gray-400 mt-1">Previously fetched images</p>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 overflow-y-auto mt-4">
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Upload className="h-12 w-12 mb-3 text-gray-300" />
              <p>Upload your own photo</p>
              <p className="text-sm text-gray-400 mt-1">Coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}


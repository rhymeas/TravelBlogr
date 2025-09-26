'use client'

import { useState, useCallback } from 'react'
import ImageGallery from 'react-image-gallery'
import Lightbox from 'yet-another-react-lightbox'
import PhotoAlbum from 'react-photo-album'
import { Play, Pause, Download, Share2, Trash2, Edit, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import 'react-image-gallery/styles/css/image-gallery.css'
import 'yet-another-react-lightbox/styles.css'

interface MediaItem {
  id: string
  url: string
  thumbnail_url?: string
  type: 'image' | 'video'
  title?: string
  caption?: string
  width?: number
  height?: number
  size?: number
  created_at: string
}

interface MediaGalleryProps {
  items: MediaItem[]
  viewMode?: 'grid' | 'carousel' | 'masonry'
  showThumbnails?: boolean
  showControls?: boolean
  allowDownload?: boolean
  allowDelete?: boolean
  onItemClick?: (item: MediaItem, index: number) => void
  onItemDelete?: (item: MediaItem) => void
  onItemEdit?: (item: MediaItem) => void
}

export function MediaGallery({
  items,
  viewMode = 'grid',
  showThumbnails = true,
  showControls = true,
  allowDownload = true,
  allowDelete = false,
  onItemClick,
  onItemDelete,
  onItemEdit
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Convert items to different formats for different libraries
  const galleryItems = items.map(item => ({
    original: item.url,
    thumbnail: item.thumbnail_url || item.url,
    description: item.caption || item.title,
    originalTitle: item.title,
    renderItem: item.type === 'video' ? renderVideoItem : undefined
  }))

  const lightboxSlides = items.map(item => ({
    src: item.url,
    alt: item.title || item.caption,
    width: item.width || 800,
    height: item.height || 600
  }))

  const photoAlbumPhotos = items
    .filter(item => item.type === 'image')
    .map(item => ({
      src: item.url,
      width: item.width || 800,
      height: item.height || 600,
      alt: item.title || item.caption,
      key: item.id
    }))

  function renderVideoItem(item: any) {
    return (
      <div className="image-gallery-video-wrapper">
        <video
          controls
          className="image-gallery-video"
          poster={item.thumbnail}
        >
          <source src={item.original} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  const handleItemClick = useCallback((item: MediaItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index)
    } else {
      setLightboxIndex(index)
    }
  }, [onItemClick])

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.title || `media-${item.id}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async (item: MediaItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'Shared media',
          text: item.caption || 'Check out this media',
          url: item.url
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(item.url)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`relative group cursor-pointer rounded-lg overflow-hidden ${
            selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleItemClick(item, index)}
        >
          {/* Media Preview */}
          <div className="aspect-square bg-gray-200">
            {item.type === 'image' ? (
              <img
                src={item.thumbnail_url || item.url}
                alt={item.title || item.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  poster={item.thumbnail_url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white bg-black/50 rounded-full p-2" />
                </div>
              </div>
            )}
          </div>

          {/* Overlay Controls */}
          {showControls && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(index)
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  {allowDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(item)
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(item)
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>

                  {onItemEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onItemEdit(item)
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {allowDelete && onItemDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onItemDelete(item)
                      }}
                      className="text-white hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleSelection(item.id)
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Item Info */}
          {(item.title || item.caption) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="text-white">
                {item.title && (
                  <h4 className="font-medium text-sm truncate">{item.title}</h4>
                )}
                {item.caption && (
                  <p className="text-xs opacity-90 truncate">{item.caption}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderCarouselView = () => (
    <div className="max-w-4xl mx-auto">
      <ImageGallery
        items={galleryItems}
        showThumbnails={showThumbnails}
        showPlayButton={true}
        showFullscreenButton={true}
        showNav={true}
        autoPlay={isPlaying}
        slideInterval={3000}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        renderCustomControls={() => (
          <div className="image-gallery-custom-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        )}
      />
    </div>
  )

  const renderMasonryView = () => (
    <PhotoAlbum
      photos={photoAlbumPhotos}
      layout="masonry"
      targetRowHeight={200}
      onClick={({ index }) => setLightboxIndex(index)}
      renderPhoto={({ photo, imageProps }) => (
        <div className="relative group cursor-pointer">
          <img {...imageProps} alt={photo.alt} />
          {showControls && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      )}
    />
  )

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-medium mb-2">No media yet</h3>
        <p>Upload some photos or videos to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Download Selected
            </Button>
            {allowDelete && (
              <Button variant="outline" size="sm" className="text-red-600">
                Delete Selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Content */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'carousel' && renderCarouselView()}
      {viewMode === 'masonry' && renderMasonryView()}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
        plugins={[]}
      />
    </div>
  )
}

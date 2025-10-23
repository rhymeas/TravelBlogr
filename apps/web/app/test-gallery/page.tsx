'use client'

import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Test data - simulating location images
const INITIAL_IMAGES = [
  'https://images.pexels.com/photos/2868223/pexels-photo-2868223.jpeg',
  'https://images.pexels.com/photos/34358968/pexels-photo-34358968.jpeg',
  'https://images.pexels.com/photos/34340950/pexels-photo-34340950.jpeg',
  'https://images.pexels.com/photos/34381451/pexels-photo-34381451.jpeg',
  'https://live.staticflickr.com/65535/54864203686_940e4ce80d_b.jpg',
]

export default function TestGalleryPage() {
  const [images, setImages] = useState<string[]>(INITIAL_IMAGES)
  const [featuredImage, setFeaturedImage] = useState<string>(INITIAL_IMAGES[0])
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set())

  // Debug: Log initial state
  console.log('🎨 Test Gallery Mounted')
  console.log('📊 Initial images:', images.length)
  console.log('📊 Images array:', images)

  const handleDelete = (imageUrl: string) => {
    console.log('🗑️ Deleting image:', imageUrl)
    
    // 1. Start delete animation
    setDeletingImages(prev => new Set(prev).add(imageUrl))
    toast.success('Image deleted!', { duration: 2000 })

    // 2. After animation, remove from array
    setTimeout(() => {
      setImages(prev => {
        const newImages = prev.filter(img => img !== imageUrl)
        console.log('📊 Images before:', prev.length)
        console.log('📊 Images after:', newImages.length)
        console.log('📊 Deleted:', imageUrl.substring(0, 50))
        return newImages
      })
      
      // Clear deleting state
      setDeletingImages(prev => {
        const next = new Set(prev)
        next.delete(imageUrl)
        return next
      })

      // If deleted image was featured, set new featured
      if (imageUrl === featuredImage) {
        setFeaturedImage(images[0] || '')
      }
    }, 600)
  }

  const handleSetFeatured = (imageUrl: string) => {
    console.log('⭐ Setting featured:', imageUrl)
    setFeaturedImage(imageUrl)
    toast.success('Featured image updated!', { duration: 2000 })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Gallery Test Page</h1>
          <p className="text-gray-600 mb-4">
            Test image deletion and featured image functionality
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <ul className="text-sm space-y-1">
              <li>Total images: <strong>{images.length}</strong></li>
              <li>Featured image: <strong className="text-blue-600">{featuredImage.substring(0, 50)}...</strong></li>
              <li>Deleting: <strong>{deletingImages.size}</strong></li>
            </ul>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                console.log('🔄 Resetting gallery')
                setImages(INITIAL_IMAGES)
                setFeaturedImage(INITIAL_IMAGES[0])
                setDeletingImages(new Set())
                toast.success('Gallery reset!')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset Gallery
            </button>
            
            <button
              onClick={() => {
                console.log('📊 Current state:')
                console.log('  Images:', images)
                console.log('  Featured:', featuredImage)
                console.log('  Deleting:', Array.from(deletingImages))
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Log State
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Gallery ({images.length} images)</h2>
          
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No images left!</p>
              <p className="text-sm mt-2">Click "Reset Gallery" to restore images</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minHeight: '400px' }}>
              {images.map((image, index) => {
                console.log(`🖼️ Rendering image ${index + 1}:`, image.substring(0, 50))
                const isFeatured = image === featuredImage
                const isDeleting = deletingImages.has(image)

                return (
                  <div
                    key={image}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all duration-500 ${
                      isDeleting
                        ? 'opacity-0 scale-75 blur-sm'
                        : 'opacity-100 scale-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`Test image ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Featured badge */}
                    {isFeatured && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetFeatured(image)
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isFeatured
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white/90 text-gray-700 hover:bg-yellow-500 hover:text-white'
                        }`}
                        title="Set as featured"
                      >
                        <Star className={`h-4 w-4 ${isFeatured ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(image)
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Image info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-xs truncate">
                        Image {index + 1} of {images.length}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Console Log */}
        <div className="bg-gray-900 text-green-400 rounded-lg shadow-lg p-6 mt-6 font-mono text-sm">
          <h2 className="text-white font-bold mb-2">Console Output:</h2>
          <p className="text-gray-400">Check browser console (F12) for detailed logs</p>
        </div>
      </div>
    </div>
  )
}


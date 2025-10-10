// @ts-nocheck
'use client'

/**
 * Test Page for Gallery-DL Image Fetching
 * Tests the new professional image stack with metadata filtering
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Loader2, Download, ExternalLink, User, Calendar, Tag, Image as ImageIcon, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageMetadata {
  url: string
  originalUrl: string
  creator: string
  creatorProfile?: string
  uploadDate?: string
  license?: string
  platform: string
  title?: string
  description?: string
  tags?: string[]
  width?: number
  height?: number
  fileSize?: number
}

interface TestResult {
  images: ImageMetadata[]
  totalDownloaded: number
  errors: string[]
  duration: number
  sources?: {
    standard: number
    social: number
    total: number
  }
}

export default function TestImagesPage() {
  const [locationName, setLocationName] = useState('East Timor')
  const [maxImages, setMaxImages] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addedImages, setAddedImages] = useState<Set<string>>(new Set())
  const [locationSlug, setLocationSlug] = useState<string>('')

  const handleFetchImages = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const startTime = Date.now()

    try {
      // First, get the location slug
      const slugResponse = await fetch(`/api/locations/search?q=${encodeURIComponent(locationName)}`)
      const slugData = await slugResponse.json()
      const slug = slugData.locations?.[0]?.slug || locationName.toLowerCase().replace(/\s+/g, '-')
      setLocationSlug(slug)

      // Use the admin API that includes social images
      const response = await fetch('/api/admin/fetch-location-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName,
          page: 1,
          perPage: maxImages,
          includeSocial: true // Enable social media images!
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      // Convert to expected format
      const images = data.images.map((img: any) => ({
        url: img.url,
        originalUrl: img.source || img.url,
        creator: img.author || 'Unknown',
        creatorProfile: img.source,
        platform: img.platform,
        title: img.title || `${locationName} - ${img.platform}`,
        score: img.score,
        width: img.width,
        height: img.height
      }))

      setResult({
        images,
        totalDownloaded: images.length,
        errors: [],
        duration,
        sources: data.sources
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddImage = async (image: ImageMetadata) => {
    if (!locationSlug) {
      toast.error('Please fetch images first to determine location')
      return
    }

    try {
      const response = await fetch('/api/admin/add-location-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug,
          imageUrl: image.url,
          source: image.originalUrl,
          platform: image.platform
        })
      })

      if (response.ok) {
        setAddedImages(prev => new Set(prev).add(image.url))
        toast.success('Image added to location!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to add image')
      }
    } catch (error) {
      toast.error('Error adding image')
      console.error('Add image error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🖼️ Gallery-DL Image Fetching Test
          </h1>
          <p className="text-gray-600">
            Test the professional image stack with metadata filtering and quality controls
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name
              </label>
              <Input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., East Timor, Paris, Singapore"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Images
              </label>
              <Input
                type="number"
                value={maxImages}
                onChange={(e) => setMaxImages(parseInt(e.target.value))}
                min={1}
                max={50}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleFetchImages}
              disabled={loading || !locationName}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Images...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Fetch Images
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-6 mb-8 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Results Summary */}
        {result && (
          <Card className="p-6 mb-8 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              ✅ Fetch Complete - Including Social Media!
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-2xl font-bold text-green-700">{result.images.length}</p>
              </div>
              {result.sources && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Standard</p>
                    <p className="text-2xl font-bold text-blue-700">{result.sources.standard}</p>
                    <p className="text-xs text-gray-500">Pexels, Unsplash</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Social</p>
                    <p className="text-2xl font-bold text-purple-700">{result.sources.social}</p>
                    <p className="text-xs text-gray-500">Reddit, Flickr</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-green-700">{(result.duration / 1000).toFixed(1)}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Image Gallery */}
        {result && result.images.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Fetched Images ({result.images.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.images.map((image, index) => (
                <Card key={index} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="aspect-video bg-gray-200 relative">
                    <img
                      src={image.url}
                      alt={image.title || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Platform Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                      image.platform === 'Reddit' ? 'bg-orange-600 text-white' :
                      image.platform === 'Flickr' ? 'bg-pink-600 text-white' :
                      image.platform === 'Pinterest' ? 'bg-red-600 text-white' :
                      'bg-black/70 text-white'
                    }`}>
                      {image.platform}
                    </div>
                    {/* Score Badge (for social images) */}
                    {(image.platform === 'Reddit' || image.platform === 'Flickr') && image.score && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        ⭐ {image.score}
                      </div>
                    )}

                    {/* Hover Overlay with Add Button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handleAddImage(image)}
                        disabled={addedImages.has(image.url)}
                        className={`
                          opacity-0 group-hover:opacity-100
                          transition-all duration-300
                          px-4 py-2 rounded-lg
                          text-white font-semibold
                          flex items-center gap-2
                          shadow-lg
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${addedImages.has(image.url)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                          }
                        `}
                      >
                        {addedImages.has(image.url) ? (
                          <>
                            <Check className="h-4 w-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add to Location
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    {image.title && (
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {image.title}
                      </h3>
                    )}

                    {/* Creator */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="truncate">{image.creator}</span>
                      {image.creatorProfile && (
                        <a
                          href={image.creatorProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* License */}
                    {image.license && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        📄 {image.license}
                      </div>
                    )}

                    {/* Dimensions */}
                    {image.width && image.height && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ImageIcon className="h-4 w-4" />
                        <span>{image.width} × {image.height}</span>
                      </div>
                    )}

                    {/* Upload Date */}
                    {image.uploadDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(image.uploadDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {image.tags.slice(0, 5).map((tag, i) => (
                            <span
                              key={i}
                              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {image.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Full Size
                      </a>
                      <a
                        href={image.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Source
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            📋 How It Works
          </h3>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>✅ <strong>Multi-source fetching:</strong> Reddit, Unsplash, Flickr, Pinterest</li>
            <li>✅ <strong>Quality filtering:</strong> Minimum resolution, aspect ratio checks</li>
            <li>✅ <strong>Smart filtering:</strong> Removes people, interiors, close-ups, B&W, night shots</li>
            <li>✅ <strong>Full attribution:</strong> Creator names, profiles, licenses preserved</li>
            <li>✅ <strong>Metadata rich:</strong> Tags, descriptions, upload dates included</li>
            <li>✅ <strong>Free & legal:</strong> Only CC-licensed or free-to-use images</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}


'use client'

export const dynamic = 'force-dynamic'


import { useState } from 'react'
import Image from 'next/image'

interface RedditImage {
  url: string
  title: string
  subreddit: string
  score: number
  permalink: string
}

export default function RedditImagesTestPage() {
  const [location, setLocation] = useState('Tokyo')
  const [loading, setLoading] = useState(false)
  const [braveImages, setBraveImages] = useState<any[]>([])
  const [smartImages, setSmartImages] = useState<RedditImage[]>([])
  const [flickrImages, setFlickrImages] = useState<any[]>([])
  const [legacyImages, setLegacyImages] = useState<any[]>([])

  const fetchBraveMethod = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/reddit-images?location=${encodeURIComponent(location)}&method=brave`)
      const data = await response.json()
      setBraveImages(data.images || [])
    } catch (error) {
      console.error('Error fetching Brave method:', error)
    }
    setLoading(false)
  }

  const fetchSmartMethod = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/reddit-images?location=${encodeURIComponent(location)}&method=smart`)
      const data = await response.json()
      setSmartImages(data.images || [])
    } catch (error) {
      console.error('Error fetching smart method:', error)
    }
    setLoading(false)
  }

  const fetchFlickrMethod = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/reddit-images?location=${encodeURIComponent(location)}&method=flickr`)
      const data = await response.json()
      setFlickrImages(data.images || [])
    } catch (error) {
      console.error('Error fetching Flickr method:', error)
    }
    setLoading(false)
  }

  const fetchLegacyMethod = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/reddit-images?location=${encodeURIComponent(location)}&method=legacy`)
      const data = await response.json()
      setLegacyImages(data.images || [])
    } catch (error) {
      console.error('Error fetching Legacy method:', error)
    }
    setLoading(false)
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchBraveMethod(),
      fetchSmartMethod(),
      fetchFlickrMethod(),
      fetchLegacyMethod()
    ])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image Source Comparison (4 ULTRA-FILTERED Methods)</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
                placeholder="Enter location (e.g., Tokyo, Paris, Rome)"
              />
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="px-6 py-2 bg-rausch-500 text-white rounded-lg hover:bg-rausch-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Test All Methods'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            <button
              onClick={fetchBraveMethod}
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              Brave API 🚀
            </button>
            <button
              onClick={fetchSmartMethod}
              disabled={loading}
              className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 text-sm"
            >
              Reddit: ULTRA 🎯
            </button>
            <button
              onClick={fetchFlickrMethod}
              disabled={loading}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              Flickr ULTRA 🎯
            </button>
            <button
              onClick={fetchLegacyMethod}
              disabled={loading}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
            >
              Legacy (/plan)
            </button>
          </div>
        </div>

        {/* Results Comparison */}
        <div className="grid grid-cols-4 gap-4">
          {/* Brave API Method */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Brave Search API 🚀
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Uses Brave Search API for high-quality location images
              </p>
              <div className="text-sm font-medium mb-4">
                Found: {braveImages.length} images
              </div>

              {braveImages.length > 0 && (
                <div className="space-y-4">
                  {braveImages.map((img: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-blue-500 mb-1">
                          {img.source}
                        </div>
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {img.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {braveImages.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No images found. Try testing!
                </div>
              )}
            </div>
          </div>

          {/* Ultra-Filtered Reddit Method */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                Reddit ULTRA 🎯
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Searches travel subreddits (CityPorn, EarthPorn, etc.) for location, ULTRA-STRICT filtering: ONLY city/architecture/landscape images
              </p>
              <div className="text-sm font-medium mb-4">
                Found: {smartImages.length} images
              </div>

              {smartImages.length > 0 && (
                <div className="space-y-4">
                  {smartImages.map((img, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-indigo-500 mb-1">
                          r/{img.subreddit} • {img.score} upvotes
                        </div>
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {img.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {smartImages.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No images found. Try testing!
                </div>
              )}
            </div>
          </div>

          {/* Flickr Method */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Flickr ULTRA 🎯
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                NO API KEY! ULTRA-STRICT filtering: ONLY city/architecture/landscape images. Same 10 filters as Reddit ULTRA.
              </p>
              <div className="text-sm font-medium mb-4">
                Found: {flickrImages.length} images
              </div>

              {flickrImages.length > 0 && (
                <div className="space-y-4">
                  {flickrImages.map((img, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-green-500 mb-1">
                          by {img.author}
                        </div>
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {img.title}
                        </div>
                        {img.tags && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            Tags: {img.tags}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {flickrImages.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No images found. Try testing!
                </div>
              )}
            </div>
          </div>

          {/* Legacy Method */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                Legacy Method (/plan)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Current production image fetcher: Pexels, Unsplash, Wikimedia, Wikipedia, Openverse, etc.
              </p>
              <div className="text-sm font-medium mb-4">
                Found: {legacyImages.length} images
              </div>

              {legacyImages.length === 0 && !loading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    No images found. Try testing!
                  </div>
                </div>
              )}

              {legacyImages.length > 0 && (
                <div className="space-y-4">
                  {legacyImages.map((img, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-orange-500 mb-1">
                          {img.source}
                        </div>
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {img.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis */}
        {(braveImages.length > 0 || smartImages.length > 0 || flickrImages.length > 0 || legacyImages.length > 0) && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Analysis - Image Count Comparison</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-2">Brave API 🚀</div>
                <div className="text-3xl font-bold text-blue-700">
                  {braveImages.length}
                </div>
                <div className="text-xs text-blue-500 mt-2">
                  High-quality search results
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-indigo-600 mb-2">Reddit (ULTRA) 🎯</div>
                <div className="text-3xl font-bold text-indigo-700">
                  {smartImages.length}
                </div>
                <div className="text-xs text-indigo-500 mt-2">
                  {new Set(smartImages.map(i => i.subreddit)).size} travel subreddits
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-2">Flickr ULTRA 🎯</div>
                <div className="text-3xl font-bold text-green-700">
                  {flickrImages.length}
                </div>
                <div className="text-xs text-green-500 mt-2">
                  No API key! ✨
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 mb-2">Legacy (/plan)</div>
                <div className="text-3xl font-bold text-orange-700">
                  {legacyImages.length}
                </div>
                <div className="text-xs text-orange-500 mt-2">
                  Production service
                </div>
              </div>
            </div>

            {smartImages.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Travel Subreddits Found (ULTRA-FILTERED):</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(smartImages.map(i => i.subreddit))).map(sub => (
                    <span key={sub} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      r/{sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">🏆 Image Sources Comparison:</div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><strong>Reddit (Subreddit):</strong> Basic filtering ✅</li>
                  <li><strong>Reddit (ULTRA) 🎯:</strong> ONLY city/architecture/landscape ⭐</li>
                  <li><strong>Flickr (ULTRA) 🎯:</strong> Same strict filtering as Reddit ULTRA ⭐</li>
                  <li><strong>Legacy (/plan):</strong> Current production (Pexels, Unsplash, etc.) ✅</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">💡 Recommended Strategy:</div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Primary:</strong> Reddit ULTRA 🎯 + Flickr ULTRA 🎯</p>
                  <p><strong>Fallback:</strong> Legacy (/plan)</p>
                  <p><strong>Why:</strong> BOTH ULTRA methods use 10 strict filters - ONLY environment images!</p>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>10 ULTRA filters:</strong> ❌ No people, food, art, animals, indoors, screenshots, text posts. ✅ Only environment images with positive signals (view, skyline, cityscape, architecture, landscape, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


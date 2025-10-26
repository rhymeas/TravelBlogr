'use client'

export const dynamic = 'force-dynamic'


import { useEffect, useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

interface LocationData {
  id: string
  name: string
  slug: string
  gallery_images: string[]
  featured_image: string | null
}

export default function TestLocationDataPage() {
  const slug = 'clermont-ferrand'
  const [directData, setDirectData] = useState<LocationData | null>(null)
  const [directError, setDirectError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = getBrowserSupabase()

      // Direct database query
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, slug, gallery_images, featured_image')
        .eq('slug', slug)
        .single()

      setDirectData(data)
      setDirectError(error)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4">Location Data Diagnostic</h1>
          <p className="text-gray-600">Testing: <strong>{slug}</strong></p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Database Query Result */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-600">
            Direct Database Query
          </h2>
          
          {directError ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-600 font-semibold">Error:</p>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(directError, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Location ID:</p>
                <p className="text-sm text-gray-600">{directData?.id}</p>
              </div>
              
              <div>
                <p className="font-semibold">Name:</p>
                <p className="text-sm text-gray-600">{directData?.name}</p>
              </div>
              
              <div>
                <p className="font-semibold">Gallery Images Count:</p>
                <p className="text-sm text-gray-600">
                  {directData?.gallery_images?.length || 0} images
                </p>
              </div>
              
              <div>
                <p className="font-semibold">Featured Image:</p>
                <p className="text-sm text-gray-600 truncate">
                  {directData?.featured_image || 'None'}
                </p>
              </div>
              
              <div>
                <p className="font-semibold">Gallery Images (first 3):</p>
                <div className="space-y-1 mt-2">
                  {directData?.gallery_images?.slice(0, 3).map((img: string, i: number) => (
                    <div key={i} className="text-xs text-gray-500 truncate">
                      {i + 1}. {img}
                    </div>
                  ))}
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-blue-600">
                  View Full Data (JSON)
                </summary>
                <pre className="text-xs mt-2 bg-gray-50 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(directData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>



        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href={`/locations/${slug}`}
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              View Location Detail Page
            </a>
            <a
              href={`/locations/${slug}/photos`}
              className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
            >
              View Photos Gallery Page
            </a>
            <a
              href="/test-location-data"
              className="block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
            >
              Refresh This Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


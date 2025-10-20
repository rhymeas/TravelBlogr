'use client'

/**
 * ImageKit Test Page
 * Verifies that ImageKit is properly configured and working
 */

import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { getCDNUrl, isImageKitConfigured, getImageKitEndpoint, getImageKitPublicKey } from '@/lib/image-cdn'

export default function TestImageKitPage() {
  // Test configuration
  const isConfigured = isImageKitConfigured()
  const endpoint = getImageKitEndpoint()
  const publicKey = getImageKitPublicKey()

  // Test images
  const testImages = [
    {
      url: 'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg',
      name: 'Pexels Image'
    },
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      name: 'Unsplash Image'
    }
  ]

  // Generate CDN URLs
  const cdnUrls = testImages.map(img => ({
    ...img,
    cdnUrl: getCDNUrl(img.url, { width: 800, quality: 85 })
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ImageKit Configuration Test</h1>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Configuration Status</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${isConfigured ? 'text-green-500' : 'text-red-500'}`}>
                {isConfigured ? '✅' : '❌'}
              </span>
              <span className="font-medium">
                ImageKit Configured: {isConfigured ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="ml-8 space-y-1 text-sm text-gray-600">
              <div>
                <strong>URL Endpoint:</strong> {endpoint || '(not set)'}
              </div>
              <div>
                <strong>Public Key:</strong> {publicKey ? `${publicKey.substring(0, 20)}...` : '(not set)'}
              </div>
            </div>
          </div>
        </div>

        {/* CDN URL Generation Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">CDN URL Generation</h2>
          
          <div className="space-y-4">
            {cdnUrls.map((img, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-medium mb-2">{img.name}</h3>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Original:</strong>
                    <div className="text-gray-600 break-all">{img.url}</div>
                  </div>
                  
                  <div>
                    <strong>CDN URL:</strong>
                    <div className="text-gray-600 break-all">{img.cdnUrl}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {img.cdnUrl.includes('ik.imagekit.io/travelblogr') ? (
                      <>
                        <span className="text-green-500">✅</span>
                        <span className="text-green-600 font-medium">Routed through ImageKit</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-500">❌</span>
                        <span className="text-red-600 font-medium">NOT routed through ImageKit</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Visual Test</h2>
          <p className="text-gray-600 mb-4">
            These images should load through ImageKit CDN. Check the Network tab to verify.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {testImages.map((img, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-medium text-sm">{img.name}</h3>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={img.url}
                    alt={img.name}
                    fill
                    preset="card"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-2 text-blue-900">How to Verify</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Check that "ImageKit Configured" shows ✅ YES</li>
            <li>Verify CDN URLs contain "ik.imagekit.io/travelblogr"</li>
            <li>Open DevTools → Network tab</li>
            <li>Filter by "Img"</li>
            <li>Reload page and verify image URLs start with "https://ik.imagekit.io/travelblogr"</li>
            <li>Check that images load quickly and look sharp</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


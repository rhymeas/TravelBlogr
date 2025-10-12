'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { Image as ImageIcon, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ImagesAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="Image Management" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          Image Management
        </h1>
        <p className="text-gray-600">
          Manage and optimize location images
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="p-2 bg-blue-50 rounded-lg w-fit mb-4">
            <RefreshCw className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Refresh Images
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Fetch new images for locations with missing or low-quality images
          </p>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Start Refresh →
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="p-2 bg-green-50 rounded-lg w-fit mb-4">
            <ImageIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Validate Images
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Check all images for quality and relevance
          </p>
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            Run Validation →
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="p-2 bg-red-50 rounded-lg w-fit mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Clean Up
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Remove broken or irrelevant images
          </p>
          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
            Start Cleanup →
          </button>
        </div>
      </div>

      {/* Existing Tools */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Existing Image Tools
        </h2>
        <div className="space-y-3">
          <Link
            href="/test-images"
            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Image Testing Tool</h3>
            <p className="text-sm text-gray-600">
              Test image fetching and preview results
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}


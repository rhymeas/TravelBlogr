'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { Users, Shield, Ban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function UsersAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <AdminBreadcrumb currentPage="User Management" />
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage users, roles, and permissions
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          User Management Coming Soon
        </h3>
        <p className="text-gray-600">
          Full user management interface will be available in the next update
        </p>
      </div>
    </div>
  )
}


'use client'

import { AdminBreadcrumb } from '@/components/admin/AdminNav'
import { Users, Shield, Ban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function UsersAdminPage() {
  return (
    <div className="min-h-screen apple-bg-primary">
      <div className="max-w-[1400px] mx-auto px-8 py-10">
        <AdminBreadcrumb currentPage="User Management" />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold apple-text-primary tracking-tight mb-2">
            User Management
          </h1>
          <p className="text-lg apple-text-secondary font-medium">
            Manage users, roles, and permissions
          </p>
        </div>

        <div className="apple-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl w-fit mx-auto mb-6">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold apple-text-primary mb-3">
              User Management Coming Soon
            </h3>
            <p className="apple-text-secondary leading-relaxed">
              Full user management interface will be available in the next update
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
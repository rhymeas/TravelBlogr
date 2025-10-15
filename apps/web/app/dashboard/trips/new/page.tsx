'use client'

export const dynamic = 'force-dynamic'

import { CreateTripForm } from '@/components/trips/CreateTripForm'

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CreateTripForm />
      </div>
    </div>
  )
}

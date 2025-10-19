import { Metadata } from 'next'
import { BatchGenerationDashboard } from '@/components/batch/BatchGenerationDashboard'

export const metadata: Metadata = {
  title: 'Batch Generation | TravelBlogr',
  description: 'Generate blog posts from your trips automatically with AI',
}

export default function BatchGenerationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <BatchGenerationDashboard />
      </div>
    </div>
  )
}


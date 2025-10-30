import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, MapPin, Eye, Edit, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Trip {
  id: string
  title: string
  description?: string
  slug: string
  cover_image?: string
  status: 'draft' | 'published' | 'archived'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  posts?: any[]
  share_links?: any[]
}

interface TripListProps {
  trips: Trip[]
  onUpdate?: (trip: Trip) => void
  onDelete?: (tripId: string) => void
}

export function TripList({ trips, onUpdate, onDelete }: TripListProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete trip')
      }

      onDelete?.(tripId)
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {trips.map((trip) => (
          <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    <Link 
                      href={`/dashboard/trips/${trip.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {trip.title}
                    </Link>
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trip.status]}`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>

                {trip.description && (
                  <p className="text-gray-600 mb-2 line-clamp-2">
                    {trip.description}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  {trip.start_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(trip.start_date).toLocaleDateString()}
                      {trip.end_date && trip.end_date !== trip.start_date && (
                        <span> - {new Date(trip.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                  
                  <span>{trip.posts?.length || 0} posts</span>
                  <span>{trip.share_links?.length || 0} share links</span>
                  
                  <span>
                    Updated {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/trips/${trip.slug}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/trips/${trip.slug}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(trip.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

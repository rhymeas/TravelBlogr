'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  MapPin, Star, Eye, Edit, Trash2, Plus, 
  Save, X, Globe, Camera 
} from 'lucide-react'
import { Location } from '@/lib/data/locationsData'

interface LocationManagerProps {
  onLocationUpdate?: (location: Location) => void
}

export function LocationManager({ onLocationUpdate }: LocationManagerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch locations from API
  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.success) {
        setLocations(data.data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLocation = async (locationData: Partial<Location>) => {
    try {
      const url = editingLocation 
        ? `/api/locations/${editingLocation.slug}`
        : '/api/locations'
      
      const method = editingLocation ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchLocations() // Refresh the list
        setEditingLocation(null)
        setIsCreating(false)
        onLocationUpdate?.(data.data)
      }
    } catch (error) {
      console.error('Error saving location:', error)
    }
  }

  const handleDeleteLocation = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const response = await fetch(`/api/locations/${slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchLocations() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting location:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rausch-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Location Manager</h2>
          <p className="text-gray-600">Manage travel destinations and their content</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-rausch-500 hover:bg-rausch-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold">{locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">
                  {locations.filter(l => l.is_featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold">
                  {locations.reduce((sum, l) => sum + l.visit_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">
                  {locations.reduce((sum, l) => sum + l.posts.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card key={location.id} className="overflow-hidden">
            <div className="relative h-48">
              <img
                src={location.featured_image}
                alt={location.name}
                className="w-full h-full object-cover"
              />
              {location.is_featured && (
                <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                  Featured
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{location.name}</h3>
                  <p className="text-sm text-gray-600">
                    {location.region}, {location.country}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span>{location.rating}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {location.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{location.visit_count.toLocaleString()} visits</span>
                <span>{location.posts.length} posts</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLocation(location)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLocation(location.slug)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal would go here */}
      {(isCreating || editingLocation) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Location' : 'Edit Location'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Location form would be implemented here with proper form validation
                and image upload capabilities for full CMS functionality.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingLocation(null)
                  }}
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button className="bg-rausch-500 hover:bg-rausch-600 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

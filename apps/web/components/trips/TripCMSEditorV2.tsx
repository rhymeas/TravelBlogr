'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { 
  Image as ImageIcon, 
  MapPin, 
  Hotel, 
  Users, 
  Settings, 
  Lock, 
  Navigation,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Post {
  id?: string
  title: string
  content: string
  featured_image?: string
  location?: string
  post_date: string
  order_index: number
}

interface TripCMSEditorV2Props {
  tripId: string
  userId: string
  trip: any
  posts: Post[]
  onUpdate: () => void
  canEdit: boolean
}

type SidebarSection = 'hero' | 'locations' | 'restaurants' | 'people' | 'images' | 'settings' | 'privacy' | 'tracking'

export function TripCMSEditorV2({ tripId, userId, trip, posts, onUpdate, canEdit }: TripCMSEditorV2Props) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('locations')
  const [expandedSections, setExpandedSections] = useState<string[]>(['locations'])
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [saving, setSaving] = useState(false)

  const [tripData, setTripData] = useState({
    title: trip.title || '',
    description: trip.description || '',
    destination: trip.destination || '',
    duration_days: trip.duration_days || '',
    trip_type: trip.trip_type || '',
    cover_image: trip.cover_image || '',
  })

  const [postData, setPostData] = useState<Post>({
    title: '',
    content: '',
    location: '',
    post_date: new Date().toISOString().split('T')[0],
    order_index: posts.length + 1,
  })

  if (!canEdit) {
    return null
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleSaveTrip = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const { error } = await supabase
        .from('trips')
        .update({
          title: tripData.title,
          description: tripData.description,
          destination: tripData.destination,
          duration_days: tripData.duration_days ? parseInt(tripData.duration_days) : null,
          trip_type: tripData.trip_type,
          cover_image: tripData.cover_image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)

      if (error) throw error

      toast.success('Trip updated successfully')
      onUpdate()
    } catch (error) {
      console.error('Error updating trip:', error)
      toast.error('Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePost = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      if (editingPost?.id) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: postData.title,
            content: postData.content,
            location: postData.location,
            post_date: postData.post_date,
          })
          .eq('id', editingPost.id)

        if (error) throw error
        toast.success('Location updated successfully')
      } else {
        // Create new post
        const { error } = await supabase
          .from('posts')
          .insert({
            trip_id: tripId,
            user_id: userId,
            title: postData.title,
            content: postData.content,
            location: postData.location,
            post_date: postData.post_date,
            order_index: postData.order_index,
          })

        if (error) throw error
        toast.success('Location added successfully')
      }

      setEditingPost(null)
      setPostData({
        title: '',
        content: '',
        location: '',
        post_date: new Date().toISOString().split('T')[0],
        order_index: posts.length + 1,
      })
      onUpdate()
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const supabase = getBrowserSupabase()
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      toast.success('Location deleted successfully')
      onUpdate()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete location')
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setPostData({
      title: post.title,
      content: post.content,
      location: post.location || '',
      post_date: post.post_date,
      order_index: post.order_index,
    })
  }

  const sidebarItems = [
    { id: 'hero' as SidebarSection, icon: ImageIcon, label: 'Hero Image' },
    { id: 'locations' as SidebarSection, icon: MapPin, label: 'Locations' },
    { id: 'restaurants' as SidebarSection, icon: Hotel, label: 'Restaurants & Hotels' },
    { id: 'people' as SidebarSection, icon: Users, label: 'People' },
    { id: 'images' as SidebarSection, icon: ImageIcon, label: 'Images' },
    { id: 'settings' as SidebarSection, icon: Settings, label: 'Settings' },
    { id: 'privacy' as SidebarSection, icon: Lock, label: 'Privacy' },
    { id: 'tracking' as SidebarSection, icon: Navigation, label: 'GPS Tracking' },
  ]

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-8">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Trip CMS</h2>
          <p className="text-xs text-gray-500 mt-1">Manage your trip content</p>
        </div>
        <nav className="p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === item.id
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl">
          {/* Hero Image Section */}
          {activeSection === 'hero' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Hero Image</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image URL
                    </label>
                    <Input
                      value={tripData.cover_image}
                      onChange={(e) => setTripData({ ...tripData, cover_image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {tripData.cover_image && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <img
                        src={tripData.cover_image}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Button onClick={handleSaveTrip} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Locations Section */}
          {activeSection === 'locations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Locations</h3>
              
              {/* Locations List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('locations-list')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">Locations ({posts.length})</span>
                  {expandedSections.includes('locations-list') ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.includes('locations-list') && (
                  <div className="border-t border-gray-200">
                    {posts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No locations yet</p>
                        <p className="text-sm mt-1">Click the button below to add your first location</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {posts.map((post) => (
                          <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{post.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {new Date(post.post_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                </p>
                                {post.location && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {post.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => post.id && handleDeletePost(post.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add/Edit Location Form */}
              {(editingPost || expandedSections.includes('add-location')) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      {editingPost ? 'Edit Location' : 'Add New Location'}
                    </h4>
                    <button
                      onClick={() => {
                        setEditingPost(null)
                        setExpandedSections(prev => prev.filter(s => s !== 'add-location'))
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location Name
                      </label>
                      <Input
                        value={postData.title}
                        onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                        placeholder="e.g., Port Moody"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={postData.content}
                        onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                        placeholder="Describe this location..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <Input
                          value={postData.location}
                          onChange={(e) => setPostData({ ...postData, location: e.target.value })}
                          placeholder="City, Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={postData.post_date}
                          onChange={(e) => setPostData({ ...postData, post_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPost(null)
                          setExpandedSections(prev => prev.filter(s => s !== 'add-location'))
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSavePost} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : editingPost ? 'Update' : 'Add Location'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Trip Settings</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trip Title
                    </label>
                    <Input
                      value={tripData.title}
                      onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                      placeholder="My Amazing Trip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={tripData.description}
                      onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                      placeholder="Describe your trip..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination
                      </label>
                      <Input
                        value={tripData.destination}
                        onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                        placeholder="e.g., Tokyo, Japan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days)
                      </label>
                      <Input
                        type="number"
                        value={tripData.duration_days}
                        onChange={(e) => setTripData({ ...tripData, duration_days: e.target.value })}
                        placeholder="7"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveTrip} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder sections */}
          {['restaurants', 'people', 'images', 'privacy', 'tracking'].includes(activeSection) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{activeSection}</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Coming soon</p>
                <p className="text-sm text-gray-400 mt-2">This feature is under development</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      {activeSection === 'locations' && !editingPost && !expandedSections.includes('add-location') && (
        <button
          onClick={() => setExpandedSections(prev => [...prev, 'add-location'])}
          className="fixed bottom-8 right-8 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
        >
          <Plus className="h-5 w-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Add Location
          </span>
        </button>
      )}
    </div>
  )
}


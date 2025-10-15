'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Edit, Save, Plus, Trash2, GripVertical, MapPin } from 'lucide-react'
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

interface TripCMSEditorProps {
  tripId: string
  userId: string
  trip: any
  posts: Post[]
  onUpdate: () => void
  canEdit: boolean
}

export function TripCMSEditor({ tripId, userId, trip, posts, onUpdate, canEdit }: TripCMSEditorProps) {
  const [isEditingTrip, setIsEditingTrip] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const [saving, setSaving] = useState(false)

  const [tripData, setTripData] = useState({
    title: trip.title || '',
    description: trip.description || '',
    destination: trip.destination || '',
    duration_days: trip.duration_days || '',
    trip_type: trip.trip_type || '',
    highlights: trip.highlights?.join('\n') || '',
    is_public_template: trip.is_public_template || false,
    is_featured: trip.is_featured || false,
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
          highlights: tripData.highlights.split('\n').filter((h: string) => h.trim()),
          is_public_template: tripData.is_public_template,
          is_featured: tripData.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)

      if (error) throw error

      toast.success('Trip updated successfully')
      setIsEditingTrip(false)
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

      if (currentPost?.id) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: postData.title,
            content: postData.content,
            location: postData.location,
            post_date: postData.post_date,
            order_index: postData.order_index,
          })
          .eq('id', currentPost.id)

        if (error) throw error
        toast.success('Post updated successfully')
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
        toast.success('Post created successfully')
      }

      setIsEditingPost(false)
      setCurrentPost(null)
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
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const supabase = getBrowserSupabase()
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      toast.success('Post deleted successfully')
      onUpdate()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const handleEditPost = (post: Post) => {
    setCurrentPost(post)
    setPostData({
      title: post.title,
      content: post.content,
      location: post.location || '',
      post_date: post.post_date,
      order_index: post.order_index,
    })
    setIsEditingPost(true)
  }

  return (
    <div className="space-y-4">
      {/* Edit Trip Button */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Trip CMS</h3>
            <p className="text-sm text-gray-600">Edit trip details and manage itinerary</p>
          </div>
          <Button
            onClick={() => setIsEditingTrip(true)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Trip
          </Button>
        </div>
      </Card>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditingTrip} onOpenChange={setIsEditingTrip}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={tripData.title}
                onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                placeholder="Trip title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={tripData.description}
                onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                placeholder="Describe your trip..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Destination</Label>
                <Input
                  value={tripData.destination}
                  onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                  placeholder="e.g., Tokyo, Japan"
                />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={tripData.duration_days}
                  onChange={(e) => setTripData({ ...tripData, duration_days: e.target.value })}
                  placeholder="7"
                />
              </div>
            </div>
            <div>
              <Label>Trip Type</Label>
              <Select
                value={tripData.trip_type}
                onValueChange={(value: string) => setTripData({ ...tripData, trip_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="beach">Beach</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="road-trip">Road Trip</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Highlights (one per line)</Label>
              <Textarea
                value={tripData.highlights}
                onChange={(e) => setTripData({ ...tripData, highlights: e.target.value })}
                placeholder="Visit Tokyo Tower&#10;Try authentic ramen&#10;Explore temples"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tripData.is_public_template}
                  onChange={(e) => setTripData({ ...tripData, is_public_template: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Public Template</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tripData.is_featured}
                  onChange={(e) => setTripData({ ...tripData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Featured</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingTrip(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTrip} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Post Dialog */}
      <Dialog open={isEditingPost} onOpenChange={setIsEditingPost}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPost ? 'Edit Post' : 'Add New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={postData.title}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                placeholder="Day 1: Arrival in Tokyo"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={postData.content}
                onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                placeholder="Describe the day's activities..."
                rows={6}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={postData.location}
                onChange={(e) => setPostData({ ...postData, location: e.target.value })}
                placeholder="Tokyo, Japan"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditingPost(false)
                setCurrentPost(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleSavePost} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : currentPost ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { X, Save, Plus, Trash2, MapPin, Image as ImageIcon, Hotel, Utensils, Activity, Info, Settings, Calendar, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getBrowserSupabase } from '@/lib/supabase'

interface TripEditorModalProps {
  trip: any
  onClose: () => void
  onUpdate: () => void
}

type Section = 'hero' | 'details' | 'highlights' | 'locations' | 'about' | 'settings'

export function TripEditorModal({ trip, onClose, onUpdate }: TripEditorModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('hero')
  const [saving, setSaving] = useState(false)

  // Trip basic data
  const [tripData, setTripData] = useState({
    title: trip.title || '',
    description: trip.description || '',
    cover_image: trip.cover_image || '',
    destination: trip.destination || '',
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    duration_days: trip.duration_days || '',
    trip_type: trip.trip_type || '',
    highlights: trip.highlights || [],
    is_featured: trip.is_featured || false,
    is_public_template: trip.is_public_template || false
  })

  const handleSaveTripBasics = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const { error } = await supabase
        .from('trips')
        .update({
          title: tripData.title,
          description: tripData.description,
          cover_image: tripData.cover_image,
          destination: tripData.destination,
          start_date: tripData.start_date || null,
          end_date: tripData.end_date || null,
          duration_days: tripData.duration_days ? parseInt(tripData.duration_days) : null,
          trip_type: tripData.trip_type,
          highlights: tripData.highlights,
          is_featured: tripData.is_featured,
          is_public_template: tripData.is_public_template,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) throw error
      alert('Trip updated!')
      onUpdate()
    } catch (error) {
      console.error('Error updating trip:', error)
      alert('Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  const sidebarSections = [
    { id: 'hero' as Section, icon: ImageIcon, label: 'Hero & Cover' },
    { id: 'details' as Section, icon: Calendar, label: 'Trip Details' },
    { id: 'highlights' as Section, icon: Activity, label: 'Highlights' },
    { id: 'locations' as Section, icon: MapPin, label: 'Locations & Days' },
    { id: 'about' as Section, icon: Info, label: 'About' },
    { id: 'settings' as Section, icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Edit Trip</h2>
            <p className="text-xs text-gray-500 mt-1">{trip.title}</p>
          </div>
          <nav className="p-2">
            {sidebarSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">
              {sidebarSections.find(s => s.id === activeSection)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Hero & Cover Section */}
            {activeSection === 'hero' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    value={tripData.title}
                    onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Summer at the Westcoast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={tripData.description}
                    onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your trip..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={tripData.cover_image}
                    onChange={(e) => setTripData({ ...tripData, cover_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {tripData.cover_image && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={tripData.cover_image}
                        alt="Cover preview"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-trip.jpg'
                        }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveTripBasics}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* Trip Details Section */}
            {activeSection === 'details' && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tripData.start_date}
                      onChange={(e) => setTripData({ ...tripData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tripData.end_date}
                      onChange={(e) => setTripData({ ...tripData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={tripData.destination}
                    onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., British Columbia, Canada"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={tripData.duration_days}
                      onChange={(e) => setTripData({ ...tripData, duration_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="7"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trip Type
                    </label>
                    <select
                      value={tripData.trip_type}
                      onChange={(e) => setTripData({ ...tripData, trip_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="family">Family</option>
                      <option value="adventure">Adventure</option>
                      <option value="beach">Beach</option>
                      <option value="cultural">Cultural</option>
                      <option value="road-trip">Road Trip</option>
                      <option value="solo">Solo</option>
                      <option value="romantic">Romantic</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleSaveTripBasics}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* Other sections - Placeholder for now */}
            {activeSection === 'highlights' && (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Highlights editor coming soon...</p>
              </div>
            )}

            {activeSection === 'locations' && (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Locations editor coming soon...</p>
                <p className="text-sm mt-2">This will include: accommodations, restaurants, activities, images</p>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="text-center py-12 text-gray-500">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>About section editor coming soon...</p>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="text-center py-12 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Settings editor coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

